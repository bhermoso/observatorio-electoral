#!/usr/bin/env python3
"""Cotejar transiciones CIS 2019 usando SOLO originales locales, sin publicar entrevistas.

Uso:
 python scripts/auditar_transiciones_cis_2019.py MD3242.zip MD3263.zip --output resultado.json
Si --output se omite, solo se imprime el resumen. SHA-256 verificados con el repositorio.
"""
import argparse
import collections
import hashlib
import json
import re
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VARS = {
 "3242":{"vote":"P10","recoded_vote":"P10R","sympathy":"P10A","recoded_sympathy":"P10AR"},
 "3263":{"vote":"P9","recoded_vote":"P9R","sympathy":"P9A","recoded_sympathy":"P9AR"},
}
UNDECIDED = {"94","97","98","99"}

def data_from_zip(path, sid):
 with zipfile.ZipFile(path) as z:
  es=z.read("ES"+sid).decode("latin1")
  lines=z.read("DA"+sid).decode("latin1").splitlines()
 defs=es.split("DATA LIST",1)[1].split("VARIABLE LABELS",1)[0]
 ix={k:(int(a)-1,int(b or a)) for k,a,b in re.findall(
  r"(?<!\w)(\w+)\s+(\d+)(?:-(\d+))?(?:\(\d+\))?",defs)}
 keys=["CCAA","PROV","VOTOSIMG",*VARS[sid].values()]
 for key in keys:
  if key not in ix:raise ValueError(sid+": no existe variable "+key)
 return [{k:line[ix[k][0]:ix[k][1]].strip() for k in keys} for line in lines]

def ambiguities(records, keys, output):
 observed=collections.defaultdict(collections.Counter)
 for r in records:observed[tuple(r[k] for k in keys)][r[output]]+=1
 conflicts=[x for x in observed.values() if len(x)>1]
 return {"observed_keys":len(observed),"ambiguous_keys":len(conflicts),
  "minimum_disagreements":sum(sum(x.values())-max(x.values()) for x in conflicts)}

def transitions(records,vote,recoded):
 # Solo ejemplos predefinidos: agrupar todas las celdas individuales con n<20.
 target=["3","5","1","4"] if vote=="P10" else ["21","3","5","50","1","4"]
 examples=[]
 for original in target:
  c=collections.Counter(r[recoded] for r in records if r[vote]==original)
  if not c:continue
  destinations={key:n for key,n in sorted(c.items()) if n>=20}
  other=sum(n for n in c.values() if n<20)
  if other:destinations["OTRAS_TRANSFORMACIONES_AGRUPADAS"]=other
  examples.append({"code_from":original,"n":sum(c.values()),"destinations":destinations})
 return examples

def study(sid,path,expected):
 digest=hashlib.sha256(Path(path).read_bytes()).hexdigest()
 if digest!=expected["archive_sha256"]:raise ValueError(sid+": SHA original inesperado")
 rows=data_from_zip(path,sid)
 v=VARS[sid];vote=v["vote"];rec=v["recoded_vote"];sym=v["sympathy"];rs=v["recoded_sympathy"]
 if len(rows)!=expected["n"]:raise ValueError(sid+": número de casos diferente")
 resolved=[r for r in rows if r[rec] not in UNDECIDED]
 unresolved=[r for r in rows if r[rec] in UNDECIDED]
 same_vote=sum(r[rec]==r["VOTOSIMG"] for r in resolved)
 same_sym=sum(r[rs]==r["VOTOSIMG"] for r in unresolved)
 direct=ambiguities(rows,[vote,"PROV"],rec)
 sympathy=ambiguities(rows,[sym,"PROV"],rs)
 combined=ambiguities(unresolved,[sym,"PROV"],"VOTOSIMG")
 if any(x["ambiguous_keys"] for x in [direct,sympathy,combined]) or same_vote!=len(resolved):
  raise AssertionError(sid+": recodificación observada no determinista")
 return {
  "source_zip_sha256":digest,"n":len(rows),
  "geographic_unit":"provincia","key_scope":"solo combinaciones presentes en el fichero original",
  "raw_vote_to_recoded_by_province":direct,
  "raw_sympathy_to_recoded_by_province":sympathy,
  "non_candidate_raw_sympathy_to_combined_by_province":combined,
  "direct_vote_retained_in_votosimg":{"n":same_vote,"total":len(resolved)},
  "requires_sympathy_or_special_recode":{"n":len(unresolved),
   "same_as_recoded_sympathy":same_sym,
   "different_due_to_additional_recode":len(unresolved)-same_sym},
  "global_raw_vote_to_recoded":ambiguities(rows,[vote],rec),
  "global_raw_sympathy_to_recoded":ambiguities(rows,[sym],rs),
  "examples_vote_recode_min_cell_20":transitions(rows,vote,rec),
  "fully_explained_observed_records":len(rows),
  "not_proven":["Fórmula exacta de programación del CIS",
   "Combinaciones no observadas de código y provincia",
   "Equivalencia de las candidaturas para otras elecciones",
   "Rendimiento predictivo fuera de muestra"]
 }

def main():
 p=argparse.ArgumentParser(description=__doc__)
 p.add_argument("zip3242",type=Path);p.add_argument("zip3263",type=Path)
 p.add_argument("--output",type=Path)
 args=p.parse_args()
 manifest=json.loads((ROOT/"data/microdatos/cotejo_originales_2019.json").read_text(encoding="utf-8"))
 report={
  "schema_version":1,"source":"ZIP originales MD3242 y MD3263, DA y sintaxis ES",
  "method":"Recuentos de correspondencias observadas por código y provincia; no es el algoritmo interno del CIS",
  "privacy":"Solo agregados; las celdas ejemplares inferiores a 20 se agrupan, sin microdatos",
  "studies":{sid:study(sid,path,manifest["studies"][sid]) for sid,path in
   [("3242",args.zip3242),("3263",args.zip3263)]},
  "caveats":["Coincidencia perfecta dentro de la muestra no implica validez para códigos o provincias no observados",
   "El agrupamiento depende de límites provinciales y etiquetas de 2019",
   "No se habilita una receta del Motor 29N ni se imputan respuestas sin una regla auditada"]
 }
 if args.output:
  args.output.parent.mkdir(parents=True,exist_ok=True)
  args.output.write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
 print(json.dumps({"status":"COINCIDE",**{sid:{"n":v["n"],
  "vote_keys":v["raw_vote_to_recoded_by_province"],"sympathy_keys":v["raw_sympathy_to_recoded_by_province"],
  "combined_keys":v["non_candidate_raw_sympathy_to_combined_by_province"]}
  for sid,v in report["studies"].items()}},ensure_ascii=False,indent=2))

if __name__=="__main__":main()

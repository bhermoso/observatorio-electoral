"""Inspección segura de los paquetes originales CIS 3242 y 3263.

Uso: python scripts/preparar_validacion_2019.py 3242 /ruta/MD3242.zip
      python scripts/preparar_validacion_2019.py 3263 /ruta/MD3263.zip

Solo publica encabezados y metadatos: nunca filas ni imputaciones.
Un SAV o un ASCII fijo requieren revisión de su diccionario y sintaxis; no se
declara ausencia de datos cuando no existe CSV.
"""
import argparse
import csv
import hashlib
import io
import json
import re
import sys
import zipfile
from pathlib import Path

STUDIES={"3242":"2019-04-28","3263":"2019-11-10"}
HINTS={
 "intencion":["INTENCIONGR","INTENCION","PREGVOTO","VOTOGEN"],
 "peso":["PESO","PONDERA","FACTOR","WEIGHT"],
 "simpatia":["VOTOSIMG","SIMPATIA","SIMPA"],
 "recuerdo":["RECUVOTOGR","RECUERDO","RECUVOTO"],
 "participacion":["PROBVOTO","PROBABILIDAD","PARTICIPACION"]
}
MAX_ENTRY=150*1024*1024
MAX_DEPTH=3

def classify(name):
 n=name.lower().split("/")[-1]
 if n.endswith(".csv"):return "csv"
 if n.endswith(".sav"):return "spss_sav"
 if n.endswith(".sps"):return "spss_syntax"
 if n.endswith(".pdf"):return "documentation"
 if n.endswith(".zip"):return "nested_zip"
 if re.match(r"^(da|es|sintaxis|codigo|cues|ft)\d+",n):return "legacy_ascii_or_documentation"
 return "other"

def headers(raw):
 candidates=[]
 for encoding in ("utf-8-sig","cp1252","latin-1"):
  try:
   text=raw.decode(encoding)
   if "\x00" in text:continue
   first=text.splitlines()[0] if text.splitlines() else ""
   if not first:continue
   for delim in (";",",","\t"):
    row=next(csv.reader([first],delimiter=delim))
    if len(row)>=10:
     clean=[x.split(":",1)[0].strip(' \t\"') for x in row]
     matched={}
     for key,patterns in HINTS.items():
      matched[key]=[x for x in clean if any(h in re.sub(r"[^A-Z0-9]","",x.upper()) for h in patterns)]
     candidates.append({"encoding":encoding,"separator":delim,"column_count":len(clean),
      "possible_variables":matched,"headers_preview":clean[:15]})
   if candidates:break
  except (UnicodeDecodeError,csv.Error,StopIteration):continue
 return max(candidates,key=lambda c:sum(len(v) for v in c["possible_variables"].values()),default=None)

def scan(zipped,depth=0,prefix=""):
 if depth>MAX_DEPTH:return []
 result=[]
 with zipfile.ZipFile(zipped) as z:
  for entry in z.infolist():
   if entry.is_dir():continue
   name=prefix+entry.filename
   kind=classify(entry.filename)
   record={"file":name,"kind":kind,"size_bytes":entry.file_size}
   if entry.file_size>MAX_ENTRY:
    record["warning"]="Entrada grande: no se inspecciona automáticamente"
    result.append(record);continue
   if kind=="csv":
    with z.open(entry) as src:raw=src.read(min(entry.file_size,200_000))
    record["header"]=headers(raw)
    if record["header"] is None:record["warning"]="No se pudo identificar encabezado CSV con seguridad"
   elif kind=="nested_zip":
    try:
     with z.open(entry) as src:raw=src.read(MAX_ENTRY+1)
     if len(raw)>MAX_ENTRY:raise ValueError("ZIP interno demasiado grande")
     record["nested"]=scan(io.BytesIO(raw),depth+1,name+"/")
    except (zipfile.BadZipFile,ValueError) as ex:record["warning"]=str(ex)
   result.append(record)
 return result

def flatten(rows):
 for row in rows:
  yield row
  yield from flatten(row.get("nested",[]))

def inspect(study,archive):
 if study not in STUDIES:raise ValueError("Solo se admiten los estudios CIS 3242 y 3263")
 path=Path(archive)
 if not path.is_file():raise FileNotFoundError(str(path))
 with path.open("rb") as src:
  digest=hashlib.file_digest(src,"sha256").hexdigest()
 files=scan(path)
 flat=list(flatten(files))
 detected={kind:sum(f["kind"]==kind for f in flat) for kind in ("csv","spss_sav","spss_syntax","legacy_ascii_or_documentation","documentation")}
 candidates=[{"file":r["file"],**r["header"]} for r in flat if r["kind"]=="csv" and r.get("header")]
 return {"schema_version":2,"study":study,"election":STUDIES[study],
  "archive_filename":path.name,"sha256":digest,"detected_formats":detected,
  "files":files,"csv_candidates":candidates,
  "status":"VARIABLE_REVIEW_REQUIRED","allowed_as_independent_test":False,
  "required_before_analysis":[
   "Consultar cuestionario y libro de códigos; validar variables, etiquetas y universo electoral",
   "Verificar y elegir PESO nacional correcto; examinar si hay varios factores",
   "Inspeccionar SAV con lector SPSS o sintaxis del fichero ASCII si no existe CSV",
   "Homologar candidaturas de 2019 por convocatoria (incluidas alianzas territoriales)",
   "Obtener y verificar escrutinio oficial, voto válido y participación",
   "Congelar protocolo y código, separando pruebas retrospectivas y prospectivas",
   "Reconstruir numeradores, denominadores, excluidos e incertidumbre del diseño"
  ],
  "warning":"Inspección estructural, NO procesamiento de microdatos ni backtest. Los nombres sugeridos no demuestran equivalencia semántica.",
  "download_note":"El CIS requiere formulario individual para descargar cada MDxxxx.zip; no se obtiene ni elude automáticamente."}

def main(argv=None):
 parser=argparse.ArgumentParser(description=__doc__)
 parser.add_argument("study",choices=tuple(STUDIES))
 parser.add_argument("archive",type=Path)
 parser.add_argument("--output",type=Path,default=None)
 a=parser.parse_args(argv)
 result=inspect(a.study,a.archive)
 target=a.output or Path("data/microdatos/preflight_"+a.study+"_2019.json")
 target.parent.mkdir(parents=True,exist_ok=True)
 target.write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
 print(str(target),"archivos",len(list(flatten(result["files"]))),"estado",result["status"])

if __name__=="__main__":main()

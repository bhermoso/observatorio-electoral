"""Preflight de microdatos CIS 2019: descubre variables y exige homologación manual.

Uso:
    python scripts/preparar_validacion_2019.py 3242 /ruta/MD3242.zip
    python scripts/preparar_validacion_2019.py 3263 /ruta/MD3263.zip

No genera estimaciones, no adivina códigos ni publica entrevistas.
Escribe exclusivamente un informe de metadatos y brechas en formato JSON.
"""
import csv
import io
import json
import re
import sys
import zipfile
from pathlib import Path

STUDIES={"3242":"2019-04-28","3263":"2019-11-10"}
NEEDED={
 "intencion":["INTENCIONGR","INTENCION","VOTO"],
 "peso":["PESO","PONDERA","FACTOR"],
 "simpatia":["VOTOSIMG","SIMPATIA","SIMPA"],
 "recuerdo":["RECUVOTOGR","RECUERDO","RECUVOTO"],
 "participacion":["PROBVOTO","PROBABILIDAD","PARTICIPACION"]
}

def embedded_names(archive, prefix=""):
 with zipfile.ZipFile(archive) as z:
  for name in z.namelist():
   if name.lower().endswith(".csv"):
    yield prefix+name,z.read(name)
   elif name.lower().endswith(".zip"):
    try:
     yield from embedded_names(io.BytesIO(z.read(name)),prefix+name+"/")
    except (zipfile.BadZipFile,ValueError):
     continue

def inspect(study,archive):
 if study not in STUDIES:raise ValueError("Solo estudios CIS 3242 y 3263")
 if not Path(archive).is_file():raise FileNotFoundError(archive)
 candidates=[]
 for name,raw in embedded_names(archive):
  try:
   text=raw[:65536].decode("utf-8-sig")
  except UnicodeDecodeError:
   text=raw[:65536].decode("latin-1")
  head=text.splitlines()[0] if text.splitlines() else ""
  delim=";" if head.count(";")>=head.count(",") else ","
  header=next(csv.reader([head],delimiter=delim))
  columns=[h.split(":",1)[0].strip(" \t\"") for h in header]
  if len(columns)<10:continue
  upper=[re.sub(r"[^A-Z0-9]","",x.upper()) for x in columns]
  matched={k:[columns[i] for i,col in enumerate(upper) if any(word in col for word in patterns)]
    for k,patterns in NEEDED.items()}
  candidates.append({"filename":name,"column_count":len(columns),
   "encoding_assumed":"utf-8-sig" if b"\xef\xbb\xbf" in raw[:3] else "utf-8-or-latin-1",
   "separator":delim,"possible_variables":matched})
 return {"study":study,"election":STUDIES[study],"archive_filename":Path(archive).name,
  "files":candidates,"status":"VARIABLE_REVIEW_REQUIRED","allowed_as_independent_test":False,
  "required_before_analysis":[
   "Verificar libros de códigos del estudio, variables reales y universo con derecho a voto",
   "Revisar diferencias de medición y codificación respecto de 2023",
   "Establecer mapa de candidaturas de la elección sin identificar SUMAR con Unidas Podemos",
   "Obtener resultado oficial sobre voto válido, partidos y provincias",
   "Congelar protocolo de las recetas sin inspeccionar los errores de la convocatoria reservada",
   "Generar y comprobar agregados y numeradores/denominadores de cada receta"
  ],"warning":"Solo inspecciona encabezados; no hay imputación, pesos procesados ni evaluación de errores."}

def main(args):
 if len(args)!=2:raise SystemExit(__doc__)
 report=inspect(*args)
 out=Path("data/microdatos/preflight_"+args[0]+"_2019.json")
 out.parent.mkdir(parents=True,exist_ok=True)
 out.write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
 print(str(out),report["status"],"CSV detectados",len(report["files"]))

if __name__=="__main__":main(sys.argv[1:])

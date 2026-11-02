"""Valida la homologación explícita antes de cualquier cálculo de 2019."""
import json
import sys
from pathlib import Path
REQUIRED=("weight","intention","combined_vote_sympathy","recall","participation",
          "universe_filter","result_vote_denominator","reviewed_by","review_date")
REQUIRED_CODES=("PSOE","PP","VOX","UNIDAS_PODEMOS","CIUDADANOS",
                "OTRAS_CANDIDATURAS","INDECISION","NO_CONTESTA",
                "ABSTENCION","BLANCO","NULO")
def validate(data,study):
 if study not in ("3242","3263"):raise ValueError("Estudio desconocido")
 item=data["studies"][study]
 missing=[key for key in REQUIRED if item.get(key) in (None,"",[])]
 missing+=["codes."+key for key in REQUIRED_CODES if item.get("codes",{}).get(key) in (None,"",[])]
 if study=="3263" and item.get("codes",{}).get("MAS_PAIS") in (None,"",[]):
  missing.append("codes.MAS_PAIS")
 if missing:raise ValueError("Homologación incompleta ("+study+"): "+", ".join(missing))
 for key in REQUIRED_CODES:
  if not isinstance(item["codes"][key],(list,tuple)):
   raise ValueError("Códigos "+key+" deben ser listas explícitas")
 return item
def main(args):
 if len(args)!=2:raise SystemExit("Uso: python scripts/verificar_homologacion_2019.py 3242 ruta/config.json")
 config=json.loads(Path(args[1]).read_text(encoding="utf-8"))
 validate(config,args[0])
 print("Homologación registrada, pendiente de confirmar cálculo y resultados:",args[0])
if __name__=="__main__":main(sys.argv[1:])

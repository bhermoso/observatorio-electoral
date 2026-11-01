"""Procesa automáticamente microdatos CSV autorizados y genera matrices agregadas.

Entrada: data/microdatos/entrada/<id>.csv y data/microdatos/config.json.
No descarga automáticamente ficheros protegidos por formularios o autenticación.
Los nombres de variables y códigos deben declararse para cada estudio.
"""
import csv
import json
from collections import defaultdict
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/"data"/"microdatos"
OUTPUT=SOURCE/"procesados"
POLLS=ROOT/"data"/"polls.json"

def classify(value, mapping):
    v=str(value or "").strip()
    return str(mapping.get(v, v)) if v else "Sin respuesta"

def process(study, spec):
    file=SOURCE/"entrada"/(study+".csv")
    if not file.exists():
        aggregated=OUTPUT/(study+".json")
        if aggregated.exists():
            result=json.loads(aggregated.read_text(encoding="utf-8"))
            if result.get("status")=="procesado" and result.get("n",0)>0:
                return {"status":"procesado","n":result["n"],"effective_n":result.get("effective_n"),"processed":f"data/microdatos/procesados/{study}.json","mode":"agregados_verificados"}
        return {"status":"pendiente","reason":"No se ha incorporado el fichero de entrevistas"}
    fields=spec.get("variables",{})
    for key in ("intencion","recuerdo"):
        if not fields.get(key):
            return {"status":"pendiente_configuracion","reason":"Falta definir variable "+key}
    matrix=defaultdict(lambda:defaultdict(float))
    count=0
    weights=[]
    with file.open(encoding=spec.get("encoding","utf-8-sig"),newline="") as fp:
        reader=csv.DictReader(fp,delimiter=spec.get("delimiter",","))
        for name in fields.values():
            if name and name not in (reader.fieldnames or []):
                raise ValueError(f"{study}: columna desconocida: {name}")
        for row in reader:
            w=float((row.get(fields.get("peso"),"1") or "1").replace(",","."))
            if not 0<w<100000:
                continue
            intent=classify(row.get(fields["intencion"]),spec.get("codigos_intencion",{}))
            recall=classify(row.get(fields["recuerdo"]),spec.get("codigos_recuerdo",{}))
            matrix[recall][intent]+=w
            weights.append(w)
            count+=1
    if not count:
        return {"status":"sin_datos_validos"}
    categories=sorted({k for row in matrix.values() for k in row})
    transfers={}
    for recall,values in sorted(matrix.items()):
        total=sum(values.values())
        transfers[recall]={"weighted_n":round(total,5),
                           "distribution":{k:round(100*values.get(k,0)/total,4) for k in categories}}
    neff=sum(weights)**2/sum(w*w for w in weights)
    result={"study":study,"status":"procesado","n":count,"effective_n":round(neff,2),
            "variables":fields,"weight_used":bool(fields.get("peso")),
            "transfers":transfers,
            "note":"Matriz descriptiva ponderada; no es una estimación cocinada de voto."}
    OUTPUT.mkdir(parents=True,exist_ok=True)
    (OUTPUT/(study+".json")).write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding="utf-8")
    return {"status":"procesado","n":count,"effective_n":round(neff,2),
            "processed":f"data/microdatos/procesados/{study}.json"}

def main():
    SOURCE.mkdir(parents=True,exist_ok=True)
    config=json.loads((SOURCE/"config.json").read_text(encoding="utf-8"))
    polls=json.loads(POLLS.read_text(encoding="utf-8"))
    records=[]
    for poll in polls:
        if not poll.get("microdata"):
            continue
        id=str(poll["id"])
        spec=config.get(id)
        try:
            result=process(id,spec or {})
        except Exception as exc:
            result={"status":"error","reason":str(exc)}
        records.append({"id":id,"institute":poll.get("institute"),"title":poll.get("title"),
                        "published":poll.get("published"),"source":poll.get("microdata"),**result})
    (SOURCE/"catalogo.json").write_text(json.dumps({"studies":records},ensure_ascii=False,indent=2),encoding="utf-8")
    print("Catálogo de microdatos:",len(records),"estudios,",sum(x["status"]=="procesado" for x in records),"procesados")

if __name__=="__main__":
    main()

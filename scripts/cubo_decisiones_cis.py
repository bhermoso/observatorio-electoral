"""Regenera data/microdatos/cubo_decisiones_cis.json desde los ZIP originales del CIS.

Uso: python scripts/cubo_decisiones_cis.py MD3411.zip MD3415.zip MD3582.zip
No se guarda ningún registro de entrevista. Se conservan únicamente agregados
nacionales por partido, respuesta de recuerdo y validez de PROBVOTO.
"""
import csv
import io
import json
import sys
import zipfile
from pathlib import Path

GROUPS = ["PSOE","PP","VOX","SUMAR","OTROS","NO_CANDIDATURA"]
CODE = {"1":0,"2":1,"3":2,"21":3}
VARIABLES = ["INTENCIONGR","VOTOSIMG"]

def classify(text):
    if text in CODE:
        return CODE[text]
    try:
        if 1 <= int(text) <= 8995:
            return 4  # 8995 = Otro partido; 8996 = blanco (excluido).
    except (ValueError,TypeError):
        pass
    return 5

def read_csv(archive, study):
    with zipfile.ZipFile(archive) as outer:
        if study=="3411":
            with zipfile.ZipFile(io.BytesIO(outer.read("3411csv.zip"))) as inner:
                raw=inner.read("3411_num.csv")
        else:
            raw=outer.read(study+"_num.csv")
    return csv.reader(io.StringIO(raw.decode("utf-8-sig")),delimiter=";")

def compute(path, study):
    reader=read_csv(path,study)
    headers=[h.split(":",1)[0].strip(' "') for h in next(reader)]
    index={name:headers.index(name) for name in ["PESO","INTENCIONGR","VOTOSIMG","PROBVOTO","RECUVOTOGR"]}
    # [pregunta][partido][recuerdo sí/no][n,suma PESO,suma PESO válido,suma PESO*p/10]
    cube=[[[[0,0.,0.,0.] for _ in range(2)] for _ in GROUPS] for _ in VARIABLES]
    number=0
    for record in reader:
        weight=float(record[index["PESO"]].replace(",","."))
        if not 0 < weight < 100:
            continue
        number+=1
        recall=int(classify(record[index["RECUVOTOGR"]].strip())!=5)
        try:
            p=int(record[index["PROBVOTO"]].strip())
            prob=p/10 if 0<=p<=10 else None
        except (ValueError,TypeError):
            prob=None
        for method,variable in enumerate(VARIABLES):
            group=classify(record[index[variable]].strip())
            cell=cube[method][group][recall]
            cell[0]+=1;cell[1]+=weight
            if prob is not None:
                cell[2]+=weight;cell[3]+=weight*prob
    for method in cube:
        for group in method:
            for cell in group:
                for j in (1,2,3):
                    cell[j]=round(cell[j],3)
    return {"n":number,"cube":cube}

def build(paths):
    return {
        "version":1,"groups":GROUPS,"methods":VARIABLES,
        "recall":"recuerdo de candidatura declarado; no implica veracidad",
        "metric":["n","suma_peso","suma_peso_prob_valida","suma_peso_prob_entre_10"],
        "studies":{sid:compute(path,sid) for sid,path in paths.items()},
    }

if __name__=="__main__":
    if len(sys.argv)!=4:
        raise SystemExit("Uso: python scripts/cubo_decisiones_cis.py MD3411.zip MD3415.zip MD3582.zip")
    paths=dict(zip(("3411","3415","3582"),map(Path,sys.argv[1:])))
    data=build(paths)
    target=Path("data/microdatos/cubo_decisiones_cis.json")
    target.parent.mkdir(parents=True,exist_ok=True)
    target.write_text(json.dumps(data,ensure_ascii=False,indent=1)+"\n",encoding="utf-8")
    print("Cubo agregado:",target,"· estudios:", {k:v["n"] for k,v in data["studies"].items()})

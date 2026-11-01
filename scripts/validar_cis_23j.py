"""Validación descriptiva de microdatos CIS 3411 y 3415 frente al 23J.
Ejemplo: python scripts/validar_cis_23j.py /ruta/MD3411.zip /ruta/MD3415.zip
Requiere pandas y numpy. No publica entrevistas individuales.
"""
import io, json, sys, zipfile
from pathlib import Path
import numpy as np
import pandas as pd

PARTIES = {"PSOE": 1, "PP": 2, "VOX": 3, "SUMAR": 21}
PUBLISHED = {
 "3411": {"PSOE":31.2,"PP":31.4,"VOX":10.6,"SUMAR":16.4},
 "3415": {"PSOE":32.2,"PP":30.8,"VOX":11.8,"SUMAR":14.9},
}
RECALL_REFERENCE = "2019-11-10"  # RECUERDO in 2023 studies refers to 2019!

def official_2023():
 election=json.loads(Path("data/election.json").read_text(encoding="utf-8"))
 ids={p["label"]:p["id"] for p in election["parties"]}
 totals={}
 for district in election["districts"]:
  for key,votes in district["votes"].items(): totals[key]=totals.get(key,0)+votes
 valid=sum(d["valid"] for d in election["districts"])
 return {"PSOE":100*(totals[ids["PSOE"]]+totals[ids["PSC"]])/valid,
         "PP":100*totals[ids["PP"]]/valid,"VOX":100*totals[ids["VOX"]]/valid,
         "SUMAR":100*totals[ids["Sumar"]]/valid}

def process(path,actual):
 study="3411" if "3411" in path.name else "3415"
 with zipfile.ZipFile(path) as outer:
  if study=="3411":
   with zipfile.ZipFile(io.BytesIO(outer.read("3411csv.zip"))) as nested:
    df=pd.read_csv(io.BytesIO(nested.read("3411_num.csv")),sep=";",usecols=["PESO","PROBVOTO","INTENCIONGR","VOTOSIMG"])
  else:
   df=pd.read_csv(io.BytesIO(outer.read("3415_num.csv")),sep=";",usecols=["PESO","PROBVOTO","INTENCIONGR","VOTOSIMG"])
 weight=pd.to_numeric(df["PESO"].astype(str).str.replace(",",".",regex=False)).to_numpy()
 intention=pd.to_numeric(df["INTENCIONGR"],errors="coerce").to_numpy()
 sympathy=pd.to_numeric(df["VOTOSIMG"],errors="coerce").to_numpy()
 prob=pd.to_numeric(df["PROBVOTO"],errors="coerce").to_numpy()
 likelihood=np.where((prob>=0)&(prob<=10),prob/10,1.0)
 def proportions(values,weights,decided):
  eligible=(values>0)&(values<8995) if decided else np.ones(len(values),dtype=bool)
  total=weights[eligible].sum()
  return {party:round(100*weights[values==code].sum()/total,3) for party,code in PARTIES.items()}
 scenarios={
  "direct_all":proportions(intention,weight,False),
  "decided":proportions(intention,weight,True),
  "sympathy_decided":proportions(sympathy,weight,True),
  "turnout_decided":proportions(intention,weight*likelihood,True),
  "published_cis":PUBLISHED[study],
 }
 errors={method:{party:round(pct-actual[party],3) for party,pct in estimates.items()} for method,estimates in scenarios.items()}
 mae={method:round(np.mean([abs(x) for x in values.values()]),3) for method,values in errors.items()}
 return {"sample_size":len(df),"effective_n":round(float(weight.sum()**2/(weight@weight)),1),
         "recall_election":RECALL_REFERENCE,"scenarios":scenarios,"errors_pp":errors,"mae_four_parties":mae}

def main():
 if len(sys.argv)!=3:raise SystemExit(__doc__)
 paths=[Path(v) for v in sys.argv[1:]]
 actual=official_2023()
 studies={("3411" if "3411" in p.name else "3415"):process(p,actual) for p in paths}
 result={"title":"Validación histórica CIS 3411 y 3415","election":"2023-07-23",
         "official_results_source":"data/election.json","official_vote_valid_percent":actual,
         "weight":"PESO","party_order":list(PARTIES),"studies":studies,
         "warnings":["Solo 4 partidos y 2 encuestas, análisis descriptivo.",
                     "RECUERDO pregunta por las elecciones de 2019; no se calibra contra 2023.",
                     "3415 VOTOSIMG no incluye la variable conjunta con voto por correo.",
                     "Los escenarios no son etapas acumulativas de la cocina oficial."]}
 print(json.dumps(result,ensure_ascii=False,indent=2))

if __name__=="__main__":main()

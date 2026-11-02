"""Discover candidate electoral surveys and model analyses for human review.

Does not alter data/polls.json. Google News may link through an aggregator,
so original URLs, field dates, sample sizes and parties must be checked.
"""
from __future__ import annotations
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.parse import urlencode
import json
import xml.etree.ElementTree as ET
import re
import sys

ROOT=Path(__file__).resolve().parents[1]
SEARCHES={
 "CIS": 'CIS barómetro estimación voto elecciones generales 2026',
 "40dB": '40dB encuesta EL PAÍS SER elecciones 2026',
 "GAD3": 'GAD3 encuesta elecciones generales 2026',
 "Sigma Dos": 'Sigma Dos sondeo elecciones generales 2026',
 "IMOP": 'IMOP encuesta generales 2026',
 "Sociométrica": 'Sociométrica encuesta elecciones generales 2026',
 "Otras casas": 'encuesta generales España 2026 ficha técnica instituto',
 "Llaneras": 'Kiko Llaneras Borja Andrino promedio encuestas modelos elecciones',
}
WORDS=re.compile(r"encuesta|sondeo|bar[oó]metro|estimaci[oó]n|eleccion|escañ|Llaneras|voto|coalici[oó]n",re.I)

def get_feed(search):
 url="https://news.google.com/rss/search?"+urlencode({"q":search,"hl":"es","gl":"ES","ceid":"ES:es"})
 with urlopen(Request(url,headers={"User-Agent":"ObservatorioElectoral/1.0 public-source-monitor"}),timeout=20) as response:
  return response.read()

def parse(xml,topic):
 root=ET.fromstring(xml)
 found=[]
 for item in root.findall("./channel/item"):
  title=(item.findtext("title") or "").strip()
  url=(item.findtext("link") or "").strip()
  published=(item.findtext("pubDate") or "").strip()
  if WORDS.search(title) and url.startswith("https://"):
   found.append({"title":title,"discovery_url":url,"publication_raw":published,"topic":topic,"original_verified":False})
 return found

def scan():
 polls=json.loads((ROOT/"data/polls.json").read_text(encoding="utf-8"))
 refs=json.loads((ROOT/"data/references.json").read_text(encoding="utf-8"))
 registered=[p.get("title","") for p in polls]+[r.get("name","") for r in refs]
 seen=set();results=[];errors=[]
 for label,query in SEARCHES.items():
  try:
   for entry in parse(get_feed(query),label):
    key=entry["title"].casefold()
    if key in seen:continue
    seen.add(key)
    if any(key==name.casefold() for name in registered):continue
    results.append(entry)
  except Exception as e:errors.append({"source":label,"detail":str(e)[:240]})
 return {"checked_at":datetime.now(timezone.utc).isoformat(),"searches":len(SEARCHES),"results":results[:70],"errors":errors,
 "policy":"DISCOVERY ONLY. Never add to polling model without primary source, field dates, sample, parties, denominator and verified original."}

def main():
 report=scan();out=Path(sys.argv[1] if len(sys.argv)>1 else "monitor-output")
 out.mkdir(parents=True,exist_ok=True)
 (out/"candidates.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
 lines=["# Vigilancia de encuestas y modelos", "", "Descubrimiento automático; ninguna entrada se integra en el modelo sin revisión.", "",
 "Consultado: "+report["checked_at"], "Propuestas: "+str(len(report["results"])), "Búsquedas fallidas: "+str(len(report["errors"])), ""]
 for e in report["results"][:35]:
  lines+=["- **"+e["topic"]+"** · "+e["title"], "  - [Consultar candidato]("+e["discovery_url"]+") · "+e["publication_raw"]]
 if report["errors"]:lines+=["","## Fuentes con errores"]+["- "+e["source"]+": "+e["detail"] for e in report["errors"]]
 (out/"report.md").write_text("\n".join(lines)+"\n",encoding="utf-8")
 print(f"Monitor: {len(report['results'])} candidates; {len(report['errors'])} source errors")
if __name__=="__main__":main()

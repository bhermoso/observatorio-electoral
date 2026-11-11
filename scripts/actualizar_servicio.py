"""Compatibilidad: resume el informe directo versionado. No usa servicios externos."""
import json,argparse
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def refresh():
 d=json.loads((ROOT/'data/vigilancia/candidatos.json').read_text())
 return {'checked_at':d.get('checked_at'),'attempted_at':d.get('last_attempt_at'),'candidates':len(d['results']),'errors':d.get('errors',[]),'cached':True,'ok':d['status']!='failed'}
def ejecutar(report=None):
 result=refresh()
 if report:
  p=Path(report);p.mkdir(parents=True,exist_ok=True);(p/'servicio.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
 return result
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--report');a=p.parse_args();r=ejecutar(a.report);print(json.dumps(r,ensure_ascii=False))
 if not r['ok']:raise SystemExit(1)

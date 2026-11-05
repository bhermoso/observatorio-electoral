"""Refresh the same candidate list used by the Observatorio button."""
import json
import argparse
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError
try:
    from scripts.incorporar_encuestas import SERVICE
except ModuleNotFoundError:
    from incorporar_encuestas import SERVICE


def refresh():
    with urlopen(Request(SERVICE+'?action=scan',method='POST',data=b''),timeout=45) as r:
        result=json.load(r)
    return {'checked_at':result.get('checked_at'),'candidates':len(result.get('candidates',[])),
            'errors':result.get('errors',[]),'cached':result.get('cached',False),'ok':True}


def ejecutar(report=None):
    attempted_at=datetime.now(timezone.utc).isoformat()
    try:
        result=refresh()
    except HTTPError as exc:
        if exc.code==451:
            result={'ok':True,'veda':True,'checked_at':None,'errors':[]}
        else:
            result={'ok':False,'checked_at':None,'errors':[f'Servicio de candidatos: HTTP {exc.code}; no se ha actualizado la bandeja.']}
    except (URLError, TimeoutError, json.JSONDecodeError) as exc:
        result={'ok':False,'checked_at':None,'errors':[f'Servicio de candidatos: {type(exc).__name__}; no se ha actualizado la bandeja.']}
    result['attempted_at']=attempted_at
    if report:
        p=Path(report);p.mkdir(parents=True,exist_ok=True)
        (p/'servicio.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    return result

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--report');a=ap.parse_args()
    result=ejecutar(a.report)
    print(json.dumps(result,ensure_ascii=False))
    if not result['ok']:raise SystemExit(1)

if __name__=='__main__':main()

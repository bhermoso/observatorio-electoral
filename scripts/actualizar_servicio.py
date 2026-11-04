"""Refresh the same candidate list used by the Observatorio button."""
import json
from urllib.request import Request, urlopen
from urllib.error import HTTPError
from incorporar_encuestas import SERVICE

def main():
    try:
        with urlopen(Request(SERVICE+'?action=scan',method='POST',data=b''),timeout=45) as r:
            result=json.load(r)
        print(json.dumps({'checked_at':result.get('checked_at'),'candidates':len(result.get('candidates',[])),
                          'errors':result.get('errors',[]),'cached':result.get('cached',False)},ensure_ascii=False))
    except HTTPError as exc:
        if exc.code==451:print('Veda: búsqueda pública suspendida.');return
        raise

if __name__=='__main__':main()

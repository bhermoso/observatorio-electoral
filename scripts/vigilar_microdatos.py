"""Busca archivos en páginas de productores; no descarga ni incorpora matrices."""
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from pathlib import Path
import json
try:
 from scripts.vigilar_encuestas import fetch_source
except ModuleNotFoundError:
 from vigilar_encuestas import fetch_source
ROOT=Path(__file__).resolve().parents[1]

def scan(catalog,previous=None):
 pages={}
 for row in sorted(catalog['estudios'],key=lambda x:x.get('fecha',''),reverse=True):
  if row.get('pagina') and row.get('productor') not in pages:
   pages[row['productor']]={'id':row['productor'],'name':row['productor'],'url':row['pagina'],'format':'html'}
 for row in catalog['fuentes']:
  if row.get('portal') and row['id'] not in pages:pages[row['id']]={'id':row['id'],'name':row['nombre'],'url':row['portal'],'format':'html'}
 known={x.get('archivo','').split('?')[0] for x in catalog['estudios']}
 with ThreadPoolExecutor(max_workers=4) as pool:checks=list(pool.map(fetch_source,list(pages.values())[:12]))
 now=datetime.now(timezone.utc).isoformat();items={}
 for r in checks:
  for x in r['items']:
   if x['tipo']!='enlace_a_archivo':continue
   items[x['url']]={'tipo':'enlace_a_archivo','url':x['url'],'titulo':x['title'],'fuente':r['id'],'pagina':r['url'],
      'estado':'ya_catalogado' if x['url'].split('?')[0] in known else 'nuevo_enlace_sin_auditar'}
 ok=sum(x['ok'] for x in checks);previous=previous or {}
 return {'schema':2,'checked_at':now if ok else previous.get('checked_at'),'last_attempt_at':now,
   'status':'complete' if ok==len(checks) else 'partial' if ok else 'failed',
   'candidates':list(items.values()) if ok else previous.get('candidates',[]),
   'errors':[r['name']+': '+r['error'] for r in checks if not r['ok']],
   'summary':{'paginas_consultadas':len(checks),'paginas_accesibles':ok,'ficheros_descargados':0,'matrices_analizadas':0}}

if __name__=='__main__':
 p=ROOT/'data/vigilancia/microdatos.json';previous=json.loads(p.read_text()) if p.exists() else {}
 result=scan(json.loads((ROOT/'data/microdatos/catalogo-publico.json').read_text()),previous)
 p.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print('Microdatos:',result['summary'])

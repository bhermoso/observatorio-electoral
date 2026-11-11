"""Certifica recuperación desde una copia autorizada del repositorio privado.
No transmite bytes, no lee claves y no escribe originales en el repositorio público.
"""
from pathlib import Path
from datetime import datetime, timezone
import argparse,hashlib,json,re
ROOT=Path(__file__).resolve().parents[1]
APPROVED=json.loads((ROOT/'data/microdatos/custodia-manifiesto.json').read_text())['files']

def certify(directory,commit):
 if not re.fullmatch(r'[a-f0-9]{40}',commit):raise ValueError('Se requiere el commit completo del depósito privado')
 rows=[];now=datetime.now(timezone.utc).isoformat()
 for item in APPROVED:
  path=Path(directory)/(item['study_id']+'.zip')
  if path.is_symlink():raise ValueError('No se admiten enlaces simbólicos')
  with path.open('rb') as stream:body=stream.read(2_000_001)
  if len(body)!=item['bytes'] or hashlib.sha256(body).hexdigest()!=item['sha256']:raise ValueError('Original no coincide: '+item['study_id'])
  rows.append({'study_id':item['study_id'],'sha256':item['sha256'],'bytes':len(body),'verified_at':now,'stored_at':now,'status':'conservado_pendiente_homologacion'})
 return {'schema':2,'provider':'github_private','repository':'bhermoso/observatorio-electoral-custodia','commit':commit,'verified_at':now,'stored':rows}

if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--directory',required=True);p.add_argument('--commit',required=True);a=p.parse_args()
 result=certify(a.directory,a.commit)
 (ROOT/'data/microdatos/custodia.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
 print('Certificados',len(result['stored']),'originales; solo se publicaron metadatos.')

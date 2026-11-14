"""Genera escenarios comparables por estudio y conserva las categorías originales.

Uso (pandas): python generar_maquina_multisondeo.py /carpeta/originales /carpeta/historicos
Ninguna entrevista, identificador o cruce demográfico individual se publica.
"""
import csv
import hashlib
import io
import itertools
import json
import math
import sys
import zipfile
from collections import defaultdict
from pathlib import Path
import pandas as pd
from cocina_cis import leer, _csv, resultado_23j, resultado_2019, VALIDOS
from generar_viaje_sondeo import calculate, KEYS
from analizar_40db_microdatos import decode

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'data/microdatos/maquina'
CIS={
 '3582':('Barómetro de octubre 2026','2026-10-14','2026-10-01','2026-10-06'),
 '3577':('Barómetro de septiembre 2026','2026-09-14','2026-09-01','2026-09-04'),
 '3571':('Barómetro de julio 2026','2026-07-15','2026-07-01','2026-07-06'),
 '3567':('Barómetro de junio 2026','2026-06-11','2026-06-01','2026-06-04'),
 '3411':('Preelectoral 23J · examen histórico','2023-07-05','2023-06-08','2023-06-27'),
 '3415':('Flash 23J · examen histórico','2023-07-17','2023-07-10','2023-07-12')}
FORTY=[
 ('40db-2026-11-14','40dB_tracking_dia02.zip','Tracking 29N · día 2','2026-11-14','2026-11-10','2026-11-13','p2','p3','p5','p1'),
 ('40db-2026-11-13','40dB_tracking_dia01.zip','Tracking 29N · día 1','2026-11-13','2026-11-10','2026-11-12','p2','p3','p5','p1'),
 ('40db-2026-11-09','2026_11_preelectoral_descargables.zip','Preelectoral noviembre 2026','2026-11-09','2026-11-02','2026-11-04','p3','p4','p6','p2'),
 ('40db-2026-10-09','2026_10_08_barometro_flash_descargables.zip','Flash de octubre 2026','2026-10-09','2026-10-07','2026-10-08','p2','p3','p9','p1'),
 ('40db-2026-10-05','2026_10_barometro_descargables.zip','Barómetro de octubre 2026','2026-10-05','2026-09-25','2026-09-28','p3','p4','p6','p2'),
 ('40db-2026-01-12','2026_01_barometro_descargables.zip','Barómetro de enero 2026','2026-01-12','2025-12-29','2026-01-05','p3','p4','p6','p2')]


def dumps(path,obj):
 path.write_text(json.dumps(obj,ensure_ascii=False,separators=(',',':'),allow_nan=False)+'\n')


def party(value,recall=False):
 s=decode(value).strip(); t=s.casefold()
 if not t or t=='nan':return 'NC'
 if 'blanco' in t:return 'BLANCO_NULO' if recall else 'BLANCO'
 if 'nulo' in t:return 'BLANCO_NULO' if recall else 'NULO'
 if t.startswith(('no votar','no voté')):return 'ABSTENCION' if recall else 'NO_VOTARIA'
 if t.startswith('no tenía edad'):return 'NUEVO'
 if t.startswith(('no lo sé','no sabe','no recuerdo')):return 'NR' if recall else 'NS'
 if t.startswith(('prefiero no contestar','no contesta')):return 'NR' if recall else 'NC'
 if t=='ninguno':return 'SIN_SIMPATIA'
 for prefix,key in [('psoe','PSOE'),('pp (','PP'),('vox','VOX'),('frente amplio','FA'),('sumar','SUMAR'),('podemos','PODEMOS'),('salf','SALF'),('se acabó','SALF'),('erc','ERC'),('jxcat','JUNTS'),('eaj','PNV'),('eh bildu','BILDU'),('bng','BNG'),('coalición canaria','CC'),('upn-pp','UPN_PP'),('upn','UPN'),('adelante','ADELANTE'),('compromís','COMPROMIS'),('ara més','ARA_MES'),('unidad del pueblo canario','UPC'),('nueva canarias','OTROS'),('cup','OTROS'),('teruel','TERUEL'),('¡soria','SORIA'),('españa vaciada','OTROS'),('upl','OTROS'),('otro','OTROS')]:
  if t.startswith(prefix):return key
 raise ValueError('Etiqueta electoral sin homologar: '+s)


def read40(path,cols):
 with zipfile.ZipFile(path) as z:
  name=next(n for n in z.namelist() if n.endswith('.dta') and not n.startswith('__MACOSX'))
  raw=z.read(name)
  reader=pd.io.stata.StataReader(io.BytesIO(raw));labels=reader.value_labels()
  df=pd.read_stata(io.BytesIO(raw),convert_categoricals=False)
 vote,sym,rec,prob=cols
 for key in [vote,sym,rec,prob,'ponde']:
  if key not in df:raise ValueError('Falta la variable '+key)
 label=lambda col,x:labels.get(col,{}).get(x,'')
 rows=[];names={};invalid=0;retained=0
 for _,r in df.iterrows():
  v=party(label(vote,r[vote]));rv=party(label(rec,r[rec]),True);sy=party(label(sym,r[sym]))
  # Solo se completa indecisión/no respuesta: no se sustituye abstención, blanco o nulo.
  combined=sy if v in ('NS','NC') and sy not in ('NS','NC','SIN_SIMPATIA') else v
  p=float(r[prob])
  if not math.isfinite(p) or p<0 or p>10:p=5;invalid+=1
  w=float(r.ponde)
  if not math.isfinite(w) or w<=0:raise ValueError('Peso no positivo o no finito')
  rows.append(dict(intencion=v,votosim=combined,recuerdo=rv,prob=p/10,peso=w))
  for col,key in [(vote,v),(sym,sy)]:names.setdefault(key,decode(label(col,r[col])))
  if v in ('NS','NC') and combined!=v:retained+=1
 not_valid={'NS','NC','NO_VOTARIA','NULO','SIN_SIMPATIA','FALTANTE'}
 valid=list(dict.fromkeys(['PP','PSOE','VOX',*sorted(set(names)-not_valid-{'PP','PSOE','VOX','BLANCO'}),'BLANCO']))
 # Nuevos partidos siguen separados; no se suman para fabricar equivalencias.
 names.update(FA='Frente Amplio',SUMAR='Sumar / Frente Amplio' if any('sumar/frente' in decode(v).lower() for v in labels[vote].values()) else 'Sumar',BLANCO='En blanco')
 profiles=[]
 for col,title in [('sexo','Sexo'),('edad_r','Edad')]:
  if col not in df:continue
  for value,g in df.groupby(col,observed=True):
   profiles.append(dict(dimension=title,category=decode(labels.get(col,{}).get(value,str(value))),n=len(g),weight=float(g.ponde.sum())))
 return rows,valid,names,dict(invalid_probability=invalid,sympathy_completed=retained,profiles=profiles)


def build(rows,meta,valid,official,names=None,extra=None):
 scenarios={}
 for bits in itertools.product((False,True),repeat=5):
  flags=dict(zip(KEYS,bits));scenarios[''.join(str(int(b)) for b in bits)]=calculate(rows,flags,official,valid)
 categories=defaultdict(int)
 for r in rows:categories[r['intencion']]+=1
 meta.update(n=len(rows),file='data/microdatos/maquina/'+meta['id']+'.json')
 data=dict(schema=2,study=meta['id'],meta=meta,n=len(rows),keys=KEYS,scenarios=scenarios,categories=dict(categories),labels=names or {},
           weight_range=[min(r['peso'] for r in rows),max(r['peso'] for r in rows)],weight_total=sum(r['peso'] for r in rows),
           source=meta['source'],sha256_zip=meta['sha256_zip'],diagnostic=extra or {},
           limits=['Escenarios experimentales sobre una misma muestra; no son la receta interna del productor ni modifican el pronóstico.',
                   'El peso original se utiliza como publicado. No se reconstruyen sus objetivos demográficos.',
                   'La calibración por recuerdo es un supuesto: memoria y composición muestral pueden explicar el desfase. Factores recortados a [0,2;5]; sin garantía de eliminar todo sesgo.',
                   'Probabilidad ausente o inválida: 0,5. No es una observación de participación.'])
 dumps(OUT/(meta['id']+'.json'),data)
 return meta


def main():
 folder=Path(sys.argv[1]);historical=Path(sys.argv[2]);OUT.mkdir(parents=True,exist_ok=True);index=[];pending=[]
 polls=json.load(open(ROOT/'data/polls.json'))
 for study,(title,published,start,end) in CIS.items():
  path=folder/('MD'+study+'.zip')
  if not path.exists():path=next(historical.rglob('MD'+study+'.zip'),None)
  if not path:continue
  rows,sha=leer(path,study);past=study in ('3411','3415')
  poll=next((p for p in polls if p['id'] in (study,'cis-'+study)),{})
  meta=dict(id='cis-'+study,house='CIS',title=title,published=published,fieldStart=poll.get('fieldStart',start),fieldEnd=poll.get('fieldEnd',end),historical=past,
            source=poll.get('source','https://www.cis.es/es/estudios/'+title.lower().replace(' ','-')),sha256_zip=sha,
            variables=dict(weight='PESO',vote='INTENCIONGR',sympathy='VOTOSIMG',recall='RECUERDO',participation='PROBVOTO'),
            recallElection='10N 2019' if past else '23J 2023',fourth='SUMAR',fourthLabel='Sumar' if past else 'Sumar/FA',sympathyMode='combined')
  index.append(build(rows,meta,VALIDOS,resultado_2019() if past else resultado_23j()))
 for ident,fname,title,published,start,end,v,s,r,p in FORTY:
  path=folder/fname
  if not path.exists():pending.append(dict(id=ident,title=title,reason='Original no descargado; no se calculan recetas.'));continue
  rows,valid,names,extra=read40(path,(v,s,r,p));modern='FA' in valid;fourth='FA' if modern else 'SUMAR'
  source= ('https://elpais.com/espana/elecciones-generales/2026-11-14/la-diferencia-entre-pp-y-psoe-se-estrecha-segun-el-tracking-diario-de-40db.html' if ident.endswith('11-14') else
          'https://elpais.com/espana/elecciones-generales/2026-11-13/la-campana-arranca-con-la-derecha-en-el-horizonte-de-los-190-escanos.html' if ident.endswith('11-13') else
          'https://elpais.com/espana/2026-11-09/consulte-todos-los-datos-internos-del-sondeo-preeelectoral-de-el-pais-cuestionarios-cruces-y-respuestas-individuales.html' if ident.endswith('11-09') else
          next(x['pagina'] for x in json.load(open(ROOT/'data/microdatos/fuentes-40db.json'))['fuentes'] if x['publicacion']==published))
  source=source.replace('preeelectoral','preelectoral')
  meta=dict(id=ident,house='40dB.',title=title,published=published,fieldStart=start,fieldEnd=end,historical=False,source=source,sha256_zip=hashlib.sha256(path.read_bytes()).hexdigest(),
            variables=dict(weight='ponde',vote=v,sympathy=s,recall=r,participation=p),recallElection='23J 2023',fourth=fourth,fourthLabel=names[fourth],sympathyMode='completion',
            overlap='Los tracking de noviembre comparten entrevistas: no son muestras independientes.' if 'Tracking' in title else None)
  # Ajuste sobre los grupos de recuerdo oficiales: otras candidaturas recordadas se agrupan en OTROS.
  official=resultado_23j()
  for row in rows:
   if row['recuerdo'] not in official and row['recuerdo'] not in ('ABSTENCION','NUEVO','NR'):row['recuerdo']='OTROS'
  if ident=='40db-2026-11-14':
   actual=sum(1 for x in rows if x['intencion']=='PP')
   meta['discrepancies']=['La presentación publica N=305 para intención PP; la matriz DTA contiene '+str(actual)+' registros. Se conserva el recuento del fichero original.'] if actual!=305 else []
  index.append(build(rows,meta,valid,official,names,extra))
 index.sort(key=lambda x:(x['published'],x['fieldEnd'],x['id']),reverse=True)
 dumps(OUT/'index.json',dict(schema=2,updated='2026-11-14',studies=index,pending=pending,default=index[0]['id'],catalog='data/microdatos/catalogo-publico.json'))
 print(len(index),'matrices originales calculadas;',len(index)*32,'recetas;',len(pending),'pendientes.')


if __name__=='__main__':main()

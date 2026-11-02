"""Reconstruye libro mayor de grupos CIS desde los ZIP originales, sin exportar entrevistas.

Uso: python scripts/generar_ledger_imputacion.py MD3411.zip MD3415.zip MD3582.zip
No se publica ningún cruce con menos de 20 entrevistas: se fusionan los
subgrupos de VOTOSIMG de la NO RESPUESTA en OTROS. Las reglas de estimación
se implementan en motor-imputacion.mjs, no aquí.
"""
import csv,io,zipfile,json,sys,collections
from pathlib import Path
PARTIES={'1':'PSOE','2':'PP','3':'VOX','21':'SUMAR'}
CATS=('PSOE','PP','VOX','SUMAR','OTROS','SIN_CANDIDATURA')
GROUPS={'9998':'INDECISION','9999':'NO_CONTESTA'}
def category(value):
 if value in PARTIES:return PARTIES[value]
 try:
  if 0<int(value)<=8995:return 'OTROS'
 except ValueError:pass
 return 'SIN_CANDIDATURA'
def load(path,sid):
 with zipfile.ZipFile(path) as z:
  if sid=='3411':
   with zipfile.ZipFile(io.BytesIO(z.read('3411csv.zip'))) as inner:raw=inner.read('3411_num.csv')
  else:raw=z.read(sid+'_num.csv')
 reader=csv.DictReader(io.StringIO(raw.decode('utf-8-sig')),delimiter=';')
 names={name.split(':')[0]:name for name in reader.fieldnames}
 for row in reader:yield {key:row[names[key]] for key in ('PESO','INTENCIONGR','VOTOSIMG','PROBVOTO','RECUVOTOGR')}
def study(path,sid):
 direct={p:[0,0.] for p in CATS}
 group={g:{'n':0,'w':0.,'sympathy':{p:[0,0.,0.] for p in CATS},
          'recall':{'CON_RECUERDO':0,'SIN_RECUERDO':0}} for g in GROUPS.values()}
 for row in load(path,sid):
  w=float(row['PESO'].replace(',','.'));response=row['INTENCIONGR'].strip()
  main=category(response);direct[main][0]+=1;direct[main][1]+=w
  if response not in GROUPS:continue
  g=group[GROUPS[response]];g['n']+=1;g['w']+=w
  v=category(row['VOTOSIMG'].strip());cell=g['sympathy'][v];cell[0]+=1;cell[1]+=w
  value=row['PROBVOTO'].strip()
  if value.isdigit() and 0<=int(value)<=10:cell[2]+=w*int(value)/10
  recall=category(row['RECUVOTOGR'].strip())
  g['recall']['CON_RECUERDO' if recall!='SIN_CANDIDATURA' else 'SIN_RECUERDO']+=1
 for gname,g in group.items():
  if gname=='NO_CONTESTA':
   other=g['sympathy']['OTROS']
   for p in list(g['sympathy']):
    if p not in ('OTROS','SIN_CANDIDATURA') and g['sympathy'][p][0]<20:
     cell=g['sympathy'].pop(p)
     for i in range(3):other[i]+=cell[i]
  g['w']=round(g['w'],4)
  g['sympathy']={p:[val[0],round(val[1],4),round(val[2],4)] for p,val in g['sympathy'].items()}
 return {'n':sum(x[0] for x in direct.values()),
  'direct':{p:[val[0],round(val[1],4)] for p,val in direct.items()},'groups':group}
def main():
 if len(sys.argv)!=4:raise SystemExit(__doc__)
 d={'version':1,'source':'CIS ZIP originales; agrupación nacional sin datos de personas',
    'groups':list(CATS),'studies':{sid:study(path,sid) for sid,path in zip(('3411','3415','3582'),sys.argv[1:])},
    'rule':'INTENCIONGR 9998 indecisión, 9999 no contesta; VOTOSIMG como candidatura observada; recuerdo solo como descriptivo; PESO original',
    'limitations':['VOTOSIMG es una variable construida, no equivale necesariamente a respuesta separada de simpatía.',
    'Esta tabla no contiene intersecciones detalladas entre recuerdo por candidatura y VOTOSIMG: no permite imputación combinada por recuerdo y simpatía.',
    'Los pesos efectivos de probabilidad PROBVOTO se muestran como diagnóstico, no se utilizan como predicción calibrada.',
    'En NO_CONTESTA, celdas de VOTOSIMG con menos de 20 entrevistas se fusionan en OTROS; por tanto OTROS no conserva siempre el significado original de partido residual. Usarlo como categoría imputada es solo análisis de sensibilidad.']}
 target=Path('data/microdatos/ledger_imputacion_cis.json')
 target.parent.mkdir(parents=True,exist_ok=True)
 target.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 print('Entrevistas:',{k:v['n'] for k,v in d['studies'].items()})
if __name__=='__main__':main()

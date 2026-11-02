"""Recalcula diagnostico_muestra_cis.json desde ZIP oficiales CIS.
Uso: python scripts/diagnosticar_muestra_cis.py MD3411.zip MD3415.zip MD3582.zip
No publica filas de entrevista; los cruces menores de 20 se suprimen.
"""
import collections,csv,io,json,sys,zipfile
from pathlib import Path
SIDS=('3411','3415','3582')
PARTIES={'1':'PSOE','2':'PP','3':'VOX','21':'SUMAR'}
STATUS={'0':'OTRAS_SITUACIONES','8995':'OTRO_PARTIDO','8996':'BLANCO','9977':'NULO','9997':'NO_VOTARIA','9998':'INDECISION','9999':'NO_CONTESTA'}
COLUMNS=('PESO','INTENCIONGR','RECUVOTOGR','PROBVOTO')
def category(code):
 if code in PARTIES:return PARTIES[code]
 if code in STATUS:return STATUS[code]
 try:
  if 1<=int(code)<=8995:return 'OTRAS_CANDIDATURAS'
 except ValueError:pass
 return 'OTROS_CODIGOS'
def recall(code):
 if code in ('9998','9999'):return 'SIN_RECUERDO_DECLARADO'
 if code in ('0','8996','9977','9997'):return 'SIN_CANDIDATURA_RECORDADA'
 try:
  if 1<=int(code)<=8995:return 'RECUERDA_CANDIDATURA'
 except ValueError:pass
 return 'SIN_CANDIDATURA_RECORDADA'
def turnout(code):
 try:v=int(code)
 except ValueError:return 'NO_VALIDO'
 return '10' if v==10 else '7_9' if 7<=v<=9 else '0_6' if 0<=v<=6 else 'NO_VALIDO'
def rows(path,sid):
 with zipfile.ZipFile(path) as z:
  if sid=='3411':
   with zipfile.ZipFile(io.BytesIO(z.read('3411csv.zip'))) as inner:raw=inner.read('3411_num.csv')
  else:raw=z.read(sid+'_num.csv')
 reader=csv.reader(io.StringIO(raw.decode('utf-8-sig')),delimiter=';')
 header=[x.split(':',1)[0] for x in next(reader)]
 idx={k:header.index(k) for k in COLUMNS}
 for row in reader:yield {k:row[i] for k,i in idx.items()}
def diagnose(path,sid):
 direct=collections.defaultdict(lambda:[0,0.]);turn=collections.Counter();rec=collections.Counter();ind_turn=collections.Counter();ind_rec=collections.Counter();weights=[]
 for r in rows(path,sid):
  w=float(r['PESO'].replace(',','.'));weights.append(w)
  dc=category(r['INTENCIONGR']);tg=turnout(r['PROBVOTO'])
  direct[dc][0]+=1;direct[dc][1]+=w
  turn[tg]+=1
  if dc=='INDECISION':
   ind_turn[tg]+=1;ind_rec[recall(r['RECUVOTOGR'])]+=1
 n=len(weights);total=sum(weights)
 # Suprimimos recuentos pequeños en cruces publicados.
 safe=lambda groups:{k:v if v>=20 else None for k,v in groups.items()}
 return {'n':n,'effective_n':round(total**2/sum(w*w for w in weights),1),'total_weight':round(total,4),
 'direct':{k:{'n':v[0],'w':round(v[1],1)} for k,v in direct.items()},
 'turnout':dict(turn),'indecision_recall':safe(ind_rec),'indecision_turnout':safe(ind_turn)}
def main():
 if len(sys.argv)!=4:raise SystemExit(__doc__)
 data={'version':1,'studies':{sid:diagnose(path,sid) for sid,path in zip(SIDS,sys.argv[1:])},
 'metadata':{'source':'CIS CSV numéricos, estudios 3411, 3415, 3582',
 'method':'Recuento por INTENCIONGR, RECUVOTOGR y PROBVOTO; pesos PESO',
 'codes':{'9998':'No sabe todavía','9999':'No contesta','9997':'No votaría','8996':'En blanco','9977':'Nulo','8995':'Otro partido','0':'Otros según estudio'},
 'recall':'Recuerda candidatura; para 3411 y 3415 corresponde a las elecciones 2019.',
 'limits':['Kish no incorpora diseño complejo','Cruces bivariantes: no inferir triple intersección','Celdas inferiores a 20 suprimidas','No se imputa voto']}}
 p=Path('data/microdatos/diagnostico_muestra_cis.json')
 p.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 print({k:v['n'] for k,v in data['studies'].items()})
if __name__=='__main__':main()

"""Procesa los DA/ES oficiales CIS 2019: python scripts/agregar_cis_2019.py MD3242.zip MD3263.zip"""
import zipfile,re,collections,json,hashlib,sys
from pathlib import Path
F={'3242':('P10R','P12'),'3263':('P9R','P11')}
S={'94':'INDECISION','98':'NO_SABE','99':'NO_CONTESTA','97':'ABSTENCION','96':'BLANCO','77':'NULO'}
P={'1':'PP','2':'PSOE','18':'VOX','3':'UNIDAS_PODEMOS','21':'UNIDAS_PODEMOS','4':'CIUDADANOS'}
def cat(v):
 if v in P:return P[v]
 if v in S:return S[v]
 return 'OTRAS_CANDIDATURAS' if v.isdigit() and 1<=int(v)<=95 else 'OTROS_CODIGOS'
def process(sid,path):
 with zipfile.ZipFile(path) as z:
  es=z.read('ES'+sid).decode('latin1');lines=z.read('DA'+sid).decode('latin1').splitlines()
 def column(name):
  m=re.search(r'\b'+name+r'\s+(\d+)-(\d+)',es)
  if not m:raise ValueError('Variable no documentada: '+name)
  a,b=map(int,m.groups());return a-1,b
 index={k:column(v) for k,v in {'vote':F[sid][0],'sym':'VOTOSIMG','rec':'RECUERDO','peso':'PESO','part':F[sid][1]}.items()}
 def field(line,k):
  a,b=index[k];return line[a:b].strip()
 totals=collections.defaultdict(lambda:[0,0.]);groups={k:collections.defaultdict(lambda:[0,0.]) for k in ('INDECISION','NO_SABE','NO_CONTESTA')}
 weights=[]
 for line in lines:
  w=float(field(line,'peso').replace(',','.'));weights.append(w)
  c=cat(field(line,'vote'));totals[c][0]+=1;totals[c][1]+=w
  if c in groups:
   p=cat(field(line,'sym'));groups[c][p][0]+=1;groups[c][p][1]+=w
 def output(c):
  vals={k:v for k,v in c.items() if v[0]>=20}
  small=[v for v in c.values() if v[0]<20]
  if small:vals['CELDAS_PEQUENAS']=[sum(v[0] for v in small),sum(v[1] for v in small)]
  return {k:[v[0],round(v[1],4)] for k,v in sorted(vals.items())}
 return {'n':len(lines),'total_weight':round(sum(weights),4),'n_kish':round(sum(weights)**2/sum(w*w for w in weights),1),
  'intention':output(totals),'groups':{k:output(v) for k,v in groups.items()},
  'variables':{k:v for k,v in zip(('intention','turnout'),F[sid])},'sha256':hashlib.sha256(Path(path).read_bytes()).hexdigest()}
if __name__=='__main__':
 if len(sys.argv)!=3:raise SystemExit(__doc__)
 result={'schema_version':1,'source':'CIS DA y ES 3242,3263; libro de códigos','studies':{s:process(s,p) for s,p in zip(('3242','3263'),sys.argv[1:])}}
 dest=Path('data/microdatos/diagnostico_2019_original.json');dest.parent.mkdir(parents=True,exist_ok=True)
 dest.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 print({k:v['n'] for k,v in result['studies'].items()})

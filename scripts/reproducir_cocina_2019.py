"""Seis etapas experimentales CIS 2019 sobre originales DA/ES (sin publicar entrevistas).

python scripts/reproducir_cocina_2019.py MD3242.zip MD3263.zip
No reemplaza homologación territorial; no integra Motor 29N.
"""
import collections,hashlib,json,re,sys,zipfile
from pathlib import Path

PARTIES=['PP','PSOE','VOX','CS'];VALID=PARTIES+['UP','OTROS','BLANCO']
MAP={'1':'PP','2':'PSOE','18':'VOX','4':'CS','21':'UP','3':'UP','96':'BLANCO',
     '77':'NULO','97':'NO_VOTARIA','94':'INDECISO','98':'NS','99':'NC'}
CONFIG={'3242':('P10R','P12','2016-06-26','2019-04-28','24cbdbccf119d1174fb6ed5cd3a23aa8303d8244ca5cdf717d27399f08bbc'),
        '3263':('P9R','P11','2019-04-28','2019-11-10','efe93eeb74047a677d2cd4c39be0fa5e340c5f7db4ec651fc4e4a6f3bcc3532c')}
# BOE-A-2016-7133, BOE-A-2019-8070, BOE-A-2019-17344.
HIST={'2016-06-26':(24053755,7941236,5443846,47182,3141570,5087538),
      '2019-04-28':(26201371,4373653,7513142,2688092,4155665,3751145),
      '2019-11-10':(24258228,5047040,6792199,3656979,1650318,3119364)}
def target(election):
    total,*votes=HIST[election]
    values=dict(zip(PARTIES+['UP'],votes))
    values['OTROS']=total-sum(votes)
    return {k:v/total for k,v in values.items()}

def category(code):
    if code in MAP:return MAP[code]
    return 'OTROS' if code.isdigit() and 1<=int(code)<=95 else 'NC'

def read(study,file):
    intent,participation,previous,election,expected=CONFIG[study]
    digest=hashlib.sha256(Path(file).read_bytes()).hexdigest()
    if digest!=expected:raise ValueError('Original distinto al cotejado: '+study)
    with zipfile.ZipFile(file) as z:
        es=z.read('ES'+study).decode('latin1')
        lines=z.read('DA'+study).decode('latin1').splitlines()
    names=['PESO',intent,'VOTOSIMG','RECUERDO',participation]
    positions={}
    for name in names:
        match=re.search(r'\b'+re.escape(name)+r'\s+(\d+)-(\d+)',es)
        if match is None:raise ValueError('Variable no identificada: '+name)
        positions[name]=tuple(map(int,match.groups()))
    def get(r,k):
        a,b=positions[k];return r[a-1:b].strip()
    rows=[]
    for line in lines:
        weight=float(get(line,'PESO').replace(',','.'))
        prob=get(line,participation)
        voteprob=int(prob)/10 if prob.isdigit() and int(prob)<=10 else .5
        remembered=get(line,'RECUERDO')
        rows.append({'direct':category(get(line,intent)),
                     'sym':category(get(line,'VOTOSIMG')),
                     'rec':category(remembered) if remembered not in ('94','97','98','99') else 'NR',
                     'w':weight,'prob':voteprob})
    return rows,digest

def shares(rows,weights,field,imputation=None):
    mass=collections.defaultdict(float)
    for r,w in zip(rows,weights):
        c=r[field]
        if c in VALID:mass[c]+=w
        elif imputation and c in ('INDECISO','NS','NC'):
            for k,frac in imputation.get(r['rec'],{}).items():mass[k]+=w*frac
    den=sum(mass.values())
    return {k:mass[k]/den*100 for k in VALID}

def calculate(study,file):
    intent,participation,previous,election,_=CONFIG[study]
    rows,sha=read(study,file)
    w=[r['w'] for r in rows]
    steps={'directa':shares(rows,[1.]*len(rows),'direct'),
           'peso':shares(rows,w,'direct'),
           'simpatia':shares(rows,w,'sym')}
    recalled=collections.defaultdict(float)
    for r,wi in zip(rows,w):recalled[r['rec']]+=wi
    remembered_groups=PARTIES+['UP','OTROS']
    base=sum(recalled[k] for k in remembered_groups)
    goal=target(previous)
    factors={k:min(5.,max(.2,goal[k]*base/recalled[k])) if recalled[k] else 1.
             for k in remembered_groups}
    wrec=[wi*factors.get(r['rec'],1.) for r,wi in zip(rows,w)]
    steps['recuerdo']=shares(rows,wrec,'sym')
    matrix=collections.defaultdict(lambda:collections.defaultdict(float))
    for r,wi in zip(rows,wrec):
        if r['rec'] in factors and r['sym'] in VALID:matrix[r['rec']][r['sym']]+=wi
    imp={group:{k:val/sum(d.values()) for k,val in d.items()} for group,d in matrix.items() if sum(d.values())}
    steps['indecisos']=shares(rows,wrec,'sym',imp)
    steps['participacion']=shares(rows,[wi*r['prob'] for wi,r in zip(wrec,rows)],'sym',imp)
    real=target(election)
    return {'id':study,'n':len(rows),'sha256_zip':sha,
            'factores_recuerdo':{k:round(v,4) for k,v in factors.items()},
            'pasos':{key:{'mae_pp':round(sum(abs(vals[k]-100*real[k]) for k in PARTIES)/4,4),
                          'votos_pct':{k:round(vals[k],4) for k in PARTIES}}
                     for key,vals in steps.items()}}

def main():
    if len(sys.argv)!=3:raise SystemExit(__doc__)
    output={'esquema':1,'estado':'EXPLORATORIO_NO_ADMITIR','estudios':[calculate('3242',sys.argv[1]),calculate('3263',sys.argv[2])]}
    for study in output['estudios']:
        print(study['id'],{step:item['mae_pp'] for step,item in study['pasos'].items()})
    return output
if __name__=='__main__':main()

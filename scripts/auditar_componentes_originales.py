#!/usr/bin/env python3
"""Componentes aislados sobre la misma cohorte original CIS 3411/3415.

Uso: python scripts/auditar_componentes_originales.py MD3411.zip MD3415.zip
Salida: solo agregados. Ninguna entrevista ni identificador se publica.
"""
from pathlib import Path
import csv,hashlib,io,json,math,sys
from collections import defaultdict
import cocina_cis as C
ROOT=Path(__file__).resolve().parents[1]

def metrics(rows,weights,field,impute=None):
    if len(rows)!=len(weights) or not weights or any(not math.isfinite(w) or w<0 for w in weights) or sum(weights)<=0:
        raise ValueError("Pesos vacíos, incompatibles, negativos o no finitos")
    mass=defaultdict(float);used=[]
    for r,w in zip(rows,weights):
        v=r[field]
        if v in C.VALIDOS:
            mass[v]+=w
            if w>0:used.append(w)
        elif impute and v in ('NS','NC') and r['recuerdo'] in impute:
            for p,f in impute[r['recuerdo']].items():mass[p]+=w*f
            used.append(w)
    base=sum(mass.values());total=sum(weights)
    return dict(n_cohorte=len(rows),n_aportan=len(used),peso_total=total,denominador_valido=base,
        kish_cohorte=total**2/sum(w*w for w in weights),
        kish_aportan=sum(used)**2/sum(w*w for w in used) if used and sum(w*w for w in used) else None,
        masa=dict(mass),porcentaje_total={p:100*mass[p]/total for p in C.VALIDOS},
        estimacion={p:100*mass[p]/base for p in C.VALIDOS} if base else {})

def audit(path,study):
    rows,sha=C.leer(path,study)
    raw=list(csv.reader(io.StringIO(C._csv(path,study).decode('utf-8-sig')),delimiter=';'))
    headers=[x.split(':',1)[0] for x in raw[0]];idx=headers.index('PROBVOTO')
    if len(rows)!=len(raw)-1:raise ValueError('Desalineación de originales')
    eligible=[]
    for row,values in zip(rows,raw[1:]):
        p=values[idx].strip()
        if p.isdigit() and 0<=int(p)<=10 and math.isfinite(row['peso']) and row['peso']>0:
            # Explicit declared probability in ALL variants. Mail backfilling is
            # retained for intention, but does not relax common eligibility.
            eligible.append(dict(row,prob=int(p)/10))
    if not eligible:raise ValueError('Sin cohorte elegible')
    rows=eligible;w=[r['peso'] for r in rows];official=C.resultado_2019()
    totals=defaultdict(float)
    for r,x in zip(rows,w):totals[r['recuerdo']]+=x
    remembered=sum(totals[g] for g in official)
    factors={g:min(5,max(.2,official[g]*remembered/totals[g])) if totals[g] else 1 for g in official}
    wr=[x*factors.get(r['recuerdo'],1) for r,x in zip(rows,w)]
    donors=defaultdict(lambda:defaultdict(float))
    for r,x in zip(rows,w):
        if r['votosim'] in C.VALIDOS and r['recuerdo'] in official:donors[r['recuerdo']][r['votosim']]+=x
    donors={g:{p:x/sum(d.values()) for p,x in d.items()} for g,d in donors.items() if sum(d.values())}
    scenarios={'directa_sin_peso':metrics(rows,[1.]*len(rows),'intencion'),
        'directa_peso':metrics(rows,w,'intencion'),'simpatia_peso':metrics(rows,w,'votosim'),
        'solo_recuerdo':metrics(rows,wr,'votosim'),
        'solo_indecisos':metrics(rows,w,'votosim',donors),
        'solo_participacion':metrics(rows,[x*r['prob'] for x,r in zip(w,rows)],'votosim')}
    # Joint recipe is separately labelled; never call it an isolated effect.
    steps,neff=C.cocinar(rows,official)
    comparisons=[]
    pairs=[('ponderacion','directa_sin_peso','directa_peso'),('simpatia','directa_peso','simpatia_peso'),('recuerdo','simpatia_peso','solo_recuerdo'),('indecisos','simpatia_peso','solo_indecisos'),('participacion','simpatia_peso','solo_participacion')]
    for component,a,b in pairs:
        x,y=scenarios[a],scenarios[b];delta={}
        for p in C.VALIDOS:
            num=100*(y['masa'].get(p,0)-x['masa'].get(p,0))/x['denominador_valido']
            den=100*y['masa'].get(p,0)*(1/y['denominador_valido']-1/x['denominador_valido'])
            delta[p]=dict(cambio_pp=y['estimacion'].get(p,0)-x['estimacion'].get(p,0),numerador_pp=num,denominador_pp=den)
        comparisons.append(dict(componente=component,base=a,alternativa=b,diferencias=delta))
    # Election outcome only scores scenarios, never calibrates respondent weights.
    sys.path.insert(0,str(ROOT))
    from modelo.motor.fuentes import resultado_23j
    target=resultado_23j();parties=['PP','PSOE','VOX','SUMAR']
    for s in scenarios.values():
        errors={p:s['estimacion'].get(p,0)-target[p] for p in parties}
        s['errores_23j']=errors;s['mae_23j']=sum(abs(e) for e in errors.values())/len(errors)
    for comparison in comparisons:
        comparison['cambio_mae_23j']=scenarios[comparison['alternativa']]['mae_23j']-scenarios[comparison['base']]['mae_23j']
    return dict(universo_puntuado=parties,resultado_oficial={p:target[p] for p in parties},denominador_objetivo='votos válidos, incluye blanco',sha256_zip=sha,n_original=len(raw)-1,n_cohorte=len(rows),n_excluidas=len(raw)-1-len(rows),
        elegibilidad='PESO finito positivo y PROBVOTO explícita entera 0–10, igual en todos los escenarios',
        objetivo_recuerdo='BOE noviembre 2019, nunca resultado 23J 2023',factores_recuerdo=factors,
        escenarios=scenarios,contrastes=comparisons,receta_acumulativa_misma_cohorte=steps,kish_final_receta=neff)

def main():
    if len(sys.argv)!=3:raise SystemExit(__doc__)
    out=dict(esquema=1,tipo='ablaciones_originales_misma_cohorte',elecciones_independientes=1,
        original_no_redistribuido=True,entrada_motor=False,
        advertencias=['Dos estudios de una elección no equivalen a validación multielectoral.',
          'Las diferencias algebraicas no son efectos causales ni contribuciones aditivas universales.',
          'La cohorte con probabilidad válida difiere del universo completo: no se mezclan sus cifras con otras bases.',
          'Los pesos de recuerdo usan solo noviembre de 2019; el resultado 23J sirve para puntuar, nunca para calibrar estos pesos.',
          'No se homologa artificialmente la adaptación experimental CIS 2019 con esta receta.'],
        estudios={s:audit(Path(p),s) for s,p in zip(('3411','3415'),sys.argv[1:])})
    code=Path(__file__);out['codigo_sha256']=hashlib.sha256(code.read_bytes()).hexdigest()
    out['dependencias_sha256']={str(p.relative_to(ROOT)):hashlib.sha256(p.read_bytes()).hexdigest() for p in [ROOT/'scripts/cocina_cis.py',ROOT/'modelo/motor/fuentes.py',ROOT/'data/sources/resultados_2019N.json',ROOT/'data/results.csv',ROOT/'data/districts.csv']}
    out['fuentes_originales']=json.loads((ROOT/'work/ciencia/descarga-cis.json').read_text()) if (ROOT/'work/ciencia/descarga-cis.json').exists() else []
    p=ROOT/'data/microdatos/componentes-originales-cohorte.json';p.write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n')
    for study,s in out['estudios'].items():print(study,'cohorte',s['n_cohorte'],'de',s['n_original'],{k:round(v['mae_23j'],3) for k,v in s['escenarios'].items()})
if __name__=='__main__':main()

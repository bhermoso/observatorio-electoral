"""Conecta recetas individuales con dos universos de pronóstico revisables.

Originales fuera del repositorio; salidas agregadas y escenarios reproducibles.
No aplica a una receta nueva los errores históricos de la estimación de su productor.
"""
import argparse
import csv
import hashlib
import io
import json
import re
import zipfile
from datetime import date,timedelta
from pathlib import Path
import numpy as np
import pandas as pd
from modelo.microdatos.taller import calcular, PROFILES
from modelo.motor import fuentes as F, pronostico as P
from scripts.cocina_cis import leer as leer_cis, _csv
from scripts.analizar_40db_microdatos import code, decode
from scripts.estimar_microdatos_more_octubre import leer as leer_more, NAMES

ROOT=Path(__file__).resolve().parents[1]
HASHES={'cis':'1cfcf43b38ee036bb89dadc7d9b88a70d2098bb2c1a5051921aa517415a00c9f',
 '40db':'905d4ab237b58fc44e6b99944505acb4e99687c02e8894d5cb0e0e410e45a100'}
MAJOR=['PP','PSOE','VOX','SUMAR','PODEMOS','SALF']


def fuentes(folder):
    path=folder/'MD3582.zip'
    if hashlib.sha256(path.read_bytes()).hexdigest()!=HASHES['cis']:raise ValueError('CIS no coincide')
    rows,_=leer_cis(path,'3582')
    csv_rows=list(csv.reader(io.StringIO(_csv(path,'3582').decode('utf-8-sig')),delimiter=';'))
    header=[x.split(':',1)[0] for x in csv_rows[0]]
    prob_index=header.index('PROBVOTO')
    probabilities=[float(row[prob_index]) if row[prob_index].isdigit() and 0<=int(row[prob_index])<=10 else np.nan for row in csv_rows[1:]]
    if len(probabilities)!=len(rows):raise ValueError('Desalineación CIS')
    cis=dict(id='cis',casa='CIS',estudio='cis-3582',n=len(rows),
        campo_ini=date(2026,10,1),campo_fin=date(2026,10,6),publicacion=date(2026,10,14),
        columnas=['INTENCIONGR','VOTOSIMG','RECUERDO','PESO','PROBVOTO'],
        url='https://www.cis.es/es/estudios/barometro-de-octubre-2026',sha256=HASHES['cis'],
        voto=[x['intencion'] for x in rows],simpatia=[x['votosim'] for x in rows],
        recuerdo=[x['recuerdo'] for x in rows],peso=[x['peso'] for x in rows],
        participacion=probabilities,
        nota='VOTOSIMG combina voto y simpatía; solo se consulta para NS. PESO es del CIS. Los 12 faltantes de PROBVOTO usan la media ponderada observada, igual que en las demás fuentes. El registro publicado dice 5.025; la matriz leída tiene 5.024 filas.',
        participacion_faltante_origen=int(np.sum(~np.isfinite(probabilities))))
    path=folder/'2026_10_08_barometro_flash_descargables.zip'
    if hashlib.sha256(path.read_bytes()).hexdigest()!=HASHES['40db']:raise ValueError('40dB no coincide')
    with zipfile.ZipFile(path) as z:
        matches=[n for n in z.namelist() if n.endswith('.dta') and not n.startswith('__MACOSX')]
        if len(matches)!=1:raise ValueError('Matriz 40dB inesperada')
        df=pd.read_stata(io.BytesIO(z.read(matches[0])))
    remap={'INDECISO':'NS','NO_RESPUESTA':'NC','FALTANTE':'NC','SIN_EDAD':'NUEVO',
        'CUP':'OTROS','UPL':'OTROS','ADELANTE':'OTROS','ESPANA_VACIADA':'OTROS','NC':'OTROS'}
    def category(x):
        if decode(x).casefold()=='ninguno':return 'NINGUNO'
        c=code(x)
        return remap.get(c,c)
    def turnout(x):
        m=re.match(r'^(\d+)',decode(x))
        return float(m[1]) if m and 0<=float(m[1])<=10 else np.nan
    db=dict(id='40db',casa='40dB.',estudio='40db-2026-10-flash',n=len(df),
        campo_ini=date(2026,10,7),campo_fin=date(2026,10,8),publicacion=date(2026,10,9),
        columnas=['p2','p3','p9','ponde','p1'],
        url='https://elpais.com/espana/2026-10-09/consulte-todos-los-datos-internos-de-la-encuesta-de-el-pais-cuestionarios-cruces-y-respuestas-individuales.html',sha256=HASHES['40db'],
        voto=[category(x) for x in df.p2],simpatia=[category(x) for x in df.p3],
        recuerdo=[category(x) for x in df.p9],peso=df.ponde.to_list(),participacion=[turnout(x) for x in df.p1],
        nota='Flash: España excepto Ceuta y Melilla. Se aproxima su cobertura al conjunto estatal; limitación visible. ponde es del productor y no permite reconstruir todas sus decisiones. CUP, UPL, Adelante y España Vaciada se reúnen explícitamente en Otros.')
    frame,source=leer_more()
    special={98:'NC',99:'NS',24:'NULO',25:'ABSTENCION',15:'UPN'}
    def morecat(x,sym=False):
        if pd.isna(x):return None
        if sym and x==23:return 'NINGUNO'
        label=NAMES.get(int(x))
        if label:
            return {'FRENTE_AMPLIO':'SUMAR','ADELANTE':'OTROS','DRAGO':'OTROS'}.get(label,label)
        # Los códigos no partidistas se contrastan con sus etiquetas en leer().
        if int(x) in special:return special[int(x)]
        raise ValueError('Código More no homologado: '+str(x))
    # Comprobar metadatos de abstención/nulo, no suponer equivalencia entre casas.
    # Metadatos inspeccionados: 24=Nulo, 25=No votaría, recuerdo 15=UPN.
    more=dict(id='more',casa='More in Common',estudio='more-in-common-2026-10-01',n=len(frame),
        campo_ini=date(2026,10,21),campo_fin=date(2026,10,25),publicacion=date(2026,11,3),
        columnas=['intencion_voto_raw','simpatia_partido','voto_2023_raw','peso_demografico','prob_voto_declarada'],
        url=source['url'],sha256=source['sha256'],
        voto=[morecat(x) for x in frame.intencion_voto_raw],
        simpatia=[morecat(x,True) for x in frame.simpatia_partido],
        recuerdo=[morecat(x) for x in frame.voto_2023_raw],
        peso=frame.peso_demografico.to_list(),participacion=frame.prob_voto_declarada.to_list(),
        nota='Frente Amplio se homologa a SUMAR solo para este ensayo. Se usa peso demográfico, nunca peso final ni intención imputada final. La composición territorial de la candidatura no queda validada por esta equivalencia.')
    return [cis,db,more]


def construir(folder,n):
    corte=date(2026,11,5)
    current,_=F.seleccion_pronostico([e for e in F.todas() if e['campo_fin']<=corte and F.publicada_antes(e,corte)])
    sources=fuentes(folder)
    byid={e['estudio']:e for e in current}
    morepub={'PP':28.3,'PSOE':27.6,'VOX':20.8,'SUMAR':7.8,'PODEMOS':2.6}
    recipes={}
    for source in sources:
        raw=[source[k] for k in ['voto','simpatia','recuerdo','peso','participacion']]
        recipes[source['id']]=calcular(*raw,truth=F.resultado_23j())
    entries=[]
    public_sources=[]
    for source in sources:
        old=byid.get(source['estudio'])
        entry=dict(old) if old else dict(casa=source['casa'],estudio=source['estudio'],
            voto=morepub,campo_ini=source['campo_ini'],campo_fin=source['campo_fin'],
            publicacion=source['publicacion'],ciclo='2023-26',origen='publicacion-more',url=source['url'])
        entry['n']=source['n'] # mismo N en todas las comparaciones, también publicada
        entries.append(entry)
        public_sources.append({k:v for k,v in source.items() if k not in ['voto','simpatia','recuerdo','peso','participacion']})
        public_sources[-1].update(recetas=recipes[source['id']],publicada=entry['voto'])
    ids={e['estudio'] for e in entries}
    other=[e for e in current if e['estudio'] not in ids]
    forecasts={}
    for mode in ['microdatos','integrada']:
        base=entries if mode=='microdatos' else other+entries
        # Inicio común a todas las recetas de cada universo; no cambia con la selección.
        start=min(F.dia_central(e) for e in base)-timedelta(days=7)
        for profile in ['publicada']+list(PROFILES):
            inputs=[]
            ledger=[]
            for entry in base:
                source=next((s for s in sources if s['estudio']==entry['estudio']),None)
                if source and profile!='publicada':
                    calculated=recipes[source['id']][profile]['estimacion']
                    # Mismos partidos con cifra publicada para aislar receta, no cobertura.
                    votes={p:calculated[p] for p in entry['voto'] if p in calculated}
                    inputs.append(dict(entry,voto=votes,origen='microdatos-cocina-oee'))
                    ledger.append(dict(estudio=entry['estudio'],casa=entry['casa'],tipo='microdatos',voto=votes))
                else:
                    inputs.append(entry)
                    ledger.append(dict(estudio=entry['estudio'],casa=entry['casa'],tipo='publicada',voto=entry['voto']))
            if len({e['estudio'] for e in inputs})!=len(inputs):raise ValueError('Muestra duplicada')
            # Nueva receta: no hereda errores del algoritmo publicado por cada casa.
            # Dos referencias de consenso; ninguna corrección histórica direccional.
            forecast=P.principal(inputs,start,corte,date(2026,11,29),{},n_por_variante=n,
                variantes=('consenso_privadas','consenso_todas'),fraccion_sesgo=0,factor_prior_23j=0)
            forecasts[mode+'_'+profile]=dict(partidos=forecast['partidos'],bloques=forecast['bloques'],
                investidura=forecast['investidura'],provincias=forecast['provincias'],
                n=forecast['n'],entradas=ledger,inicio=str(start),
                sin_encuestas=forecast['sin_encuestas'],encuestas=len(inputs),
                cocinadas=sum(x['tipo']=='microdatos' for x in ledger),
                casas=len({e['casa'] for e in inputs}))
            print('Calculado',mode,profile,flush=True)
    return dict(esquema=1,corte=str(corte),eleccion='2026-11-29',fuentes=public_sources,
        entrevistas=sum(s['n'] for s in sources),recetas=PROFILES,escenarios=forecasts,
        historica=json.load(open(ROOT/'data/microdatos/40db-2023-factorial-completo.json')),
        errores_casas=json.load(open(ROOT/'data/microdatos/trazabilidad-error-casas-23j.json')),
        sensibilidad=json.load(open(ROOT/'data/microdatos/sensibilidad-error-23j.json')),
        parametros=dict(industria=2.2,rho_bloque=.5,contraccion=50,
            imputar_nc=False,recorte_recuerdo=[.5,2],n_por_variante=n,
            correccion_error_historico=0,variantes=['consenso_privadas','consenso_todas']),
        limites=['Receta experimental, no validada prospectivamente. Las pruebas del código no acreditan acierto.',
            'Se aprovechan pesos del productor. Ninguna receta es independiente de toda su preparación.',
            'Indecisos se imputan bajo una hipótesis de similitud con donantes; NC permanece excluido.',
            'Participación declarada / 10 no es una probabilidad calibrada. Los faltantes usan la media ponderada observada de cada muestra.',
            'Se mantiene 2,2 como supuesto de incertidumbre de industria; no se estima con estas tres muestras.',
            'No se traslada el error de 2023 del productor a una cocina individual distinta.',
            'Las tres matrices corresponden a fechas y diseños diferentes; no son 8.034 entrevistas del mismo trabajo de campo.',
            'Microdatos usa tres encuestas, con referencias de consenso distintas. Integrada añade otras estimaciones publicadas; no pretende cocinar entrevistas que no tenemos.',
            'Con una sola oleada por casa en el circuito de microdatos, fecha y efecto de casa se distinguen mediante supuestos del modelo, no por evidencia temporal repetida suficiente.',
            'Se conservan los mismos partidos observados en cada fuente publicada. Los regionales sin datos mantienen la hipótesis geográfica de 2023.',
            'No se atribuyen cambios a eventos; su seguimiento permanece separado hasta reunir evidencia.'])


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('zip_dir',type=Path)
    parser.add_argument('--simulaciones-por-variante',type=int,default=750)
    args=parser.parse_args()
    result=construir(args.zip_dir,args.simulaciones_por_variante)
    (ROOT/'data/microdatos/taller-integrado.json').write_text(json.dumps(result,ensure_ascii=False,indent=2,default=str)+'\n')

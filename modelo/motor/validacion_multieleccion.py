"""Evaluación nacional temporal. No es un backtest del simulador de escaños 29N.

Las predicciones se construyen antes de leer el resultado de la elección objetivo.
Parámetros fijados: no se selecciona una receta con las elecciones de prueba.
Entrenamiento expansivo: solo convocatorias anteriores, nunca futuras (ni LOEO
simétrico). PP/PSOE es el soporte común documentado, no el universo electoral.
"""
from collections import defaultdict
from datetime import date, timedelta
import hashlib
import json
from math import sqrt
import numpy as np
from . import fuentes as F
from .tendencia import ajustar

PARTIDOS = ('PP','PSOE')
HORIZONTES = (90,60,30,15,7)
PARAMETROS = dict(ventana=180, ventana_promedios=30, semivida=15, tau=.15,
                  industria=2.0, factor_casa=.5, sd_prior_casa=1.5, veda=6,
                  partidos=list(PARTIDOS), horizontes=list(HORIZONTES))
VARIANTES = ('ultima_publicacion','media_casas','media_recencia','media_casas_corregida',
             'latente_sin_correccion','mezcla_nacional_historica')

def temporal(encuestas, corte, ventana=180, partidos=PARTIDOS):
    out=[]
    for original in encuestas:
        e=dict(original)
        for k in ('campo_ini','campo_fin','publicacion'):
            if isinstance(e.get(k),str):e[k]=date.fromisoformat(e[k])
        if not e.get('publicacion') or not e.get('campo_fin') or not e.get('campo_ini'):continue
        if e.get('campo_supuesto') or e.get('fecha_publicacion_desconocida'):continue
        if not e['campo_ini']<=e['campo_fin']<=e['publicacion']<=corte:continue
        if e['campo_fin']<corte-timedelta(days=ventana):continue
        if not all(p in e.get('voto',{}) for p in partidos):continue
        # Missing n is an explicit sensitivity, not a fabricated sample size.
        e['n_supuesto']=e.get('n_supuesto',False) or not e.get('n')
        e['n']=e.get('n') or 1000
        e['casa']=F.casa_canonica(e['casa'])
        out.append(e)
    # Same house/field/vote can be repeated across sources. Publication known at
    # the cut is used; future source corrections cannot delete older observations.
    dedup={}
    for e in sorted(out,key=lambda x:(x['publicacion'],x['estudio'])):
        k=(e['casa'],e['campo_ini'],e['campo_fin'],tuple(e['voto'][p] for p in partidos))
        dedup.setdefault(k,e)
    return sorted(dedup.values(),key=lambda e:(e['publicacion'],e['estudio']))

def ultimas_casas(obs,corte,ventana=30):
    out={}
    for e in obs:
        if e['campo_fin']<corte-timedelta(days=ventana):continue
        key=e['casa']
        if key not in out or (e['publicacion'],e['campo_fin'],e['estudio'])>(out[key]['publicacion'],out[key]['campo_fin'],out[key]['estudio']):out[key]=e
    return list(out.values())

def aprender(ciclos, encuestas, objetivo, partidos=PARTIDOS, disponible_hasta=None):
    """Residual final por casa/elección, promedio igual entre elecciones previas."""
    residual=defaultdict(list);trained=[]
    for ciclo in ciclos:
        day=date.fromisoformat(ciclo['fecha'])
        pub_resultado=ciclo.get('fecha_publicacion_resultado')
        if day>=objetivo or not pub_resultado or date.fromisoformat(pub_resultado)>(disponible_hasta or objetivo) or not all(p in ciclo['resultado'] for p in partidos):continue
        corte=day-timedelta(days=PARAMETROS['veda'])
        obs=ultimas_casas(temporal([e for e in encuestas if e['eleccion']==ciclo['fecha']],corte,partidos=partidos),corte)
        if not obs:continue
        trained.append(ciclo['fecha'])
        for e in obs:
            for p in partidos:residual[(e['casa'],p)].append(e['voto'][p]-ciclo['resultado'][p])
    return {k:float(np.mean(v)) for k,v in residual.items()},trained

def intervalo(mu,sd):
    return dict(media=float(mu),sd=float(sd),p5=float(mu-1.6448536269514722*sd),p95=float(mu+1.6448536269514722*sd))

def predecir(encuestas,corte,eleccion,residuales=None,ventana=180,industria=2.0,tau=.15,omitir_n_supuesto=False,partidos=PARTIDOS):
    """No recibe resultado objetivo. El mismo soporte se usa en todas las variantes."""
    obs=temporal(encuestas,corte,ventana,partidos=partidos)
    if omitir_n_supuesto:obs=[e for e in obs if not e['n_supuesto']]
    ult=ultimas_casas(obs,corte)
    if len(ult)<2:return None
    pesos=np.array([2**(-(corte-e['campo_fin']).days/15) for e in ult]);pesos/=pesos.sum()
    finales=[e for e in ult if e['publicacion']==max(o['publicacion'] for o in ult)]
    residual=residuales or {};result={v:{} for v in VARIANTES}
    days=(eleccion-corte).days;inicio=corte-timedelta(days=ventana)
    for p in partidos:
        means=[e['voto'][p] for e in ult]
        mu=float(np.mean(means));scale=sqrt(max(mu,.5)/25)
        # A common declared predictive envelope for descriptive baselines. It is
        # an assumption being evaluated, not sampling precision / sqrt(n polls).
        common_sd=sqrt((industria*scale)**2+(tau*scale)**2*days+1/len(ult))
        baselines={'ultima_publicacion':np.mean([e['voto'][p] for e in finales]),
                   'media_casas':mu,'media_recencia':float(np.dot(means,pesos)),
                   'media_casas_corregida':np.mean([e['voto'][p]-.5*residual.get((e['casa'],p),0) for e in ult])}
        for v,x in baselines.items():result[v][p]=intervalo(x,common_sd)
        fits=[]
        for variant in ('privadas','todas','historica'):
            kw=dict(tau=tau)
            if variant=='todas':kw['excluir_ancla']=()
            elif variant=='historica' and residual:
                priors={c:(.5*r,1.5) for (c,q),r in residual.items() if q==p}
                if priors:kw['prior_sesgos']=priors
            fit=ajustar(obs,p,inicio,corte,**kw)
            m=float(fit['media'][-1]);sc=float(fit['escala'])
            sd=sqrt(float(fit['sd'][-1])**2+(tau*sc)**2*days+(industria*sc)**2)
            fits.append((m,sd))
        result['latente_sin_correccion'][p]=intervalo(*fits[0])
        # Moment summary of an equal Gaussian mixture; exact mixture quantiles
        # are computed deterministically (no Monte Carlo interval noise).
        from scipy.optimize import brentq
        from scipy.special import ndtr
        ms=np.array([x[0] for x in fits]);ss=np.array([x[1] for x in fits]);m=float(ms.mean())
        sd=sqrt(float(np.mean(ss**2+(ms-m)**2)))
        lo=min(ms-12*ss);hi=max(ms+12*ss)
        quant=lambda q:float(brentq(lambda x:float(np.mean(ndtr((x-ms)/ss)))-q,lo,hi))
        result['mezcla_nacional_historica'][p]=dict(media=m,sd=sd,p5=quant(.05),p95=quant(.95))
    admitted={e['estudio'] for e in obs}
    excluded=[]
    for e in encuestas:
        if e['estudio'] in admitted:continue
        pub=str(e.get('publicacion') or '');fin=str(e.get('campo_fin') or '')
        reason=('publicacion_desconocida' if not pub or e.get('fecha_publicacion_desconocida') else
                'publicacion_posterior_al_corte' if pub>str(corte) else
                'campo_posterior_al_corte' if fin>str(corte) else
                'fuera_de_ventana' if fin<str(corte-timedelta(days=ventana)) else
                'muestra_imputada_excluida' if omitir_n_supuesto and (e.get('n_supuesto') or not e.get('n')) else
                'duplicada_o_campo_incompleto_o_partidos_incompatibles')
        excluded.append(dict(estudio=e['estudio'],motivo=reason))
    return dict(predicciones=result,excluidas=excluded,admitidas=[e['estudio'] for e in obs],ultimas_por_casa=[e['estudio'] for e in ult],
                n_estudios=len(obs),n_casas=len(ult),n_efectivo_casas_recencia=float(1/sum(pesos**2)),
                muestras_imputadas=sum(e['n_supuesto'] for e in obs),
                sin_calibracion_previa=not bool(residual),
                firma_entrada=hashlib.sha256(json.dumps(obs,sort_keys=True,default=str).encode()).hexdigest())

def metricas(filas):
    if not filas:return dict(n=0,mae=None,rmse=None,sesgo=None,cobertura90=None,anchura90=None,interval_score90=None)
    e=np.array([r['error'] for r in filas]);scores=[]
    for r in filas:
        l,u,y=r['p5'],r['p95'],r['oficial']
        scores.append(u-l+20*max(l-y,0)+20*max(y-u,0))
    return dict(n=len(filas),mae=float(np.mean(abs(e))),rmse=float(sqrt(np.mean(e**2))),sesgo=float(np.mean(e)),
                cobertura90=float(np.mean([r['p5']<=r['oficial']<=r['p95'] for r in filas])),
                anchura90=float(np.mean([r['p95']-r['p5'] for r in filas])),interval_score90=float(np.mean(scores)))

def evaluar(ciclos,encuestas,horizontes=HORIZONTES,partidos=PARTIDOS):
    cortes=[];filas=[]
    for ciclo in sorted(ciclos,key=lambda c:c['fecha']):
        day=date.fromisoformat(ciclo['fecha'])
        own=[e for e in encuestas if e['eleccion']==ciclo['fecha']]
        for h in horizontes:
            cut=min(day-timedelta(days=h),day-timedelta(days=6))
            res,trained=aprender(ciclos,encuestas,day,partidos=partidos,disponible_hasta=cut)
            pred=predecir(own,cut,day,res,partidos=partidos)
            registro=dict(eleccion=ciclo['fecha'],horizonte=h,corte=cut.isoformat(),entrenamiento=trained,estado='evaluado' if pred else 'sin_dos_casas')
            if pred:
                registro.update(pred)
                for variant,parties in pred['predicciones'].items():
                    for p,x in parties.items():
                        y=ciclo['resultado'][p]
                        filas.append(dict(eleccion=ciclo['fecha'],horizonte=h,variante=variant,partido=p,oficial=y,error=x['media']-y,**x))
            cortes.append(registro)
    resumen={v:metricas([r for r in filas if r['variante']==v]) for v in VARIANTES}
    # Cluster bootstrap of mean election MAE, never pretend 30 correlated cuts
    # are 30 independent general elections.
    rng=np.random.default_rng(20261112)
    for v in VARIANTES:
        scores=[np.mean([abs(r['error']) for r in filas if r['variante']==v and r['eleccion']==c['fecha']]) for c in ciclos if any(r['variante']==v and r['eleccion']==c['fecha'] for r in filas)]
        if scores:
            draws=np.array(scores)[rng.integers(0,len(scores),(10000,len(scores)))].mean(1)
            resumen[v]['mae_cluster_ic95']=np.quantile(draws,[.025,.975]).tolist()
    group=lambda field:{str(k):{v:metricas([r for r in filas if r['variante']==v and r[field]==k]) for v in VARIANTES} for k in sorted({r[field] for r in filas})}
    return dict(esquema=1,estado='evaluacion_retrospectiva_nacional_parcial',nivel=3,
        elecciones_independientes=len({r['eleccion'] for r in filas}),cortes_evaluados=sum(c['estado']=='evaluado' for c in cortes),
        protocolo=dict(PARAMETROS,partidos=list(partidos)),entrenamiento='expansivo: solo elecciones anteriores; hiperparámetros fijos, sin selección por resultado',
        universo=list(partidos),modelo_operativo_29n_evaluado=False,validacion_independiente=False,
        advertencias=['PP/PSOE son las únicas candidaturas homologadas en las seis convocatorias; no se normalizan entre sí.',
         'Las referencias secundarias fechadas no equivalen al contraste de todos los originales.',
         'La mezcla nacional histórica reutiliza tendencia. No reproduce calibración 23J, normalización conjunta, correlación entre partidos ni geografía del Motor 29N.',
         'Intervalos marginales; seis elecciones correlacionadas temporalmente no bastan para validar probabilidades de mayoría.',
         'Industria 2.0 pp es una hipótesis fijada para este protocolo, no la calibración 2.2 del Motor 29N basada en 23J.',
         'No se usa el resultado objetivo para ajustar. No se ha escogido una variante ganadora ni cambiado el principal por estos resultados.'],
        resumen=resumen,por_eleccion=group('eleccion'),por_horizonte=group('horizonte'),por_partido=group('partido'),cortes=cortes,errores=filas)

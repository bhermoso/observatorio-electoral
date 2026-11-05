"""Ensayo controlado del traslado del error histórico a la estimación actual.

Mismas semillas, fecha, simulaciones y supuestos salvo fracción y presencia de CIS.
No cambia el pronóstico publicado ni selecciona parámetros por acierto futuro.
"""
import argparse
import json
from datetime import date, timedelta
from pathlib import Path
from modelo.motor import fuentes as F, evaluacion as E, pronostico as P

ROOT = Path(__file__).resolve().parents[1]
PARTIES = ('PP','PSOE','VOX','SUMAR','PODEMOS')


def ejecutar(corte, n):
    polls = [e for e in F.todas() if e['campo_fin']<=corte and F.publicada_antes(e,corte)]
    current, excluded = F.seleccion_pronostico(polls)
    if not current: raise ValueError('No hay encuestas elegibles')
    errors = E.error_final(polls,date(2023,7,23),F.resultado_23j(),['PP','PSOE','VOX','SUMAR'])
    start = min(F.dia_central(e) for e in current)-timedelta(days=7)
    output = []
    for cis in (True,False):
        inputs = current if cis else [e for e in current if e['casa']!='CIS']
        historical = errors if cis else {c:r for c,r in errors.items() if c!='CIS'}
        for fraction in (0,.25,.5,1):
            forecast = P.principal(inputs,start,corte,date(2026,11,29),historical,
                n_por_variante=n,fraccion_sesgo=fraction,factor_prior_23j=fraction)
            output.append(dict(cis=cis,fraccion=fraction,encuestas=len(inputs),
                casas_actuales=sorted({e['casa'] for e in inputs}),
                casas_historicas=sorted(historical),simulaciones=forecast['n'],
                correccion_consensos=forecast['correccion_industria'],
                factor_prior_23j=forecast['factor_prior_23j'],
                partidos={p:forecast['partidos'][p] for p in PARTIES if p in forecast['partidos']},
                bloques=forecast['bloques']))
            print('Calculado', 'con CIS' if cis else 'sin CIS',fraction,flush=True)
    return dict(corte=str(corte),eleccion='2026-11-29',inicio_comun=str(start),
        estado='sensibilidad_no_validacion_predictiva',n_por_variante=n,
        control='Semillas idénticas por variante y corte; todas las variantes con el mismo número de simulaciones.',
        definicion_cis='Sin CIS excluye sus encuestas actuales y su error histórico; no es un efecto exclusivo sobre el ancla.',
        definicion_fraccion='Se varían conjuntamente la corrección de consenso y el centro previo histórico de casa.',
        cero='0 % anula el traslado direccional del error de 2023, pero mantiene la variante calibrada con centros cero y su dispersión previa. No equivale a eliminar esa variante ni toda la información histórica.',
        invariantes=dict(industria=P.INDUSTRIA_PRINCIPAL,rho_bloque=P.RHO_BLOQUE,
            sd_prov=.08,metodo_geo='proporcional',variantes=list(P.VARIANTES)),
        encuestas_actuales=[dict(casa=e['casa'],estudio=e['estudio'],campo_fin=str(e['campo_fin']),
            publicacion=str(e['publicacion']),voto=e['voto'],n=e['n']) for e in current],
        errores_historicos=errors,escenarios=output,
        limites=['El experimento no demuestra cuál de las fracciones acierta más.',
            'Las mayorías son frecuencias condicionadas al modelo; no probabilidades empíricamente calibradas.',
            'Con y sin CIS cambia la evidencia actual y la histórica; se conserva el mismo inicio temporal.',
            '100 % traslada el error entero en los centros y correcciones, no obliga a la salida final a moverse esa cantidad.',
            'El ensayo conserva el principal sobre agregados; no incluye todavía la receta candidata More in Common.'])


def informe(data):
    lines=['# Cuánto depende el pronóstico del error de 2023', '',
        'Corte: '+data['corte']+'. Elección modelada: '+data['eleccion']+'.',
        'Sensibilidad del modelo, no validación del porcentaje correcto.', '',
        '## Qué se ha cambiado', '',data['definicion_fraccion'],data['definicion_cis'],
        data['cero'], '',
        'Mismas semillas, inicio temporal y '+str(data['n_por_variante'])+' simulaciones por cada una de las tres variantes. Incertidumbre de industria, correlación de bloques y traslado territorial constantes.', '',
        '## Voto central por partido', '',
        '| CIS | Traslado del error | PP | PSOE | Vox | Sumar | Podemos |',
        '|---|---:|---:|---:|---:|---:|---:|']
    for s in data['escenarios']:
        vals=' | '.join(f"{s['partidos'][p]['voto'][0]:.2f}" for p in PARTIES)
        lines.append(f"| {'Con' if s['cis'] else 'Sin'} | {100*s['fraccion']:.0f} % | {vals} |")
    lines += ['', '## Escaños y mayorías', '',
        'Medianas de escaños por partido. Las medianas no tienen por qué sumar 350. La frecuencia de mayoría se calcula sumando escaños en cada simulación.', '',
        '| CIS | Traslado | PP | PSOE | Vox | Sumar | Podemos | Mayoría PP + Vox |',
        '|---|---:|---:|---:|---:|---:|---:|---:|']
    for s in data['escenarios']:
        seats=' | '.join(f"{s['partidos'][p]['escanos'][0]:.0f}" for p in PARTIES)
        lines.append(f"| {'Con' if s['cis'] else 'Sin'} | {100*s['fraccion']:.0f} % | {seats} | {100*s['bloques']['PP+VOX']['p_mayoria']:.1f} % |")
    lines += ['', '## Diferencia entre no trasladar el error y trasladar la mitad', '']
    for cis in (True,False):
        a=next(s for s in data['escenarios'] if s['cis']==cis and s['fraccion']==0)
        b=next(s for s in data['escenarios'] if s['cis']==cis and s['fraccion']==.5)
        changes=', '.join(f"{p}: {b['partidos'][p]['voto'][0]-a['partidos'][p]['voto'][0]:+.2f} puntos" for p in PARTIES)
        lines.append(f"- {'Con' if cis else 'Sin'} CIS: {changes}.")
    lines += ['', '## Qué se puede concluir', '',
        'Las diferencias cuantifican cuánto depende el resultado de nuestras decisiones. No prueban que una casa vaya a repetir su desviación histórica ni que el 50 % sea el porcentaje correcto.', '',
        'La referencia es con CIS y 50 %. Sin CIS retira tanto sus encuestas actuales como su contribución histórica; este contraste no separa ambos mecanismos.', '',
        'Los intervalos de voto y escaños y las frecuencias de todos los bloques se conservan en el JSON. No se presentan como validación histórica.', '',
        '## Límites', '']+['- '+x for x in data['limites']]
    lines += ['', '## Reproducción', '',
        '`python -m scripts.sensibilidad_error_23j --simulaciones-por-variante '+str(data['n_por_variante'])+'`',
        'Datos: `data/microdatos/sensibilidad-error-23j.json`.', '']
    return '\n'.join(lines)


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--corte',type=date.fromisoformat,default=date(2026,11,5))
    parser.add_argument('--simulaciones-por-variante',type=int,default=2000)
    args=parser.parse_args()
    if args.simulaciones_por_variante<100: raise ValueError('Se requieren al menos 100 simulaciones por variante')
    result=ejecutar(args.corte,args.simulaciones_por_variante)
    path=ROOT/'data/microdatos/sensibilidad-error-23j.json'
    path.write_text(json.dumps(result,ensure_ascii=False,indent=2,default=str)+'\n')
    (ROOT/'docs/sensibilidad-error-23j.md').write_text(informe(result))

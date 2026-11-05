"""Expone los errores históricos que realmente alimentan el Motor 29N.

No atribuye causas ni convierte una elección en un sesgo persistente demostrado.
"""
import json
from datetime import date, timedelta
from pathlib import Path
from statistics import mean

from modelo.motor import fuentes as F, evaluacion as E, pronostico as P

ROOT = Path(__file__).resolve().parents[1]


def construir():
    election = date(2023, 7, 23)
    parties = ['PP', 'PSOE', 'VOX', 'SUMAR']
    polls = F.todas()
    truth = F.resultado_23j()
    errors = E.error_final(polls, election, truth, parties)
    cards = []
    for house, row in sorted(errors.items()):
        candidates = [e for e in polls if e['casa']==house and e['estudio']==row['estudio']]
        if len(candidates) != 1:
            raise ValueError('Selección no unívoca: '+house)
        source = candidates[0]
        cards.append(dict(casa=house, estudio=source['estudio'],
            campo_fin=source['campo_fin'].isoformat(),
            publicacion=source['publicacion'].isoformat(),
            dias_entre_campo_y_eleccion=(election-source['campo_fin']).days,
            origen=source['origen'], url=source['url'],
            estimacion={p:source['voto'][p] for p in row['error']},
            resultado={p:truth[p] for p in row['error']},
            error_firmado_pp=row['error'], mae_pp=row['mae'],
            partidos_comparados=list(row['error']),
            prior_aplicado_variante_calibrada={p:P.priors_23j(errors,p)[house][0]
                for p in ('PP','PSOE','VOX') if p in row['error']}))
    averages = {}
    for name, subset in [('todas',cards), ('sin_cis',[c for c in cards if c['casa']!='CIS'])]:
        averages[name] = {p:dict(casas=[c['casa'] for c in subset if p in c['error_firmado_pp']],
            error_promedio_pp=mean(c['error_firmado_pp'][p] for c in subset if p in c['error_firmado_pp']))
            for p in parties if any(p in c['error_firmado_pp'] for c in subset)}
    return dict(eleccion=election.isoformat(),
        seleccion=dict(dias_campo=21, publicacion_hasta=(election-timedelta(days=6)).isoformat(),
            regla='Última publicada por casa entre las elegibles; no todas las encuestas del periodo'),
        convencion='Error firmado = estimación publicada menos resultado; positivo sobreestima, negativo infraestima.',
        resultados_fuente='Base electoral local F.resultado_23j(); no se verifica de nuevo externamente en esta ejecución.',
        fichas=cards, promedios=averages,
        correccion_consenso=dict(fraccion=P.FRACCION_SESGO, minimo_casas=P.MIN_CASAS_SESGO,
            puntos=P.correccion_industria(errors), variantes=list(P.VARIANTES_CORREGIDAS),
            universo='Todas las casas elegibles, incluido CIS, también para corregir consenso_privadas'),
        incertidumbre_industria=dict(parametro=P.INDUSTRIA_PRINCIPAL,
            estado='Supuesto del motor, no error demostrado de cada encuesta ni desviación estimada entre elecciones'),
        limites=['Una sola elección no identifica sesgo persistente por casa ni varianza de industria entre elecciones.',
            'La desviación puede incluir cambio posterior al campo. No identifica su causa.',
            'MAE entre casas solo comparable con el mismo conjunto de partidos.',
            'El factor 0.5 es una decisión de cocina, no una recurrencia aprendida con elecciones independientes.',
            'Un error medio compartido no significa que todas las casas errasen con el mismo signo.'])


def render(data):
    lines=['# Qué errores de las casas utiliza el Observatorio', '', data['convencion'], '',
        '## Evidencia que se compara', '',
        '23J de 2023. Campo terminado dentro de los 21 días anteriores y publicación documentada hasta el 17 de julio. Una encuesta por casa: la última publicada entre las elegibles.', '',
        '| Casa | Publicación | Fin de campo | PP | PSOE | Vox | Sumar |',
        '|---|---|---|---:|---:|---:|---:|']
    for c in data['fichas']:
        vals=[f"{c['error_firmado_pp'][p]:+.2f}" if p in c['error_firmado_pp'] else 'Sin dato' for p in ['PP','PSOE','VOX','SUMAR']]
        lines.append('| '+c['casa']+' | '+c['publicacion']+' | '+c['campo_fin']+' | '+' | '.join(vals)+' |')
    lines += ['', '## Del error observado a nuestra cocina actual', '',
        'La variante calibrada usa como centro previo de cada casa la mitad de su error de 2023 para PP, PSOE y Vox. Es un supuesto de persistencia parcial, no un error actual conocido.', '',
        'Las dos variantes de consenso reciben una corrección igual a menos la mitad del error medio histórico, con al menos cinco casas por partido. La implementación usa todas las casas elegibles, incluido CIS, incluso al corregir el consenso de privadas. Esta decisión debe mostrarse y contrastarse; no ocultarse bajo la etiqueta «industria».', '',
        '| Partido | Error promedio, todas | Error promedio, sin CIS | Corrección actual a consensos |',
        '|---|---:|---:|---:|']
    for p in ['PP','PSOE','VOX','SUMAR']:
        get=lambda group:data['promedios'][group][p]['error_promedio_pp']
        correction=data['correccion_consenso']['puntos'].get(p)
        value=f'{correction:+.3f}' if correction is not None else 'No aplicada'
        lines.append(f'| {p} | {get("todas"):+.3f} | {get("sin_cis"):+.3f} | {value} |')
    lines += ['', 'El promedio anterior es simple, con una entrada por casa y los partidos disponibles; no es un promedio ponderado por muestra ni el pronóstico actual del Observatorio.', '',
        'El parámetro de incertidumbre de industria del principal es 2,2 puntos para el nivel de referencia del modelo. No significa que cada casa haya errado 2,2 puntos: es una decisión sobre incertidumbre, diferente de las correcciones anteriores.', '',
        '## Límites de atribución', '']+[f'- {x}' for x in data['limites']]
    lines += ['', '## Fichas comprobables', '',
        'El JSON adjunto conserva para cada casa estudio, URL, fechas, cifra publicada, resultado, resta y prior aplicado. Son las entradas realmente seleccionadas por el motor.', '',
        'Reproducir: `python -m scripts.explicar_error_casas`.',
        'Detalle: `data/microdatos/trazabilidad-error-casas-23j.json`.', '']
    return '\n'.join(lines)


if __name__=='__main__':
    data=construir()
    (ROOT/'data/microdatos/trazabilidad-error-casas-23j.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
    report=ROOT/'docs/explicacion-error-casas.md'
    report.write_text(render(data))
    print(report.read_text())

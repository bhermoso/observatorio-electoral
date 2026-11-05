"""Descompone ocho recetas ya calculadas; no vuelve a analizar entrevistas.

Compara operaciones sobre la misma oleada y los mismos cuatro partidos.
La media entre oleadas es descriptiva, no una estimación entre elecciones.
"""
import json
from pathlib import Path
from statistics import mean

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'data/microdatos/40db-2023-recetas-detalle.json'
# Combinaciones del ensayo previo: recuerdo, simpatía, participación.
RECIPES = {
    (0, 0, 0): 'directa_ponderada_ponde',
    (0, 0, 1): 'directa_ponderada_x_participacion_0_10',
    (0, 1, 0): 'simpatia_para_indecisos',
    (0, 1, 1): None,  # No se calculó simpatía + participación sin recuerdo.
    (1, 0, 0): 'recuerdo_2019_calibracion_50pct',
    (1, 0, 1): 'recuerdo_mas_participacion',
    (1, 1, 0): 'recuerdo_mas_simpatia_indecisos',
    (1, 1, 1): 'recuerdo_mas_simpatia_mas_participacion',
}


def comparar(data):
    truth = data['truth_pct']
    results = []
    for study in data['studies']:
        recipes = study['recipes']
        for factors, name in RECIPES.items():
            if name is None:
                continue
            for axis, operation in enumerate(('recuerdo', 'simpatia', 'participacion')):
                if factors[axis]:
                    continue
                other = list(factors)
                other[axis] = 1
                target = RECIPES[tuple(other)]
                if target is None:
                    continue
                before, after = recipes[name], recipes[target]
                # Recalcular desde votos, evitando depender del MAE redondeado.
                residual_before = {p: before['vote'][p] - v for p, v in truth.items()}
                residual_after = {p: after['vote'][p] - v for p, v in truth.items()}
                delta = {p: abs(residual_after[p])-abs(residual_before[p]) for p in truth}
                results.append(dict(estudio=study['id'], operacion=operation,
                    receta_origen=name, receta_destino=target,
                    cambio_voto_pp={p: round(after['vote'][p]-before['vote'][p], 6) for p in truth},
                    cambio_error_absoluto_pp={p: round(v, 6) for p, v in delta.items()},
                    cambio_mae_pp=round(mean(delta.values()), 6)))
    return results


def informe(data, results):
    lines = ['# Auditoría de operaciones: 40dB y las generales de 2023', '',
        'Fuente: agregados previamente calculados desde los tres ZIP originales (4.800 entrevistas).',
        'La primera sección recalcula diferencias desde esos agregados. La última incorpora una nueva ejecución desde las entrevistas originales.',
        'Una elección, tres oleadas: no son tres validaciones independientes.', '',
        '## Operaciones añadidas a la intención directa ponderada', '',
        'Cambio del error absoluto medio en puntos porcentuales; negativo significa menor error.', '',
        '| Operación | Flash de junio | Barómetro de junio | Preelectoral de julio |',
        '|---|---:|---:|---:|']
    base = 'directa_ponderada_ponde'
    for op in ('recuerdo', 'simpatia', 'participacion'):
        rows = [r for r in results if r['operacion']==op and r['receta_origen']==base]
        lines.append('| '+op+' | '+' | '.join(f"{r['cambio_mae_pp']:+.3f}" for r in rows)+' |')
    lines += ['', '## Error de la receta completa, desglosado por partido', '',
        'Cambio de error absoluto frente a la directa ponderada; positivo significa empeoramiento.', '',
        '| Encuesta | PP | PSOE | Vox | Sumar |', '|---|---:|---:|---:|---:|']
    for s in data['studies']:
        before=s['recipes'][base]['vote']
        after=s['recipes']['recuerdo_mas_simpatia_mas_participacion']['vote']
        delta=[abs(after[p]-v)-abs(before[p]-v) for p,v in data['truth_pct'].items()]
        lines.append('| '+s['id']+' | '+' | '.join(f'{x:+.3f}' for x in delta)+' |')
    lines += ['', '## Decisiones de desarrollo', '',
        '- No adoptar la calibración parcial del recuerdo de 2019 como corrección por defecto: empeora estas tres oleadas. El resultado se limita a esta calibración, esta casa y esta elección.',
        '- No descartar el recuerdo: distinguir sesgo de composición, recuerdo erróneo, nuevos votantes y abstención. El ensayo previo usa seis referencias aproximadas y una intensidad fija del 50 %, sin modelar esos mecanismos.',
        '- No interpretar participación / 10 como una probabilidad calibrada: probar transformaciones fijadas antes de evaluar otra elección y contrastar cobertura por grupo.',
        '- Separar simpatía de voto observado. La imputación supone una conducta de los indecisos; su mejora eventual no demuestra ese mecanismo.',
        '- En el ensayo previo faltaba simpatía + participación sin recuerdo. Se ha completado desde los originales en la ejecución descrita más abajo; no se ha inferido a partir de los MAE.',
        '- La receta de More in Common contiene imputación por donantes y contracción que no se ensayaron aquí. Este análisis no valida esa receta por transferencia entre casas.',
        '- Próximo desarrollo: auditar etiquetas y faltantes y contrastar recuerdo sin ajuste, parcial y regularizado. Elegir parámetros y evaluar acierto en convocatorias distintas.',
        '- Conservar fecha de campo: el error contra el 23J incluye movimientos posteriores al campo y no identifica exclusivamente error de encuesta.',
        '- Las referencias oficiales y las cifras publicadas se heredan del análisis previo; no se han verificado de nuevo contra fuentes externas en esta ejecución.', '',
        '## Reproducción', '',
        '`python scripts/auditar_operaciones_40db_2023.py`', '',
        'Entrada: `data/microdatos/40db-2023-recetas-detalle.json`.',
        'Salida numérica: `data/microdatos/40db-2023-efectos-operaciones.json`.',
        'Las pequeñas diferencias con MAE publicados en la auditoría previa proceden del redondeo de los votos a tres decimales.', '']
    full_path = ROOT/'data/microdatos/40db-2023-factorial-completo.json'
    if full_path.exists():
        full = json.loads(full_path.read_text())
        lines += ['## Combinación completada desde los originales', '',
            'Se han verificado los tres SHA-256 y reproducido las siete recetas ponderadas previas con tolerancia de 0,00051 puntos por partido. Se calcula la octava combinación sobre las 4.800 entrevistas.', '',
            '| Encuesta | Directa ponderada | Simpatía + participación | Publicada por 40dB |',
            '|---|---:|---:|---:|']
        for old, new in zip(data['studies'], full['estudios']):
            if old['id'] != new['estudio']: raise ValueError('Oleadas desordenadas')
            get = lambda name: next(r['mae_pp'] for r in new['recetas'] if r['nombre']==name)
            lines.append(f"| {old['id']} | {get('directa_ponderada_ponde'):.3f} | {get('simpatia_mas_participacion_sin_recuerdo'):.3f} | {old['published_mae_23j']:.3f} |")
        lines += ['', 'La combinación mejora las dos oleadas posteriores, empeora el flash y no supera a la estimación publicada en ninguna de las tres. No elegirla como ganadora para 2026 a partir de este único resultado electoral.', '',
            'Reproducción desde matrices: `python -m scripts.completar_factorial_40db_2023 /carpeta/zip`.',
            'Se mantienen los supuestos anteriores para aislar el contraste. La participación no numérica conserva la imputación 0,5 del ensayo previo; no es una probabilidad calibrada.', '']
    return '\n'.join(lines)


if __name__ == '__main__':
    data = json.loads(SOURCE.read_text())
    results = comparar(data)
    output = dict(estado='retrospectiva_exploratoria_una_eleccion',
        fuente='40db-2023-recetas-detalle.json',
        combinacion_ausente='simpatia_mas_participacion_sin_recuerdo', comparaciones=results)
    (ROOT/'data/microdatos/40db-2023-efectos-operaciones.json').write_text(
        json.dumps(output, ensure_ascii=False, indent=2)+'\n')
    report = ROOT/'docs/auditoria-operaciones-40db-2023.md'
    report.write_text(informe(data, results))
    print(report.read_text())

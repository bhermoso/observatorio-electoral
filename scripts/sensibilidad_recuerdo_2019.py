"""Sensibilidad de la calibración por recuerdo sobre los ZIP originales CIS 2019.

Uso: python scripts/sensibilidad_recuerdo_2019.py MD3242.zip MD3263.zip
Requiere scripts/reproducir_cocina_2019.py y mantiene fijos pesos,
imputación de indecisos, participación y cuatro partidos evaluados.
Emite SOLO agregados públicos; no modifica el Motor 29N.
"""
import argparse
import collections
import json
from pathlib import Path
import reproducir_cocina_2019 as cocina

PARTIDOS = ['PP', 'PSOE', 'VOX', 'CS']
GRUPOS_VALIDOS = PARTIDOS + ['UP', 'OTROS', 'BLANCO']
ESCENARIOS = [
    ('sin_calibracion', 0., (.2, 5.), 'todos'),
    ('calibracion_25', .25, (.2, 5.), 'todos'),
    ('calibracion_50', .5, (.2, 5.), 'todos'),
    ('calibracion_75', .75, (.2, 5.), 'todos'),
    ('calibracion_100', 1., (.2, 5.), 'todos'),
    ('limite_05_2', 1., (.5, 2.), 'todos'),
    ('limite_075_15', 1., (.75, 1.5), 'todos'),
    ('solo_pp_psoe_vox_cs', 1., (.2, 5.), 'cuatro'),
]

def calcular(rows, eleccion_anterior, eleccion_objetivo, intensidad=1.,
             limites=(.2, 5.), grupos='todos', participacion=True):
    """Intensidad logarítmica del factor: factor_efectivo = factor**intensidad."""
    if not 0 <= intensidad <= 1 or limites[0] <= 0 or limites[1] < limites[0]:
        raise ValueError('Parámetros de intensidad o límites inválidos')
    recuerdo = collections.defaultdict(float)
    for row in rows:
        recuerdo[row['rec']] += row['w']
    calibrables = PARTIDOS + ['UP', 'OTROS']
    base = sum(recuerdo[k] for k in calibrables)
    objetivo = cocina.target(eleccion_anterior)
    factores = {
        k: (min(limites[1], max(limites[0], objetivo[k]*base/recuerdo[k]))**intensidad
            if recuerdo[k] > 0 else 1.)
        for k in calibrables
    }
    pesos = [
        r['w'] * (factores.get(r['rec'], 1.) if
                  grupos == 'todos' or r['rec'] in PARTIDOS else 1.)
        for r in rows
    ]
    cruces = collections.defaultdict(lambda: collections.defaultdict(float))
    for row, w in zip(rows, pesos):
        if row['rec'] in factores and row['sym'] in GRUPOS_VALIDOS:
            cruces[row['rec']][row['sym']] += w
    imputaciones = {
        group: {k: mass/sum(data.values()) for k, mass in data.items()}
        for group, data in cruces.items() if sum(data.values()) > 0
    }
    masas = collections.defaultdict(float)
    for row, w in zip(rows, pesos):
        w *= row['prob'] if participacion else 1.
        voto = row['sym']
        if voto in GRUPOS_VALIDOS:
            masas[voto] += w
        elif voto in ('INDECISO', 'NS', 'NC'):
            for k, p in imputaciones.get(row['rec'], {}).items():
                masas[k] += w*p
    total = sum(masas.values())
    porcentajes = {k: 100*masas[k]/total for k in GRUPOS_VALIDOS}
    escrutinio = cocina.target(eleccion_objetivo)
    mae = sum(abs(porcentajes[k]-100*escrutinio[k]) for k in PARTIDOS)/4
    return {
        'mae_pp': round(mae, 4),
        'porcentajes': {k: round(porcentajes[k], 4) for k in PARTIDOS},
        'factores': {k: round(f, 4) for k, f in factores.items()}
    }

def analizar(archivo_3242, archivo_3263):
    salida = {'esquema': 1, 'tipo': 'sensibilidad_2019_retrospectiva',
              'estado': 'EXPERIMENTAL_NO_ADMITIR', 'receta': 'recuerdo en seis etapas',
              'unidad': 'MAE puntos porcentuales PP PSOE VOX Ciudadanos',
              'intensidad': 'factor_efectivo = factor_recortado ** intensidad',
              'otros': 'Agrupa todas las candidaturas no homologadas; no separa el efecto territorial',
              'estudios': []}
    for sid, archivo in [('3242', archivo_3242), ('3263', archivo_3263)]:
        _, _, anterior, eleccion, sha = cocina.CONFIG[sid]
        rows, actual_sha = cocina.read(sid, archivo)
        if actual_sha != sha:
            raise ValueError('Huella no coincidente: ' + sid)
        res = {
            'id': sid, 'eleccion': eleccion, 'sha256_zip': actual_sha,
            'n': len(rows), 'escenarios': {}
        }
        for nombre, intensidad, limites, grupos in ESCENARIOS:
            res['escenarios'][nombre] = calcular(
                rows, anterior, eleccion, intensidad, limites, grupos)
        salida['estudios'].append(res)
    return salida

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('md3242', type=Path)
    parser.add_argument('md3263', type=Path)
    args = parser.parse_args()
    resultado = analizar(args.md3242, args.md3263)
    print(json.dumps(resultado, indent=2, ensure_ascii=False))

if __name__ == '__main__':
    main()

"""Reabre originales verificados, reproduce siete recetas y completa la octava.

No publica filas. Los resultados conocidos del 23J no eligen parámetros.
Se conservan las convenciones del ensayo previo para aislar la combinación ausente.
"""
import argparse
import hashlib
import io
import itertools
import json
import re
import unicodedata
import zipfile
from pathlib import Path

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]


def clean(value):
    if pd.isna(value):
        return ''
    text = str(value)
    try:
        text = text.encode('latin1').decode('utf8')
    except UnicodeError:
        pass
    return unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode().lower().strip()


def classify(value, recall=False):
    text = clean(value)
    if text.startswith(('psoe', 'psc')): return 'PSOE'
    if text == 'pp' or text.startswith('pp '): return 'PP'
    if text == 'vox': return 'VOX'
    if recall:
        for prefix, code in [('unidas podemos', 'UP'), ('ciudadanos', 'CS'), ('mas pais', 'MP')]:
            if text.startswith(prefix): return code
    if text.startswith('sumar'): return 'SUMAR'
    if text == 'podemos': return 'PODEMOS'
    if 'blanco' in text: return 'BLANCO'
    if 'nulo' in text: return 'NULO'
    if text in ('no lo se', 'no lo sabe'): return 'INDECISO'
    if 'prefiero no contestar' in text: return 'NC'
    if text.startswith(('no vot', 'no tenia edad')): return 'ABSTENCION'
    if text == 'ninguno': return 'NINGUNO'
    return 'OTROS' if text else 'NC'


def turnout(value):
    text = clean(value)
    match = re.match(r'^(\d+)', text)
    return min(10, float(match[1]))/10 if match else .5


def run(folder):
    from scripts.auditar_operaciones_40db_2023 import RECIPES
    prior = json.loads((ROOT/'data/microdatos/40db-2023-recetas-detalle.json').read_text())
    valid = {'PP', 'PSOE', 'VOX', 'SUMAR', 'BLANCO', 'OTROS', 'PODEMOS'}
    truth = prior['truth_pct']
    output = []
    for study in prior['studies']:
        path = folder / study['filename']
        if hashlib.sha256(path.read_bytes()).hexdigest() != study['sha256']:
            raise ValueError('No coincide el original: '+path.name)
        with zipfile.ZipFile(path) as archive:
            names = [n for n in archive.namelist() if n.endswith('.dta') and not n.startswith('__MACOSX')]
            if len(names) != 1: raise ValueError('Número inesperado de matrices DTA')
            frame = pd.read_stata(io.BytesIO(archive.read(names[0])))
        if len(frame) != study['n']: raise ValueError('Tamaño no reproducido')
        cols = study['variables']
        v = np.array([classify(x) for x in frame[cols['vote']]])
        affinity = np.array([classify(x) for x in frame[cols['affinity']]])
        recall = np.array([classify(x, True) for x in frame[cols['recall']]])
        participation = np.array([turnout(x) for x in frame[cols['turnout']]])
        w = frame.ponde.to_numpy(dtype=float)
        if not np.all(np.isfinite(w) & (w > 0)): raise ValueError('Pesos inválidos')
        imputed = v.copy()
        selected = (v == 'INDECISO') & np.isin(affinity, list(valid))
        imputed[selected] = affinity[selected]
        adjusted = w.copy()
        old = prior['recall_reference_2019_approx_pct']
        total = w[np.isin(recall, list(old))].sum()
        for party, target in old.items():
            mass = w[recall == party].sum()
            if mass <= 0: raise ValueError('Recuerdo sin donantes')
            factor = (target/sum(old.values()))/(mass/total)
            adjusted[recall == party] *= 1+.5*(factor-1)
        recipes = []
        for factors in itertools.product((0, 1), repeat=3):
            r, s, t = factors
            vote = imputed if s else v
            weight = (adjusted if r else w) * (participation if t else 1)
            denominator = weight[np.isin(vote, list(valid))].sum()
            estimate = {p: float(100*weight[vote == p].sum()/denominator) for p in truth}
            name = RECIPES[factors]
            if name:
                previous = study['recipes'][name]
                if any(abs(estimate[p]-previous['vote'][p]) > .00051 for p in truth):
                    raise ValueError('No se reproduce la receta previa '+name)
            error = {p: estimate[p]-truth[p] for p in truth}
            recipes.append(dict(recuerdo=r, simpatia=s, participacion=t,
                nombre=name or 'simpatia_mas_participacion_sin_recuerdo',
                voto=estimate, error_firmado_pp=error,
                mae_pp=float(np.mean([abs(e) for e in error.values()]))))
        output.append(dict(estudio=study['id'], n=len(frame), sha256=study['sha256'],
            recetas_previas_reproducidas=7, recetas=recipes,
            participacion_no_numerica=int(sum(not re.match(r'^(\d+)', clean(x)) for x in frame[cols['turnout']]))))
    return dict(estado='exploratorio_una_eleccion', estudios=output,
        limitaciones=[
            'No se han elegido coeficientes según el resultado; evaluación retrospectiva, no validación independiente.',
            'Se conservan la referencia aproximada de recuerdo, ajuste del 50 % y participación/10 del ensayo previo.',
            'Participación no numérica se trata como 0.5, supuesto heredado sin calibración.',
            'Una combinación ausente se calcula ahora desde las entrevistas, no se interpola desde los errores.',
            'La clasificación heredada reúne categorías no reconocidas en OTROS: requiere auditoría antes de ampliar su uso.',
        ])


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('zip_dir', type=Path)
    args = parser.parse_args()
    result = run(args.zip_dir)
    target = ROOT/'data/microdatos/40db-2023-factorial-completo.json'
    target.write_text(json.dumps(result, ensure_ascii=False, indent=2)+'\n')
    for study in result['estudios']:
        print(study['estudio'], '7 recetas reproducidas; MAE simpatía + participación:',
              next(r['mae_pp'] for r in study['recetas'] if r['nombre']=='simpatia_mas_participacion_sin_recuerdo'))

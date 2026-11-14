"""32 recetas sobre el mismo CIS. Publica masas y operaciones, nunca entrevistas.

Uso: python scripts/generar_viaje_sondeo.py /ruta/MD3582.zip
Mantiene las reglas de cocina_cis.py y permite omitir operaciones sin sumar
sus diferencias. Cada combinación se vuelve a calcular sobre las respuestas.
"""
import itertools
import json
import sys
from collections import defaultdict
from pathlib import Path
from cocina_cis import leer, resultado_23j, VALIDOS, RECORTE

ROOT = Path(__file__).resolve().parents[1]
KEYS = ['peso', 'simpatia', 'recuerdo', 'indecisos', 'participacion']


def calculate(rows, flags, official):
    weights = [r['peso'] if flags['peso'] else 1.0 for r in rows]
    field = 'votosim' if flags['simpatia'] else 'intencion'
    recalled = {g: sum(w for r, w in zip(rows, weights) if r['recuerdo'] == g) for g in official}
    rec_total = sum(recalled.values())
    sample = {g: v / rec_total for g, v in recalled.items()}
    factors = {g: round(min(RECORTE[1], max(RECORTE[0], official[g] / sample[g])), 4) if sample[g] else 1.0 for g in official}
    if flags['recuerdo']:
        weights = [w * factors.get(r['recuerdo'], 1) for r, w in zip(rows, weights)]
    trans = defaultdict(lambda: defaultdict(float))
    for r, w in zip(rows, weights):
        if r[field] in VALIDOS and r['recuerdo'] in official:
            trans[r['recuerdo']][r[field]] += w
    matrix = {g: {p: v / sum(ps.values()) for p, v in ps.items()} for g, ps in trans.items() if sum(ps.values())}
    masses = defaultdict(float)
    observed = defaultdict(float)
    imputed = defaultdict(float)
    counts = defaultdict(int)
    contributors = []
    imputation_groups = defaultdict(lambda: dict(mass=0.0, interviews=0))
    for r, w in zip(rows, weights):
        if flags['participacion']:
            w *= r['prob']
        p = r[field]
        if p in VALIDOS:
            masses[p] += w
            observed[p] += w
            counts[p] += 1
            contributors.append(w)
        elif flags['indecisos'] and p in ('NS', 'NC') and r['recuerdo'] in matrix:
            imputation_groups[r['recuerdo']]['mass'] += w
            imputation_groups[r['recuerdo']]['interviews'] += 1
            for dest, probability in matrix[r['recuerdo']].items():
                masses[dest] += w * probability
                imputed[dest] += w * probability
            contributors.append(w)
    denominator = sum(masses.values())
    return dict(flags=flags, denominator=denominator, contributors=len(contributors),
                neff=sum(contributors)**2 / sum(w*w for w in contributors),
                masses={p: masses[p] for p in VALIDOS}, observed={p: observed[p] for p in VALIDOS},
                imputed={p: imputed[p] for p in VALIDOS}, counts={p: counts[p] for p in VALIDOS},
                shares={p: 100*masses[p]/denominator for p in VALIDOS},
                recall_sample={g: 100*v for g, v in sample.items()}, recall_official={g: 100*v for g, v in official.items()},
                factors=factors, transfers=matrix, imputation_groups=dict(imputation_groups))


def main():
    rows, sha = leer(sys.argv[1], '3582')
    official = resultado_23j()
    scenarios = {}
    for bits in itertools.product((False, True), repeat=len(KEYS)):
        flags = dict(zip(KEYS, bits))
        scenarios[''.join(str(int(b)) for b in bits)] = calculate(rows, flags, official)
    categories = defaultdict(int)
    for r in rows:
        categories[r['intencion']] += 1
    out = dict(schema=1, study='3582', n=len(rows), sha256_zip=sha, keys=KEYS, categories=dict(categories),
               weight_range=[min(r['peso'] for r in rows), max(r['peso'] for r in rows)],
               weight_total=sum(r['peso'] for r in rows), scenarios=scenarios,
               source='https://www.cis.es/es/estudios/barometro-de-octubre-2026',
               limits=['Receta experimental; no altera el pronóstico operativo.',
                       'PESO se utiliza tal como lo publica el CIS; no se reconstruye su calibración sociodemográfica.',
                       'Recuerdo: factores entre 0,2 y 5; abstención y no respuesta conservan su peso.',
                       'PROBVOTO ausente o fuera de 0–10 recibe 0,5, supuesto heredado de la receta.',
                       'El fichero tiene 5.024 registros; la ficha publicada consigna 5.025.'])
    (ROOT / 'data/microdatos/viaje-sondeo-3582.json').write_text(json.dumps(out, ensure_ascii=False, separators=(',', ':'))+'\n')
    print(f'{len(rows)} entrevistas; {len(scenarios)} combinaciones; solo agregados.')


if __name__ == '__main__':
    main()

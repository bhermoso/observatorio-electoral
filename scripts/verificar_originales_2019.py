"""Puerta de integridad para los originales CIS 3242 y 3263 (2019).

Uso:
    python scripts/verificar_originales_2019.py MD3242.zip MD3263.zip
    python scripts/verificar_originales_2019.py --informe-json MD3242.zip MD3263.zip

Lee DA/ES de los ZIP aportados; solo emite totales y diagnóstico, nunca entrevistas.
No ejecuta calibración por recuerdo ni declara homologadas candidaturas territoriales.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import math
import re
import sys
import zipfile
from collections import defaultdict
from pathlib import Path

BASE = Path(__file__).resolve().parents[1]
VARIABLES = {
    "3242": {"intencion": "P10R", "simpatia": "VOTOSIMG", "recuerdo": "RECUERDO", "peso": "PESO", "participacion": "P12"},
    "3263": {"intencion": "P9R", "simpatia": "VOTOSIMG", "recuerdo": "RECUERDO", "peso": "PESO", "participacion": "P11"},
}
COMPARE_CODES = {
    "1": "PP", "2": "PSOE", "18": "VOX",
    "4": "CIUDADANOS", "3": "UNIDAS_PODEMOS", "21": "UNIDAS_PODEMOS",
    "94": "INDECISION", "98": "NO_SABE", "99": "NO_CONTESTA",
    "97": "NO_VOTARIA", "96": "BLANCO", "77": "NULO",
}
SENSITIVE_OUTPUT = {"microdatos", "filas", "rows", "entrevistas"}

def _load(path):
    return json.loads((BASE / path).read_text(encoding="utf-8"))

def _column_positions(syntax, field):
    m = re.search(r"\b" + re.escape(field) + r"\s+(\d+)-(\d+)", syntax, re.IGNORECASE)
    if not m:
        raise ValueError("Falta posición de " + field + " en ES")
    a, b = map(int, m.groups())
    if not (0 < a <= b < 10000):
        raise ValueError("Posición inválida: " + field)
    return a - 1, b

def _read_original(study, archive, expected_sha):
    if not archive.is_file():
        raise FileNotFoundError(str(archive))
    sha = hashlib.sha256(archive.read_bytes()).hexdigest()
    if sha != expected_sha:
        raise ValueError("SHA-256 no coincide con original previamente cotejado: " + study)
    with zipfile.ZipFile(archive) as z:
        syntax = z.read("ES" + study).decode("latin-1")
        raw = z.read("DA" + study).decode("latin-1").splitlines()
    positions = {k: _column_positions(syntax, var) for k, var in VARIABLES[study].items()}
    return raw, positions, sha

def _extract(row, pos):
    return row[pos[0]:pos[1]].strip()

def _category(code):
    return COMPARE_CODES.get(code, "OTRAS_CANDIDATURAS" if code.isdigit() and 1 <= int(code) <= 95 else "OTROS_CODIGOS")

def verify(study, archive, expected, tolerance=0.03):
    recorded = expected["studies"][study]
    rows, positions, sha = _read_original(study, archive, recorded["sha256"])
    if len(rows) != recorded["n"]:
        raise ValueError("Número de entrevistas discrepante en " + study)
    counts, weights = defaultdict(int), defaultdict(float)
    sum_weight, sum_square = 0., 0.
    joint_counts = defaultdict(int)
    for i, row in enumerate(rows):
        try:
            w = float(_extract(row, positions["peso"]).replace(",", "."))
        except ValueError as exc:
            raise ValueError("PESO no numérico en " + study + ": fila " + str(i+1)) from exc
        if not math.isfinite(w) or w <= 0:
            raise ValueError("PESO inválido en " + study + ": fila " + str(i+1))
        sum_weight += w
        sum_square += w*w
        intent = _category(_extract(row, positions["intencion"]))
        sympathy = _category(_extract(row, positions["simpatia"]))
        counts[intent] += 1
        weights[intent] += w
        # Solo tamaño total de cruces, no filas de entrevista ni celdas pequeñas.
        joint_counts[(intent, sympathy)] += 1
    if abs(sum_weight - recorded["weighted_n"]) > tolerance:
        raise ValueError("Suma de PESO no coincide con el agregado auditado: " + study)
    kish = sum_weight**2/sum_square
    if abs(kish - recorded["kish_n"]) > 0.15:
        raise ValueError("Kish incompatible con agregado auditado: " + study)
    checked = {}
    for label, item in recorded["intention"].items():
        if label == "CELDAS_PEQUENAS":
            continue
        if counts[label] != item["n"] or abs(weights[label] - item["w"]) > tolerance:
            raise ValueError("Recuento o peso incompatible: " + study + "/" + label)
        checked[label] = {"n":counts[label], "peso":round(weights[label], 3)}
    return {
        "study": study, "status": "ORIGINAL_VERIFICADO",
        "sha256": sha, "n":len(rows), "suma_peso":round(sum_weight, 4),
        "kish":round(kish, 1), "variables":VARIABLES[study],
        "categorias_verificadas":checked,
        "celdas_de_cruce_no_publicadas":len(joint_counts),
        "apto_recuerdo":False,
        "bloqueos":["Falta homologación de candidaturas por provincia y resultados electorales completos",
                    "Falta ejecutar la receta de seis etapas con matrices individuales y criterio congelado"],
    }

def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--informe-json", action="store_true")
    parser.add_argument("md3242", type=Path)
    parser.add_argument("md3263", type=Path)
    args = parser.parse_args(argv)
    evidence = _load("data/microdatos/diagnostico_2019_original.json")
    result = {"schema_version":1, "conclusion":"NO_ADMITIR_RECUERDO",
              "studies":[verify("3242",args.md3242,evidence),verify("3263",args.md3263,evidence)]}
    if args.informe_json:
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        for s in result["studies"]:
            print(s["study"],s["status"],"n=",s["n"],"Kish=",s["kish"])
        print(result["conclusion"])
    return result

if __name__=="__main__":
    try:
        main()
    except (ValueError,KeyError,zipfile.BadZipFile,FileNotFoundError) as e:
        print("ORIGINAL_NO_VALIDADO:",e,file=sys.stderr)
        sys.exit(2)

"""Regenera agregados nacionales publicables desde tres ZIP oficiales CIS.

Uso:
  python scripts/recalcular_cis_microdatos.py MD3411.zip MD3415.zip MD3582.zip

Depende de pandas. NO publica entrevistas individuales ni identificadores de personas.
Los ZIP se mantienen fuera del sitio estático. Validar variables y libros de códigos.
"""
import io
import json
import sys
import zipfile
from pathlib import Path

import pandas as pd

GROUPS = ["PSOE", "PP", "VOX", "SUMAR", "OTROS", "NO_CANDIDATURA"]
FIELDS = ["peso_total", "peso_con_probabilidad_valida", "peso_prob_0_6",
          "peso_prob_7_9", "peso_prob_10", "suma_peso_por_probabilidad_div_10"]
PARTIES = {1: "PSOE", 2: "PP", 3: "VOX", 21: "SUMAR"}

def load_zip(path, study):
    with zipfile.ZipFile(path) as archive:
        csvname = f"{study}_num.csv"
        if csvname in archive.namelist():
            raw = archive.read(csvname)
        else:
            with zipfile.ZipFile(io.BytesIO(archive.read(f"{study}csv.zip"))) as nested:
                raw = nested.read(csvname)
    frame = pd.read_csv(io.BytesIO(raw), sep=";", encoding="utf-8-sig", low_memory=False)
    frame.columns = [col.split(":", 1)[0] for col in frame.columns]
    return frame

def aggregate(frame):
    import numpy as np
    weight = pd.to_numeric(frame["PESO"].astype(str).str.replace(",", ".", regex=False),
                           errors="raise")
    probability = pd.to_numeric(frame["PROBVOTO"], errors="coerce")
    valid = probability.between(0, 10)
    methods = {}
    for name, column in (("directa", "INTENCIONGR"), ("simpatia", "VOTOSIMG")):
        code = pd.to_numeric(frame[column], errors="coerce")
        party = code.map(PARTIES)
        # 8995 = «Otro partido»: candidatura. 8996 = blanco: no candidatura.
        party = party.where(party.notna(),
                            np.where(code.between(1, 8995), "OTROS", "NO_CANDIDATURA"))
        rows = []
        for category in GROUPS:
            selected_weight = weight.where(party == category, 0)
            rows.append([
                round(float(selected_weight.sum()), 5),
                round(float(selected_weight.where(valid, 0).sum()), 5),
                round(float(selected_weight.where(valid & probability.between(0, 6), 0).sum()), 5),
                round(float(selected_weight.where(valid & probability.between(7, 9), 0).sum()), 5),
                round(float(selected_weight.where(valid & (probability == 10), 0).sum()), 5),
                round(float((selected_weight.where(valid, 0) * probability.where(valid, 0) / 10).sum()), 5),
            ])
        methods[name] = rows
    return dict(n=len(frame),
                effective_n=round(float(weight.sum()**2 / weight.pow(2).sum()), 2),
                methods=methods)

def main(paths, output):
    studies = {code: aggregate(load_zip(path, code)) for code, path in paths.items()}
    data = dict(
        schema_version=2,
        note="Agregados nacionales reconstruidos de ZIP CIS originales; sin entrevistas individuales.",
        groups=GROUPS, fields=FIELDS,
        recipe_note=("8995 = Otro partido y cuenta como candidatura; 8996 = blanco. "
                     "Para ponderación experimental se usan solo PROBVOTO entre 0 y 10, "
                     "con peso PESO × PROBVOTO/10."),
        study=studies)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(data, ensure_ascii=False, indent=2)+"\n",encoding="utf-8")
    for code, study in studies.items():
        rows = study["methods"]["directa"]
        decided = sum(row[0] for row in rows[:5])
        print(code, "entrevistas", study["n"],
              "PSOE entre decididos", round(100*rows[0][0]/decided, 3))

if __name__ == "__main__":
    if len(sys.argv) not in (4, 5):
        raise SystemExit("Uso: script.py MD3411.zip MD3415.zip MD3582.zip [salida.json]")
    target = Path(sys.argv[4]) if len(sys.argv) == 5 else Path("data/microdatos/agregados_originales_cis.json")
    main(dict(zip(("3411", "3415", "3582"), map(Path, sys.argv[1:4]))), target)

"""Lectura de ficheros de microdatos (SPSS .sav del CIS) y detección de variables.

Uso previsto, cuando haya acceso a la descarga:
    1. Descargar el fichero del estudio desde su página de microdatos (enlace en
       data/polls.json, campo `microdata`) y dejarlo en modelo/microdatos/crudos/<estudio>/.
    2. Declarar en modelo/microdatos/estudios.json las variables y códigos, copiados del
       cuestionario del instituto (no se adivinan).
    3. python3 -m modelo.microdatos <estudio>

Necesita `pyreadstat` (pip install pyreadstat) solo para leer .sav; el resto del motor no.
"""
import glob
import json
import os
import re
import numpy as np

DIR = os.path.dirname(os.path.abspath(__file__))


def leer_sav(ruta):
    try:
        import pyreadstat
    except ImportError as e:
        raise RuntimeError("Para leer microdatos .sav hace falta: pip install pyreadstat") from e
    df, meta = pyreadstat.read_sav(ruta, apply_value_formats=False)
    return df, meta


def candidatas(meta, patrones=("intenci[oó]n.*voto", "recuerdo.*voto", "^peso")):
    """Variables cuya etiqueta coincide con los patrones: ayuda para rellenar estudios.json,
    no sustituye la lectura del cuestionario."""
    out = {}
    for nombre, etiqueta in zip(meta.column_names, meta.column_labels):
        for pat in patrones:
            if re.search(pat, f"{nombre} {etiqueta or ''}", re.I):
                out.setdefault(pat, []).append((nombre, etiqueta, meta.variable_value_labels.get(nombre)))
    return out


def config(estudio):
    cfg = json.load(open(os.path.join(DIR, "estudios.json"), encoding="utf-8"))
    if estudio not in cfg:
        raise KeyError(f"El estudio {estudio} no está declarado en estudios.json")
    return cfg[estudio]


def fichero(estudio):
    rutas = glob.glob(os.path.join(DIR, "crudos", estudio, "*.sav"))
    if not rutas:
        raise FileNotFoundError(f"No hay .sav en modelo/microdatos/crudos/{estudio}/")
    return rutas[0]


def columnas(df, cfg):
    g = lambda v: np.asarray(df[v].fillna(-1).astype(int)) if v else None
    return g(cfg["intencion"]), g(cfg.get("recuerdo")), np.asarray(df[cfg["peso"]].fillna(0), float)

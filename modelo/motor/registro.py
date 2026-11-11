"""Registro de la plataforma: encuestas consultadas y evolución del pronóstico.

- encuestas.csv: todas las encuestas que el motor conoce del ciclo 2023-26 y las
  finales del 23J, con su estado de verificación, fuente y cifras.
- historial.json: el pronóstico principal recalculado para cada día, usando solo
  las encuestas que ya estaban publicadas ese día. Cada entrada guarda la firma de
  las encuestas y parámetros con que se calculó; si no cambian, no se recalcula.
"""
import csv
import hashlib
import json
import os
from datetime import timedelta
import numpy as np
from .fuentes import RAIZ, publicada_antes, dia_central, seleccion_pronostico
from pathlib import Path
from . import pronostico as PR

DIR = os.path.join(RAIZ, "modelo", "registro")
VERSION = "4"   # cambiar al modificar el modelo invalida el historial guardado
# 4 (2026-11-11): selección de oleadas observable en cada corte histórico.
# 2 (2026-11-03): puerta de calidad de fuentes (fuentes.seleccion_pronostico).
# 3 (2026-11-03): corrección de la mitad del sesgo de industria del 23J (pronostico.correccion_industria).
PRINCIPALES = ["PP", "PSOE", "VOX", "SUMAR", "PODEMOS"]


def escribir_encuestas(encuestas):
    os.makedirs(DIR, exist_ok=True)
    cols = ["casa", "estudio", "origen", "campo_ini", "campo_fin", "publicacion", "n", "modo",
            "PP", "PSOE", "VOX", "SUMAR", "PODEMOS", "SALF", "ERC", "JUNTS", "BILDU", "PNV", "BNG", "CC", "UPN",
            "ciclo", "url", "nota"]
    filas = sorted(encuestas, key=lambda e: (e["campo_fin"], e["casa"]), reverse=True)
    with open(os.path.join(DIR, "encuestas.csv"), "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, cols)
        w.writeheader()
        for e in filas:
            fila = {k: e.get(k) for k in ("casa", "estudio", "origen", "campo_ini", "campo_fin", "publicacion",
                                          "n", "modo", "ciclo", "url", "nota")}
            fila.update({p: e["voto"].get(p) for p in cols if p.isupper()})
            w.writerow(fila)
    return len(filas)


def firma_dependencias():
    """Invalida el historial al cambiar código, geografía o supuestos externos."""
    root = Path(RAIZ)
    paths = sorted(set((root / "modelo/motor").glob("*.py")) |
                   set((root / "modelo/microdatos").glob("*.json")) |
                   {root / "data" / f for f in ("election.json", "districts.csv", "results.csv", "events.json")})
    digest = hashlib.sha256()
    for path in paths:
        digest.update(str(path.relative_to(root)).encode())
        digest.update(path.read_bytes())
    return digest.hexdigest()


def _firma(encuestas, fecha, n, industria, inicio=None, eleccion=None, errores_23j=None):
    # Una corrección de muestra o campo cambia la verosimilitud aunque no cambie el voto.
    campos = ("estudio", "casa", "voto", "n", "campo_ini", "campo_fin", "publicacion", "modo", "origen")
    ids = sorted(json.dumps({k: e.get(k) for k in campos}, sort_keys=True, default=str) for e in encuestas)
    txt = json.dumps([VERSION, firma_dependencias(), str(fecha), n, industria, PR.RHO_BLOQUE, ids,
                      str(inicio), str(eleccion), errores_23j], ensure_ascii=False, sort_keys=True, default=str)
    return hashlib.sha1(txt.encode()).hexdigest()[:16]


def _compacto(r, fecha, disp):
    P = r["partidos"]
    return dict(
        fecha=str(fecha), n_encuestas=len(disp), casas=sorted({e["casa"] for e in disp}),
        ultima_encuesta=str(max(e["campo_fin"] for e in disp)),
        voto={p: [round(x, 2) for x in P[p]["voto"]] for p in PRINCIPALES if p in P},
        escanos={p: [round(x, 1) for x in P[p]["escanos"]] for p in P},
        primero={p: round(P[p]["primero"], 3) for p in ("PP", "PSOE") if p in P},
        bloques={b: dict(mediana=v["mediana"], p5=v["p5"], p95=v["p95"], p_mayoria=round(v["p_mayoria"], 3))
                 for b, v in r["bloques"].items()})


def historial(actuales, inicio, desde, hasta, eleccion, errores_23j, n_por_variante=500):
    """Devuelve la lista de entradas diarias desde `desde` hasta `hasta` (incluidos)."""
    os.makedirs(DIR, exist_ok=True)
    ruta = os.path.join(DIR, "historial.json")
    previo = {}
    if os.path.exists(ruta):
        with open(ruta, encoding="utf-8") as stream:
            previo = {h["fecha"]: h for h in json.load(stream)}
    out = []
    d = desde
    while d <= hasta:
        # Seleccionar DESPUÉS de filtrar la información conocida ese día. Una
        # encuesta futura no puede retirar una oleada disponible en el pasado.
        conocidas = [e for e in actuales if publicada_antes(e, d) and e["campo_fin"] <= d]
        disp, _ = seleccion_pronostico(conocidas)
        disp = [e for e in disp if dia_central(e) <= d]
        if len({e["casa"] for e in disp}) >= 2:
            firma = _firma(disp, d, n_por_variante, PR.INDUSTRIA_PRINCIPAL,
                           inicio=inicio, eleccion=eleccion, errores_23j=errores_23j)
            h = previo.get(str(d))
            if not h or h.get("firma") != firma:
                r = PR.principal(disp, inicio, d, eleccion, errores_23j, n_por_variante=n_por_variante)
                h = _compacto(r, d, disp)
                h["firma"] = firma
                h["version"] = VERSION
                h["nuevas"] = sorted(e["estudio"] for e in disp
                                     if (e.get("publicacion") or e["campo_fin"] + timedelta(days=2)) == d)
            out.append(h)
        d += timedelta(days=1)
    with open(ruta, "w", encoding="utf-8") as stream:
        json.dump(out, stream, ensure_ascii=False, indent=1)
    return out

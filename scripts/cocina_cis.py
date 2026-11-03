"""Cocina propia del Observatorio sobre microdatos originales del CIS.

Uso:
  python -I scripts/cocina_cis.py MD3582.zip [--salida data/microdatos/cocina_cis_3582.json]

Lee el ZIP oficial del CIS (no se versiona), aplica una receta explícita paso a paso y
escribe SOLO agregados: ninguna fila de entrevista sale del script.

Receta (acumulativa; cada paso conserva los anteriores):
  0. Intención directa (INTENCIONGR) entre quienes nombran candidatura o blanco, sin ponderar.
  1. Ponderación sociodemográfica del CIS (PESO).
  2. Voto + simpatía (VOTOSIMG) en lugar de intención directa.
  3. Calibración por recuerdo de voto (RECUERDO, generales 2023): entre quienes recuerdan
     haber votado, el peso se ajusta para que el recuerdo reproduzca el resultado oficial del
     23J (BOE). Abstencionistas, nuevos electores y quienes no responden conservan su peso.
     Factores recortados a [0,2; 5].
  4. Indecisos (N.S./N.C. en VOTOSIMG) que recuerdan voto a una candidatura: se reparten
     según cómo votan hoy los decididos de su mismo grupo de recuerdo (matriz de transferencias
     observada, con los pesos ya calibrados).
  5. Participación: cada entrevista pesa además PROBVOTO/10 (N.S./N.C. = 0,5).
El resultado del paso 5 es «CIS 3582 cocinado por el Observatorio».
"""
from __future__ import annotations
import argparse
import csv
import hashlib
import io
import json
import zipfile
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

# Códigos del libro de códigos del estudio (comprobados en 3582_etiq.csv).
INTENCION = {1: "PSOE", 2: "PP", 3: "VOX", 8: "PODEMOS", 21: "SUMAR", 28: "SALF", 901: "ERC", 902: "JUNTS",
             1602: "BILDU", 1601: "PNV", 1201: "BNG", 503: "CC", 1501: "UPN",
             6: "OTROS", 29: "OTROS", 101: "OTROS", 8995: "OTROS", 8996: "BLANCO",
             9977: "NULO", 9997: "NO_VOTARIA", 9998: "NS", 9999: "NC"}
RECUERDO = {1: "PSOE", 2: "PP", 3: "VOX", 21: "SUMAR", 901: "ERC", 902: "JUNTS", 1602: "BILDU",
            1601: "PNV", 1201: "BNG", 503: "CC", 1501: "UPN", 6: "OTROS", 8995: "OTROS",
            8996: "BLANCO_NULO", 9977: "BLANCO_NULO", 9995: "NUEVO", 9996: "NUEVO",
            9997: "ABSTENCION", 9998: "NR", 9999: "NR"}
CANDIDATURAS = ["PP", "PSOE", "VOX", "SUMAR", "PODEMOS", "SALF", "ERC", "JUNTS", "BILDU", "PNV", "BNG", "CC", "UPN", "OTROS"]
VALIDOS = CANDIDATURAS + ["BLANCO"]
VOTO_RECORDADO = ["PSOE", "PP", "VOX", "SUMAR", "ERC", "JUNTS", "BILDU", "PNV", "BNG", "CC", "UPN", "OTROS", "BLANCO_NULO"]
RECORTE = (0.2, 5.0)


def resultado_23j():
    """Votos emitidos del 23J por grupo de recuerdo (candidaturas + blanco/nulo), desde data/ (BOE)."""
    mapa = {"PP": "PP", "PSOE": "PSOE", "PSC": "PSOE", "VOX": "VOX", "SUMAR": "SUMAR", "ERC": "ERC", "JUNTS": "JUNTS",
            "EH Bildu": "BILDU", "EAJ-PNV": "PNV", "BNG": "BNG", "CCa": "CC", "UPN": "UPN"}
    votos = defaultdict(float)
    for r in csv.DictReader(open(ROOT / "data/results.csv", encoding="utf-8-sig")):
        if r["election"] != "2023-07-23":
            continue
        cod = r["party"].rstrip(".").rsplit("(", 1)[1].rstrip(")")
        votos[mapa.get(cod, "OTROS")] += int(r["votes"])
    for r in csv.DictReader(open(ROOT / "data/districts.csv", encoding="utf-8-sig")):
        if r["election"] == "2023-07-23":
            votos["BLANCO_NULO"] += int(r["blank"]) + int(r["invalid"])
    total = sum(votos.values())
    return {k: v / total for k, v in votos.items()}


def leer(zip_path, estudio):
    raw = zipfile.ZipFile(zip_path).read(f"{estudio}_num.csv").decode("utf-8-sig")
    filas = list(csv.reader(io.StringIO(raw), delimiter=";"))
    cab = [c.split(":", 1)[0] for c in filas[0]]
    idx = {v: cab.index(v) for v in ("PESO", "INTENCIONGR", "VOTOSIMG", "RECUERDO", "PROBVOTO")}
    out = []
    for f in filas[1:]:
        g = lambda v: f[idx[v]].strip()
        prob = int(g("PROBVOTO")) if g("PROBVOTO").isdigit() else None
        out.append(dict(peso=float(g("PESO").replace(",", ".")), intencion=INTENCION.get(int(g("INTENCIONGR")), "OTROS"),
                        votosim=INTENCION.get(int(g("VOTOSIMG")), "OTROS"), recuerdo=RECUERDO.get(int(g("RECUERDO")), "NR"),
                        prob=(prob / 10 if prob is not None and prob <= 10 else 0.5)))
    return out, hashlib.sha256(Path(zip_path).read_bytes()).hexdigest()


def reparto(pesos):
    tot = sum(pesos[k] for k in VALIDOS)
    return {k: round(100 * pesos[k] / tot, 3) for k in VALIDOS} if tot else {}


def estimar(e, campo, peso, imputar=None):
    acc = defaultdict(float)
    for r, w in zip(e, peso):
        v = r[campo]
        if v in VALIDOS:
            acc[v] += w
        elif imputar and v in ("NS", "NC") and r["recuerdo"] in imputar:
            for k, p in imputar[r["recuerdo"]].items():
                acc[k] += w * p
    return reparto(acc), acc


def cocinar(e, oficial):
    pasos = []
    def paso(clave, titulo, regla, parametro, shares, extra=None):
        prev = pasos[-1]["estimacion"] if pasos else None
        pasos.append(dict(id=clave, titulo=titulo, regla=regla, parametro=parametro, estimacion=shares,
                          variacion_pp=({k: round(shares[k] - prev[k], 3) for k in shares} if prev else None),
                          **(extra or {})))
    uno = [1.0] * len(e)
    s, _ = estimar(e, "intencion", uno)
    paso("directa", "Intención directa sin ponderar", "Porcentaje sobre quienes nombran candidatura o voto en blanco",
         "INTENCIONGR; excluye nulo, no votaría, N.S. y N.C.", s,
         dict(entrevistas=len(e), entrevistas_validas=sum(1 for r in e if r["intencion"] in VALIDOS)))
    w = [r["peso"] for r in e]
    s, _ = estimar(e, "intencion", w)
    paso("peso", "Ponderación del CIS", "Peso sociodemográfico publicado por el CIS", "PESO", s)
    s, _ = estimar(e, "votosim", w)
    paso("simpatia", "Voto + simpatía", "Quien no declara voto pero sí simpatía se asigna a ese partido", "VOTOSIMG", s)
    # Calibración por recuerdo entre quienes recuerdan haber votado.
    peso_rec = defaultdict(float)
    for r, x in zip(e, w):
        peso_rec[r["recuerdo"]] += x
    votantes = sum(peso_rec[g] for g in VOTO_RECORDADO)
    factores, recuerdo_muestra = {}, {}
    for g in VOTO_RECORDADO:
        recuerdo_muestra[g] = round(100 * peso_rec[g] / votantes, 3) if votantes else None
        objetivo = oficial.get(g, 0) * votantes
        f = objetivo / peso_rec[g] if peso_rec[g] else 1.0
        factores[g] = round(min(max(f, RECORTE[0]), RECORTE[1]), 4)
    w = [x * factores.get(r["recuerdo"], 1.0) for r, x in zip(e, w)]
    s, _ = estimar(e, "votosim", w)
    paso("recuerdo", "Calibración por recuerdo de voto 2023",
         "Entre quienes recuerdan haber votado, el recuerdo ponderado debe reproducir el resultado oficial del 23J",
         f"RECUERDO; factores recortados a {RECORTE}", s,
         dict(recuerdo_muestra_pct=recuerdo_muestra, resultado_23j_pct={g: round(100 * oficial.get(g, 0), 3) for g in VOTO_RECORDADO},
              factores=factores))
    # Transferencias observadas: cómo votan hoy los decididos de cada grupo de recuerdo.
    trans = defaultdict(lambda: defaultdict(float))
    for r, x in zip(e, w):
        if r["votosim"] in VALIDOS and r["recuerdo"] in VOTO_RECORDADO:
            trans[r["recuerdo"]][r["votosim"]] += x
    imputar = {g: {k: v / sum(d.values()) for k, v in d.items()} for g, d in trans.items() if sum(d.values()) > 0}
    indecisos = sum(x for r, x in zip(e, w) if r["votosim"] in ("NS", "NC"))
    imputables = sum(x for r, x in zip(e, w) if r["votosim"] in ("NS", "NC") and r["recuerdo"] in imputar)
    s, _ = estimar(e, "votosim", w, imputar)
    paso("indecisos", "Indecisos según su recuerdo", "N.S./N.C. que recuerdan voto se reparten como los decididos de su grupo de recuerdo",
         "Matriz de transferencias observada con pesos calibrados", s,
         dict(indecisos_pct=round(100 * indecisos / sum(w), 2), imputados_pct_de_indecisos=round(100 * imputables / indecisos, 1) if indecisos else 0,
              transferencias_pct={g: {k: round(100 * v, 1) for k, v in sorted(d.items(), key=lambda z: -z[1]) if v >= 0.005} for g, d in imputar.items()}))
    w = [x * r["prob"] for r, x in zip(e, w)]
    s, _ = estimar(e, "votosim", w, imputar)
    paso("participacion", "Probabilidad de votar", "Cada entrevista pesa además su probabilidad declarada de votar",
         "PROBVOTO/10; N.S./N.C. = 0,5", s)
    validos = [x for r, x in zip(e, w) if r["votosim"] in VALIDOS or (r["votosim"] in ("NS", "NC") and r["recuerdo"] in imputar)]
    n_eff = sum(validos) ** 2 / sum(x * x for x in validos)
    return pasos, round(n_eff, 1)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("zip")
    ap.add_argument("--estudio", default="3582")
    ap.add_argument("--salida")
    a = ap.parse_args()
    e, sha = leer(a.zip, a.estudio)
    pasos, n_eff = cocinar(e, resultado_23j())
    out = dict(esquema=1, estudio=a.estudio, fuente=f"MD{a.estudio}.zip (CIS)", sha256_zip=sha,
               naturaleza="Cocina propia sobre microdatos individuales. Solo agregados; ninguna entrevista se publica.",
               receta=[p["id"] for p in pasos], pasos=pasos,
               resultado=dict(estimacion=pasos[-1]["estimacion"], n_efectivo=n_eff,
                              nota="n efectivo de Kish con los pesos finales; es el que se usa como tamaño muestral en el Motor 29N."),
               limitaciones=["El recuerdo de voto tiene errores propios (olvido, deseabilidad); la calibración los corrige solo en parte.",
                             "La abstención recordada no se calibra: el CIS entrevista a residentes y el censo oficial incluye el CERA.",
                             "Los factores de calibración se recortan a [0,2; 5].",
                             "Receta validada frente al 23J solo cuando consta en validacion_cocina_cis.json."])
    destino = Path(a.salida or ROOT / f"data/microdatos/cocina_cis_{a.estudio}.json")
    destino.write_text(json.dumps(out, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    for p in pasos:
        print(f"{p['id']:14s}", " ".join(f"{k} {p['estimacion'][k]:5.1f}" for k in ("PP", "PSOE", "VOX", "SUMAR", "PODEMOS")))
    print("n efectivo", n_eff)


if __name__ == "__main__":
    main()

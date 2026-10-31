"""Pronóstico del 29N: tendencia actual + incertidumbre hasta el día de la elección.

Fuentes de incertidumbre (independientes, sumadas en varianza):
1. Estimación de hoy (posterior del modelo de tendencia).
2. Movimiento hasta la elección: paseo aleatorio tau * sqrt(días restantes).
3. Error de industria: lo que fallan todas las casas a la vez. Calibrado con el 23J
   (único precedente con datos en el sistema): RMS ~1,4 pp. Se usa sd = 1,5 pp para
   un partido del 25 %, escalada con sqrt(p/25), mínimo 0,3 pp.
4. Error provincial del traslado a escaños (lognormal, sd 0,08).
"""
from datetime import timedelta
import numpy as np
from .tendencia import ajustar
from .escanos import Base

PARTIDOS = ["PP", "PSOE", "VOX", "SUMAR", "PODEMOS", "SALF", "ERC", "JUNTS", "BILDU", "PNV",
            "BNG", "CC", "UPN"]
BLANCO = 0.8   # % de voto en blanco sobre válidos (23J: 0,8 %)
BLOQUES = {"PP+VOX": ["PP", "VOX"], "PP+VOX+UPN": ["PP", "VOX", "UPN"],
           "PSOE+SUMAR+PODEMOS": ["PSOE", "SUMAR", "PODEMOS"],
           "PSOE+SUMAR+PODEMOS+ERC+JUNTS+BILDU+PNV+BNG+CC":
               ["PSOE", "SUMAR", "PODEMOS", "ERC", "JUNTS", "BILDU", "PNV", "BNG", "CC"]}

VARIANTES = {
    "consenso_privadas": "Sesgo cero = media de las casas privadas (CIS fuera del ancla).",
    "consenso_todas": "Sesgo cero = media de todas las casas, CIS incluido.",
    "calibrada_23j": "Sesgo previo de cada casa = 50 % de su error en el 23J (PP, PSOE, Vox); sin ancla de consenso.",
}


def priors_23j(errores, partido, factor=0.5, sd=1.5):
    return {c: (factor * r["error"][partido], sd) for c, r in errores.items() if partido in r["error"]}


def estimar(encuestas, inicio, hoy, variante, errores_23j=None, eventos=(), tau=0.15):
    out = {}
    for p in PARTIDOS:
        kw = dict(tau=tau, eventos=eventos)
        if variante == "consenso_todas":
            kw["excluir_ancla"] = ()
        elif variante == "calibrada_23j" and p in ("PP", "PSOE", "VOX") and errores_23j:
            kw["prior_sesgos"] = priors_23j(errores_23j, p)
        r = ajustar(encuestas, p, inicio, hoy, **kw)
        if r is not None:
            out[p] = r
    return out


def simular(ajustes, dias_restantes, n=5000, tau=0.15, sd_prov=0.08, semilla=29):
    rng = np.random.default_rng(semilla)
    partidos = [p for p in PARTIDOS if p in ajustes]
    mu = np.array([ajustes[p]["media"][-1] for p in partidos])
    sd_hoy = np.array([ajustes[p]["sd"][-1] for p in partidos])
    sd_ind = np.maximum(1.5 * np.sqrt(np.clip(mu, 0, None) / 25), 0.3)
    esc = np.array([ajustes[p]["escala"] for p in partidos])
    sd_tot = np.sqrt(sd_hoy ** 2 + (tau * esc) ** 2 * dias_restantes + sd_ind ** 2)
    rep = {"SUMAR": 1.0}
    if "SUMAR" in partidos and "PODEMOS" in partidos:
        a, b = mu[partidos.index("SUMAR")], mu[partidos.index("PODEMOS")]
        rep = {"SUMAR": a / (a + b), "PODEMOS": b / (a + b)}
    base = Base(partidos + ["OTROS"], rep)
    votos = np.zeros((n, len(partidos)))
    escanos = np.zeros((n, len(partidos)), dtype=int)
    R = len(base.provincias)
    for k in range(n):
        v = np.clip(mu + rng.normal(0, 1, len(mu)) * sd_tot, 0.01, None)
        otros = max(100 - BLANCO - v.sum(), 0.5)
        tot = v.sum() + otros
        v = v * (100 - BLANCO) / tot
        votos[k] = v
        nac = np.append(v, otros * (100 - BLANCO) / tot) / 100
        e = base.repartir(base.proyectar(nac, rng.normal(0, sd_prov, (R, len(nac)))))
        escanos[k] = e.sum(0)[:-1]
    return dict(partidos=partidos, votos=votos, escanos=escanos, sd_total=dict(zip(partidos, sd_tot)))


def resumir(sim):
    P, V, E = sim["partidos"], sim["votos"], sim["escanos"]
    q = lambda x: (float(np.median(x)), float(np.percentile(x, 5)), float(np.percentile(x, 95)))
    partidos = {p: dict(voto=q(V[:, j]), escanos=q(E[:, j]), primero=float(np.mean(E.argmax(1) == j)))
                for j, p in enumerate(P)}
    bloques = {}
    for b, m in BLOQUES.items():
        idx = [P.index(x) for x in m if x in P]
        s = E[:, idx].sum(1)
        bloques[b] = dict(mediana=float(np.median(s)), p5=float(np.percentile(s, 5)),
                          p95=float(np.percentile(s, 95)), p_mayoria=float(np.mean(s >= 176)))
    return dict(partidos=partidos, bloques=bloques)


def promedio_simple(encuestas, hoy, dias=30):
    """Referencia: última encuesta de cada casa en `dias`, mismo peso, sin correcciones."""
    ult = {}
    for e in sorted(encuestas, key=lambda e: e["campo_fin"]):
        if hoy - timedelta(days=dias) <= e["campo_fin"] <= hoy:
            ult[e["casa"]] = e
    return {p: float(np.mean([e["voto"][p] for e in ult.values() if p in e["voto"]]))
            for p in PARTIDOS if any(p in e["voto"] for e in ult.values())}, sorted(ult)

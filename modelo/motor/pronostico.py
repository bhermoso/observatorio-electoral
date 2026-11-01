"""Pronóstico del 29N: tendencia actual + incertidumbre hasta el día de la elección.

Fuentes de incertidumbre (independientes, sumadas en varianza):
1. Estimación de hoy (posterior del modelo de tendencia).
2. Movimiento hasta la elección: paseo aleatorio tau * sqrt(días restantes).
3. Error de industria: lo que fallan todas las casas a la vez. Calibrado con el 23J
   (único precedente con datos en el sistema): RMS ~1,4 pp. Se usa sd = 1,5 pp para
   un partido del 25 %, escalada con sqrt(p/25), mínimo 0,3 pp.
4. Error provincial del traslado a escaños (lognormal, sd 0,08).

El error de industria no es independiente entre partidos. Una fracción `rho_bloque` de
su varianza es un factor común que desplaza voto entre bloques (signo + para PP, Vox y
UPN; − para PSOE, Sumar y Podemos; 0 para el resto). Motivo de método: todas las casas
ponderan por recuerdo de voto y comparten el mismo tipo de fallo. En el 23J la diferencia
entre bloques se infló 2,3 pp. Con una sola elección no se puede estimar rho: es un
supuesto declarado (0,5 por defecto) y el informe muestra la sensibilidad.
"""
from datetime import timedelta
import numpy as np
from .tendencia import ajustar
from .escanos import Base

PARTIDOS = ["PP", "PSOE", "VOX", "SUMAR", "PODEMOS", "SALF", "ERC", "JUNTS", "BILDU", "PNV",
            "BNG", "CC", "UPN"]
BLANCO = 0.8   # % de voto en blanco sobre válidos (23J: 0,8 %)
RHO_BLOQUE = 0.5
SIGNO_BLOQUE = {"PP": 1, "VOX": 1, "UPN": 1, "PSOE": -1, "SUMAR": -1, "PODEMOS": -1}
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


REGIONALES = ["ERC", "JUNTS", "BILDU", "PNV", "BNG", "CC", "UPN"]


def simular(ajustes, dias_restantes, n=5000, tau=0.15, sd_prov=0.08, semilla=29, rho_bloque=RHO_BLOQUE,
            industria=1.5, desplazamiento=None, metodo_geo="proporcional"):
    """Simula el 29N. Los partidos regionales sin estimación en las encuestas del corte
    conservan su voto nacional del 23J como hipótesis (marcados en `sin_encuestas`),
    con la misma incertidumbre que tendría un partido de su tamaño sin datos."""
    rng = np.random.default_rng(semilla)
    estimados = [p for p in PARTIDOS if p in ajustes]
    mu_e = {p: ajustes[p]["media"][-1] for p in estimados}
    rep = {"SUMAR": 1.0}
    if "SUMAR" in mu_e and "PODEMOS" in mu_e:
        a, b = mu_e["SUMAR"], mu_e["PODEMOS"]
        rep = {"SUMAR": a / (a + b), "PODEMOS": b / (a + b)}
    sin = [p for p in REGIONALES if p not in ajustes]
    partidos = [p for p in PARTIDOS if p in ajustes or p in sin]
    base = Base(partidos + ["OTROS"], rep)
    nac23 = dict(zip(base.partidos, 100 * base.nacional))
    mu = np.array([mu_e[p] if p in mu_e else nac23[p] for p in partidos])
    if desplazamiento:   # escenario explícito: puntos que se suman o restan a la media
        mu = mu + np.array([desplazamiento.get(p, 0.0) for p in partidos])
        mu = np.clip(mu, 0.05, None)
    esc = np.array([ajustes[p]["escala"] if p in ajustes else np.sqrt(max(mu[i], 0.5) / 25)
                    for i, p in enumerate(partidos)])
    sd_hoy = np.array([ajustes[p]["sd"][-1] if p in ajustes else 3.0 * esc[i] for i, p in enumerate(partidos)])
    sd_ind = np.maximum(industria * np.sqrt(np.clip(mu, 0, None) / 25), 0.3 * industria / 1.5)
    sd_resto = np.sqrt(sd_hoy ** 2 + (tau * esc) ** 2 * dias_restantes)
    sd_tot = np.sqrt(sd_resto ** 2 + sd_ind ** 2)
    signo = np.array([SIGNO_BLOQUE.get(p, 0) for p in partidos], dtype=float)
    # Partidos sin bloque: todo su error de industria es propio.
    comun = np.where(signo != 0, np.sqrt(rho_bloque), 0.0)
    propio = np.sqrt(1 - comun ** 2)
    votos = np.zeros((n, len(partidos)))
    escanos = np.zeros((n, len(partidos)), dtype=int)
    R = len(base.provincias)
    por_prov = np.zeros((R, len(partidos)))
    for k in range(n):
        z = rng.normal()
        ind = sd_ind * (comun * signo * z + propio * rng.normal(0, 1, len(mu)))
        v = np.clip(mu + rng.normal(0, 1, len(mu)) * sd_resto + ind, 0.01, None)
        otros = max(100 - BLANCO - v.sum(), 0.5)
        tot = v.sum() + otros
        v = v * (100 - BLANCO) / tot
        votos[k] = v
        nac = np.append(v, otros * (100 - BLANCO) / tot) / 100
        e = base.repartir(base.proyectar(nac, rng.normal(0, sd_prov, (R, len(nac))), metodo=metodo_geo))
        escanos[k] = e.sum(0)[:-1]
        por_prov += e[:, :-1]
    return dict(partidos=partidos, votos=votos, escanos=escanos, sd_total=dict(zip(partidos, sd_tot)),
                sin_encuestas=sin, rho_bloque=rho_bloque, industria=industria,
                provincias=list(base.provincias), escanos_prov=base.escanos.tolist(),
                por_provincia=por_prov / n)


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


INDUSTRIA_PRINCIPAL = 2.2


def principal(encuestas, inicio, hoy, eleccion, errores_23j, n_por_variante=2000, industria=INDUSTRIA_PRINCIPAL,
              desplazamiento=None, metodo_geo="proporcional"):
    """Pronóstico principal: une las simulaciones de las tres variantes de referencia, a
    partes iguales, con un error de industria intermedio entre el supuesto inicial (1,5)
    y el que habría cubierto 2023 (~2,9). Así la incertidumbre de método (qué casas
    definen el sesgo cero) y la de calibración entran en una sola distribución."""
    dias = (eleccion - hoy).days
    sims = []
    for var in VARIANTES:
        aj = estimar(encuestas, inicio, hoy, var, errores_23j=errores_23j)
        sims.append(simular(aj, dias, n=n_por_variante, industria=industria,
                            semilla=sum(map(ord, var)) + hoy.toordinal(), desplazamiento=desplazamiento,
                            metodo_geo=metodo_geo))
    P = sims[0]["partidos"]
    assert all(s["partidos"] == P for s in sims)
    V = np.vstack([s["votos"] for s in sims])
    E = np.vstack([s["escanos"] for s in sims])
    pp = np.mean([s["por_provincia"] for s in sims], axis=0)
    r = resumir(dict(partidos=P, votos=V, escanos=E))
    r["provincias"] = [dict(provincia=pr, escanos=sims[0]["escanos_prov"][i],
                            reparto={p: round(float(pp[i, j]), 2) for j, p in enumerate(P) if pp[i, j] >= 0.05})
                       for i, pr in enumerate(sims[0]["provincias"])]
    r["n"] = int(E.shape[0])
    r["industria"] = industria
    r["dias"] = dias
    r["sin_encuestas"] = sims[0]["sin_encuestas"]
    return r

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
    recortados = np.zeros(len(partidos), dtype=int)
    residual_minimo = 0
    factores_normalizacion = []
    for k in range(n):
        z = rng.normal()
        ind = sd_ind * (comun * signo * z + propio * rng.normal(0, 1, len(mu)))
        crudo = mu + rng.normal(0, 1, len(mu)) * sd_resto + ind
        recortados += crudo < 0.01
        v = np.clip(crudo, 0.01, None)
        residual_minimo += (100 - BLANCO - v.sum()) < 0.5
        otros = max(100 - BLANCO - v.sum(), 0.5)
        tot = v.sum() + otros
        factores_normalizacion.append(float((100-BLANCO)/tot))
        v = v * (100 - BLANCO) / tot
        votos[k] = v
        nac = np.append(v, otros * (100 - BLANCO) / tot) / 100
        e = base.repartir(base.proyectar(nac, rng.normal(0, sd_prov, (R, len(nac))), metodo=metodo_geo))
        escanos[k] = e.sum(0)[:-1]
        por_prov += e[:, :-1]
    return dict(partidos=partidos, votos=votos, escanos=escanos, sd_total=dict(zip(partidos, sd_tot)),
                sin_encuestas=sin, rho_bloque=rho_bloque, industria=industria,
                provincias=list(base.provincias), escanos_prov=base.escanos.tolist(),
                por_provincia=por_prov / n,
                diagnostico_normalizacion=dict(n=n, semilla=semilla,
                    frecuencia_recorte_inferior={p:float(recortados[j]/n) for j,p in enumerate(partidos)},
                    frecuencia_residual_minimo=float(residual_minimo/n),
                    factor_media=float(np.mean(factores_normalizacion)), factor_minimo=float(min(factores_normalizacion)),
                    nota="El recorte y la normalización pueden desplazar medias y dependencias; diagnóstico, no calibración composicional."))


def frecuencias_primero(escanos):
    """Primera fuerza exclusiva y compartida, invariantes al orden de partidos."""
    e = np.asarray(escanos)
    if e.ndim != 2 or not e.shape[0] or not e.shape[1]:
        raise ValueError("Matriz de escaños vacía o incompatible")
    maxima = e == e.max(axis=1, keepdims=True)
    empate = maxima.sum(axis=1) > 1
    return dict(exclusivo=np.mean(maxima & ~empate[:, None], axis=0),
                compartido=np.mean(maxima, axis=0), empate=float(empate.mean()))


def resumir(sim):
    P, V, E = sim["partidos"], sim["votos"], sim["escanos"]
    q = lambda x: (float(np.median(x)), float(np.percentile(x, 5)), float(np.percentile(x, 95)))
    primera = frecuencias_primero(E)
    partidos = {p: dict(voto=q(V[:, j]), escanos=q(E[:, j]), primero=float(primera["exclusivo"][j]),
                        primero_o_empate=float(primera["compartido"][j]))
                for j, p in enumerate(P)}
    bloques = {}
    for b, m in BLOQUES.items():
        idx = [P.index(x) for x in m if x in P]
        s = E[:, idx].sum(1)
        bloques[b] = dict(mediana=float(np.median(s)), p5=float(np.percentile(s, 5)),
                          p95=float(np.percentile(s, 95)), p_mayoria=float(np.mean(s >= 176)))
    return dict(partidos=partidos, bloques=bloques, empate_primero=primera["empate"])



# Hipótesis aritméticas, no pronósticos de comportamiento parlamentario.
# Los diputados no incluidos en afirmativos ni abstenciones se cuentan como no.
ESCENARIOS_INVESTIDURA = {
    "pp_vox_primera": dict(nombre="PP + Vox: mayoría absoluta", si=("PP", "VOX"), abstienen=()),
    "pp_vox_upn_primera": dict(nombre="PP + Vox + UPN: mayoría absoluta", si=("PP", "VOX", "UPN"), abstienen=()),
    "pp_vox_segunda_abst_otros": dict(nombre="PP + Vox: segunda votación si UPN y CC se abstienen",
        si=("PP", "VOX"), abstienen=("UPN", "CC")),
    "psoe_sumar_podemos_primera": dict(nombre="PSOE + Sumar + Podemos: mayoría absoluta",
        si=("PSOE", "SUMAR", "PODEMOS"), abstienen=()),
    "psoe_sumar_segunda_abst_territoriales": dict(nombre="PSOE + Sumar + Podemos: segunda votación con abstención de ERC, Junts, Bildu, PNV, BNG y CC",
        si=("PSOE", "SUMAR", "PODEMOS"), abstienen=("ERC", "JUNTS", "BILDU", "PNV", "BNG", "CC")),
    "psoe_apoyos_territoriales_primera": dict(nombre="PSOE + Sumar + Podemos + ERC + Junts + Bildu + PNV + BNG + CC: mayoría absoluta",
        si=("PSOE", "SUMAR", "PODEMOS", "ERC", "JUNTS", "BILDU", "PNV", "BNG", "CC"), abstienen=()),
}


def evaluar_investidura(partidos, escanos, escenarios=ESCENARIOS_INVESTIDURA):
    """Evaluación CONDICIONAL de reglas de votación, usando cada simulación conjunta.
    Art. 99 CE: primera votación >=176; segunda, sí > no (no se suman abstenciones a sí).
    No atribuye probabilidad a pactos ni a que un partido decida abstenerse.
    """
    E = np.asarray(escanos, dtype=int)
    if E.ndim != 2 or E.shape[1] != len(partidos):
        raise ValueError("Dimensiones de escaños y partidos incompatibles")
    if np.any(E < 0) or np.any(E.sum(axis=1) > 350):
        raise ValueError("Reparto parlamentario inválido")
    ids = {p: i for i, p in enumerate(partidos)}
    out = {}
    for clave, rule in escenarios.items():
        si, abst = tuple(rule["si"]), tuple(rule["abstienen"])
        if set(si) & set(abst):
            raise ValueError("Un partido no puede votar sí y abstenerse")
        if any(p not in ids for p in (*si, *abst)):
            out[clave] = dict(disponible=False, motivo="Una formación del escenario no está modelizada")
            continue
        yes = E[:, [ids[p] for p in si]].sum(axis=1)
        abstain = E[:, [ids[p] for p in abst]].sum(axis=1) if abst else np.zeros(len(E), dtype=int)
        no = 350 - yes - abstain
        out[clave] = dict(
            disponible=True, nombre=rule["nombre"], si=list(si), abstienen=list(abst),
            resto="no", n=int(len(E)), mediana_si=float(np.median(yes)),
            mediana_abstenciones=float(np.median(abstain)), mediana_no=float(np.median(no)),
            p5_si=float(np.percentile(yes, 5)), p95_si=float(np.percentile(yes, 95)),
            frecuencia_primera=float(np.mean(yes >= 176)),
            frecuencia_segunda=float(np.mean(yes > no))
        )
    return out

def promedio_simple(encuestas, hoy, dias=30):
    """Referencia: última encuesta de cada casa en `dias`, mismo peso, sin correcciones."""
    ult = {}
    for e in sorted(encuestas, key=lambda e: e["campo_fin"]):
        if hoy - timedelta(days=dias) <= e["campo_fin"] <= hoy:
            ult[e["casa"]] = e
    return {p: float(np.mean([e["voto"][p] for e in ult.values() if p in e["voto"]]))
            for p in PARTIDOS if any(p in e["voto"] for e in ult.values())}, sorted(ult)


INDUSTRIA_PRINCIPAL = 2.2

# Cocina del Observatorio sobre agregados: corrección parcial del sesgo común de la industria.
# En el 23J la media de las casas se desvió del resultado (encuesta − resultado): PSOE −2,5 pp, etc.
# Se corrige una fracción de ese sesgo en las variantes de consenso (la variante calibrada ya parte
# del error de cada casa). Fracción 0,5: con una sola elección de referencia no se supone que el
# sesgo se repita entero ni que desaparezca. Solo partidos con error medido en al menos MIN_CASAS casas.
FRACCION_SESGO = 0.5
MIN_CASAS_SESGO = 5
VARIANTES_CORREGIDAS = ("consenso_privadas", "consenso_todas")


def correccion_industria(errores_23j, fraccion=FRACCION_SESGO, min_casas=MIN_CASAS_SESGO):
    """Puntos que se suman a la media de cada partido: −fracción × error medio de las casas en el 23J."""
    out = {}
    for p in PARTIDOS:
        v = [r["error"][p] for r in (errores_23j or {}).values() if p in r.get("error", {})]
        if len(v) >= min_casas:
            out[p] = round(-fraccion * float(np.mean(v)), 3)
    return out


def principal(encuestas, inicio, hoy, eleccion, errores_23j, n_por_variante=2000, industria=INDUSTRIA_PRINCIPAL,
              desplazamiento=None, metodo_geo="proporcional", rho_bloque=RHO_BLOQUE,
              sd_prov=0.08, variantes=None, fraccion_sesgo=FRACCION_SESGO):
    """Pronóstico principal: une las simulaciones de las tres variantes de referencia, a
    partes iguales, con un error de industria intermedio entre el supuesto inicial (1,5)
    y el que habría cubierto 2023 (~2,9). Así la incertidumbre de método (qué casas
    definen el sesgo cero) y la de calibración entran en una sola distribución."""
    dias = (eleccion - hoy).days
    sims = []
    nombres = tuple(variantes) if variantes is not None else tuple(VARIANTES)
    if not nombres or any(v not in VARIANTES for v in nombres):
        raise ValueError("Variantes desconocidas o lista vacía")
    corr = correccion_industria(errores_23j, fraccion_sesgo) if fraccion_sesgo else {}
    for var in nombres:
        aj = estimar(encuestas, inicio, hoy, var, errores_23j=errores_23j)
        d = dict(desplazamiento or {})
        if var in VARIANTES_CORREGIDAS:
            for k, v in corr.items():
                d[k] = d.get(k, 0.0) + v
        sims.append(simular(aj, dias, n=n_por_variante, industria=industria,
                            semilla=sum(map(ord, var)) + hoy.toordinal(), desplazamiento=d or None,
                            metodo_geo=metodo_geo, rho_bloque=rho_bloque, sd_prov=sd_prov))
    P = sims[0]["partidos"]
    assert all(s["partidos"] == P for s in sims)
    V = np.vstack([s["votos"] for s in sims])
    E = np.vstack([s["escanos"] for s in sims])
    pp = np.mean([s["por_provincia"] for s in sims], axis=0)
    r = resumir(dict(partidos=P, votos=V, escanos=E))
    r["investidura"] = evaluar_investidura(P, E)
    r["provincias"] = [dict(provincia=pr, escanos=sims[0]["escanos_prov"][i],
                            reparto={p: round(float(pp[i, j]), 2) for j, p in enumerate(P) if pp[i, j] >= 0.05})
                       for i, pr in enumerate(sims[0]["provincias"])]
    r["diagnostico_normalizacion"] = {v:s["diagnostico_normalizacion"] for v,s in zip(nombres,sims)}
    r["n"] = int(E.shape[0])
    r["industria"] = industria
    r["dias"] = dias
    r["sin_encuestas"] = sims[0]["sin_encuestas"]
    r["correccion_industria"] = dict(fraccion=fraccion_sesgo, puntos=corr, variantes=list(VARIANTES_CORREGIDAS))
    return r

"""Evaluación de las casas: exactitud frente a resultados y sesgo entre ciclos.

- error_final: última encuesta de cada casa en los `dias` previos a la elección
  frente al resultado oficial. Error firmado = encuesta - resultado (pp).
- sesgo_industria: error medio de todas las casas. Es el error que NINGÚN promedio
  puede corregir por sí solo, porque todas fallan en la misma dirección.
- sesgos_ciclo: sesgo de cada casa respecto al consenso dentro de un ciclo (del
  modelo de tendencia). Comparar ciclos dice si la "cocina" de una casa es estable.
"""
from datetime import timedelta
import numpy as np
from .tendencia import ajustar
from .fuentes import BLOQUE_IZQ


def error_final(encuestas, fecha_eleccion, resultado, partidos, dias=21):
    filas = {}
    for e in sorted(encuestas, key=lambda e: e["campo_fin"]):
        if fecha_eleccion - timedelta(days=dias) <= e["campo_fin"] < fecha_eleccion:
            filas[e["casa"]] = e  # se queda la última
    out = {}
    for c, e in filas.items():
        err = {p: e["voto"][p] - resultado[p] for p in partidos if p in e["voto"]}
        if err:
            out[c] = dict(estudio=e["estudio"], campo_fin=e["campo_fin"], origen=e["origen"],
                          url=e["url"], error=err, mae=float(np.mean(np.abs(list(err.values())))),
                          completa=len(err) == len(partidos))
    return out


def sesgo_industria(errores, partidos):
    out = {}
    for p in partidos:
        v = [r["error"][p] for r in errores.values() if p in r["error"]]
        if v:
            out[p] = (float(np.mean(v)), float(np.std(v, ddof=1)) if len(v) > 1 else None, len(v))
    return out


def error_promedio_simple(errores, partidos):
    """Error del promedio simple de las últimas encuestas (lo que hace un agregador básico)."""
    return {p: float(np.mean([r["error"][p] for r in errores.values() if p in r["error"]]))
            for p in partidos if any(p in r["error"] for r in errores.values())}


def con_bloque(encuestas, ciclo):
    """Añade IZQ (espacio a la izquierda del PSOE) cuando constan sus dos componentes."""
    a, b = BLOQUE_IZQ[ciclo]
    out = []
    for e in encuestas:
        if a in e["voto"] and b in e["voto"]:
            e = dict(e, voto=dict(e["voto"], IZQ=e["voto"][a] + e["voto"][b]))
        out.append(e)
    return out


def sesgos_ciclo(encuestas, partidos, inicio, fin, **kw):
    return {p: r for p in partidos if (r := ajustar(encuestas, p, inicio, fin, **kw))}


def estabilidad(sesgos_a, sesgos_b, partidos, min_encuestas=2):
    """Sesgo de cada casa en dos ciclos y correlación entre ellos, por partido."""
    out = {}
    for p in partidos:
        if p not in sesgos_a or p not in sesgos_b:
            continue
        A, B = sesgos_a[p], sesgos_b[p]
        comunes = [c for c in A["sesgos"] if c in B["sesgos"]
                   and A["n_encuestas"][c] >= min_encuestas and B["n_encuestas"][c] >= 1]
        pares = [(A["sesgos"][c][0], B["sesgos"][c][0]) for c in comunes]
        r = float(np.corrcoef(*zip(*pares))[0, 1]) if len(pares) >= 4 else None
        out[p] = dict(casas={c: (A["sesgos"][c], B["sesgos"][c], A["n_encuestas"][c], B["n_encuestas"][c])
                             for c in comunes}, correlacion=r)
    return out


def ficha_casas(encuestas):
    """Lo que dicen los datos sobre la forma de trabajar de cada casa (no opiniones)."""
    out = {}
    for c in sorted({e["casa"] for e in encuestas}):
        propias = [e for e in encuestas if e["casa"] == c]
        campo = [(e["campo_fin"] - e["campo_ini"]).days + 1 for e in propias if e.get("campo_ini")]
        modos = sorted({e["modo"] for e in propias if e.get("modo")})
        out[c] = dict(encuestas=len(propias),
                      muestra_mediana=int(np.median([e["n"] for e in propias])),
                      dias_campo_mediana=float(np.median(campo)) if campo else None,
                      modos=modos,
                      primera=min(e["campo_fin"] for e in propias),
                      ultima=max(e["campo_fin"] for e in propias),
                      origenes=sorted({e["origen"] for e in propias}))
    return out


def retroprueba_cortes(encuestas, fecha_eleccion, resultado, partidos, cortes=(30, 15, 7, 1),
                       inicio=None, tau=0.15, dias_simple=30):
    """Para cada corte (días antes de la elección), usa solo las encuestas ya publicadas
    ese día y compara con el resultado: promedio simple y modelo (dos variantes).
    Para el modelo también comprueba si el resultado cae dentro del intervalo del 90 %
    del pronóstico (estimación + movimiento hasta la elección + error de industria),
    con las mismas fórmulas que pronostico.simular."""
    from .fuentes import publicada_antes
    out = []
    for d in cortes:
        corte = fecha_eleccion - timedelta(days=d)
        disp = [e for e in encuestas if e["campo_fin"] < fecha_eleccion and publicada_antes(e, corte)]
        ult = {}
        for e in sorted(disp, key=lambda e: e["campo_fin"]):
            if (corte - e["campo_fin"]).days <= dias_simple:
                ult[e["casa"]] = e
        simple = {p: float(np.mean([e["voto"][p] for e in ult.values() if p in e["voto"]])) - resultado[p]
                  for p in partidos if any(p in e["voto"] for e in ult.values())}
        fila = dict(dias=d, corte=corte, casas_recientes=sorted(ult), n_recientes=len(ult),
                    simple=simple, modelos={})
        for var, kw in (("consenso_privadas", {}), ("consenso_todas", {"excluir_ancla": ()})):
            errs, dentro, sds = {}, {}, {}
            for p in partidos:
                r = ajustar(disp, p, inicio or (fecha_eleccion - timedelta(days=200)), corte, tau=tau, **kw)
                if r is None:
                    continue
                m = float(r["media"][-1])
                sd_ind = max(1.5 * np.sqrt(max(m, 0) / 25), 0.3)
                sd = float(np.sqrt(r["sd"][-1] ** 2 + (tau * r["escala"]) ** 2 * d + sd_ind ** 2))
                errs[p] = m - resultado[p]
                sds[p] = sd
                dentro[p] = abs(errs[p]) <= 1.645 * sd
            fila["modelos"][var] = dict(error=errs, sd=sds, dentro=dentro)
        out.append(fila)
    return out

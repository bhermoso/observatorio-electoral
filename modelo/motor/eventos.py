"""Influencia de acontecimientos sobre la intención de voto.

Tres medidas, de menos a más supuestos:
1. Pares por casa: última encuesta de cada instituto antes del suceso frente a la
   primera con campo íntegramente posterior. El sesgo de casa se cancela.
2. Modelo de tendencia con transición libre en la fecha: salto inmediato y cambio
   acumulado a 7 y 14 días (x[E+k] - x[E-1]), con su error típico.
3. Calibración con placebos: la misma medida en fechas sin acontecimiento conocido.
   Un efecto solo se considera distinguible si supera claramente esa distribución nula.

Las encuestas cuyo campo incluye la fecha del suceso se excluyen (mezclan antes y
después). Si no consta el inicio del campo, se excluyen las que terminan en los
`buffer` días siguientes al suceso.
"""
from datetime import timedelta
import numpy as np
from .tendencia import ajustar
from .fuentes import dia_central


def _solapa(e, fecha, buffer):
    if e.get("campo_ini"):
        return e["campo_ini"] < fecha <= e["campo_fin"]
    return fecha <= e["campo_fin"] < fecha + timedelta(days=buffer)


def pares(encuestas, fecha, partidos, buffer=3, max_dias_antes=45):
    det = {}
    for c in sorted({e["casa"] for e in encuestas}):
        propias = sorted((e for e in encuestas if e["casa"] == c and not _solapa(e, fecha, buffer)),
                         key=lambda e: e["campo_fin"])
        antes = [e for e in propias if e["campo_fin"] < fecha
                 and (fecha - e["campo_fin"]).days <= max_dias_antes]
        despues = [e for e in propias if (e.get("campo_ini") or e["campo_fin"]) >= fecha]
        if antes and despues:
            a, d = antes[-1], despues[0]
            det[c] = dict(antes=a["campo_fin"], despues=d["campo_fin"],
                          cambio={p: d["voto"][p] - a["voto"][p] for p in partidos
                                  if p in a["voto"] and p in d["voto"]})
    media = {}
    for p in partidos:
        v = [d["cambio"][p] for d in det.values() if p in d["cambio"]]
        if v:
            media[p] = (float(np.mean(v)), float(np.std(v, ddof=1) / np.sqrt(len(v))) if len(v) > 1 else None, len(v))
    return media, det


def efecto(encuestas, partido, fecha, horizontes=(0, 7, 14), ventana=(120, 60), buffer=3, **kw):
    """Cambio estimado tras `fecha`. Horizonte 0 = salto inmediato."""
    ini, fin = fecha - timedelta(days=ventana[0]), fecha + timedelta(days=ventana[1])
    obs = [e for e in encuestas if not _solapa(e, fecha, buffer)]
    r = ajustar(obs, partido, ini, fin, eventos=[fecha], con_cov=True, **kw)
    if r is None:
        return None
    t0 = (fecha - ini).days
    T = len(r["media"])
    ult = max((dia_central(e) for e in obs if partido in e["voto"] and dia_central(e) <= fin), default=None)
    out = {"encuestas_despues": r["saltos"][fecha]["encuestas_despues"] if fecha in r["saltos"] else 0}
    for k in horizontes:
        t = t0 + k
        if t >= T or ult is None or ini + timedelta(days=t) > ult:
            out[k] = None   # no se extrapola más allá de la última encuesta
            continue
        m, C = r["media"], r["cov"]
        d = m[t] - m[t0 - 1]
        v = C[t, t] + C[t0 - 1, t0 - 1] - 2 * C[t, t0 - 1]
        out[k] = (float(d), float(np.sqrt(max(v, 0))))
    return out


def placebos(encuestas, partido, fechas, horizonte=14, **kw):
    """Distribución nula del cambio a `horizonte` días en fechas sin suceso."""
    vals = []
    for f in fechas:
        r = efecto(encuestas, partido, f, horizontes=(horizonte,), **kw)
        if r and r.get(horizonte):
            vals.append(r[horizonte][0])
    return np.array(vals)

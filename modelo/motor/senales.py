"""Registro de señales y escenarios explícitos.

Las señales (afirmaciones de analistas y encuestadores) no modifican el pronóstico. Para
cada tema con señales se calculan escenarios: el pronóstico principal con un traslado de
voto declarado (por ejemplo, del PSOE al PP). Así se ve qué implicaría cada afirmación si
fuera cierta y qué tamaño tendría que tener el cambio para notarse en las encuestas.
"""
import json
import os
from .fuentes import RAIZ
from . import pronostico as PR

RUTA = os.path.join(RAIZ, "modelo", "senales", "senales.json")
ESCENARIOS_URDA = [
    ("Sin efecto (pronóstico actual)", {}),
    ("PSOE −1 → PP +1", {"PSOE": -1.0, "PP": 1.0}),
    ("PSOE −2 → PP +2", {"PSOE": -2.0, "PP": 2.0}),
    ("PSOE −3 → PP +3", {"PSOE": -3.0, "PP": 3.0}),
    ("PSOE −2 → Vox +1, PP +1", {"PSOE": -2.0, "PP": 1.0, "VOX": 1.0}),
]


def cargar(errores_23j=None):
    d = json.load(open(RUTA, encoding="utf-8"))
    for s in d["senales"]:
        c = s.get("casa_evaluada")
        if errores_23j and c in errores_23j:
            s["historial_23j"] = {p: round(v, 1) for p, v in errores_23j[c]["error"].items()}
    return d


def escenarios(actuales, inicio, hoy, eleccion, errores_23j, umbrales, n_por_variante=600):
    out = []
    for nombre, desp in ESCENARIOS_URDA:
        r = PR.principal(actuales, inicio, hoy, eleccion, errores_23j, n_por_variante=n_por_variante,
                         desplazamiento=desp)
        P = r["partidos"]
        cambio_psoe = abs(desp.get("PSOE", 0.0))
        out.append(dict(nombre=nombre, desplazamiento=desp,
                        escanos={p: P[p]["escanos"] for p in ("PP", "PSOE", "VOX")},
                        p_mayoria=r["bloques"]["PP+VOX"]["p_mayoria"],
                        ppvox=r["bloques"]["PP+VOX"]["mediana"],
                        pp_primero=P["PP"]["primero"],
                        distinguible=(cambio_psoe > umbrales.get("PSOE", 99)) if desp else None))
    return out

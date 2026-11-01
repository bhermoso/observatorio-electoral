"""Nuestra propia cocina a partir de microdatos (respuestas individuales).

Funciona sobre arrays de códigos, sin depender del formato del fichero:
- voto_directo: intención de voto ponderada con el peso del instituto.
- transferencias: matriz recuerdo de voto 2023 × intención actual (de dónde viene cada voto).
- reponderar_por_recuerdo: ajusta los pesos para que el recuerdo de voto de la muestra
  reproduzca el resultado real de 2023 (la corrección más extendida entre institutos).
- estimacion_propia: voto directo con esos pesos, sobre voto decidido.

Los códigos de cada estudio (qué número es cada partido, abstención, no sabe...) se
declaran en modelo/microdatos/estudios.json, tomados del cuestionario del instituto.
"""
import numpy as np


def _shares(cod, w, mapa, validos=None):
    tot = {}
    for c, p in mapa.items():
        tot[p] = tot.get(p, 0.0) + float(w[cod == c].sum())
    base = sum(v for p, v in tot.items() if validos is None or p in validos)
    return {p: 100 * v / base for p, v in tot.items() if base > 0 and (validos is None or p in validos)}


def voto_directo(intencion, pesos, mapa, partidos_validos):
    """% de cada partido sobre el voto decidido (excluye abstención, no sabe, no contesta)."""
    return _shares(np.asarray(intencion), np.asarray(pesos, float), mapa, set(partidos_validos))


def transferencias(recuerdo, intencion, pesos, mapa_rec, mapa_int):
    """Matriz {recuerdo: {intención: % de quienes recuerdan ese voto}}."""
    rec, ints, w = np.asarray(recuerdo), np.asarray(intencion), np.asarray(pesos, float)
    out = {}
    for cr, pr in mapa_rec.items():
        sel = rec == cr
        if w[sel].sum() == 0:
            continue
        fila = out.setdefault(pr, {})
        for ci, pi in mapa_int.items():
            fila[pi] = fila.get(pi, 0.0) + float(w[sel & (ints == ci)].sum())
    for pr, fila in out.items():
        t = sum(fila.values())
        out[pr] = {k: round(100 * v / t, 2) for k, v in fila.items()} if t else fila
    return out


def reponderar_por_recuerdo(recuerdo, pesos, mapa_rec, objetivo, iter_max=50, tol=1e-6):
    """Multiplica los pesos de cada grupo de recuerdo para que su distribución coincida con
    `objetivo` ({partido_2023: %}, sobre quienes declaran recuerdo). Los que no declaran
    recuerdo conservan su peso (no se les impone un voto que no dicen)."""
    rec, w = np.asarray(recuerdo), np.asarray(pesos, float).copy()
    grupos = {p: np.isin(rec, [c for c, q in mapa_rec.items() if q == p]) for p in set(mapa_rec.values())}
    grupos = {p: g for p, g in grupos.items() if p in objetivo and g.any()}
    obj_tot = sum(objetivo[p] for p in grupos)
    for _ in range(iter_max):
        con = sum(w[g].sum() for g in grupos.values())
        cambio = 0.0
        for p, g in grupos.items():
            actual = w[g].sum() / con
            meta = objetivo[p] / obj_tot
            f = meta / actual
            w[g] *= f
            cambio = max(cambio, abs(f - 1))
        if cambio < tol:
            break
    return w


def estimacion_propia(intencion, recuerdo, pesos, mapa_int, mapa_rec, objetivo_recuerdo, partidos_validos):
    w = reponderar_por_recuerdo(recuerdo, pesos, mapa_rec, objetivo_recuerdo)
    return dict(voto_directo=voto_directo(intencion, pesos, mapa_int, partidos_validos),
                reponderado=voto_directo(intencion, w, mapa_int, partidos_validos),
                transferencias=transferencias(recuerdo, intencion, pesos, mapa_rec, mapa_int))

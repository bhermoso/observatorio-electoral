"""Modelo de estado latente por partido, resuelto en forma cerrada (Gauss lineal).

  y_i  = x[t_i] + h[casa_i] + e_i,     e_i ~ N(0, s_muestral_i^2 + s_casa^2)
  x[t] = x[t-1] + w_t,                 w_t ~ N(0, tau^2)     (paseo aleatorio diario)
  h    ~ N(0, s_h^2),  con la media de las casas "ancla" fijada a 0.

Para un acontecimiento en la fecha E, la transición E-1 -> E deja de penalizarse
(salto libre, previa N(0, 10^2)): el salto estimado x[E]-x[E-1] y su error típico
salen de la covarianza posterior. Con pocas encuestas posteriores, el error es
grande y el informe lo dice.

Todo en puntos porcentuales. La matriz es (T + H) x (T + H), con T días:
cabe holgadamente para ciclos de varios años.
"""
from datetime import timedelta
import numpy as np
from .fuentes import dia_central

DEFF = 1.5          # efecto de diseño: el error real de una encuesta supera al de m.a.s.
S_CASA = 1.0        # error no muestral por encuesta (pp), además del sesgo fijo de la casa


def ajustar(encuestas, partido, inicio, fin, tau=0.15, s_h=3.0, anclas=None, excluir_ancla=("CIS",),
            eventos=(), n_max=5000, con_cov=False, prior_sesgos=None,
            ventana_ancla=45):
    """Devuelve dict con fechas, media y sd diaria, sesgos de casa (media, sd) y saltos.

    anclas: casas cuya media de sesgo se fija a 0. Por defecto, todas las presentes
    salvo `excluir_ancla`. Es la definición de "cero": el resultado mide la posición
    respecto al consenso de esas casas, no respecto a la verdad (ver evaluacion.py).
    """
    obs = [e for e in encuestas if partido in e["voto"] and inicio <= dia_central(e) <= fin]
    if not obs:
        return None
    # Las tolerancias escalan con el tamaño del partido: un 2 % no oscila ni se
    # desvía entre casas lo mismo que un 30 %.
    esc = np.sqrt(max(np.mean([e["voto"][partido] for e in obs]), 0.5) / 25)
    tau, s_h, s_casa = tau * esc, s_h * esc, S_CASA * esc
    T = (fin - inicio).days + 1
    casas = sorted({e["casa"] for e in obs})
    H = len(casas)
    ci = {c: T + k for k, c in enumerate(casas)}
    N = T + H
    A = np.zeros((N, N))
    b = np.zeros(N)

    # Casas que publican muchas encuestas seguidas (trackings, paneles diarios) no deben
    # dominar: la varianza se multiplica por el nº de encuestas de la casa en ±7 días.
    dias = np.array([(dia_central(e) - inicio).days for e in obs])
    for k, e in enumerate(obs):
        t = int(np.clip(dias[k], 0, T - 1))
        p = e["voto"][partido] / 100
        n = min(e["n"], n_max) / DEFF
        var = 1e4 * max(p * (1 - p), 0.0005) / n + s_casa ** 2
        vecinas = sum(1 for j, o in enumerate(obs) if o["casa"] == e["casa"] and abs(dias[j] - dias[k]) <= 7)
        var *= vecinas
        h = ci[e["casa"]]
        w = 1 / var
        for i in (t, h):
            b[i] += w * e["voto"][partido]
            for j in (t, h):
                A[i, j] += w
    # Paseo aleatorio (con transiciones libres en los acontecimientos).
    libres = {(ev - inicio).days for ev in eventos if inicio < ev <= fin}
    for t in range(1, T):
        w = 1 / 10.0 ** 2 if t in libres else 1 / tau ** 2
        A[t, t] += w; A[t - 1, t - 1] += w
        A[t, t - 1] -= w; A[t - 1, t] -= w
    # Previa difusa del nivel inicial y previa de los sesgos.
    A[0, 0] += 1 / 20.0 ** 2
    b[0] += np.mean([e["voto"][partido] for e in obs]) / 20.0 ** 2
    # Sin prior_sesgos: sesgos N(0, s_h^2) y ancla dura (consenso de `anclas`).
    # Con prior_sesgos {casa: (media, sd)}: cada casa con historial recibe esa previa
    # (calibración frente a resultados reales) y no se impone ancla de consenso.
    for c in casas:
        m, s = (prior_sesgos or {}).get(c, (0.0, s_h))
        A[ci[c], ci[c]] += 1 / s ** 2
        b[ci[c]] += m / s ** 2
    # Restricción de ancla (penalización fuerte sobre la media de sus sesgos).
    # Ancla por defecto: casas activas en los últimos `ventana_ancla` días (las que
    # desaparecieron meses antes no deben fijar el nivel actual), salvo `excluir_ancla`.
    if anclas is None:
        activas = {e["casa"] for e in obs if (fin - dia_central(e)).days <= ventana_ancla}
        anclas = [c for c in casas if c not in excluir_ancla and c in activas]
    anclas = [c for c in anclas if c in ci] or casas
    if prior_sesgos is None:
        a = np.zeros(N)
        for c in anclas:
            a[ci[c]] = 1 / len(anclas)
        A += 1e6 * np.outer(a, a)
    else:
        anclas = sorted(c for c in casas if c in prior_sesgos)

    cov = np.linalg.inv(A)
    z = cov @ b
    sd = np.sqrt(np.clip(np.diag(cov), 0, None))
    saltos = {}
    for ev in eventos:
        t = (ev - inicio).days
        if 0 < t < T:
            d = z[t] - z[t - 1]
            v = cov[t, t] + cov[t - 1, t - 1] - 2 * cov[t, t - 1]
            antes = sum(1 for e in obs if dia_central(e) < ev)
            despues = sum(1 for e in obs if dia_central(e) >= ev)
            saltos[ev] = dict(salto=float(d), sd=float(np.sqrt(max(v, 0))),
                              encuestas_antes=antes, encuestas_despues=despues)
    return dict(partido=partido, inicio=inicio,
                fechas=[inicio + timedelta(days=t) for t in range(T)],
                media=z[:T], sd=sd[:T],
                sesgos={c: (float(z[ci[c]]), float(sd[ci[c]])) for c in casas},
                n_encuestas={c: sum(1 for e in obs if e["casa"] == c) for c in casas},
                anclas=anclas, saltos=saltos, cov_ultimo=float(cov[T - 1, T - 1]),
                cov=cov[:T, :T] if con_cov else None, escala=float(esc))


def ajustar_todos(encuestas, partidos, inicio, fin, **kw):
    return {p: r for p in partidos if (r := ajustar(encuestas, p, inicio, fin, **kw)) is not None}

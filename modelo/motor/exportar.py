"""Reúne en un único dict todo lo que necesita la página explicativa."""
import json
import os
from datetime import timedelta
import numpy as np
from .fuentes import RAIZ, dia_central
from .tendencia import DEFF, S_CASA
from . import eventos as EV
from . import pronostico as PR

PRINCIPALES = ["PP", "PSOE", "VOX", "SUMAR", "PODEMOS"]


def _r(x, d=2):
    return None if x is None else round(float(x), d)


def _fichas_verificadas():
    return {s["id"]: s for s in json.load(open(os.path.join(RAIZ, "data", "polls.json"), encoding="utf-8"))}


def _fichas_29n():
    out = {}
    for l in open(os.path.join(RAIZ, "modelo", "externos", "29n_encuestadores.jsonl"), encoding="utf-8"):
        r = json.loads(l)
        out.setdefault(r["estudio_id"], r)
    return out


def encuestas(lista, ajustes_ref):
    fv, f29 = _fichas_verificadas(), _fichas_29n()
    out = []
    for e in lista:
        f = {}
        if e["origen"] == "verificada":
            s = fv.get(e["estudio"], {})
            f = dict(titulo=s.get("title"), cliente=s.get("publisher"), publicacion=s.get("published"),
                     universo=s.get("universe"), escenario=s.get("scenario"), denominador=s.get("denominator"),
                     ficha_url=s.get("technical"), microdatos=s.get("microdata"), cuestionario=s.get("questionnaire"),
                     ponderacion=s.get("weight"), notas=s.get("notes"), verificacion=s.get("verification"),
                     verificado=s.get("verified"), cobertura=s.get("coverage"),
                     valores_publicados=s.get("values"), escanos_publicados=s.get("seats"))
        elif e["origen"] == "terceros-29n":
            s = f29.get(e["estudio"], {})
            f = dict(publicacion=s.get("fecha_publicacion"), tipo_fuente=s.get("fuente_tipo"),
                     eleccion=s.get("eleccion"))
        corr = {}
        for p, v in e["voto"].items():
            a = ajustes_ref.get(p)
            if a and e["casa"] in a["sesgos"]:
                corr[p] = _r(v - a["sesgos"][e["casa"]][0])
        out.append(dict(casa=e["casa"], estudio=e["estudio"], campo_ini=e.get("campo_ini"), campo_fin=e["campo_fin"],
                        dia_central=dia_central(e), n=e["n"], modo=e.get("modo"), ambito=e.get("ambito"),
                        origen=e["origen"], url=e["url"], ciclo=e["ciclo"], voto=e["voto"], corregido=corr,
                        publicacion_registro=e.get("publicacion"), nota_registro=e.get("nota"), **f))
    return out


def tendencias(ajustes):
    out = {}
    for var, aj in ajustes.items():
        out[var] = {p: dict(media=[_r(x) for x in aj[p]["media"]], sd=[_r(x) for x in aj[p]["sd"]],
                            sesgos={c: [_r(m), _r(s), aj[p]["n_encuestas"][c]] for c, (m, s) in aj[p]["sesgos"].items()},
                            anclas=aj[p]["anclas"], escala=_r(aj[p]["escala"], 3))
                    for p in aj}
    return out


def incertidumbre(ajustes, dias, tau=0.15):
    out = {}
    for var, aj in ajustes.items():
        out[var] = {}
        for p, a in aj.items():
            mu = float(a["media"][-1])
            hoy = float(a["sd"][-1])
            deriva = tau * a["escala"] * np.sqrt(dias)
            ind = max(1.5 * np.sqrt(max(mu, 0) / 25), 0.3)
            out[var][p] = dict(media=_r(mu), hoy=_r(hoy), deriva=_r(deriva), industria=_r(ind),
                               total=_r(np.sqrt(hoy ** 2 + deriva ** 2 + ind ** 2)))
    return out


def histogramas(sims):
    out = {}
    for var, s in sims.items():
        E, P = s["escanos"], s["partidos"]
        h = {}
        for p in ("PP", "PSOE", "VOX"):
            v = E[:, P.index(p)]
            h[p] = np.bincount(v, minlength=v.max() + 1).tolist()
        pv = E[:, P.index("PP")] + E[:, P.index("VOX")]
        h["PP+VOX"] = np.bincount(pv, minlength=pv.max() + 1).tolist()
        out[var] = dict(n=int(E.shape[0]), hist=h)
    return out


def ejemplo_pesos(lista, partido, hoy, ajuste, dias=30):
    """Para explicar el cálculo: encuestas recientes de un partido con su varianza,
    peso relativo, sesgo estimado y valor corregido (variante de referencia)."""
    esc = ajuste["escala"]
    filas = []
    for e in lista:
        if partido not in e["voto"] or (hoy - e["campo_fin"]).days > dias or e["campo_fin"] > hoy:
            continue
        p = e["voto"][partido] / 100
        n = min(e["n"], 5000) / DEFF
        muestral = 1e4 * p * (1 - p) / n
        var = muestral + (S_CASA * esc) ** 2
        vecinas = sum(1 for o in lista if o["casa"] == e["casa"] and partido in o["voto"]
                      and abs((dia_central(o) - dia_central(e)).days) <= 7)
        var *= vecinas
        s = ajuste["sesgos"].get(e["casa"], (0, 0))[0]
        filas.append(dict(casa=e["casa"], campo_fin=e["campo_fin"], n=e["n"], valor=e["voto"][partido],
                          sd_muestral=_r(np.sqrt(muestral)), sd_total=_r(np.sqrt(var)), vecinas=vecinas,
                          sesgo=_r(s), corregido=_r(e["voto"][partido] - s), w=1 / var))
    tot = sum(f["w"] for f in filas)
    for f in filas:
        f["peso"] = _r(100 * f.pop("w") / tot, 1)
    return sorted(filas, key=lambda f: f["campo_fin"])


def serie_evento(prev_all, fecha, partidos=("PP", "PSOE", "VOX")):
    ini, fin = fecha - timedelta(days=120), fecha + timedelta(days=60)
    out = dict(fecha=fecha, inicio=ini, encuestas=[], tendencia={})
    for e in prev_all:
        if ini <= e["campo_fin"] <= fin:
            out["encuestas"].append(dict(casa=e["casa"], f=e["campo_fin"], v={p: e["voto"].get(p) for p in partidos}))
    from .tendencia import ajustar
    obs = [e for e in prev_all if not EV._solapa(e, fecha, 3)]
    for p in partidos:
        r = ajustar(obs, p, ini, fin, eventos=[fecha])
        out["tendencia"][p] = dict(media=[_r(x) for x in r["media"]], sd=[_r(x) for x in r["sd"]])
    return out


def ejemplo_dhondt(provincia="Toledo"):
    import csv
    filas, esc = [], None
    for r in csv.DictReader(open(os.path.join(RAIZ, "data", "results.csv"), encoding="utf-8-sig")):
        if r["election"] == "2023-07-23" and r["district"] == provincia:
            filas.append((r["party"].rstrip(".").rsplit("(", 1)[1].rstrip(")"), int(r["votes"])))
    for r in csv.DictReader(open(os.path.join(RAIZ, "data", "districts.csv"), encoding="utf-8-sig")):
        if r["election"] == "2023-07-23" and r["district"] == provincia:
            esc = int(r["seats"])
    filas.sort(key=lambda f: -f[1])
    return dict(provincia=provincia, esc=esc, p=[[c, v] for c, v in filas[:4]])


def geografia(principal):
    """Datos para explicar el reparto: cuotas de 2023 por provincia (ya en partidos
    actuales), voto nacional 2023 y 2026, y cuota provincial proyectada con el voto
    nacional central del pronóstico."""
    from .escanos import Base
    P = [p for p in PR.PARTIDOS if p in principal["partidos"]]
    mu = {p: principal["partidos"][p]["voto"][0] for p in P}
    rep = {"SUMAR": 1.0}
    if "SUMAR" in mu and "PODEMOS" in mu:
        rep = {"SUMAR": mu["SUMAR"] / (mu["SUMAR"] + mu["PODEMOS"]), "PODEMOS": mu["PODEMOS"] / (mu["SUMAR"] + mu["PODEMOS"])}
    base = Base(P + ["OTROS"], rep)
    nac26 = np.array([mu[p] for p in P])
    otros = max(100 - PR.BLANCO - nac26.sum(), 0.5)
    tot = nac26.sum() + otros
    nac26 = np.append(nac26, otros) * (100 - PR.BLANCO) / tot / 100
    proy = base.proyectar(nac26)
    return dict(partidos=base.partidos, reparto_sumar=rep,
                nacional23=[_r(100 * x) for x in base.nacional], nacional26=[_r(100 * x) for x in nac26],
                provincias=[dict(nombre=base.provincias[i], escanos=int(base.escanos[i]),
                                 validos=int(base.validos[i]), blanco=_r(100 * base.blancos[i] / base.validos[i], 3),
                                 cuota23=[_r(100 * x, 3) for x in base.cuota[i]],
                                 cuota26=[_r(100 * x, 3) for x in proy[i]])
                            for i in range(len(base.provincias))])


def recetario():
    r = os.path.join(RAIZ, "modelo", "recetario", "recetas.json")
    m = os.path.join(RAIZ, "modelo", "microdatos", "estudios.json")
    out = json.load(open(r, encoding="utf-8")) if os.path.exists(r) else None
    if out is not None and os.path.exists(m):
        est = json.load(open(m, encoding="utf-8"))
        out["microdatos"] = [dict(estudio=k, estado=v["estado"], pagina=v.get("pagina_microdatos"))
                             for k, v in est.items() if not k.startswith("_")]
    return out


def datos(enc, actuales, inicio, hoy, dias, ajustes, sims, resumen, simple, casas_simple, err, ind, simple23,
          bt, res23, est, ses_prev, umbrales, prev_all, casado, urda, eleccion, contraste=(), sensibilidad=(), retro_cortes=(), sens_industria=(), industria_23j=None,
          principal=None, historial=(), senales=None, escenarios_urda=(), geo_sens=None, otros_agregadores=()):
    ref = ajustes["consenso_privadas"]
    finales23 = [e for e in enc if e["ciclo"] == "2019-23" and e["campo_fin"] >= eleccion.replace(year=2023, month=5, day=1)
                 and e["origen"] != "terceros-wikipedia"]
    m_c, det_c = EV.pares(prev_all, casado, ["PP", "PSOE", "VOX"])
    efectos_c = {p: EV.efecto(prev_all, p, casado) for p in ("PP", "PSOE", "VOX")}
    return dict(
        corte=hoy, eleccion=eleccion, dias=dias, inicio_ciclo=inicio, urda=urda,
        conteo={o: sum(1 for e in enc if e["origen"] == o) for o in {e["origen"] for e in enc}},
        variantes=PR.VARIANTES,
        encuestas=encuestas(actuales, ref),
        industria_principal=PR.INDUSTRIA_PRINCIPAL, finales_23j=encuestas(finales23, {}),
        tendencias=tendencias(ajustes), incertidumbre=incertidumbre(ajustes, dias),
        resumen=resumen, histogramas=histogramas(sims), promedio_simple=simple, casas_simple=casas_simple,
        ejemplo_pp=ejemplo_pesos(actuales, "PP", hoy, ref["PP"]),
        resultado_23j={p: _r(v) for p, v in res23.items()},
        error_23j={c: dict(r, error={p: _r(v) for p, v in r["error"].items()}, mae=_r(r["mae"])) for c, r in err.items()},
        industria_23j={p: [_r(m), _r(s), n] for p, (m, s, n) in ind.items()},
        simple_23j={p: _r(v) for p, v in simple23.items()},
        retroprueba_23j={v: {p: _r(x) for p, x in d.items()} for v, d in bt.items()},
        estabilidad={p: dict(correlacion=_r(d["correlacion"]),
                             casas={c: [_r(a[0]), _r(b[0]), na, nb] for c, (a, b, na, nb) in d["casas"].items()})
                     for p, d in est.items()},
        umbrales={p: _r(u) for p, u in umbrales.items()},
        dhondt_ejemplo=ejemplo_dhondt(),
        contraste=list(contraste),
        sensibilidad=list(sensibilidad), rho_bloque=PR.RHO_BLOQUE,
        retro_cortes=list(retro_cortes), principal=principal, historial=list(historial),
        geografia=geografia(principal) if principal else None,
        recetario=recetario(), senales=senales, escenarios_urda=list(escenarios_urda),
        geo_sens=geo_sens, otros_agregadores=list(otros_agregadores), sens_industria=list(sens_industria), industria_cubre_23j=industria_23j,
        casado=dict(serie=serie_evento(prev_all, casado),
                    pares={p: [_r(m), _r(s), n] for p, (m, s, n) in m_c.items()},
                    efectos={p: {str(k): ([_r(v[0]), _r(v[1])] if v else None) for k, v in r.items()
                                 if k != "encuestas_despues"} for p, r in efectos_c.items()}),
    )

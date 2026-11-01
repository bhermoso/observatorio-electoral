"""Ejecuta el motor completo y escribe modelo/salida/informe.md y pronostico.json.

    python3 -m modelo [--hoy AAAA-MM-DD] [--n 4000]
"""
import argparse
import json
import os
from datetime import date, timedelta
import numpy as np
from .motor import fuentes as F, evaluacion as V, eventos as EV, pronostico as PR, registro as RG, senales as SG
from .motor.tendencia import ajustar

ELECCION = date(2026, 11, 29)
URDA = date(2026, 10, 28)
E23 = date(2023, 7, 23)
CASADO = date(2022, 2, 17)
P4 = ["PP", "PSOE", "VOX", "SUMAR"]
SALIDA = os.path.join(os.path.dirname(os.path.abspath(__file__)), "salida")


def f1(x, signo=False):
    return "—" if x is None else (f"{x:+.1f}" if signo else f"{x:.1f}")


def tabla(cab, filas):
    out = ["| " + " | ".join(cab) + " |", "|" + "---|" * len(cab)]
    out += ["| " + " | ".join(str(c) for c in f) + " |" for f in filas]
    return "\n".join(out)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--hoy", type=date.fromisoformat, default=date.today())
    ap.add_argument("--n", type=int, default=4000)
    ap.add_argument("--n-hist", type=int, default=500, help="simulaciones por variante y día en el historial")
    ap.add_argument("--desde", type=date.fromisoformat, default=date(2026, 10, 1), help="inicio del historial")
    a = ap.parse_args()
    hoy = a.hoy
    enc = [e for e in F.todas() if e["campo_fin"] <= hoy and F.publicada_antes(e, hoy)]
    res23 = F.resultado_23j()
    L = []
    w = L.append
    origenes = {}
    for e in enc:
        origenes[e["origen"]] = origenes.get(e["origen"], 0) + 1
    w(f"# Motor de pronóstico 29N — corte {hoy.isoformat()}\n")
    w(f"Encuestas cargadas: {len(enc)} ({', '.join(f'{k}: {v}' for k, v in sorted(origenes.items()))}). "
      "`verificada` = registro primario del observatorio; `terceros-*` = ver `modelo/externos/PROCEDENCIA.md`.\n")

    # ---------- Evaluación 23J ----------
    err = V.error_final(enc, E23, res23, P4)
    ind = V.sesgo_industria(err, P4)
    simple23 = V.error_promedio_simple(err, P4)
    e23 = [e for e in enc if e["campo_fin"] < E23]
    bt = {}
    for var, kw in (("consenso_privadas", {}), ("consenso_todas", {"excluir_ancla": ()})):
        bt[var] = {}
        for p in P4:
            r = ajustar(e23, p, date(2023, 1, 1), E23 - timedelta(days=1), **kw)
            if r:
                bt[var][p] = r["media"][-1] - res23[p]
    mae = lambda d: float(np.mean([abs(v) for v in d.values()]))

    # ---------- Pronóstico ----------
    actuales = [e for e in enc if e["ciclo"] == "2023-26"]
    inicio = min(F.dia_central(e) for e in actuales) - timedelta(days=7)
    dias = (ELECCION - hoy).days
    resumen = {}
    ajustes = {}
    sims = {}
    for var in PR.VARIANTES:
        aj = PR.estimar(actuales, inicio, hoy, var, errores_23j=err)
        ajustes[var] = aj
        sims[var] = PR.simular(aj, dias, n=a.n)
        resumen[var] = PR.resumir(sims[var])
    simple, casas_simple = PR.promedio_simple(actuales, hoy)

    # ---------- Pronóstico principal, evolución y provincias ----------
    princ = PR.principal(actuales, inicio, hoy, ELECCION, err, n_por_variante=max(a.n // 2, 500))
    hist = RG.historial(actuales, inicio, a.desde, hoy, ELECCION, err, n_por_variante=a.n_hist)
    n_reg = RG.escribir_encuestas([e for e in enc if e["ciclo"] == "2023-26" or
                                   (e["origen"] != "terceros-wikipedia" and e["campo_fin"] >= date(2023, 5, 1))])
    w("## 0. Pronóstico principal\n")
    w(f"Une a partes iguales las tres variantes de la sección 1, con un error de industria de "
      f"{PR.INDUSTRIA_PRINCIPAL} pp para un partido del 25 % (intermedio entre el supuesto inicial y el que habría "
      f"cubierto 2023). {princ['n']} simulaciones. Intervalo del 90 %.\n")
    filas = [[p, f"{r['voto'][0]:.1f} ({r['voto'][1]:.1f}–{r['voto'][2]:.1f})",
              f"**{r['escanos'][0]:.0f}** ({r['escanos'][1]:.0f}–{r['escanos'][2]:.0f})"]
             for p, r in sorted(princ["partidos"].items(), key=lambda x: -x[1]["escanos"][0])]
    w(tabla(["Partido", "Voto %", "Escaños"], filas))
    w("")
    w(tabla(["Bloque", "Escaños", "P(≥176)"],
            [[b, f"{v['mediana']:.0f} ({v['p5']:.0f}–{v['p95']:.0f})", f"{v['p_mayoria']:.0%}"]
             for b, v in princ["bloques"].items()] +
            [["PP primera fuerza", "", f"{princ['partidos']['PP']['primero']:.0%}"]]))
    w(f"\n### Evolución (pronóstico de cada día con las encuestas publicadas hasta ese día)\n")
    filas = []
    for h in hist:
        filas.append([h["fecha"], h["n_encuestas"],
                      " · ".join(f"{p} {h['escanos'][p][0]:.0f}" for p in ("PP", "PSOE", "VOX") if p in h["escanos"]),
                      f"{h['bloques']['PP+VOX']['p_mayoria']:.0%}", f"{h['primero'].get('PP', 0):.0%}",
                      ", ".join(h.get("nuevas", [])) or ""])
    w(tabla(["Día", "Encuestas", "Escaños (mediana)", "P(PP+Vox ≥ 176)", "P(PP 1º)", "Encuestas nuevas ese día"], filas))
    w(f"\n### Escaños por provincia (media de las simulaciones)\n")
    w(tabla(["Provincia", "Escaños", "Reparto medio"],
            [[pr["provincia"], pr["escanos"], " · ".join(f"{p} {v:.1f}" for p, v in
                                                       sorted(pr["reparto"].items(), key=lambda x: -x[1]))]
             for pr in princ["provincias"]]))
    w(f"\nRegistro de encuestas consultadas: `modelo/registro/encuestas.csv` ({n_reg} filas). "
      "Evolución: `modelo/registro/historial.json`.\n")

    # ---------- Sensibilidad geográfica y otros agregadores ----------
    princ_u = PR.principal(actuales, inicio, hoy, ELECCION, err, n_por_variante=max(a.n // 4, 400), metodo_geo="uniforme")
    geo_sens = dict(proporcional={p: v["escanos"] for p, v in princ["partidos"].items()},
                    uniforme={p: v["escanos"] for p, v in princ_u["partidos"].items()},
                    p_mayoria={"proporcional": princ["bloques"]["PP+VOX"]["p_mayoria"],
                               "uniforme": princ_u["bloques"]["PP+VOX"]["p_mayoria"]},
                    provincias=[])
    for a_, b_ in zip(princ["provincias"], princ_u["provincias"]):
        dif = {p: round(b_["reparto"].get(p, 0) - a_["reparto"].get(p, 0), 2) for p in set(a_["reparto"]) | set(b_["reparto"])}
        mayor = max(dif.items(), key=lambda x: abs(x[1])) if dif else (None, 0)
        if abs(mayor[1]) >= 0.3:
            geo_sens["provincias"].append(dict(provincia=a_["provincia"], escanos=a_["escanos"],
                                               proporcional=a_["reparto"], uniforme=b_["reparto"], diferencia=dif))
    w("### Sensibilidad al uso del mapa de 2023\n")
    w("Escaños medianos con el traslado proporcional (el del pronóstico: cada partido pierde o gana en proporción a "
      "su fuerza en cada provincia) frente al uniforme (los mismos puntos en todas las provincias donde se presentó).\n")
    w(tabla(["Partido", "Proporcional", "Uniforme", "Diferencia"],
            [[p, f"{geo_sens['proporcional'][p][0]:.0f}", f"{geo_sens['uniforme'][p][0]:.0f}",
              f"{geo_sens['uniforme'][p][0] - geo_sens['proporcional'][p][0]:+.0f}"]
             for p in ("PP", "PSOE", "VOX", "SUMAR", "PODEMOS", "ERC", "JUNTS", "BILDU", "PNV") if p in geo_sens["uniforme"]]))
    w(f"\nP(PP+Vox ≥ 176): proporcional {geo_sens['p_mayoria']['proporcional']:.0%}, uniforme {geo_sens['p_mayoria']['uniforme']:.0%}. "
      f"Circunscripciones donde el método mueve al menos 0,3 escaños medios: {len(geo_sens['provincias'])}.\n")
    otros = []
    por_fecha = {h["fecha"]: h for h in hist}
    for ag in F.otros_agregadores():
        h = por_fecha.get(str(ag["fecha"])) or (hist[-1] if hist else None)
        otros.append(dict(ag, motor=dict(fecha=h["fecha"], voto={p: h["voto"][p][0] for p in h["voto"]},
                                          escanos={p: h["escanos"][p][0] for p in ("PP", "PSOE", "VOX")}) if h else None))
    if otros:
        w("### Otros agregadores (contraste; no entran en el pronóstico)\n")
        w(tabla(["Agregador", "Fecha", "PP", "PSOE", "Vox", "Motor ese día (PP · PSOE · Vox)"],
                [[o["nombre"], f"{o['fecha']} ({o['fecha_tipo']})"] +
                 [f1(o["voto"].get(p)) + (f" · {o['escanos'][p]}" if p in o["escanos"] else "") for p in ("PP", "PSOE", "VOX")] +
                 [" · ".join(f"{o['motor']['voto'][p]:.1f} ({o['motor']['escanos'][p]:.0f})" for p in ("PP", "PSOE", "VOX")) if o["motor"] else "—"]
                 for o in otros]))
        w("")

    w("## 1. Variantes del pronóstico\n")
    w(f"Faltan {dias} días. Mediana e intervalo del 90 % de {a.n} simulaciones por variante. "
      "La diferencia entre variantes es la incertidumbre de método: depende de qué casas se toman como referencia.\n")
    filas = []
    for p in PR.PARTIDOS:
        fila = [p, f1(simple.get(p))]
        for var in PR.VARIANTES:
            r = resumen[var]["partidos"].get(p)
            fila.append("—" if r is None else
                        f"{r['voto'][0]:.1f} ({r['voto'][1]:.1f}–{r['voto'][2]:.1f}) · "
                        f"**{r['escanos'][0]:.0f}** ({r['escanos'][1]:.0f}–{r['escanos'][2]:.0f})")
        filas.append(fila)
    w(tabla(["Partido", "Promedio simple %"] + [f"{v}: voto % · escaños" for v in PR.VARIANTES], filas))
    w("")
    filas = []
    for b in PR.BLOQUES:
        filas.append([b] + [f"{resumen[v]['bloques'][b]['mediana']:.0f} "
                            f"({resumen[v]['bloques'][b]['p5']:.0f}–{resumen[v]['bloques'][b]['p95']:.0f}) · "
                            f"P(≥176) {resumen[v]['bloques'][b]['p_mayoria']:.0%}" for v in PR.VARIANTES])
    filas.append(["PP primera fuerza"] + [f"{resumen[v]['partidos']['PP']['primero']:.0%}" for v in PR.VARIANTES])
    w(tabla(["Bloque"] + list(PR.VARIANTES), filas))
    w("\nVariantes:\n" + "\n".join(f"- `{k}`: {v}" for k, v in PR.VARIANTES.items()))
    w(f"- Promedio simple: última encuesta de cada casa en 30 días, mismo peso ({', '.join(casas_simple)}).\n")

    # ---------- Evaluación ----------
    # ---------- Sensibilidad a la correlación del error de industria ----------
    sens = []
    for rho in (0.0, PR.RHO_BLOQUE, 0.8):
        sm = PR.simular(ajustes["consenso_privadas"], dias, n=min(a.n, 2500), rho_bloque=rho)
        P_, E_, V_ = sm["partidos"], sm["escanos"], sm["votos"]
        pv = E_[:, P_.index("PP")] + E_[:, P_.index("VOX")]
        dif = V_[:, P_.index("PP")] - V_[:, P_.index("PSOE")]
        sens.append(dict(rho=rho, p_mayoria=float(np.mean(pv >= 176)),
                         pp_primero=float(np.mean(E_.argmax(1) == P_.index("PP"))),
                         ppvox=(float(np.median(pv)), float(np.percentile(pv, 5)), float(np.percentile(pv, 95))),
                         dif=(float(np.median(dif)), float(np.percentile(dif, 5)), float(np.percentile(dif, 95)))))
    w("### Sensibilidad: error común entre bloques\n")
    w("Fracción de la varianza del error de industria que desplaza voto entre bloques (PP, Vox, UPN frente a "
      "PSOE, Sumar, Podemos). No se puede estimar con una sola elección evaluada; "
      f"el pronóstico usa {PR.RHO_BLOQUE}. Variante `consenso_privadas`.\n")
    w(tabla(["Correlación entre bloques", "PP − PSOE (pp, 90 %)", "PP + Vox escaños (90 %)", "P(PP+Vox ≥ 176)", "P(PP primero)"],
            [[f"{x['rho']:.1f}" + (" (pronóstico)" if x['rho'] == PR.RHO_BLOQUE else ""),
              f"{x['dif'][0]:+.1f} ({x['dif'][1]:+.1f} a {x['dif'][2]:+.1f})",
              f"{x['ppvox'][0]:.0f} ({x['ppvox'][1]:.0f}–{x['ppvox'][2]:.0f})",
              f"{x['p_mayoria']:.0%}", f"{x['pp_primero']:.0%}"] for x in sens]))
    w("")

    w("## 2. Evaluación de las encuestas frente al 23J\n")
    w("Última encuesta de cada casa en las 3 semanas previas. Error = encuesta − resultado (pp). "
      f"Resultado oficial: {', '.join(f'{p} {res23[p]:.2f}' for p in P4)}.\n")
    filas = [[c, r["campo_fin"], r["origen"]] + [f1(r["error"].get(p), True) for p in P4] +
             [f"{r['mae']:.2f}" + ("" if r["completa"] else " (incompleta)")]
             for c, r in sorted(err.items(), key=lambda x: (not x[1]["completa"], x[1]["mae"]))]
    w(tabla(["Casa", "Fin campo", "Origen"] + P4 + ["MAE"], filas))
    w("\n**Error de industria** (media de casas; lo que ningún promedio corrige): " +
      ", ".join(f"{p} {m:+.1f} (sd entre casas {f1(s)}, n={n})" for p, (m, s, n) in ind.items()) + ".\n")
    w("**Retroprueba en el 23J** (datos hasta el 22-jul-2023; error en pp):\n")
    filas = [["Promedio simple de las últimas"] + [f1(simple23.get(p), True) for p in P4] + [f"{mae(simple23):.2f}"]]
    for var, d in bt.items():
        filas.append([f"Modelo `{var}`"] + [f1(d.get(p), True) for p in P4] + [f"{mae(d):.2f}"])
    w(tabla(["Método"] + P4 + ["MAE"], filas))
    rp = V.retroprueba_cortes(enc, E23, res23, P4, inicio=date(2023, 1, 1))
    w("\n**Retroprueba por cortes** (encuestas ya publicadas en cada fecha; error en pp; "
      "«fuera» = el resultado quedó fuera del intervalo del 90 % del pronóstico del modelo):\n")
    filas = []
    for f in rp:
        m = f["modelos"]["consenso_privadas"]
        filas.append([f"{f['dias']} día{'' if f['dias'] == 1 else 's'} ({f['corte'].isoformat()})", f["n_recientes"],
                      " ".join(f"{p} {f1(f['simple'].get(p), True)}" for p in P4),
                      " ".join(f"{p} {f1(m['error'].get(p), True)}{'' if m['dentro'].get(p, True) else ' (fuera)'}" for p in P4),
                      f"{sum(m['dentro'].values())}/{len(m['dentro'])}"])
    w(tabla(["Corte", "Casas con encuesta reciente", "Promedio simple", "Modelo consenso privadas",
             "Dentro del intervalo"], filas))
    dentro = sum(sum(f["modelos"]["consenso_privadas"]["dentro"].values()) for f in rp)
    total = sum(len(f["modelos"]["consenso_privadas"]["dentro"]) for f in rp)
    w(f"\nCobertura del intervalo del 90 %: {dentro} de {total} casos. El PSOE quedó fuera en todos los cortes: "
      "las encuestas lo infravaloraron más de lo que el modelo considera posible. Con una sola elección no se puede "
      "saber si fue excepcional o si el error de industria supuesto (1,5 pp para un partido del 25 %) es demasiado bajo.\n")
    b23, caso23 = V.industria_que_cubre(rp)
    sens_ind = []
    for b in (1.5, round((1.5 + b23) / 2, 2), round(b23, 2)):
        for var in PR.VARIANTES:
            sm = PR.simular(ajustes[var], dias, n=min(a.n, 2000), industria=b)
            P_, E_ = sm["partidos"], sm["escanos"]
            pv = E_[:, P_.index("PP")] + E_[:, P_.index("VOX")]
            sens_ind.append(dict(industria=b, variante=var, p_mayoria=float(np.mean(pv >= 176)),
                                 pp_primero=float(np.mean(E_.argmax(1) == P_.index("PP"))),
                                 ppvox=(float(np.median(pv)), float(np.percentile(pv, 5)), float(np.percentile(pv, 95)))))
    w(f"\n**Sensibilidad al tamaño del error de industria.** Para que el intervalo del 90 % hubiera contenido los 16 casos "
      f"de la retroprueba, el error de industria tendría que haber sido de {b23:.1f} pp para un partido del 25 % "
      f"(lo determina {caso23[1]} a {caso23[0]} días, error {caso23[2]:+.1f}); el pronóstico usa 1,5.\n")
    filas = []
    for b in sorted({x["industria"] for x in sens_ind}):
        fila = [f"{b:.2f}" + (" (pronóstico)" if b == 1.5 else " (cubre 2023)" if b == round(b23, 2) else "")]
        for var in PR.VARIANTES:
            x = next(y for y in sens_ind if y["industria"] == b and y["variante"] == var)
            fila.append(f"{x['ppvox'][0]:.0f} ({x['ppvox'][1]:.0f}–{x['ppvox'][2]:.0f}) · P(≥176) {x['p_mayoria']:.0%} · PP 1º {x['pp_primero']:.0%}")
        filas.append(fila)
    w(tabla(["Error de industria (pp al 25 %)"] + list(PR.VARIANTES), filas))
    w("")
    w("\nLa variante calibrada no se puede retroprobar en el 23J (usaría el propio resultado). "
      "Con una sola elección evaluada, ninguna diferencia entre métodos es concluyente.\n")

    # ---------- Cocinas ----------
    w("## 3. Cocinas: cómo trabaja y hacia dónde se desvía cada casa\n")
    ficha = V.ficha_casas([e for e in enc if e["ciclo"] == "2023-26" or e["campo_fin"] >= date(2023, 1, 1)])
    cur = {p: ajustes["consenso_privadas"][p] for p in ("PP", "PSOE", "VOX")}
    act_izq = V.con_bloque(actuales, "2023-26")
    r_izq = ajustar(act_izq, "IZQ", inicio, hoy)
    if r_izq:
        cur["IZQ"] = r_izq
    filas = []
    for c, f in ficha.items():
        if not any(c in cur[p]["sesgos"] for p in cur):
            continue
        s = [f"{cur[p]['sesgos'][c][0]:+.1f}±{cur[p]['sesgos'][c][1]:.1f}" if c in cur[p]["sesgos"] else "—"
             for p in ("PP", "PSOE", "VOX", "IZQ") if p in cur]
        e23c = err.get(c, {}).get("error", {})
        filas.append([c, ", ".join(f["modos"]) or "—", f["muestra_mediana"], f1(f["dias_campo_mediana"]),
                      cur["PP"]["n_encuestas"].get(c, 0)] + s +
                     [" ".join(f"{p}{v:+.1f}" for p, v in e23c.items() if p in ("PP", "PSOE", "VOX")) or "—"])
    w("Sesgo actual = desviación respecto al consenso de las privadas en el ciclo 2023-26 (pp, ± error típico). "
      "IZQ = Sumar + Podemos, solo cuando la casa publica ambos.\n")
    w(tabla(["Casa", "Modo", "Muestra", "Días campo", "Encuestas", "PP", "PSOE", "Vox", "IZQ", "Error 23J"], filas))

    prev = V.con_bloque([e for e in enc if e["ciclo"] == "2019-23" and e["campo_fin"] <= date(2023, 1, 31)], "2019-23")
    ses_prev = V.sesgos_ciclo(prev, ["PP", "PSOE", "VOX", "IZQ"], date(2019, 11, 11), date(2023, 1, 31))
    ses_act = dict(cur)
    est = V.estabilidad(ses_prev, ses_act, ["PP", "PSOE", "VOX", "IZQ"])
    w("\n**Comparabilidad entre ciclos**: sesgo de cada casa en 2019-23 (nov-2019 a ene-2023, tablas de Wikipedia) "
      "frente a 2023-26. IZQ 2019-23 = UP + Más País.\n")
    casas = sorted({c for p in est for c in est[p]["casas"]})
    filas = []
    for c in casas:
        fila = [c]
        for p in ("PP", "PSOE", "VOX", "IZQ"):
            x = est.get(p, {}).get("casas", {}).get(c)
            fila.append("—" if x is None else f"{x[0][0]:+.1f} → {x[1][0]:+.1f}")
        filas.append(fila)
    filas.append(["**Correlación**"] + [f1(est[p]["correlacion"]) if p in est else "—" for p in ("PP", "PSOE", "VOX", "IZQ")])
    w(tabla(["Casa", "PP", "PSOE", "Vox", "IZQ"], filas))
    w("\nUna correlación alta indica que la casa conserva su forma de cocinar entre ciclos; baja, que su sesgo "
      "pasado no sirve para corregir el actual. Con pocas casas comunes, el coeficiente es orientativo.\n")

    # ---------- Eventos ----------
    w("## 4. Acontecimientos: accidente de Urda (28-oct-2026)\n")
    media, det = EV.pares(actuales, URDA, P4)
    nuevas = [e for e in actuales if (e.get("campo_ini") or e["campo_fin"]) >= URDA]
    w(f"Encuestas con campo íntegramente posterior al 28-oct: **{len(nuevas)}**. "
      f"Pares antes/después por casa: **{len(det)}**.\n")
    if det:
        w(tabla(["Casa", "Antes", "Después"] + P4,
                [[c, d["antes"], d["despues"]] + [f1(d["cambio"].get(p), True) for p in P4] for c, d in det.items()]))
        for p in P4:
            r = EV.efecto(actuales, p, URDA, horizontes=(0, 7))
            if r and r.get(0):
                w(f"- Modelo {p}: salto {r[0][0]:+.1f} ± {r[0][1]:.1f}")
    else:
        w("Todavía no se puede medir: ninguna encuesta del sistema tiene entrevistas posteriores al suceso. "
          "El pronóstico de la sección 1 no incorpora ningún efecto de Urda.\n")
    w("**Umbral de detección** (calibrado con placebos en el ciclo 2019-23: cambio a 14 días en fechas sin suceso "
      "elegido, cada 14 días; percentil 95 del valor absoluto):\n")
    fechas = [date(2020, 6, 1) + timedelta(days=14 * i) for i in range(60)]
    fechas = [f for f in fechas if abs((f - CASADO).days) > 75 and f < date(2022, 11, 1)]
    prev_all = [e for e in enc if e["ciclo"] == "2019-23"]
    umbrales = {}
    for p in ("PP", "PSOE", "VOX"):
        v = EV.placebos(prev_all, p, fechas)
        umbrales[p] = float(np.percentile(np.abs(v), 95))
    w(", ".join(f"{p} ±{u:.1f} pp" for p, u in umbrales.items()) +
      ". Un efecto de Urda menor que esto no se distinguirá del ruido aunque exista.\n")
    reg_senales = SG.cargar(err)
    esc_urda = SG.escenarios(actuales, inicio, hoy, ELECCION, err, umbrales, n_por_variante=max(a.n // 5, 300))
    w("### Señales sobre Urda (no entran en el pronóstico)\n")
    for sn in [x for x in reg_senales["senales"] if x["tema"] == "Urda"]:
        h23 = sn.get("historial_23j")
        w(f"- **{sn['fecha']} · {sn['autor']}** ({sn['plataforma']}): {sn['afirmacion']} "
          f"Aporta datos: {'sí' if sn['aporta_datos'] else 'no'}. Falta: {sn['que_falta']}"
          + (f" Error de su casa en el 23J: " + ", ".join(f"{p} {v:+.1f}" for p, v in h23.items()) + "." if h23 else ""))
    w("\n### Escenarios de Urda (hipótesis explícitas, no pronóstico)\n")
    w(tabla(["Escenario", "PP", "PSOE", "Vox", "PP+Vox", "P(PP+Vox ≥ 176)", "P(PP 1º)", "¿Se notaría en las encuestas?"],
            [[x["nombre"]] + [f"{x['escanos'][p][0]:.0f}" for p in ("PP", "PSOE", "VOX")] +
             [f"{x['ppvox']:.0f}", f"{x['p_mayoria']:.0%}", f"{x['pp_primero']:.0%}",
              "—" if x["distinguible"] is None else ("sí" if x["distinguible"] else "no, dentro del ruido")]
             for x in esc_urda]))
    w(f"\n«Se notaría» compara el cambio del PSOE con su umbral de detección ({umbrales.get('PSOE', 0):.1f} pp).\n")
    w("**Validación del método** con un suceso conocido — crisis Casado–Ayuso (17-feb-2022):\n")
    m_c, det_c = EV.pares(prev_all, CASADO, ["PP", "PSOE", "VOX"])
    filas = []
    for p in ("PP", "PSOE", "VOX"):
        r = EV.efecto(prev_all, p, CASADO)
        filas.append([p, f"{m_c[p][0]:+.1f} (n={m_c[p][2]})", f"{r[0][0]:+.1f} ± {r[0][1]:.1f}",
                      f"{r[14][0]:+.1f} ± {r[14][1]:.1f}", f"±{umbrales[p]:.1f}",
                      "sí" if abs(r[14][0]) > umbrales[p] else "no"])
    w(tabla(["Partido", "Pares por casa", "Salto inmediato", "Cambio a 14 días", "Umbral placebo",
             "Distinguible"], filas))
    w("\nEl método detecta la subida de Vox; la caída del PP (real, de 2 a 4 puntos según la casa) queda en el "
      "límite porque el PP tuvo grandes oscilaciones en ese ciclo, lo que eleva su umbral.\n")

    # ---------- Limitaciones ----------
    # ---------- Contraste con agregadores externos ----------
    contraste = []
    refs = [r for r in F.referencias_agregadores() if r["fecha"] <= hoy]
    if refs:
        w("## 5. Contraste con promedios externos\n")
        w("Para comparar en igualdad de condiciones, el motor se ejecuta con los datos que existían en la fecha "
          "de cada referencia (encuestas publicadas y con campo terminado hasta ese día), variante `consenso_privadas`.\n")
    for ref in refs:
        enc_d = [e for e in actuales if e["campo_fin"] <= ref["fecha"] and F.publicada_antes(e, ref["fecha"])]
        if len({e["casa"] for e in enc_d}) < 2:
            continue
        aj_d = PR.estimar(enc_d, inicio, ref["fecha"], "consenso_privadas", errores_23j=err)
        r_d = PR.resumir(PR.simular(aj_d, (ELECCION - ref["fecha"]).days, n=min(a.n, 2000)))
        filas = []
        for p in ("PP", "PSOE", "VOX", "SUMAR", "PODEMOS"):
            m = r_d["partidos"].get(p)
            filas.append([p, f1(ref["voto"].get(p)), f1(m["voto"][0]) if m else "—",
                          ref["escanos"].get(p, "—"), f"{m['escanos'][0]:.0f} ({m['escanos'][1]:.0f}–{m['escanos'][2]:.0f})" if m else "—"])
        w(f"### {ref['nombre']} — {ref['fecha'].isoformat()}\n")
        w(tabla(["Partido", "Referencia voto %", "Motor voto %", "Referencia escaños", "Motor escaños (90 %)"], filas))
        w(f"\nEncuestas disponibles para el motor en esa fecha: {len(enc_d)} de {len({e['casa'] for e in enc_d})} casas. "
          f"Fuente: {ref['url']}. {ref['notas']}\n")
        contraste.append(dict(id=ref["id"], nombre=ref["nombre"], fecha=ref["fecha"], url=ref["url"], notas=ref["notas"],
                              metodo=ref["metodo"], verificado=ref["verificado"], ref_voto=ref["voto"],
                              ref_escanos=ref["escanos"], n_encuestas=len(enc_d),
                              casas=sorted({e["casa"] for e in enc_d}),
                              motor={p: dict(voto=v["voto"], escanos=v["escanos"]) for p, v in r_d["partidos"].items()}))

    w("## 6. Límites conocidos\n")
    w("- Un solo precedente evaluado (23J). Faltan 2015, 2016 y 2019 (requieren acceso a Wikipedia o a las fuentes originales).\n"
      "- Ciclo 2023-26 con pocas encuestas antes de octubre de 2026: la tendencia previa es poco informativa.\n"
      "- Algunas encuestas finales de 2023 están incompletas en la fuente de terceros (marcadas).\n"
      "- Partidos regionales: pocas casas publican su voto; sus sesgos están poco identificados.\n"
      "- El traslado a escaños supone que la geografía relativa del 23J se mantiene.\n")

    os.makedirs(SALIDA, exist_ok=True)
    open(os.path.join(SALIDA, "informe.md"), "w", encoding="utf-8").write("\n".join(L) + "\n")
    json.dump(dict(corte=hoy.isoformat(), eleccion=ELECCION.isoformat(), variantes=resumen,
                   promedio_simple=simple, error_23j={c: r["error"] for c, r in err.items()},
                   industria_23j=ind, retroprueba_23j=bt, umbral_placebo=umbrales),
              open(os.path.join(SALIDA, "pronostico.json"), "w", encoding="utf-8"),
              ensure_ascii=False, indent=1, default=str)
    from .motor import exportar
    datos = exportar.datos(enc=enc, actuales=actuales, inicio=inicio, hoy=hoy, dias=dias, ajustes=ajustes,
                           sims=sims, resumen=resumen, simple=simple, casas_simple=casas_simple, err=err,
                           ind=ind, simple23=simple23, bt=bt, res23=res23, est=est, ses_prev=ses_prev,
                           umbrales=umbrales, prev_all=prev_all, casado=CASADO, urda=URDA, eleccion=ELECCION,
                           contraste=contraste, sensibilidad=sens, retro_cortes=rp,
                           principal=princ, historial=hist, senales=reg_senales, escenarios_urda=esc_urda,
                           geo_sens=geo_sens, otros_agregadores=otros,
                           sens_industria=sens_ind, industria_23j=dict(valor=b23, caso=caso23))
    json.dump(datos, open(os.path.join(SALIDA, "datos_pagina.json"), "w", encoding="utf-8"),
              ensure_ascii=False, default=str, separators=(",", ":"))
    plantilla = os.path.join(os.path.dirname(os.path.abspath(__file__)), "pagina", "plantilla.html")
    if os.path.exists(plantilla):
        html = open(plantilla, encoding="utf-8").read().replace(
            "/*DATOS*/null", json.dumps(datos, ensure_ascii=False, default=str, separators=(",", ":")))
        open(os.path.join(SALIDA, "pagina.html"), "w", encoding="utf-8").write(html)
    print("\n".join(L))


if __name__ == "__main__":
    main()

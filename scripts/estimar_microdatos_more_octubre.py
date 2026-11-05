#!/usr/bin/env python3
"""Estima desde cinco columnas SPSS y contrasta su entrada al Motor 29N.

Solo escribe agregados. El original se verifica y se elimina al salir.
No modifica el principal ni trata una muestra como dos encuestas independientes.
Ejecutar desde la raíz: python -m scripts.estimar_microdatos_more_octubre
"""
import argparse
import hashlib
import io
import json
import tempfile
import urllib.request
import zipfile
from datetime import date, timedelta
from pathlib import Path
import numpy as np
import pyreadstat
from modelo.microdatos.receta_declarada import cocinar
from modelo.motor import fuentes as F, evaluacion as V, pronostico as PR

HASH = "813f5a4f7b8cad45bb4f184b7744e4937d8651b34a09bee93b149513c9ff106f"
NAMES = {1:"PP", 2:"PSOE", 3:"VOX", 4:"FRENTE_AMPLIO", 8:"ERC", 9:"JUNTS",
         10:"PNV", 11:"BILDU", 12:"CC", 14:"BNG", 20:"PODEMOS", 21:"SALF",
         22:"OTROS", 23:"BLANCO", 32:"ADELANTE", 33:"DRAGO"}
MAJOR = [1, 2, 3, 4, 20, 21]
COLS = ["intencion_voto_raw", "simpatia_partido", "voto_2023_raw",
        "peso_demografico", "prob_voto_declarada"]
PUBLISHED = {"PP":28.3, "PSOE":27.6, "VOX":20.8, "SUMAR":7.8, "PODEMOS":2.6}


def leer():
    manifest = json.loads(Path("data/microdatos/estado-descargas.json").read_text())
    source = next(x for x in manifest["archivos"] if x["id"] == "more-in-common-2026-10-01")
    raw = urllib.request.urlopen(source["url"], timeout=45).read()
    if len(raw) != 615299 or hashlib.sha256(raw).hexdigest() != HASH:
        raise ValueError("Los bytes no coinciden con el original autorizado")
    with zipfile.ZipFile(io.BytesIO(raw)) as archive:
        savs = [x for x in archive.infolist() if x.filename.endswith(".sav") and not x.filename.startswith("__MACOSX")]
        if len(savs) != 1 or savs[0].file_size > 40_000_000:
            raise ValueError("Matriz inesperada")
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory)/"original.sav"
            path.write_bytes(archive.read(savs[0]))
            frame, meta = pyreadstat.read_sav(str(path), usecols=COLS)
    if len(frame) != 2210:
        raise ValueError("Tamaño de muestra inesperado")
    required = {"intencion_voto_raw": {4:"Frente Amplio", 23:"Blanco", 98:"NC", 99:"NS"},
                "simpatia_partido": {4:"Frente Amplio", 23:"Ninguno"},
                "voto_2023_raw": {4:"Sumar"}}
    for var, codes in required.items():
        for code, label in codes.items():
            if meta.variable_value_labels[var].get(code) != label:
                raise ValueError("Ha cambiado el significado de una categoría")
    for var in ("intencion_voto_raw", "simpatia_partido", "voto_2023_raw"):
        found = set(frame[var].dropna().to_numpy())
        if not found.issubset(set(meta.variable_value_labels[var])):
            raise ValueError("Hay categorías no documentadas en "+var)
    for code in MAJOR:
        if int(np.sum(frame.intencion_voto_raw == code)) < 20:
            raise ValueError("Una categoría publicable tiene menos de 20 respuestas")
    return frame, source


def resumir(result):
    out = {}
    for id_, step in result["pasos"].items():
        shares = {NAMES[c]: step["porcentajes"][c] for c in MAJOR}
        shares["RESTO_INCLUIDO_BLANCO"] = 100-sum(shares.values())
        out[id_] = {"estimacion": shares,
                    "numeradores_ponderados": {NAMES[c]:step["numeradores"][c] for c in MAJOR},
                    "denominador_ponderado":step["denominador_ponderado"],
                    "efectivo_kish_asignado":step["efectivo_kish_asignado"]}
    return {"pasos":out, "diagnostico":result["diagnostico"]}


def puente(shares, corte, n):
    all_polls = [e for e in F.todas() if e["campo_fin"] <= corte and F.publicada_antes(e, corte)]
    current, excluded = F.seleccion_pronostico(all_polls)
    if any("common" in e["casa"].lower() for e in current):
        raise ValueError("More in Common ya está en el modelo: revisar dependencia antes de añadir")
    err = V.error_final(all_polls, date(2023,7,23), F.resultado_23j(), ["PP","PSOE","VOX","SUMAR"])
    start = min(F.dia_central(e) for e in current)-timedelta(days=7)
    candidate = dict(estudio="more-in-common-2026-10-01", casa="More in Common",
                     origen="escenario-microdatos", ciclo="2023-26", campo_ini=date(2026,10,21),
                     campo_fin=date(2026,10,25), publicacion=date(2026,11,3), n=2210,
                     n_supuesto=False, modo="CAWI", ancla_privadas=True)
    # Cinco partidos con dato publicado comparable. SALF y regionales no se imputan
    # a la referencia publicada para completar artificialmente la comparación.
    model_shares = {"SUMAR" if p=="FRENTE_AMPLIO" else p:v for p,v in shares.items()}
    cooked = {p:model_shares[p] for p in PUBLISHED}
    scenarios = {}
    for key, values in (("sin_more_in_common",None), ("con_more_publicada",PUBLISHED), ("con_more_cocina_oee",cooked)):
        inputs = current if values is None else current+[dict(candidate, voto=values)]
        forecast = PR.principal(inputs,start,corte,date(2026,11,29),err,n_por_variante=n)
        scenarios[key] = {"encuestas":len(inputs), "simulaciones":forecast["n"],
                          "partidos":{p:forecast["partidos"][p] for p in PUBLISHED},
                          "bloques":forecast["bloques"]}
    historical = [e for e in all_polls if e["ciclo"] != "2023-26"]
    return {"escenarios":scenarios,"historicas_cargadas":len(historical),
            "historicas_wikipedia":sum(e.get("origen")=="terceros-wikipedia" for e in historical),
            "muestra_anadida_una_vez_por_escenario":True,
            "comparacion_receta":"con_more_cocina_oee frente a con_more_publicada; misma muestra y mismos cinco partidos",
            "homologacion_explicita":"Solo para este escenario: Frente Amplio de octubre se asigna a SUMAR del motor. La composición y geografía de 2023 no están validadas para esta candidatura.",
            "incertidumbre":"Se mantienen los supuestos del motor. No se incorpora todavía incertidumbre adicional de imputación ni de selección de receta; los intervalos no están validados."}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--corte",type=date.fromisoformat,default=date(2026,11,5))
    parser.add_argument("--simulaciones-por-variante",type=int,default=750)
    args = parser.parse_args()
    if args.corte < date(2026,11,3):
        raise ValueError("No puede usarse una encuesta antes de su publicación")
    frame, source = leer()
    vectors = [frame[v].to_numpy() for v in COLS]
    results = {str(alpha):resumir(cocinar(*vectors,validos=NAMES,contraccion=alpha)) for alpha in (0,50,100)}
    result = results["50"]
    result["sensibilidad_no_respuesta"] = resumir(cocinar(*vectors,validos=NAMES,contraccion=50,imputar_nc=True))
    result.update({"esquema":1,"estado":"candidata_sin_validacion_predictiva",
                   "estudio":"More in Common · octubre 2026","entrevistas":2210,
                   "campo":["2026-10-21","2026-10-25"],"publicacion":"2026-11-03",
                   "corte":str(args.corte),"sha256_original":HASH,"url_original":source["url"],
                   "columnas_leidas":COLS,"estimacion_publicada":PUBLISHED,
                   "sensibilidad_contraccion":{k:v["pasos"]["participacion"]["estimacion"] for k,v in results.items()},
                   "receta":["Peso demográfico publicado, sin el peso final que añade recuerdo",
                     "Intención bruta: candidaturas y blanco; nulo, abstención y NS/NC excluidos del denominador inicial",
                     "Para NS, se usa simpatía válida; Ninguno nunca se transforma en voto blanco",
                     "Para NS restantes, distribución de donantes por recuerdo; contracción hacia distribución global con masa previa 50, expresada en entrevistas efectivas de Kish",
                     "Sin donantes o recuerdo ausente se usa la distribución global; NC queda sin imputar en la referencia",
                     "Cada peso se multiplica por probabilidad declarada de votar / 10; faltantes usan la media ponderada observada",
                     "Normalización final sobre masa asignada a candidaturas y blanco"],
                   "limitaciones":["Estimación de encuesta referida al campo de octubre, no predicción aislada del 29N",
                     "No se usa intencion_voto_final, prob_voto_estimada, voto_2023_final ni el peso final de la casa",
                     "El peso demográfico sigue procediendo de More in Common; nuestra receta no es independiente de toda su preparación",
                     "La distribución de los indecisos se supone comparable a la de los donantes de su recuerdo; no es un comportamiento observado",
                     "El valor 50 es un supuesto previo, no un coeficiente optimizado. Se muestra sensibilidad 0/50/100 y tratamiento alternativo de NC",
                     "Kish es un diagnóstico de pesos, no una muestra probabilística ni un margen de error",
                     "No se ha validado esta receta en elecciones independientes ni se elige por parecerse a una cifra publicada",
                     "No se publica ninguna entrevista, texto libre ni celda pequeña de transferencias",
                     "El pronóstico principal, sus ficheros y su historial no se modifican"]})
    print("Calculada receta sobre 2.210 entrevistas; conectando escenarios con el motor…",flush=True)
    result["puente_motor"] = puente(result["pasos"]["participacion"]["estimacion"],args.corte,args.simulaciones_por_variante)
    target=Path("data/microdatos/candidata-more-in-common-octubre-2026.json")
    target.write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n")
    print(target)
    for name,step in result["pasos"].items():print(name,{k:round(v,2) for k,v in step["estimacion"].items()})
    for name,scenario in result["puente_motor"]["escenarios"].items():print(name,{p:round(x["voto"][0],2) for p,x in scenario["partidos"].items()})


if __name__=="__main__":main()

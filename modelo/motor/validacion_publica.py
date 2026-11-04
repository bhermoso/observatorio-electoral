"""Auditoría histórica estrictamente temporal, sin ajustar parámetros al resultado.

Evalúa promedios que NO usan el resultado del año evaluado. Los cortes de una
misma elección están correlacionados: nunca cuentan como elecciones independientes.
"""
from collections import defaultdict
from datetime import timedelta
import numpy as np

def corte_publicado(encuestas, corte, ventana=30):
    """Última publicación por casa antes de corte. Rechaza fechas imputadas."""
    if ventana <= 0:
        raise ValueError("Ventana inválida")
    per = {}
    for e in encuestas:
        pub = e.get("publicacion")
        fin = e.get("campo_fin")
        if pub is None or fin is None or e.get("campo_supuesto") or e.get("fecha_publicacion_desconocida"):
            continue
        if pub > corte or fin > corte or fin < corte - timedelta(days=ventana):
            continue
        if e.get("origen") == "prensa-sin-verificar":
            continue
        key = e["casa"]
        if key not in per or (pub, fin, e["estudio"]) > (
            per[key]["publicacion"], per[key]["campo_fin"], per[key]["estudio"]):
            per[key] = e
    return list(per.values())

def estimacion_corte(encuestas, corte, partidos, ventana=30):
    """Promedio descriptivo igual por instituto; no representa cocina microdatos."""
    estudios = corte_publicado(encuestas, corte, ventana)
    votos = {}
    casas = {}
    for p in partidos:
        v = [(e["casa"], float(e["voto"][p])) for e in estudios if p in e.get("voto", {})]
        if v:
            votos[p] = float(np.mean([x[1] for x in v]))
            casas[p] = len(v)
    return dict(voto=votos, casas=casas, estudios=[e["estudio"] for e in estudios],
                fecha=str(corte), n=len(estudios))

def auditar_historico(encuestas, elecciones, partidos=("PP","PSOE","VOX"), horizontes=(30,15,7,1),
                     dias_veda=6, ventana=30):
    """Cada elección necesita resultado oficial documentado y fecha de publicación.

    No aprende coeficientes de los datos evaluados. Los errores son descriptivos;
    no se estima cobertura del 90 % ni probabilidad calibrada con una sola elección.
    """
    resultados = []
    for evento in elecciones:
        fecha = evento["fecha"]
        oficial = evento["resultado"]
        limite = fecha - timedelta(days=dias_veda)
        cortes = []
        for dias in horizontes:
            corte = min(fecha - timedelta(days=dias), limite)
            s = estimacion_corte(encuestas, corte, partidos, ventana)
            error = {p: round(s["voto"][p] - oficial[p], 3)
                     for p in partidos if p in s["voto"] and p in oficial}
            cortes.append(dict(**s, dias_antes=dias, congelado_por_veda=corte == limite,
                               error=error, mae=round(float(np.mean([abs(x) for x in error.values()])),3) if error else None))
        resultados.append(dict(eleccion=str(fecha), fuente_oficial=evento["fuente"],
                               cortes=cortes))
    validas = [e for e in resultados if any(c["mae"] is not None for c in e["cortes"])]
    return dict(esquema=1, estado="exploratorio" if len(validas)<3 else "evaluacion_multielectoral",
                elecciones_independientes=len(validas), cortes_totales=sum(len(e["cortes"]) for e in resultados),
                parametros_calibrados=False, usa_resultado_evaluado_para_ajustar=False,
                nota=("Los cortes de una misma convocatoria NO son pruebas independientes. "
                      "Este promedio no calibra el Motor 29N; ninguna probabilidad de mayoría "
                      "queda validada por esta auditoría."),
                elecciones=resultados)

"""Trazabilidad de entradas y parámetros de la estimación del Motor 29N.

No hay atribución causal por simpatía/recuerdo sobre porcentajes publicados: son
transformaciones potencialmente hechas por terceros sin su algoritmo divulgado.
Las fuentes históricas de 2023 se usan para calibración: no son cuotas actuales.
"""
from collections import Counter
from datetime import date
from math import sqrt

from .pronostico import PARTIDOS
PARTIDOS_AUDITADOS = tuple(PARTIDOS)
VARIABLES = {
    "intencion_directa": {"estado": "no_ingresa_directamente", "detalle": "El motor recibe estimaciones publicadas por las casas, no la respuesta bruta individual."},
    "intencion_directa_ponderada": {"estado": "no_desagregable", "detalle": "La parte procedente de tabulaciones ponderadas dentro de cada instituto no se identifica con las estimaciones publicadas."},
    "recuerdo_de_voto": {"estado": "no_desagregable", "detalle": "Puede participar en la cocina de la casa. El motor no recibe un término explícito por recuerdo individual; separadamente ensaya sesgos calibrados con errores reales del 23J, que NO son recuerdo."},
    "simpatia": {"estado": "no_desagregable", "detalle": "El motor no introduce la simpatía de entrevistados como variable independiente. La estimación que publica cada casa puede haberla utilizado."},
    "transferencias": {"estado": "no_desagregable", "detalle": "El motor no incorpora matrices de transición voto recordado-voto declarado. Se investigan por separado en microdatos."},
    "probabilidad_de_votar": {"estado": "no_desagregable", "detalle": "El motor no recibe probabilidades individuales de participación; la eventual cocina de participación de cada casa no es reconstruible desde el porcentaje final."},
    "acontecimientos": {"estado": "sin_salto_automatico", "detalle": "El motor dispone de mecanismo para saltos temporales, pero el pronóstico principal no aplica cambios atribuidos automáticamente a sucesos."},
    "estimacion_publicada": {"estado": "entrada_observada", "detalle": "Observación de voto por partido recibida de las encuestadoras; el algoritmo interno de cada casa no se puede descomponer sin su documentación."},
    "efecto_de_encuestadora": {"estado": "modelizado", "detalle": "Término estadístico de casa relativo a un ancla definida; no es una estimación directa de simpatía o recuerdo."},
    "tendencia_temporal": {"estado": "modelizado", "detalle": "Estado latente diario de voto con paseo aleatorio y suavizado."},
    "geografia_2023": {"estado": "modelizado", "detalle": "Patrón provincial para trasladar el voto nacional a circunscripciones."},
}


def elaborar(encuestas, ajustes, variantes, principal, hoy, excluidas_prensa=0,
             industria=2.2, tau=0.15):
    if not isinstance(hoy, date):
        raise TypeError("hoy debe ser fecha")
    fuente = Counter(e["origen"] for e in encuestas)
    por_partido = {}
    for p in PARTIDOS_AUDITADOS:
        aportan = [e for e in encuestas if p in e["voto"]]
        casas = sorted({e["casa"] for e in aportan})
        variantes_entrada = {}
        for nombre, ajuste in ajustes.items():
            r = ajuste.get(p)
            if r is None:
                continue
            variantes_entrada[nombre] = {
                "estimacion_latente_en_corte": round(float(r["media"][-1]), 5),
                "sd_estimacion_latente": round(float(r["sd"][-1]), 5),
                "casas_ancla": list(r["anclas"]),
            }
        salida = principal.get("partidos", {}).get(p, {})
        voto = salida.get("voto")
        por_partido[p] = {
            "encuestas_con_estimacion": len(aportan),
            "encuestadoras_distintas": len(casas),
            "casas": casas,
            "origenes": dict(Counter(e["origen"] for e in aportan)),
            "observaciones": [
                {
                    "casa": e["casa"],
                    "estudio": e.get("estudio", "sin-identificador"),
                    "campo_fin": e["campo_fin"].isoformat() if e.get("campo_fin") else None,
                    "publicacion": e["publicacion"].isoformat() if e.get("publicacion") else None,
                    "voto_publicado": float(e["voto"][p]),
                    "origen": e["origen"],
                    "url": e.get("url"),
                    "muestra": e.get("n"),
                }
                for e in sorted(aportan, key=lambda x: x.get("campo_fin") or date.min, reverse=True)
            ],
            "variantes_tendencia": variantes_entrada,
            "pronostico_principal_voto_mediana": float(voto[0]) if voto else None,
            "pronostico_principal_voto_p5_p95": [float(voto[1]), float(voto[2])] if voto else None,
            "escala_industria_pp": round(max(industria * sqrt(max(float(voto[0]), 0) / 25), 0.3 * industria / 1.5), 5) if voto else None,
        }
    return {
        "esquema": 1,
        "corte": hoy.isoformat(),
        "definicion": "Trazabilidad de datos y etapas; NO porcentajes de autoría de cada variable de cocina.",
        "fuentes": {
            "estudios_actuales_incluidos": len(encuestas),
            "casas_actuales": len({e["casa"] for e in encuestas}),
            "origenes": dict(fuente),
            "registros_prensa_sin_verificar_excluidos": excluidas_prensa,
            "limitacion": "Los registros terceros-29n pueden no contener todos los elementos originales de ficha; el origen no acredita fiabilidad idéntica.",
        },
        "parametros_de_modelo": {
            "anclas": ["consenso_privadas", "consenso_todas", "calibrada_23j"],
            "combinacion_principal": "Mezcla a partes iguales de las distribuciones simuladas de las tres variantes",
            "error_industria_referencia_pp": industria,
            "deriva_temporal_diaria_referencia_pp": tau,
            "error_provincial_lognormal_sd": 0.08,
            "rho_bloque_supuesto": 0.5,
            "advertencia": "Los errores se combinan en varianza, no en porcentajes de influencia. La incertidumbre territorial actúa sobre escaños, no como peso sobre intención directa.",
        },
        "variables": VARIABLES,
        "partidos": por_partido,
        "medidas_no_identificables": [
            "No se puede atribuir un porcentaje del pronóstico a recuerdo, simpatía o participación a partir de estimaciones ya cocinadas por institutos.",
            "Una diferencia entre la intención directa y la estimación final de una casa no identifica qué corrección la produjo.",
            "Para medir contribuciones de cada ingrediente se requiere acceder a microdatos comparables, replicar una receta explícita y hacer pruebas de ablación y validación fuera de elección.",
        ],
    }

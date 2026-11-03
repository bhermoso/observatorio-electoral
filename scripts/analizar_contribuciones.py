"""Comparaciones contrafactuales descriptivas de recetas sobre agregados CIS 3411/3415.

No son ablaciones de un mismo modelo: las columnas proceden de definiciones o
denominadores distintos. El efecto causal atribuible a un ingrediente NO está
identificado. No usar estos datos para corregir automáticamente el Motor 29N.
"""
import json
from pathlib import Path

SOURCE = Path("data/microdatos/validacion_23j.json")
OUTPUT = Path("data/microdatos/contribuciones_cocina_23j.json")
COMPARISONS = {
    "simpatia": ("decided", "sympathy_decided", "Voto + simpatía frente a voto entre decididos"),
    "participacion": ("decided", "turnout_decided", "Ponderación experimental por participación frente a decididos"),
    "estimacion_publicada": ("decided", "published_cis", "Estimación publicada frente a decididos; incluye ajustes no identificados"),
}
def calculate(data):
    truth = data["official_vote_valid_percent"]
    parties = list(data["party_order"])
    studies = data["studies"]
    cases = []
    for code, (base, alternative, description) in COMPARISONS.items():
        per_study = []
        for study_id in sorted(studies):
            a = studies[study_id]["scenarios"]
            by_party = []
            for p in parties:
                x, y, target = a[base][p], a[alternative][p], truth[p]
                by_party.append({
                    "partido": p,
                    "base": x,
                    "alternativa": y,
                    "cambio_estimacion_pp": round(y-x, 6),
                    "cambio_error_absoluto_pp": round(abs(y-target)-abs(x-target), 6),
                })
            n = len(by_party)
            per_study.append({
                "estudio": study_id,
                "partidos": by_party,
                "mae_base": round(sum(abs(a[base][p]-truth[p]) for p in parties)/n,6),
                "mae_alternativa": round(sum(abs(a[alternative][p]-truth[p]) for p in parties)/n,6),
                "diferencia_mae_pp": round(sum(t["cambio_error_absoluto_pp"] for t in by_party)/n,6),
                "partidos_con_menor_error": sum(t["cambio_error_absoluto_pp"] < 0 for t in by_party),
                "partidos_con_mayor_error": sum(t["cambio_error_absoluto_pp"] > 0 for t in by_party),
            })
        cases.append({
            "codigo": code,
            "comparacion": description,
            "base": base,
            "alternativa": alternative,
            "estudios": per_study,
            "consistencia_mae": "mejora_ambos" if all(r["diferencia_mae_pp"] < 0 for r in per_study)
                else "empeora_ambos" if all(r["diferencia_mae_pp"] > 0 for r in per_study)
                else "signo_discrepante_o_igual",
            "identificacion_causal": False,
        })
    return {
        "schema_version":1,
        "fecha_eleccion":"2023-07-23",
        "origen":SOURCE.as_posix(),
        "descripcion":"Contrastes descriptivos entre escenarios reconstruidos con códigos CIS revisados (8995 = Otro partido); no son contribuciones causales aisladas ni recetas secuenciales.",
        "comparaciones":cases,
        "ausencias":{
            "recuerdo":"Sin contraste válido: RECUERDO en 3411/3415 corresponde a 2019, no a 2023. No se ha creado un procedimiento alternativo comparable.",
            "transferencias":"Los cruces de recuerdo e intención son descriptivos y no existe aquí una regla de transferencia estimada y probada en ambos estudios.",
            "eventos":"No se puede atribuir una variación a un acontecimiento con estas dos encuestas del 23J.",
            "escanos":"No hay validación provincial observada para atribuir cambios de escaños a la cocina. La proyección IPF del laboratorio es ilustrativa; no se atribuyen efectos causales.",
            "ponderacion_demografica":"Los escenarios agregados usan PESO y no contienen una variante sin postestratificación con idéntico denominador.",
        },
        "advertencias":[
            "Las recetas comparadas son salidas alternativas, NO pasos acumulativos del mismo algoritmo.",
            "Cambiar una receta modifica a veces denominador y composición simultáneamente; no identifica una contribución marginal causal.",
            "Los dos estudios corresponden a una sola elección; su repetición no es validación entre convocatorias.",
            "El resultado electoral solo se emplea para evaluar el error; no para reconstruir una receta que desconocemos.",
            "La variable VOTOSIMG de 3415 no incorpora por sí sola el componente de voto por correo.",
            "Los cambios se expresan en puntos porcentuales, no en porcentajes atribuibles de la estimación final.",
            "No deben sumarse las diferencias entre comparaciones ni extrapolarse al Motor 29N.",
            "Se ha corregido el código CIS 8995 como Otro partido: las cifras y los MAE históricos se recalcularon con el universo de candidaturas 1..8995.",
        ],
        "decision":"No introducir automáticamente ninguna corrección por simpatía o participación ni asignar pesos ficticios. Ampliar a nuevas elecciones y microdatos comparables.",
    }

if __name__ == "__main__":
    OUTPUT.write_text(json.dumps(calculate(json.loads(SOURCE.read_text(encoding="utf-8"))),ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(f"Auditoría: {OUTPUT}")

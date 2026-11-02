"""Auditoría histórica de cocina electoral.

Utiliza solamente agregados de microdatos ya procesados y resultados oficiales.
No accede al futuro para elegir un método: elección en un estudio, prueba en otro.
Los dos estudios pertenecen a la MISMA elección. No es validación entre comicios.
No incluye el voto directo sobre todos los entrevistados como candidato a estimación
de voto válido, pues su denominador no es comparable.
No reajusta parámetros ni modifica el Motor 29N.
"""
import json
from pathlib import Path

PARTIDOS = ("PSOE", "PP", "VOX", "SUMAR")
METODOS = ("decided", "sympathy_decided", "turnout_decided", "published_cis")
ETIQUETAS = {
    "decided": "Voto entre respuestas con candidatura",
    "sympathy_decided": "Voto + simpatía entre respuestas con candidatura",
    "turnout_decided": "Hipótesis de participación autodeclarada",
    "published_cis": "Estimación CIS publicada (referencia, no receta propia)",
}
INPUT = Path("data/microdatos/validacion_23j.json")
OUTPUT = Path("data/microdatos/auditoria_cocina_23j.json")


def evaluar(data):
    real = data["official_vote_valid_percent"]
    estudios = data["studies"]
    identificadores = sorted(estudios)
    if len(identificadores) < 2:
        raise ValueError("Se requieren dos estudios para realizar el contraste")
    def metricas(study, method):
        vals = study["scenarios"][method]
        diferencias = {p: float(vals[p] - real[p]) for p in PARTIDOS}
        ae = {p: abs(v) for p, v in diferencias.items()}
        return {
            "mae_pp": round(sum(ae.values()) / len(PARTIDOS), 6),
            "error_firmado_pp": {p: round(x, 6) for p, x in diferencias.items()},
            "error_absoluto_pp": {p: round(x, 6) for p, x in ae.items()},
            "max_error_pp": round(max(ae.values()), 6),
        }
    tabla = {sid: {m: metricas(estudios[sid], m) for m in METODOS} for sid in identificadores}
    pruebas = []
    for calibracion in identificadores:
        # En caso de empate se elige alfabéticamente, nunca mirando la prueba.
        ganador = min(METODOS, key=lambda m: (tabla[calibracion][m]["mae_pp"], m))
        for prueba in identificadores:
            if prueba == calibracion:
                continue
            test = tabla[prueba]
            candidato = test[ganador]["mae_pp"]
            publicado = test["published_cis"]["mae_pp"]
            decided = test["decided"]["mae_pp"]
            pruebas.append({
                "seleccion_estudio": calibracion,
                "evaluacion_estudio": prueba,
                "metodo_seleccionado": ganador,
                "error_entrenamiento_mae_pp": tabla[calibracion][ganador]["mae_pp"],
                "error_prueba_mae_pp": candidato,
                "referencia_cis_mae_pp": publicado,
                "referencia_decididos_mae_pp": decided,
                "cambio_frente_publicado_pp": round(candidato - publicado, 6),
                "cambio_frente_decididos_pp": round(candidato - decided, 6),
                "mejora_frente_publicado": candidato < publicado,
                "nota": "La elección del método utiliza exclusivamente el estudio de selección. Ambos estudios fueron realizados antes de la misma elección de 2023.",
            })
    return {
        "schema_version": 1,
        "titulo": "Auditoría exploratoria de procedimientos CIS frente al resultado del 23J",
        "eleccion": "2023-07-23",
        "fuente": str(INPUT),
        "resultado_oficial": data["official_results_source"],
        "partidos": list(PARTIDOS),
        "metodos": ETIQUETAS,
        "excluido_como_estimacion": {
            "metodo": "direct_all",
            "razon": "La intención directa sobre todos los entrevistados tiene un denominador distinto del voto válido y no es una estimación con el mismo objetivo.",
        },
        "resultados_por_estudio": tabla,
        "pruebas_seleccion_y_traslado": pruebas,
        "limitaciones": [
            "Dos encuestas de un mismo instituto y una sola elección: NO es validación fuera de muestra electoral independiente.",
            "La elección final se usa para medir el error, nunca para seleccionar el método en el estudio de evaluación.",
            "Sumar de 2023 no equivale necesariamente a todas las etiquetas y coaliciones de otros ciclos.",
            "En el CIS 3415 la variable VOTOSIMG usada no incorpora el componente especial de voto por correo.",
            "La variable RECUERDO de los estudios 3411 y 3415 se refiere al 10N de 2019, no al 23J. No se ha realizado calibración por recuerdo.",
            "La probabilidad declarada de votar no es una probabilidad calibrada de participación real.",
            "La fecha de entrevistas varía entre estudios; las diferencias no se atribuyen solo a la cocina.",
            "La cercanía puntual al resultado final no demuestra que este método reproduzca la fórmula interna del CIS.",
            "No se autorizan ajustes automáticos de la estimación del Motor 29N con esta evidencia.",
        ],
        "decision_operativa": "No adoptar automáticamente correcciones de simpatía, recuerdo o participación en el pronóstico principal. Mantenerlas como experimentos hasta validarlas en otras elecciones y con definiciones homogéneas.",
    }


def main():
    data = json.loads(INPUT.read_text(encoding="utf-8"))
    report = evaluar(data)
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report["pruebas_seleccion_y_traslado"], ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()

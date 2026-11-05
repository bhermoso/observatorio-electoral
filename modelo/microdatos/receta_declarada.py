"""Receta candidata explícita: respuestas, simpatía, transferencias y participación.

No usa variables finales imputadas por el productor ni entrena con un resultado futuro.
El parámetro de contracción es un supuesto previo que se somete a sensibilidad.
"""
import numpy as np


def cocinar(intencion, simpatia, recuerdo, peso, participacion, validos,
            ns=99, nc=98, ninguno_simpatia=23, contraccion=50.0, imputar_nc=False):
    v, s, r, w, p = [np.asarray(x, dtype=float) for x in
                     (intencion, simpatia, recuerdo, peso, participacion)]
    if any(x.ndim != 1 or len(x) != len(v) for x in (v, s, r, w, p)):
        raise ValueError("Las columnas deben ser vectores de la misma longitud")
    if not len(v) or not np.isfinite(w).all() or np.any(w <= 0):
        raise ValueError("Los pesos deben ser positivos y finitos")
    if not np.isfinite(contraccion) or contraccion < 0:
        raise ValueError("La contracción debe ser finita y no negativa")
    codes = tuple(sorted(set(validos)))
    if not codes or ns in codes or nc in codes:
        raise ValueError("Las categorías válidas no pueden incluir NS ni NC")
    n = len(v)
    matrix = np.column_stack([v == c for c in codes]).astype(float)

    def agregado(m, weights):
        numerators = (m * weights[:, None]).sum(axis=0)
        denominator = float(numerators.sum())
        if denominator <= 0:
            raise ValueError("No hay masa de voto válido")
        assigned_weight = weights * m.sum(axis=1)
        return {"porcentajes": {c: float(100*x/denominator) for c, x in zip(codes, numerators)},
                "denominador_ponderado": denominator,
                "numeradores": {c: float(x) for c, x in zip(codes, numerators)},
                "efectivo_kish_asignado": float(denominator**2 / np.sum(assigned_weight**2))}

    stages = {"directa_sin_peso": agregado(matrix, np.ones(n)),
              "peso_demografico": agregado(matrix, w)}
    original_decided = matrix.sum(axis=1) == 1
    sympathy_added = np.zeros(n, dtype=bool)
    # En B5a, 23 significa Ninguno; en B5, significa Blanco. Nunca se equiparan.
    for j, c in enumerate(codes):
        if c == ninguno_simpatia:
            continue
        sel = (v == ns) & (s == c)
        matrix[sel, j] = 1
        sympathy_added |= sel
    stages["simpatia"] = agregado(matrix, w)
    donors = matrix.sum(axis=1) == 1
    global_mass = (matrix[donors] * w[donors, None]).sum(axis=0)
    if global_mass.sum() <= 0:
        raise ValueError("No hay donantes para repartir la indecisión")
    global_prob = global_mass / global_mass.sum()
    eligible = (~donors) & ((v == ns) | ((v == nc) & imputar_nc))
    global_fallback = np.zeros(n, dtype=bool)
    group_effectives = []
    # La imputación es fraccionaria y determinista: conserva la masa de cada persona.
    for value in np.unique(r[eligible & np.isfinite(r)]):
        target = eligible & (r == value)
        group = donors & (r == value)
        if not group.any():
            matrix[target] = global_prob
            global_fallback |= target
            continue
        gw = w[group]
        effective = float(gw.sum()**2 / np.sum(gw**2))
        gp = (matrix[group] * gw[:, None]).sum(axis=0) / gw.sum()
        reliability = effective / (effective + contraccion)
        matrix[target] = reliability*gp + (1-reliability)*global_prob
        group_effectives.append(effective)
    missing_recall = eligible & ~np.isfinite(r)
    matrix[missing_recall] = global_prob
    global_fallback |= missing_recall
    if np.any(matrix.sum(axis=1) > 1 + 1e-10):
        raise ValueError("Se ha asignado más de una unidad de voto")
    if not np.allclose(matrix[original_decided].sum(axis=1), 1):
        raise ValueError("Se han alterado respuestas decididas")
    stages["indecisos_transferencias"] = agregado(matrix, w)
    observed = np.isfinite(p) & (p >= 0) & (p <= 10)
    if not observed.any():
        raise ValueError("Falta la probabilidad declarada de participación")
    fallback = float(np.average(p[observed]/10, weights=w[observed]))
    turnout = np.where(observed, p/10, fallback)
    stages["participacion"] = agregado(matrix, w*turnout)
    return {"pasos": stages, "diagnostico": {
        "entrevistas": n, "ns_iniciales": int(np.sum(v == ns)),
        "nc_iniciales": int(np.sum(v == nc)),
        "asignadas_por_simpatia": int(sympathy_added.sum()),
        "asignadas_por_transferencias": int(eligible.sum()),
        "imputadas_con_distribucion_global": int(global_fallback.sum()),
        "participacion_faltante": int((~observed).sum()),
        "participacion_declarada_media_ponderada": fallback,
        "contraccion": contraccion, "imputar_nc": imputar_nc,
        "masa_final_asignada": float(matrix.sum()),
        "sin_asignacion_final": int(np.sum(matrix.sum(axis=1) == 0)),
    }}

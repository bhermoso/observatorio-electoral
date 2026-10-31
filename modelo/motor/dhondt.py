"""Reparto D'Hondt por circunscripción (LOREG art. 163)."""
import numpy as np


def dhondt(votos, escanos, umbral=0.03, total_validos=None):
    """Reparte `escanos` entre candidaturas.

    votos: array de votos por candidatura.
    umbral: fracción mínima de votos válidos (incluidos blancos) para optar a escaño.
    total_validos: votos válidos de la circunscripción; si es None se usa sum(votos).
    """
    votos = np.asarray(votos, dtype=float)
    total = votos.sum() if total_validos is None else total_validos
    elegibles = np.where(votos >= umbral * total, votos, 0.0)
    asignados = np.zeros(len(votos), dtype=int)
    if escanos <= 0 or elegibles.sum() == 0:
        return asignados
    for _ in range(escanos):
        cocientes = elegibles / (asignados + 1)
        # Empates: la LOREG da el escaño a la candidatura con más votos totales.
        mejor = np.flatnonzero(cocientes == cocientes.max())
        ganador = mejor[np.argmax(elegibles[mejor])]
        asignados[ganador] += 1
    return asignados

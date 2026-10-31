"""Del voto nacional a escaños: swing proporcional provincial sobre el 23J y D'Hondt.

El 23J solo aporta la geografía (dónde es fuerte cada partido) y las magnitudes.
Partidos sin base en 2023 (SALF) reciben cuota uniforme; Sumar 2023 se reparte
entre SUMAR y PODEMOS según el peso relativo que les den hoy las encuestas.
"""
import csv
import os
import numpy as np
from .dhondt import dhondt
from .fuentes import RAIZ

MAPA_23J = {"PP": "PP", "PSOE": "PSOE", "PSC": "PSOE", "VOX": "VOX", "SUMAR": "SUMAR", "ERC": "ERC",
            "JUNTS": "JUNTS", "EH Bildu": "BILDU", "EAJ-PNV": "PNV", "BNG": "BNG", "CCa": "CC", "UPN": "UPN"}


class Base:
    def __init__(self, partidos, reparto_sumar):
        self.partidos = list(partidos)
        d = os.path.join(RAIZ, "data")
        dist = [r for r in csv.DictReader(open(os.path.join(d, "districts.csv"), encoding="utf-8-sig"))
                if r["election"] == "2023-07-23"]
        self.provincias = [r["district"] for r in dist]
        self.escanos = np.array([int(r["seats"]) for r in dist])
        idx = {p: i for i, p in enumerate(self.provincias)}
        P = len(self.partidos)
        self.votos = np.zeros((len(dist), P))
        self.blancos = np.array([float(r["blank"]) for r in dist])
        self.validos = np.array([float(r["valid"]) for r in dist])
        col = {p: j for j, p in enumerate(self.partidos)}
        for r in csv.DictReader(open(os.path.join(d, "results.csv"), encoding="utf-8-sig")):
            if r["election"] != "2023-07-23":
                continue
            cod = r["party"].rstrip(".").rsplit("(", 1)[1].rstrip(")")
            destino = MAPA_23J.get(cod, "OTROS")
            reparto = reparto_sumar if destino == "SUMAR" else {destino: 1.0}
            for p, f in reparto.items():
                self.votos[idx[r["district"]], col[p]] += float(r["votes"]) * f
        self.cuota = self.votos / self.validos[:, None]
        self.peso = self.validos / self.validos.sum()
        self.nacional = self.peso @ self.cuota

    def proyectar(self, nuevo, ruido=None):
        nuevo = np.asarray(nuevo, float)
        with np.errstate(divide="ignore", invalid="ignore"):
            c = self.cuota * np.where(self.nacional > 0, nuevo / self.nacional, 0.0)
        sin = self.nacional == 0
        c[:, sin] = nuevo[sin]
        if ruido is not None:
            c = c * np.exp(ruido)
        actual = self.peso @ c
        with np.errstate(divide="ignore", invalid="ignore"):
            return c * np.where(actual > 0, nuevo / actual, 0.0)

    def repartir(self, cuotas, umbral=0.03):
        mask = np.array([p != "OTROS" for p in self.partidos])
        blanco = self.blancos / self.validos
        out = np.zeros(cuotas.shape, dtype=int)
        for i in range(len(self.provincias)):
            v = np.where(mask, cuotas[i], 0.0)
            if self.escanos[i] == 1:   # Ceuta y Melilla: mayoría simple
                out[i, int(np.argmax(v))] = 1
                continue
            out[i] = dhondt(v, self.escanos[i], umbral, total_validos=cuotas[i].sum() + blanco[i])
        return out

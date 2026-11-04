"""Contrato auditable para geografía electoral pública adicional (europeas 2024).

Nunca mezcla candidaturas entre elecciones por similitud de nombre.
Solo acepta un fichero completo, por 52 circunscripciones de 2023, con votos
de la candidatura y votos válidos locales, y procedencia oficial por fila.
La incorporación al pronóstico requiere además una prueba temporal externa.
"""
import csv
from collections import defaultdict
from pathlib import Path
from .escanos import Base

FUENTE_INTERIOR = "https://descargas.interior.gob.es/datasets/resultados_electorales/Elecciones-al-Parlamento-Europeo.xlsx"
PARTIDOS_AMBIGUOS = {"SUMAR", "PODEMOS", "SALF", "ERC", "JUNTS", "BILDU", "PNV", "CC", "UPN"}

def validar_perfil(ruta, provincias, *, eleccion="2024-06-09"):
    """Devuelve perfiles solo si están completos y proceden de datos oficiales.

    CSV normalizado: eleccion, provincia, partido, votos, validos, fuente.
    Los votos pueden ser 0, pero cada partido debe declarar expresamente el 0
    para cada provincia: no se imputa una candidatura ausente.
    """
    provincias=set(provincias)
    rows=list(csv.DictReader(Path(ruta).open(encoding="utf-8-sig",newline="")))
    seen=set()
    out=defaultdict(dict)
    if not rows:
        raise ValueError("Sin observaciones")
    for r in rows:
        if r["eleccion"]!=eleccion:
            raise ValueError("Elección distinta de la declarada")
        pr,p=r["provincia"],r["partido"]
        if pr not in provincias or not p:
            raise ValueError("Provincia o partido no reconocido")
        clave=(pr,p)
        if clave in seen:
            raise ValueError("Duplicado de provincia y partido")
        seen.add(clave)
        if not r["fuente"].startswith("https://") or "interior.gob.es" not in r["fuente"]:
            raise ValueError("Falta enlace institucional a la fuente original")
        try:
            votes=int(r["votos"])
            valid=int(r["validos"])
        except (ValueError,TypeError):
            raise ValueError("Votos o válidos inválidos") from None
        if votes<0 or valid<=0 or votes>valid:
            raise ValueError("Recuento electoral inválido")
        out[p][pr]=(votes,valid)
    for p,values in out.items():
        if set(values)!=provincias:
            raise ValueError(f"Perfil incompleto de {p}: {len(values)} de {len(provincias)} provincias")
        # Un mismo denominador para todas las candidaturas de una provincia.
    for pr in provincias:
        vals={v[1] for valores in out.values() for provincia,v in valores.items() if provincia==pr}
        if len(vals)!=1:
            raise ValueError("Denominador provincial inconsistente")
        if sum(out[p][pr][0] for p in out)>next(iter(vals)):
            raise ValueError("Suma de votos superior a los válidos")
    return {p:{pr:out[p][pr][0]/out[p][pr][1] for pr in sorted(provincias)} for p in sorted(out)}

def estado_geografico(actualizados, fuente=FUENTE_INTERIOR):
    """Informe honesto sobre qué datos se utilizan en el pronóstico."""
    return dict(mapa_base="Congreso 23J 2023, 52 circunscripciones",fuente_2023="BOE-A-2023-18907",
                fuente_2024=fuente,geografia_2024_importada=bool(actualizados),
                geografia_2024_aplicada_al_pronostico=False,
                motivo="La geografía adicional necesita equivalencias entre candidaturas, pruebas fuera de muestra y validación completa antes de entrar en producción.")

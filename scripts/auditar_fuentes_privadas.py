#!/usr/bin/env python3
"""Inspección REMOTA y NO REPRODUCTORA de archivos originales de GAD3 y SocioMétrica.

Solo descarga en un directorio temporal del runner. No imprime ni publica filas,
columnas libres o respuestas. Conserva exclusivamente métricas de estructura,
huella SHA-256 y nombres de variables metodológicas (no valores).
No deduce receta de cocina, representatividad ni estimaciones electorales.

Uso: python scripts/auditar_fuentes_privadas.py
El entorno externo de Actions puede acceder a archivos que no abre el lector web.
"""
from __future__ import annotations

import hashlib
import io
import json
import re
import sys
import tempfile
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET
import zipfile
from pathlib import Path

ARCHIVOS = [
    {
        "id": "gad3-aragon-enero-2026",
        "casa": "GAD3",
        "n_reportado": 1207,
        "formato": "xlsx",
        "url": "https://www.gad3.com/wp-content/uploads/2026/01/GAD3xHOY-ARAGON-Microdatos-estimacion-de-voto.xlsx",
    },
    {
        "id": "gad3-aragon-febrero-2026",
        "casa": "GAD3",
        "n_reportado": 4123,
        "formato": "xlsx",
        "url": "https://www.gad3.com/wp-content/uploads/2026/02/GAD3-FORTA-CARTV-8F-Microdatos.xlsx",
    },
    {
        "id": "gad3-andalucia-mayo-2026",
        "casa": "GAD3",
        "n_reportado": 1142,
        "formato": "xlsx",
        "url": "https://www.gad3.com/wp-content/uploads/2026/05/GAD3-Microdatos-ABC-Andalucia-2026.xlsx",
    },
    {
        "id": "sociometrica-julio-2025",
        "casa": "SocioMétrica",
        "n_reportado": 1100,
        "formato": "sav",
        "url": "https://s1.elespanol.com/upload/redaccion/2025/07/28/track_sociometrica_elespanol_23-27_jul25.sav?utm_cmp_rs=linksinline",
    },
]

METHOD_TERMS = re.compile(
    r"vot(?:o|ar)|recuerd|ponder|peso|factor|weight|probab|particip|simpat|indecis",
    re.I,
)
MAX_MB = 40
XML_S = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"


def get(url: str) -> bytes:
    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 (compatible; ArchivoMicrodatosOEE/1.0; investigacion)",
            "Accept": "*/*",
        },
    )
    with urllib.request.urlopen(request, timeout=50) as response:
        length = int(response.headers.get("Content-Length", 0) or 0)
        if length > MAX_MB * 1024**2:
            raise ValueError("Fichero mayor que el límite de seguridad")
        data = response.read(MAX_MB * 1024**2 + 1)
        if len(data) > MAX_MB * 1024**2:
            raise ValueError("Fichero mayor que el límite de seguridad")
        return data


def inspect_xlsx(data: bytes) -> dict:
    with zipfile.ZipFile(io.BytesIO(data)) as z:
        files = z.namelist()
        sheets = sorted(
            s
            for s in files
            if re.fullmatch(r"xl/worksheets/sheet[0-9]+\.xml", s)
        )
        if not sheets or "[Content_Types].xml" not in files:
            raise ValueError("No es XLSX de Excel válido")
        out = []
        for name in sheets[:20]:
            maxrow = 0
            maxcol = 0
            cells = 0
            for event, item in ET.iterparse(z.open(name), events=("start",)):
                if item.tag == XML_S + "row":
                    try:
                        maxrow = max(maxrow, int(item.get("r", "0")))
                    except ValueError:
                        pass
                elif item.tag == XML_S + "c":
                    cells += 1
                    ref = item.get("r", "")
                    letters = re.match(r"([A-Z]+)", ref)
                    if letters:
                        col = 0
                        for ch in letters.group(1):
                            col = col * 26 + ord(ch) - 64
                        maxcol = max(maxcol, col)
            out.append(
                {
                    "hoja": name.rsplit("/", 1)[-1],
                    "filas_de_hoja_incluyendo_cabecera": maxrow,
                    "columnas": maxcol,
                    "celdas_referenciadas": cells,
                }
            )
        return {"hojas": out, "hay_hojas": len(sheets)}


def inspect_sav(data: bytes) -> dict:
    if not data.startswith((b"$FL2", b"$FL3")):
        raise ValueError("Cabecera SAV de SPSS no reconocida")
    try:
        import pyreadstat
    except ImportError:
        return {"formato_sav_reconocido": True, "nota": "Sin pyreadstat; solo cabecera"}
    with tempfile.TemporaryDirectory() as tmp:
        f = Path(tmp) / "datos.sav"
        f.write_bytes(data)
        _, meta = pyreadstat.read_sav(str(f), metadataonly=True)
    method_cols = []
    for col, label in zip(meta.column_names, meta.column_labels):
        # NO incluir valores de ninguna entrevista; únicamente nombres de variables.
        if METHOD_TERMS.search(col + " " + (label or "")):
            method_cols.append({"variable": col[:48], "etiqueta": (label or "")[:120]})
    return {
        "formato_sav_reconocido": True,
        "filas_declaradas_en_metadatos": meta.number_rows,
        "columnas": meta.number_columns,
        "variables_metodologicas": method_cols[:25],
    }


def inspect_one(source: dict) -> dict:
    result = {k: source[k] for k in ("id", "casa", "n_reportado", "formato", "url")}
    try:
        data = get(source["url"])
        result["sha256"] = hashlib.sha256(data).hexdigest()
        result["bytes"] = len(data)
        if source["formato"] == "xlsx":
            result.update(inspect_xlsx(data))
        else:
            result.update(inspect_sav(data))
        result["estado"] = "fichero_descargado_y_estructura_leida"
    except Exception as error:
        # No incorporar al resultado HTML de páginas de error.
        result["estado"] = "descarga_o_lectura_fallida"
        if isinstance(error, urllib.error.HTTPError):
            result["error"] = "HTTP " + str(error.code)
        elif isinstance(error, urllib.error.URLError):
            result["error"] = "Error de conexión: " + str(error.reason)[:120]
        else:
            result["error"] = type(error).__name__ + ": " + str(error)[:120]
    return result


def main():
    report = {
        "esquema": 1,
        "tipo": "verificacion_remota_sin_datos_individuales",
        "advertencia": "Un XLSX denominado microdatos puede contener tablas agregadas; una SAV puede contener variables transformadas. No se atribuye receta interna.",
        "archivos": [inspect_one(x) for x in ARCHIVOS],
    }
    print("AUDITORIA_JSON=" + json.dumps(report, ensure_ascii=False, separators=(",", ":")))
    print(
        "RESUMEN:",
        sum(x["estado"] == "fichero_descargado_y_estructura_leida" for x in report["archivos"]),
        "descargas estructuralmente verificadas de",
        len(ARCHIVOS),
    )


if __name__ == "__main__":
    main()

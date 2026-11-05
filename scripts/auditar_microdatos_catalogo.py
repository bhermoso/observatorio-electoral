#!/usr/bin/env python3
"""Audita BINARIOS de microdatos públicos, sin publicar registros individuales.

Lee URLs aprobadas desde el catálogo versionado, verifica la descarga (máx. 35 MiB),
la huella SHA-256 y la estructura de matrices SAV/DTA/CSV/XLSX y ZIP.
SOLO PERSISTE metadatos. No guarda matrices en el repositorio ni crea estimaciones.
"""

from __future__ import annotations
import argparse
import concurrent.futures
import csv
import hashlib
import io
import ipaddress
import json
import os
import re
import socket
import tempfile
import urllib.error
import urllib.parse
import urllib.request
import zipfile
from datetime import datetime, timezone
from pathlib import Path

MAX_FILE = 35 * 1024 * 1024
MAX_EXPANDED = 110 * 1024 * 1024
MAX_MEMBERS = 600
MAX_REDIRECTS = 3
ALLOWED = {
    "ep00.epimg.net", "moreincommon.es", "www.moreincommon.es",
    "www.gad3.com", "gad3.com", "s1.elespanol.com", "s2.elespanol.com",
    "www.cemopmurcia.es", "cemopmurcia.es",
}
SUPPORTED = {".zip", ".sav", ".dta", ".csv", ".xlsx"}
SCAN_URL = "https://gjzihgfzxorpvevrrfkh.supabase.co/functions/v1/microdatos?action=status"
VAR_RE = re.compile(r"recuerd|vot|particip|ponder|peso|factor|weight|simpat|indecis|probab", re.I)
FIELDS = ("id", "productor", "fecha", "archivo")
CATALOG = Path("data/microdatos/catalogo-publico.json")
OUTPUT = Path("data/microdatos/estado-descargas.json")


def validate_url(url: str) -> str:
    u = urllib.parse.urlsplit(url)
    if (u.scheme != "https" or not u.hostname or u.hostname.lower() not in ALLOWED
            or u.username or u.password or u.port not in (None, 443)):
        raise ValueError("dominio_o_protocolo_no_autorizado")
    ext = Path(urllib.parse.unquote(u.path)).suffix.lower()
    if ext not in SUPPORTED:
        raise ValueError("extension_no_admitida")
    return url


class SafeRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        validate_url(newurl)
        count = int(req.headers.get("X-Redirect-Count", "0"))
        if count >= MAX_REDIRECTS:
            raise ValueError("demasiadas_redirecciones")
        newreq = super().redirect_request(req, fp, code, msg, headers, newurl)
        if newreq is not None:
            newreq.add_header("X-Redirect-Count", str(count + 1))
        return newreq


def fetch_bytes(url: str) -> bytes:
    validate_url(url)
    opener = urllib.request.build_opener(SafeRedirect)
    req = urllib.request.Request(url, headers={
        "User-Agent": "Mozilla/5.0 (compatible; OEE-MicrodataAudit/1.0; research)",
        "Accept": "application/zip,application/octet-stream,*/*",
    })
    with opener.open(req, timeout=22) as res:
        size = int(res.headers.get("Content-Length") or 0)
        if size > MAX_FILE:
            raise ValueError("archivo_demasiado_grande")
        chunks, n = [], 0
        while True:
            part = res.read(min(65536, MAX_FILE + 1 - n))
            if not part:
                break
            n += len(part)
            if n > MAX_FILE:
                raise ValueError("archivo_demasiado_grande")
            chunks.append(part)
        return b"".join(chunks)


def safe_variables(names):
    # Solo nombres de variables, nunca valores individuales ni cabeceras arbitrarias.
    found = [str(n).strip()[:55] for n in names if VAR_RE.search(str(n))]
    return found[:18]


def binary_matrix(data: bytes, ext: str):
    try:
        import pyreadstat
    except ImportError:
        raise RuntimeError("falta_pyreadstat")
    with tempfile.TemporaryDirectory() as tmp:
        file = Path(tmp) / ("encuesta" + ext)
        file.write_bytes(data)
        reader = pyreadstat.read_sav if ext == ".sav" else pyreadstat.read_dta
        try:
            _, md = reader(str(file), metadataonly=True, output_format="dict")
        except Exception:
            try:
                # Las matrices antiguas pueden contener cadenas CP1252/Latin-1.
                _, md = reader(str(file), metadataonly=True, output_format="dict", encoding="latin1")
            except Exception:
                raise RuntimeError("fichero_estadistico_no_legible") from None
    return {
        "tipo": ext.lstrip("."),
        "filas": int(md.number_rows or 0),
        "columnas": int(md.number_columns or len(md.column_names)),
        "variables_clave": safe_variables(md.column_names),
    }


def excel_matrix(data: bytes):
    import openpyxl
    wb = openpyxl.load_workbook(io.BytesIO(data), read_only=True, data_only=True)
    try:
        sheets = []
        for ws in wb.worksheets[:12]:
            sheets.append({
                "filas": min(int(ws.max_row or 0), 1000000),
                "columnas": min(int(ws.max_column or 0), 10000),
            })
        return {"tipo": "xlsx", "hojas": len(wb.worksheets), "resumen_hojas": sheets}
    finally:
        wb.close()


def csv_matrix(data: bytes):
    head = data[:200000].decode("utf-8-sig", errors="replace")
    try:
        dialect = csv.Sniffer().sniff(head[:8000], delimiters=",;\t")
    except csv.Error:
        dialect = csv.excel
    reader = csv.reader(io.StringIO(head), dialect)
    hdr = next(reader, [])
    return {"tipo": "csv", "columnas": min(len(hdr), 10000),
            "filas_aproximadas": max(0, data.count(b"\n") - 1),
            "variables_clave": safe_variables(hdr)}


def zip_matrix(data: bytes):
    if not zipfile.is_zipfile(io.BytesIO(data)):
        raise ValueError("zip_invalido")
    with zipfile.ZipFile(io.BytesIO(data)) as z:
        members = [x for x in z.infolist() if not x.is_dir() and not x.filename.startswith("__MACOSX")]
        if len(members) > MAX_MEMBERS:
            raise ValueError("demasiados_miembros_zip")
        if sum(x.file_size for x in members) > MAX_EXPANDED:
            raise ValueError("contenido_zip_demasiado_grande")
        tabular = [x for x in members if Path(x.filename).suffix.lower() in SUPPORTED - {".zip"}]
        summaries = []
        for x in tabular[:6]:
            suffix = Path(x.filename).suffix.lower()
            if x.file_size > MAX_FILE or x.compress_size and x.file_size > 250 * x.compress_size:
                summaries.append({"tipo": suffix[1:], "error": "miembro_excesivo"})
                continue
            try:
                raw = z.read(x)
                if suffix in {".sav", ".dta"}:
                    record = binary_matrix(raw, suffix)
                elif suffix == ".xlsx":
                    record = excel_matrix(raw)
                else:
                    record = csv_matrix(raw)
                summaries.append(record)
            except Exception as exc:
                summaries.append({"tipo": suffix[1:], "error": type(exc).__name__})
        return {
            "tipo": "zip", "miembros": len(members),
            "ficheros_tabulares": len(tabular), "matrices": summaries,
        }


def inspect(data: bytes, extension: str):
    if not data or data[:20].lstrip().startswith((b"<html", b"<!DOCTYPE", b"<?xml")):
        raise ValueError("respuesta_html_no_archivo")
    if extension == ".zip":
        return zip_matrix(data)
    if extension == ".xlsx":
        return excel_matrix(data)
    if extension == ".sav":
        if not data.startswith((b"$FL2", b"$FL3")):
            raise ValueError("cabecera_sav_invalida")
        return binary_matrix(data, extension)
    if extension == ".dta":
        return binary_matrix(data, extension)
    if extension == ".csv":
        return csv_matrix(data)
    raise ValueError("tipo_no_soportado")


def classify(meta: dict) -> str:
    matrices = meta.get("matrices", []) if meta.get("tipo") == "zip" else [meta]
    for m in matrices:
        if m.get("tipo") in {"sav", "dta"} and m.get("filas", 0) >= 100 and m.get("columnas", 0) >= 8:
            return "matriz_detectada_pendiente_homologacion"
        if m.get("tipo") == "csv" and m.get("filas_aproximadas", 0) >= 100 and m.get("columnas", 0) >= 8:
            return "matriz_detectada_pendiente_homologacion"
        # En Excel una tabla con miles de filas puede ser un cruce, no entrevistados.
        if m.get("tipo") == "xlsx":
            return "hoja_descargada_sin_matriz_individual_confirmada"
    return "archivo_descargado_sin_matriz_confirmada"


def audit(study):
    id_, url = study["id"], study["archivo"]
    result = {"id": id_, "productor": study["productor"], "fecha": study["fecha"],
              "url": url, "estado": "pendiente", "es_pronostico": False}
    try:
        validate_url(url)
        data = fetch_bytes(url)
        suffix = Path(urllib.parse.urlsplit(url).path).suffix.lower()
        meta = inspect(data, suffix)
        result.update({"bytes": len(data), "sha256": hashlib.sha256(data).hexdigest(),
                       "estructura": meta, "estado": classify(meta)})
    except urllib.error.HTTPError as e:
        result.update({"estado": "descarga_fallida", "error": "HTTP_" + str(e.code)})
    except urllib.error.URLError:
        result.update({"estado": "descarga_fallida", "error": "conexion_no_disponible"})
    except Exception as e:
        result.update({"estado": "descarga_fallida", "error": str(e)[:85] if isinstance(e, (ValueError, RuntimeError)) else type(e).__name__})
    return result


def candidates(catalog, limit=12):
    if not isinstance(catalog.get("estudios"), list):
        raise ValueError("catalogo_sin_estudios")
    by_id = {}
    for study in catalog["estudios"]:
        if not all(study.get(k) for k in FIELDS) or study.get("fecha", "") < "2025-01-01":
            continue
        try:
            validate_url(study["archivo"])
        except ValueError:
            continue
        by_id.setdefault(study["id"], study)
    # Priorizar encuestas nacionales recientes sin auditoría previa y restringir el coste.
    return sorted(
        by_id.values(), key=lambda s: (
            s.get("estado") != "enlace_documentado",
            s.get("ambito") != "España",
            -int(s["fecha"].replace("-", "")),
            s["id"],
        )
    )[:limit]



def read_discoveries(catalog):
    """Conecta el resultado REAL del buscador al siguiente paso de descarga.

    Solo admite URLs de archivos vistas en páginas oficiales, en hosts aprobados.
    No interpreta noticias RSS como descargas. No persiste respuestas individuales.
    """
    from datetime import timedelta
    try:
        req = urllib.request.Request(
            SCAN_URL,
            headers={"Accept": "application/json", "Origin": "https://bhermoso.github.io"},
        )
        with urllib.request.urlopen(req, timeout=12) as response:
            raw = response.read(400001)
        if len(raw) > 400000:
            raise ValueError("cache_excesiva")
        data = json.loads(raw)
        checked = datetime.fromisoformat(data["checked_at"].replace("Z", "+00:00"))
        if datetime.now(timezone.utc) - checked > timedelta(days=8):
            return []
        known = {x.get("archivo", "").split("?")[0] for x in catalog["estudios"]}
        allowed_sources = {"40db", "gad3", "more-in-common", "sociometrica", "cemop"}
        out = []
        for row in data.get("candidates", [])[:120]:
            if row.get("tipo") != "enlace_a_archivo":
                continue
            source = str(row.get("fuente", "")).lower().strip()
            if source not in allowed_sources:
                continue
            url = row.get("url")
            try:
                validate_url(url)
            except (ValueError, TypeError):
                continue
            if url.split("?")[0] in known:
                continue
            known.add(url.split("?")[0])
            out.append({
                "id": "hallazgo-" + hashlib.sha256(url.split("?")[0].encode()).hexdigest()[:16],
                "productor": source, "fecha": checked.date().isoformat(),
                "ambito": "Por verificar", "archivo": url,
                "estado": "candidato_documental", "origen": "scan_supabase",
            })
        return out[:10]
    except (ValueError, KeyError, TimeoutError, OSError, urllib.error.URLError,
            json.JSONDecodeError) as exc:
        print("Hallazgos Supabase no disponibles; se utiliza catálogo: " + type(exc).__name__)
        return []

def build(previous, results, now):
    prior = {x["id"]: x for x in previous.get("archivos", [])}
    archived = []
    for record in sorted(results, key=lambda r: r["id"]):
        old = prior.get(record["id"], {})
        # La marca temporal no cambia cuando el resultado y la huella permanecen iguales.
        comparable = {k: v for k, v in record.items() if k != "verificado_en"}
        old_comparable = {k: v for k, v in old.items() if k != "verificado_en"}
        record["verificado_en"] = old.get("verificado_en") if comparable == old_comparable else now
        archived.append(record)
    for key, old in sorted(prior.items()):
        if key not in {r["id"] for r in archived}:
            archived.append(old)
    archived.sort(key=lambda row: row["id"])
    return {"esquema": 1, "fuente": "enlaces_originales_publicos",
            "nota": "Auditoría técnica no equivale a autorización de redistribución, homologación de variables ni elegibilidad para Motor 29N. Ninguna respuesta individual se guarda en GitHub.",
            "archivos": archived}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=18)
    ap.add_argument("--sin-hallazgos", action="store_true", help="No consultar la búsqueda reciente")
    ap.add_argument("--output", default=str(OUTPUT))
    args = ap.parse_args()
    if not 1 <= args.limit <= 25:
        raise SystemExit("--limit debe estar entre 1 y 25")
    catalog = json.loads(CATALOG.read_text(encoding="utf-8"))
    studies = candidates(catalog, args.limit)
    if not args.sin_hallazgos:
        fresh = read_discoveries(catalog)
        # Los hallazgos del buscador se prueban antes que los enlaces antiguos.
        studies = (fresh + studies)[:args.limit]
    if not studies:
        raise SystemExit("Ningún enlace autorizado en catálogo")
    output = Path(args.output)
    previous = json.loads(output.read_text()) if output.exists() else {}
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
        rows = list(pool.map(audit, studies))
    result = build(previous, rows, datetime.now(timezone.utc).isoformat(timespec="seconds"))
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    for row in rows:
        m = row.get("estructura") or {}
        print(json.dumps({"id": row["id"], "estado": row["estado"],
                          "sha256": row.get("sha256"), "bytes": row.get("bytes"),
                          "matrices_detectadas": m.get("ficheros_tabulares", 0),
                          "error": row.get("error")}, ensure_ascii=False))
    print("Resumen:", len(rows), "archivos intentados;",
          sum("descargad" in r["estado"] or "matriz_detectada" in r["estado"] for r in rows),
          "descargas comprobadas; ninguna entrevista publicada.")


if __name__ == "__main__":
    main()

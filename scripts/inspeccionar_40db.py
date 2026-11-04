#!/usr/bin/env python3
"""Audita METADATOS de ZIP públicos de 40dB, nunca filas ni respuestas.

Uso:
  python scripts/inspeccionar_40db.py 40db-2026-10-flash /ruta/descargables.zip
  python scripts/inspeccionar_40db.py 40db-2026-10-flash /ruta/descargables.zip --salida auditoria.json

No descarga archivos, no descomprime, no infiere códigos electorales y no altera
el motor de pronóstico. El archivo original permanece en el equipo local.
"""
import argparse
import hashlib
import json
from pathlib import Path, PurePosixPath
import zipfile

ROOT = Path(__file__).resolve().parents[1]
FUENTES = ROOT / "data" / "microdatos" / "fuentes-40db.json"
DATOS = {".csv", ".xlsx", ".xls", ".sav", ".dta", ".ods", ".parquet"}
DOCUMENTACION = {".pdf", ".doc", ".docx", ".txt", ".rtf", ".html", ".htm"}


def resumen_zip(archivo):
    """Devuelve solo nombre, extensión, tamaño y hash del contenedor ZIP."""
    archivo = Path(archivo)
    sha = hashlib.sha256()
    with archivo.open("rb") as fp:
        for bloque in iter(lambda: fp.read(1024 * 1024), b""):
            sha.update(bloque)

    if not zipfile.is_zipfile(archivo):
        raise ValueError("El archivo no es un ZIP válido")
    formatos = {}
    miembros = []
    with zipfile.ZipFile(archivo) as zf:
        infos = zf.infolist()
        if len(infos) > 10000:
            raise ValueError("ZIP con demasiadas entradas para auditar")
        for item in infos:
            if item.is_dir():
                continue
            nombre = item.filename
            partes = PurePosixPath(nombre).parts
            if (not partes or nombre.startswith("/") or "\\" in nombre
                    or ".." in partes or ":" in partes[0]):
                raise ValueError("Ruta ZIP no segura; auditoría detenida")
            if item.flag_bits & 1:
                raise ValueError("ZIP con entradas cifradas; auditoría detenida")
            ext = PurePosixPath(nombre).suffix.lower()
            categoria = ("matriz_posible" if ext in DATOS
                         else "documentacion_posible" if ext in DOCUMENTACION
                         else "otro")
            formatos[ext or "(sin_extension)"] = formatos.get(ext or "(sin_extension)", 0) + 1
            miembros.append({"nombre": nombre, "extension": ext,
                             "bytes_descomprimidos_declarados": item.file_size,
                             "categoria": categoria})
    return {"sha256_zip": sha.hexdigest(), "n_archivos": len(miembros),
            "formatos": dict(sorted(formatos.items())), "archivos": miembros,
            "contenido_leido": False, "respuestas_publicadas": False}


def auditar(estudio, archivo, catalogo=FUENTES):
    fuentes = json.loads(Path(catalogo).read_text(encoding="utf-8"))["fuentes"]
    fuente = next((x for x in fuentes if x["id"] == estudio), None)
    if fuente is None:
        raise ValueError("Estudio desconocido: consultar fuentes-40db.json")
    return {"estudio": estudio, "fuente": fuente["pagina"],
            "archivo_original": fuente["zip"],
            "estado": "zip_local_metadatos_auditados_no_homologado",
            "no_utilizar_para_pronostico": True, **resumen_zip(archivo)}


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("estudio", help="Identificador registrado en fuentes-40db.json")
    p.add_argument("archivo", type=Path, help="Ruta local a ZIP descargado manualmente")
    p.add_argument("--salida", type=Path, help="JSON de metadatos (sin respuestas individuales)")
    args = p.parse_args()
    informe = auditar(args.estudio, args.archivo)
    texto = json.dumps(informe, ensure_ascii=False, indent=2) + "\n"
    if args.salida:
        args.salida.write_text(texto, encoding="utf-8")
    else:
        print(texto, end="")


if __name__ == "__main__":
    main()

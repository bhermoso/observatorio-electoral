#!/usr/bin/env python3
"""Reconocimiento reproducible de microdatos More in Common 2026.

Lee en memoria los originales públicos cotejados con SHA-256; NO publica respuestas
individuales, cruces, frecuencias pequeñas, ni usa datos en el pronóstico.
Extrae SOLO metadatos del SAV, nombres de documentos y vocabulario categórico.
Los códigos son declarados por la fuente; ninguna etiqueta se infiere por nombre.
"""
from __future__ import annotations
import argparse
import hashlib
import io
import json
import re
import tempfile
import zipfile
from datetime import datetime, timezone
from pathlib import Path

from auditar_microdatos_catalogo import fetch_bytes

AUDIT = Path("data/microdatos/estado-descargas.json")
OUTPUT = Path("data/microdatos/homologacion-more-in-common-2026.json")
ALLOWED = {
    "more-in-common-2026-05-01": ("3a65823bcbd3b94df84f77650755f8bdf47b22e0ab4a4c252136d986a2b5b3f8", 286799),
    "more-in-common-2026-07-01": ("6d369d9d91ccda486cddc64ba7cb80af265b263e12e413696c5c42fb843b0a71", 270287),
    "more-in-common-2026-09-01": ("8f31b4042f7219903ba698d2955bf868ceee2c3ae4a86eea1939ece3c0821b27", 293998),
    "more-in-common-2026-10-01": ("813f5a4f7b8cad45bb4f184b7744e4937d8651b34a09bee93b149513c9ff106f", 615299),
}
ROLES = {
    "participacion_2023_raw": "recuerdo_participacion_bruto",
    "participacion_2023_final": "recuerdo_participacion_transformado",
    "voto_2023_raw": "recuerdo_voto_bruto",
    "voto_2023_final": "recuerdo_voto_transformado",
    "prob_voto_declarada": "probabilidad_participacion",
    "intencion_voto_raw": "intencion_declarada_bruta",
    "intencion_voto_simpatia": "intencion_y_simpatia_transformada",
    "intencion_voto_final": "intencion_final_fuente_sin_interpretar",
    "simpatia_partido": "simpatia",
}
RE_WEIGHT = re.compile(r"^(peso|weight|pond|factor)(?:[ _a-z0-9]*)$", re.I)
RE_PREFERENCE = re.compile(r"^prob_voto_", re.I)
EXCLUDE = re.compile(r"(_otros|_abierta|_texto|_open|_id|_email)$", re.I)
MAX_MEMBERS, MAX_EXPANDED = 75, 60_000_000


def short(text, limit=160):
    return str(text or "").replace("\x00", "").replace("\n", " ").replace("\r", " ").strip()[:limit]


def select_role(name):
    # Texto abierto y variables de identificación jamás se exportan.
    if EXCLUDE.search(name):
        return None
    if name in ROLES:
        return ROLES[name]
    if RE_PREFERENCE.match(name):
        return "probabilidad_voto_por_partido"
    if RE_WEIGHT.match(name):
        return "ponderacion_candidata_sin_validar"
    return None


def check_archive(data, study):
    target, size = ALLOWED[study]
    if len(data) != size or hashlib.sha256(data).hexdigest() != target:
        raise ValueError("Original distinto del certificado de custodia")
    if not zipfile.is_zipfile(io.BytesIO(data)):
        raise ValueError("Original no es ZIP")
    return target


def examine_zip(data, study):
    """Inspecciona estructura y etiquetas; nunca lee filas de respuestas."""
    try:
        import pyreadstat
    except ImportError as exc:
        raise RuntimeError("Falta pyreadstat==1.3.2 para validar SAV") from exc
    digest = check_archive(data, study)
    with zipfile.ZipFile(io.BytesIO(data)) as archive:
        files = [f for f in archive.infolist() if not f.is_dir() and not f.filename.startswith("__MACOSX")]
        if len(files) > MAX_MEMBERS or sum(f.file_size for f in files) > MAX_EXPANDED:
            raise ValueError("Límites de ZIP superados")
        if any(f.file_size > 40_000_000 or (f.compress_size and f.file_size/f.compress_size > 300) for f in files):
            raise ValueError("ZIP con miembro excesivo")
        # Solo nombres de archivo de la fuente, nunca contenidos del codebook.
        document_names = sorted(short(Path(f.filename).name,90) for f in files
            if Path(f.filename).suffix.lower() in {".pdf",".txt",".md",".docx",".xlsx"})
        savs = sorted((f for f in files if Path(f.filename).suffix.lower() == ".sav"), key=lambda f: f.file_size, reverse=True)
        if not savs:
            raise ValueError("No hay SAV de entrevistas; se requiere revisión manual")
        if len(savs) > 3:
            raise ValueError("Demasiadas matrices SAV ambiguas")
        matrices = []
        for zfile in savs:
            with tempfile.TemporaryDirectory() as temp:
                path = Path(temp)/"matriz.sav"
                path.write_bytes(archive.read(zfile))
                try:
                    _,meta = pyreadstat.read_sav(str(path),metadataonly=True,output_format="dict")
                except Exception:
                    _,meta = pyreadstat.read_sav(str(path),metadataonly=True,output_format="dict",encoding="latin1")
            variables = []
            for i,name in enumerate(meta.column_names):
                role = select_role(name)
                if role is None:
                    continue
                code_map = meta.variable_value_labels.get(name) or {}
                # Son etiquetas del libro de códigos, NO frecuencias ni respuestas individuales.
                codes = [{"codigo":short(k,45),"etiqueta":short(v,130)}
                         for k,v in sorted(code_map.items(),key=lambda p:str(p[0]))[:40]]
                variables.append({
                    "nombre": short(name,80),
                    "funcion_provisional": role,
                    "etiqueta_documentada": short(meta.column_labels[i] if i<len(meta.column_labels) else "",170),
                    "categorias_documentadas": codes,
                    "categorias_truncadas": len(code_map)>len(codes),
                    "codigos_verificados": bool(code_map),
                    "uso_en_motor": False
                })
            matrices.append({
                "archivo":short(Path(zfile.filename).name,100),
                "filas":int(meta.number_rows or 0),
                "columnas":int(meta.number_columns or len(meta.column_names)),
                "variables_relevantes":variables,
            })
        return {
            "id":study,"sha256":digest,"tamano_bytes":len(data),
            "documentos":document_names,"matrices":matrices,
            "estado":"metadatos_extraidos_pendientes_de_revision_semantica",
            "entra_en_motor_29n":False,
        }


def summarize(studies):
    available={}
    for s in studies:
        present={v["funcion_provisional"] for m in s["matrices"] for v in m["variables_relevantes"]}
        available[s["id"]]=sorted(present)
    common=sorted(set.intersection(*(set(v) for v in available.values()))) if available else []
    return {
        "roles_presentes_por_estudio":available,
        "roles_presentes_en_todos":common,
        "nota":"Compartir nombre o función provisional no valida códigos, población, periodo, peso ni comparabilidad."
    }


def build(studies):
    if not studies:
        raise ValueError("No se puede publicar homologación sin estudios")
    return {
        "esquema":1,
        "generado_en":datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "fuente":"More in Common España · Pulso electoral",
        "metodo":"Metadatos SPSS originales con SHA-256; metadataonly=True; sin leer entrevistas",
        "limites":[
            "Los nombres sugieren funciones; hace falta verificar cuestionario y libro de códigos.",
            "La variable terminada en final NO equivale por sí misma a estimación publicada.",
            "La ponderación no se aplicará hasta identificar pesos y universos correctos.",
            "No se publican microdatos, respuestas individuales ni tablas de contingencia.",
            "Ningún estudio pasa automáticamente al Motor 29N."
        ],
        "estudios":studies,
        "comparabilidad_provisional":summarize(studies),
        "motor_29n_modificado":False
    }


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--output",default=str(OUTPUT))
    args=parser.parse_args()
    manifest=json.loads(AUDIT.read_text(encoding="utf-8"))
    approved={r["id"]:r for r in manifest["archivos"] if r.get("id") in ALLOWED}
    if set(approved)!=set(ALLOWED):
        raise ValueError("Faltan originales en el manifiesto auditado")
    studies=[]
    for id_ in sorted(ALLOWED):
        entry=approved[id_]
        if entry.get("sha256")!=ALLOWED[id_][0] or entry.get("bytes")!=ALLOWED[id_][1]:
            raise ValueError("La huella auditada ha cambiado: "+id_)
        print("Reconociendo metadatos originales: "+id_,flush=True)
        zip_bytes=fetch_bytes(entry["url"])
        record=examine_zip(zip_bytes,id_)
        studies.append(record)
        print("  matrices:",len(record["matrices"]),
              "variables relevantes:",sum(len(m["variables_relevantes"]) for m in record["matrices"]),
              "filas:",",".join(str(m["filas"]) for m in record["matrices"]),flush=True)
    result=build(studies)
    target=Path(args.output);target.parent.mkdir(parents=True,exist_ok=True)
    target.write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("Metadatos guardados sin entrevistas; Motor 29N intacto.")


if __name__=="__main__":
    main()

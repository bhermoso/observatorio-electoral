"""Coteja los ZIP originales del CIS 3242 y 3263 con los agregados del repositorio.

Uso: python scripts/cotejar_originales_cis_2019.py MD3242.zip MD3263.zip
Opcional: --output resumen.json (solo indicadores agregados, sin respuestas).
"""
import argparse
import hashlib
import json
import math
import re
import zipfile
from pathlib import Path
from agregar_cis_2019 import process

ROOT = Path(__file__).resolve().parents[1]


def require_equal(condition, message):
    if not condition:
        raise ValueError(message)


def audit_one(study, path, manifest, reference):
    path = Path(path)
    require_equal(path.is_file(), f"{study}: fichero no encontrado")
    expected = manifest["studies"][study]
    old = reference["studies"][study]
    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    require_equal(digest == expected["archive_sha256"] == old["sha256"],
                  f"{study}: SHA-256 no coincide")
    with zipfile.ZipFile(path) as archive:
        for name, meta in expected["original_files"].items():
            require_equal(name in archive.namelist(), f"{study}: falta miembro {name}")
            info = archive.getinfo(name)
            require_equal(info.file_size <= 25 * 1024 * 1024,
                          f"{study}: miembro demasiado grande {name}")
            raw = archive.read(name)
            require_equal(hashlib.sha256(raw).hexdigest() == meta["sha256"],
                          f"{study}: SHA de {name} no coincide")
        syntax = archive.read("ES" + study).decode("latin1")
        header = syntax.split("VARIABLE LABELS", 1)[0]
        require_equal("WEIGHT BY PESO." in syntax,
                      f"{study}: ponderación nacional no documentada")
        for var, (start, end) in expected["variables"].items():
            matches = re.findall(
                r"(?<!\w)" + re.escape(var) + r"\s+(\d+)(?:-(\d+))?(?:\(\d+\))?",
                header)
            require_equal(
                any(int(a) == start and int(b or a) == end for a, b in matches),
                f"{study}: posición inesperada de {var}")
        require_equal("94 'No lo tiene decidido aún'" in syntax,
                      f"{study}: código de indecisión 94 no verificado")

    # La rutina original agrupa las respuestas: no exportamos entrevistas.
    actual = process(study, path)
    require_equal(actual["n"] == expected["n"] == old["n"],
                  f"{study}: número de entrevistas diferente")
    require_equal(math.isclose(actual["weighted_n"], old["weighted_n"], abs_tol=.02),
                  f"{study}: suma PESO distinta")
    require_equal(math.isclose(actual["kish_n"], old["kish_n"], abs_tol=.2),
                  f"{study}: Kish diferente")
    for name, value in old["intention"].items():
        observed = actual["intention"].get(name)
        require_equal(observed is not None and observed["n"] == value["n"],
                      f"{study}: casos de {name} distintos")
        require_equal(math.isclose(observed["w"], value["w"], abs_tol=.02),
                      f"{study}: peso de {name} distinto")
    for name, value in old["groups"].items():
        observed = actual["groups"][name]
        require_equal(observed["n"] == value["n"],
                      f"{study}: grupo {name} distinto")
        require_equal(math.isclose(observed["w"], value["w"], abs_tol=.02),
                      f"{study}: peso del grupo {name} distinto")
    return dict(study=study, original_sha256=digest, n=actual["n"],
                weighted_n=actual["weighted_n"], kish_n=actual["kish_n"],
                compared_intention_groups=len(old["intention"]),
                compared_response_groups=len(old["groups"]), status="COINCIDE",
                original_data_uploaded_to_repository=False)


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("zip3242", type=Path)
    parser.add_argument("zip3263", type=Path)
    parser.add_argument("--output", type=Path)
    opt = parser.parse_args(argv)
    manifest = json.loads(
        (ROOT / "data/microdatos/cotejo_originales_2019.json").read_text(
            encoding="utf-8"))
    reference = json.loads(
        (ROOT / "data/microdatos/diagnostico_2019_original.json").read_text(
            encoding="utf-8"))
    reports = [
        audit_one(study, path, manifest, reference)
        for study, path in [("3242", opt.zip3242), ("3263", opt.zip3263)]
    ]
    result = dict(status="VERIFICADO", studies=reports,
                  privacy="Sin entrevistas individuales ni datos de registro")
    if opt.output:
        opt.output.write_text(json.dumps(result, ensure_ascii=False, indent=2)
                              + "\n", encoding="utf-8")
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return result


if __name__ == "__main__":
    main()

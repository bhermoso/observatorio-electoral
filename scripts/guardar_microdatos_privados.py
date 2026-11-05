#!/usr/bin/env python3
"""Archivo privado de microdatos, ejecutado SOLO con OIDC firmado de GitHub Actions.
La descarga y la custodia se realizan en Supabase; no pasan ZIP al artefacto Actions.
"""
from __future__ import annotations
import argparse
import json
import os
import urllib.parse
import urllib.request
import urllib.error

AUDIENCE = "https://gjzihgfzxorpvevrrfkh.supabase.co/functions/v1/almacen-microdatos"
APPROVED = (
    "more-in-common-2026-05-01",
    "more-in-common-2026-07-01",
    "more-in-common-2026-09-01",
    "more-in-common-2026-10-01",
)


def oidc_token(env: dict) -> str:
    request_url = env.get("ACTIONS_ID_TOKEN_REQUEST_URL", "")
    bearer = env.get("ACTIONS_ID_TOKEN_REQUEST_TOKEN", "")
    if not request_url.startswith("https://") or not bearer:
        raise ValueError("Debe ejecutarse en GitHub Actions con id-token: write")
    params = urllib.parse.parse_qsl(urllib.parse.urlsplit(request_url).query)
    params.append(("audience", AUDIENCE))
    u = urllib.parse.urlsplit(request_url)
    target = urllib.parse.urlunsplit((u.scheme, u.netloc, u.path, urllib.parse.urlencode(params), u.fragment))
    req = urllib.request.Request(target, headers={"Authorization": "Bearer " + bearer})
    with urllib.request.urlopen(req, timeout=15) as response:
        token = json.load(response).get("value", "")
    if not token:
        raise RuntimeError("GitHub no ha entregado identidad OIDC")
    return token


def store(study_id: str, token: str, opener=urllib.request.urlopen):
    if study_id not in APPROVED:
        raise ValueError("Estudio no autorizado en el procedimiento")
    body = json.dumps({"study_id": study_id}).encode("utf-8")
    req = urllib.request.Request(AUDIENCE + "?action=store",
        data=body, method="POST",
        headers={"Authorization": "Bearer " + token, "Content-Type": "application/json"})
    try:
        with opener(req, timeout=85) as response:
            result = json.load(response)
    except urllib.error.HTTPError as err:
        try:
            payload = json.load(err)
            reason = payload.get("error", "error_del_servidor")
            detail = payload.get("detalle", "")
        except (ValueError, OSError):
            reason, detail = "respuesta_error", ""
        raise RuntimeError(f"Error al conservar {study_id}: {reason} {detail}") from None
    if result.get("ok") is not True or result.get("original_conservado") is not True or result.get("integridad_verificada") is not True:
        raise RuntimeError(f"El servidor no ha confirmado la conservación de {study_id}")
    return {k: result.get(k) for k in ("study_id", "sha256", "bytes", "ya_existia")}


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--study", default="todos", choices=("todos",) + APPROVED)
    args = p.parse_args()
    studies = APPROVED if args.study == "todos" else (args.study,)
    token = oidc_token(os.environ)
    failed = []
    for study in studies:
        try:
            result = store(study, token)
            print(f"Conservado en bucket privado: {result['study_id']} · SHA256 {str(result['sha256'])[:16]}… · {result['bytes']} bytes · preexistente={result['ya_existia']}")
        except (ValueError, RuntimeError, OSError, urllib.error.URLError) as error:
            print("No conservado: " + study + " (" + str(error)[:160] + ")")
            failed.append(study)
    print(f"Resultado: {len(studies)-len(failed)} de {len(studies)} originales recuperables. No se publica ninguna entrevista.")
    if failed:
        raise SystemExit(1)


if __name__ == "__main__":
    main()

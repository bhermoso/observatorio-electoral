"""Resume una ejecución del circuito de actualización en data/ingesta/estado.json.

Lee monitor-output/candidates.json (descubrimiento) y monitor-output/actualizacion.json
(incorporación). No inventa campos: lo que no consta queda en null.
Uso: python scripts/estado_actualizacion.py monitor-output [--run-url URL] [--recalculo-lanzado true|false]
"""
from __future__ import annotations
import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data/ingesta/estado.json"


def leer(ruta):
    try:
        return json.loads(Path(ruta).read_text(encoding="utf-8"))
    except (FileNotFoundError, json.JSONDecodeError):
        return None


def construir(carpeta, previo=None, run_url=None, recalculo=False, ahora=None):
    previo = previo or {}
    cand = leer(Path(carpeta) / "candidates.json") or {}
    inc = leer(Path(carpeta) / "actualizacion.json") or {}
    servicio = leer(Path(carpeta) / "servicio.json") or {}
    ahora = ahora or datetime.now(timezone.utc).isoformat()
    added = inc.get("added") or []
    errores = [f"{e.get('source')}: {e.get('detail')}" for e in cand.get("errors", [])]
    errores.extend(str(e) for e in servicio.get('errors', []))
    if not cand:
        errores.append("La búsqueda no generó informe válido (fallo del paso)")
    if not inc:
        errores.append("La incorporación no generó informe (fallo del paso)")
    return {
        "esquema": 1,
        "generado": ahora,
        "ejecucion": run_url,
        "ultima_busqueda": cand.get("checked_at"),
        "candidatos_detectados": len(cand.get("results", [])) if cand else None,
        "naturaleza_candidatos": "Titulares de Google News (RSS). No contienen cifras extraídas ni verificadas.",
        "errores_busqueda": errores,
        "bandeja_validadas": inc.get("candidates_approved"),
        "incorporadas": added,
        "ya_registradas": inc.get("already_registered") or [],
        "rechazadas": inc.get("rejected") or [],
        "registros_antes": inc.get("before"),
        "registros_despues": inc.get("after"),
        "ultima_incorporacion_efectiva": ahora if added else previo.get("ultima_incorporacion_efectiva"),
        "recalculo_lanzado": bool(recalculo),
        "ultimo_recalculo_lanzado": ahora if recalculo else previo.get("ultimo_recalculo_lanzado"),
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("carpeta")
    ap.add_argument("--run-url")
    ap.add_argument("--recalculo-lanzado", default="false")
    a = ap.parse_args()
    estado = construir(a.carpeta, leer(OUT), a.run_url, a.recalculo_lanzado == "true")
    OUT.write_text(json.dumps(estado, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(json.dumps(estado, ensure_ascii=False))


if __name__ == "__main__":
    main()

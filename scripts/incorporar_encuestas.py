"""Importa fichas previamente verificadas desde data/ingesta/validadas.json.

No convierte titulares RSS en encuestas. Solo añade fichas con fuente primaria
documentada que pasen el esquema y el detector de muestras repetidas.
"""
from __future__ import annotations
import argparse
import json
from datetime import datetime,timezone
from pathlib import Path
try:\n    from scripts.auditar_encuestas import audit\nexcept ModuleNotFoundError:\n    from auditar_encuestas import audit
ROOT=Path(__file__).resolve().parents[1]
INPUT=ROOT/"data/ingesta/validadas.json"
POLLS=ROOT/"data/polls.json"

def integrate(existing, proposals):
    if not isinstance(proposals,list):raise ValueError("La bandeja de aprobadas debe ser una lista")
    known={p["id"]:p for p in existing}
    added=[]
    skipped=[]
    for record in proposals:
        if not isinstance(record,dict) or not record.get("id"):raise ValueError("Ficha sin ID")
        key=record["id"]
        if key in known:
            if known[key]!=record:raise ValueError(f"{key}: cambio de registro ya publicado; requiere PR editorial")
            skipped.append(key)
            continue
        new=existing+[record]
        checking=audit(existing,new)
        if checking["errors"]:raise ValueError("; ".join(checking["errors"]))
        existing=new
        known[key]=record
        added.append(key)
    return existing,added,skipped

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--dry-run",action="store_true")
    ap.add_argument("--report",default="actualizacion-output")
    args=ap.parse_args()
    existing=json.loads(POLLS.read_text(encoding="utf-8"))
    proposals=json.loads(INPUT.read_text(encoding="utf-8")) if INPUT.exists() else []
    updated,added,skipped=integrate(existing,proposals)
    out=ROOT/args.report
    out.mkdir(exist_ok=True,parents=True)
    report={"checked_at":datetime.now(timezone.utc).isoformat(),
            "before":len(existing),"after":len(updated),"added":added,"already_registered":skipped,
            "candidates_approved":len(proposals),"published":not args.dry_run and bool(added)}
    (out/"actualizacion.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    (out/"actualizacion.md").write_text(
        "# Actualización de encuestas\n\n"+
        f"Antes: {len(existing)} · Después: {len(updated)}\n\n"+
        f"Incorporadas: {', '.join(added) or 'ninguna'}\n\n"+
        f"Ya registradas: {', '.join(skipped) or 'ninguna'}\n\n"+
        "Solo se aceptan registros contrastados previamente; los titulares detectados no cuentan como encuestas.\n",encoding="utf-8")
    if not args.dry_run and added:POLLS.write_text(json.dumps(updated,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(json.dumps(report,ensure_ascii=False))
if __name__=="__main__":main()

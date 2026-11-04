"""Importa fichas previamente verificadas desde data/ingesta/validadas.json.

No convierte titulares RSS en encuestas. Solo añade fichas con fuente primaria
documentada que pasen el esquema y el detector de muestras repetidas.
"""
from __future__ import annotations
import argparse
import json
from urllib.request import urlopen, Request
from urllib.error import HTTPError
from datetime import datetime,timezone
from pathlib import Path
try:
    from scripts.auditar_encuestas import audit
except ModuleNotFoundError:
    from auditar_encuestas import audit
ROOT=Path(__file__).resolve().parents[1]
INPUT=ROOT/"data/ingesta/validadas.json"
POLLS=ROOT/"data/polls.json"
SERVICE="https://gjzihgfzxorpvevrrfkh.supabase.co/functions/v1/encuestas"

def read_service():
    """Public read of editor-approved records; credentials stay on the service."""
    try:
        with urlopen(Request(SERVICE+"?action=approved",headers={"Accept":"application/json"}),timeout=30) as response:
            raw=response.read(2_000_001)
    except HTTPError as exc:
        if exc.code==451:return []  # Same publication blackout as the site.
        raise
    if len(raw)>2_000_000:raise ValueError("Respuesta del servicio demasiado grande")
    records=json.loads(raw)
    if not isinstance(records,list):raise ValueError("Bandeja del servicio inválida")
    return records

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

def integrate_each(existing, proposals):
    """Como integrate, pero una ficha inválida no bloquea a las demás: se rechaza con su motivo."""
    if not isinstance(proposals,list):raise ValueError("La bandeja de aprobadas debe ser una lista")
    added,skipped,rejected=[],[],[]
    for record in proposals:
        try:
            existing,a,s=integrate(existing,[record])
            added+=a;skipped+=s
        except ValueError as e:
            rejected.append({"id":str(record.get("id") or "sin-id") if isinstance(record,dict) else "sin-id","motivo":str(e)})
    return existing,added,skipped,rejected

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--dry-run",action="store_true")
    ap.add_argument("--report",default="actualizacion-output")
    ap.add_argument("--service",action="store_true",help="Añadir las fichas aprobadas desde el Observatorio")
    args=ap.parse_args()
    existing=json.loads(POLLS.read_text(encoding="utf-8"))
    proposals=json.loads(INPUT.read_text(encoding="utf-8")) if INPUT.exists() else []
    if args.service:proposals+=read_service()
    updated,added,skipped,rejected=integrate_each(existing,proposals)
    out=ROOT/args.report
    out.mkdir(exist_ok=True,parents=True)
    report={"checked_at":datetime.now(timezone.utc).isoformat(),
            "before":len(existing),"after":len(updated),"added":added,"already_registered":skipped,"rejected":rejected,
            "candidates_approved":len(proposals),"published":not args.dry_run and bool(added)}
    (out/"actualizacion.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    (out/"actualizacion.md").write_text(
        "# Actualización de encuestas\n\n"+
        f"Antes: {len(existing)} · Después: {len(updated)}\n\n"+
        f"Incorporadas: {', '.join(added) or 'ninguna'}\n\n"+
        f"Ya registradas: {', '.join(skipped) or 'ninguna'}\n\n"+
        f"Rechazadas: {'; '.join(r['id']+': '+r['motivo'] for r in rejected) or 'ninguna'}\n\n"+
        "Solo se aceptan registros contrastados previamente; los titulares detectados no cuentan como encuestas.\n",encoding="utf-8")
    if not args.dry_run and added:POLLS.write_text(json.dumps(updated,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(json.dumps(report,ensure_ascii=False))
if __name__=="__main__":main()

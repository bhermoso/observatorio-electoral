"""Audita incorporaciones al archivo electoral sin modificar registros originales.
Uso: python scripts/auditar_encuestas.py --base origin/main --out audit-output
"""
import argparse
import json
import re
import subprocess
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlsplit

ROOT=Path(__file__).resolve().parents[1]
REQUIRED=('id','institute','publisher','title','fieldStart','fieldEnd','published',
          'sample','scope','universe','scenario','denominator','source',
          'technical','verification','sourcePages','verified','values')

def norm(x):
    return re.sub(r'\s+',' ',str(x or '').strip().casefold())

def fingerprint(p):
    """Distingue revisiones de una misma muestra de sondeos de otra ola."""
    return (norm(p.get('institute')),p.get('fieldStart'),p.get('fieldEnd'),
            norm(p.get('scope')),norm(p.get('publisher')))

def assess(polls):
    errors=[]
    ids=Counter(str(p.get('id')) for p in polls)
    for key,count in ids.items():
        if count>1:errors.append(f'ID duplicado: {key}')
    groups={}
    for p in polls:
        pid=p.get('id','sin-id')
        absent=[k for k in REQUIRED if p.get(k) is None or p.get(k)=='' or p.get(k)=={}]
        if absent:errors.append(f'{pid}: faltan {", ".join(absent)}')
        if p.get('kind')!='poll-estimate':errors.append(f'{pid}: tipo no admitido')
        if not isinstance(p.get('sample'),int) or isinstance(p.get('sample'),bool) or p.get('sample',0)<=0:
            errors.append(f'{pid}: muestra inválida')
        for key in ('fieldStart','fieldEnd','published','verified'):
            try:datetime.strptime(p[key],'%Y-%m-%d')
            except (ValueError,KeyError,TypeError):errors.append(f'{pid}: fecha {key} inválida')
        if all(p.get(k) for k in ('fieldStart','fieldEnd','published','verified')):
            if not p['fieldStart']<=p['fieldEnd']<=p['published']<=p['verified']:
                errors.append(f'{pid}: secuencia temporal incoherente')
        for key in ('source','technical'):
            if urlsplit(str(p.get(key,''))).scheme!='https':
                errors.append(f'{pid}: fuente {key} debe ser https')
        if not isinstance(p.get('values'),dict) or not p['values']:
            errors.append(f'{pid}: porcentajes sin verificar')
        else:
            for party,val in p['values'].items():
                if isinstance(val,bool) or not isinstance(val,(int,float)) or not 0<=val<=100:
                    errors.append(f'{pid}: porcentaje inválido de {party}')
        if any(token in norm(p.get('scope')) for token in ('andalucía','madrid','cataluña','galicia')):
            # Posibles sondeos regionales deben registrarse fuera del promedio nacional.
            if norm(p.get('scope')) not in ('españa','españa, excepto ceuta y melilla'):
                errors.append(f'{pid}: ámbito territorial requiere revisión de elegibilidad nacional')
        groups.setdefault(fingerprint(p),[]).append(pid)
    for key,studies in groups.items():
        if len(studies)>1:errors.append('Posible misma muestra duplicada: '+', '.join(studies))
    return errors

def read_base(ref):
    if not ref:return []
    try:
        raw=subprocess.check_output(['git','show',f'{ref}:data/polls.json'],cwd=ROOT,text=True,stderr=subprocess.PIPE)
    except subprocess.CalledProcessError as exc:
        raise RuntimeError(f'No se puede comparar con {ref}: {exc.stderr[:200]}') from exc
    return json.loads(raw)

def audit(before,after):
    errors=assess(after)
    old={p['id']:p for p in before}
    new={p['id']:p for p in after}
    added=[new[k] for k in sorted(new.keys()-old.keys())]
    changed=[new[k] for k in sorted(new.keys()&old.keys()) if new[k]!=old[k]]
    removed=sorted(old.keys()-new.keys())
    if removed:errors.append('Eliminaciones requieren revisión expresa: '+', '.join(removed))
    return {'checked_at':datetime.now(timezone.utc).isoformat(),
            'old_count':len(before),'new_count':len(after),
            'added':[{'id':p['id'],'institute':p['institute'],'published':p['published'],'source':p['source']} for p in added],
            'changed':[p['id'] for p in changed],'removed':removed,'errors':errors,
            'recalculate_model':bool(added or changed or removed) and not errors}

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument('--base',default=None)
    ap.add_argument('--out',default='audit-output')
    args=ap.parse_args()
    before=read_base(args.base)
    after=json.loads((ROOT/'data/polls.json').read_text(encoding='utf-8'))
    result=audit(before,after)
    dest=Path(args.out);dest.mkdir(parents=True,exist_ok=True)
    (dest/'auditoria.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    lines=['# Auditoría de encuestas','',f"Antes: {result['old_count']} · Después: {result['new_count']}",
           '',f"Incorporaciones ({len(result['added'])}):"]
    lines += [f"- {p['institute']} · {p['id']} · {p['published']} · {p['source']}" for p in result['added']]
    lines += ['',f"Correcciones: {', '.join(result['changed']) or 'ninguna'}",
              f"Eliminaciones: {', '.join(result['removed']) or 'ninguna'}",
              '',f"Problemas detectados: {len(result['errors'])}"]
    lines += [f"- {e}" for e in result['errors']]
    lines += ['', 'El recálculo del Motor 29N se ejecuta en pages.yml después de integrar cambios en main.']
    (dest/'auditoria.md').write_text('\n'.join(lines)+'\n',encoding='utf-8')
    print('\n'.join(lines))
    if result['errors']:raise SystemExit(1)

if __name__=='__main__':main()

#!/usr/bin/env python3
"""Referencia descriptiva R0: peso original e intención, sin selección PROBVOTO.
Uso: python scripts/generar_linea_base_originales.py MD3411.zip MD3415.zip
No decide ni activa una receta de pronóstico; solo escribe agregados.
"""
import hashlib,json,math,sys
from collections import defaultdict
from pathlib import Path
import cocina_cis as C
from auditar_componentes_originales import metrics
ROOT=Path(__file__).resolve().parents[1]
def main():
 if len(sys.argv)!=3:raise SystemExit(__doc__)
 out=dict(esquema=1,estado='referencia_descriptiva_no_receta_aprobada',entrada_motor=False,
   filtro='PESO finito positivo; sin seleccionar por recuerdo, simpatía ni PROBVOTO',
   medidas='Intención original; todas las entrevistas elegibles y voto válido se muestran como denominadores distintos.',estudios={})
 for study,path in zip(('3411','3415'),sys.argv[1:]):
  rows,sha=C.leer(path,study);eligible=[r for r in rows if math.isfinite(r['peso']) and r['peso']>0];w=[r['peso'] for r in eligible]
  result=metrics(eligible,w,'intencion');allmass=defaultdict(float)
  for r,x in zip(eligible,w):allmass[r['intencion']]+=x
  result['porcentaje_todas_categorias']={p:100*v/sum(w) for p,v in sorted(allmass.items())}
  out['estudios'][study]=dict(n_original=len(rows),sha256_zip=sha,**result)
 out['dependencias_sha256']={str(p.relative_to(ROOT)):hashlib.sha256(p.read_bytes()).hexdigest() for p in [Path(__file__).resolve(),ROOT/'scripts/cocina_cis.py',ROOT/'scripts/auditar_componentes_originales.py']}
 p=ROOT/'data/microdatos/linea-base-originales.json';p.write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n');print({k:(v['n_original'],v['n_cohorte'],round(v['kish_cohorte'],2)) for k,v in out['estudios'].items()})
if __name__=='__main__':main()

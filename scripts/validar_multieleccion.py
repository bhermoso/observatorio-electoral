#!/usr/bin/env python3
"""Genera evidencia retrospectiva reproducible; no modifica el pronóstico principal."""
from pathlib import Path
import hashlib
import json
import os
import subprocess
import sys
from datetime import date
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT))
from modelo.motor import fuentes as F
from modelo.motor.validacion_multieleccion import evaluar, aprender, predecir

def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def main():
    data=ROOT/'data/historico/multieleccion.json';d=json.loads(data.read_text());ciclos=d['elecciones'];enc=d['encuestas']
    # Existing 2023 sources already contain explicit dates and provenance. No
    # inferred publications from the older undated Wikipedia CSV are allowed.
    e23=[e for e in F.todas() if date(2023,1,1)<=e['campo_fin']<date(2023,7,23) and e.get('publicacion') and e['origen']!='prensa-sin-verificar']
    for e in e23:enc.append(dict(e,eleccion='2023-07-23'))
    ciclos.append(dict(fecha='2023-07-23',fecha_publicacion_resultado='2023-09-01',resultado=F.resultado_23j(),fuente='data/election.json · BOE-A-2023-18907'))
    result=evaluar(ciclos,enc)
    result['ampliacion_candidaturas']={}
    for party in ('CS','VOX','IU','UPYD','SUMAR'):
        own_cycles=[c for c in ciclos if party in c['resultado']]
        if not own_cycles:continue
        extra=evaluar(own_cycles,enc,partidos=(party,))
        extra['advertencias']=['Soporte propio de esta candidatura en las convocatorias indicadas; no fusionar con el promedio primario PP/PSOE.','Mismas entradas entre comparadores para cada candidatura/corte. Ninguna coalición se traslada automáticamente a otra elección.','Sin evaluación territorial ni validación independiente del Motor 29N.']
        result['ampliacion_candidaturas'][party]=extra
    # Fixed sensitivity grid, not a search used to select production parameters.
    from datetime import timedelta
    sensitivity=[]
    for ciclo in ciclos:
        day=date.fromisoformat(ciclo['fecha']);cut=day-timedelta(days=7);prior,trained=aprender(ciclos,enc,day,disponible_hasta=cut);own=[e for e in enc if e['eleccion']==ciclo['fecha']]
        for name,kw in [('central',{}),('industria_1.5',{'industria':1.5}),('tau_0.10',{'tau':.10}),('tau_0.20',{'tau':.20}),('ventana_90',{'ventana':90}),('solo_n_documentado',{'omitir_n_supuesto':True})]:
            p=predecir(own,cut,day,prior,**kw)
            sensitivity.append(dict(eleccion=ciclo['fecha'],escenario=name,estado='evaluado' if p else 'sin_datos',predicciones=p['predicciones'] if p else None,n_estudios=p['n_estudios'] if p else 0))
    result['sensibilidad']=sensitivity
    inputs=[data]+sorted((ROOT/'modelo/externos').glob('*.*'))+[ROOT/'data'/f for f in ('results.csv','districts.csv','polls.json','election.json')]
    code=sorted((ROOT/'modelo/motor').glob('*.py'))+[Path(__file__).resolve(),ROOT/'scripts/importar_historico_multieleccion.py']
    result['reproducibilidad']=dict(commit_base=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),
       cambios_locales=bool(subprocess.check_output(['git','status','--porcelain'],cwd=ROOT,text=True).strip()),
       sha256={str(p.relative_to(ROOT)):sha(p) for p in inputs+code if p.is_file()},semilla_bootstrap=20261112,replicas_bootstrap=10000,
       prediccion='analítica; sin Monte Carlo',comando='OPENBLAS_NUM_THREADS=1 OMP_NUM_THREADS=1 python scripts/validar_multieleccion.py',
       numpy=__import__('numpy').__version__,scipy=__import__('scipy').__version__)
    out=ROOT/'modelo/validacion/multieleccion.json';out.parent.mkdir(exist_ok=True);out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
    lines=['# Evaluación retrospectiva nacional parcial','',f"{result['elecciones_independientes']} elecciones; {result['cortes_evaluados']} cortes correlacionados. Soporte: PP y PSOE. Nivel 3 para estos comparadores; el Motor 29N completo no queda validado.",'','| Variante | MAE pp | RMSE pp | Sesgo pp | Cobertura 90 % | Anchura pp |','|---|---:|---:|---:|---:|---:|']
    for v,m in result['resumen'].items():lines.append(f"| {v} | {m['mae']:.3f} | {m['rmse']:.3f} | {m['sesgo']:+.3f} | {m['cobertura90']:.1%} | {m['anchura90']:.3f} |")
    lines+=['']+['- '+s for s in result['advertencias']]+['','JSON: `modelo/validacion/multieleccion.json`. Contiene admisiones por corte, entrenamiento, errores por candidatura, fuentes y huellas del código/datos.']
    (out.with_suffix('.md')).write_text('\n'.join(lines)+'\n');print('\n'.join(lines[:14]))
if __name__=='__main__':main()

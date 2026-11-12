"""Manifiesto verificable de código y entradas agregadas, sin entrevistas."""
from pathlib import Path
import hashlib
import json
import subprocess
from .fuentes import RAIZ

def estado_evaluacion():
    p=Path(RAIZ)/'modelo/validacion/multieleccion.json'
    if not p.exists():return dict(estado='sin_artefacto',validacion_independiente=False)
    d=json.loads(p.read_text())
    return dict(estado=d['estado'],nivel_modelo_operativo=2,nivel_comparadores_nacionales=3,
                elecciones_independientes=d['elecciones_independientes'],universo=d['universo'],
                modelo_operativo_29n_evaluado=False,validacion_independiente=False,
                archivo='data/ciencia/multieleccion.json',sha256=hashlib.sha256(p.read_bytes()).hexdigest())

def manifiesto_operativo(encuestas,corte,n_solicitado):
    root=Path(RAIZ)
    paths=sorted(set((root/'modelo/motor').glob('*.py'))|set((root/'modelo/externos').glob('*.*'))|
        set((root/'modelo/microdatos').glob('*.json'))|{root/'modelo/__main__.py'}|
        {root/'data'/x for x in ('polls.json','events.json','election.json','districts.csv','results.csv','references.json')})
    hashes={str(p.relative_to(root)):hashlib.sha256(p.read_bytes()).hexdigest() for p in paths if p.is_file()}
    try:
        commit=subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip()
        dirty=bool(subprocess.check_output(['git','status','--porcelain'],cwd=root,text=True).strip())
    except (OSError,subprocess.CalledProcessError):commit=None;dirty=None
    from . import pronostico as P
    return dict(esquema=1,commit=commit,arbol_con_cambios=dirty,sha256=hashes,corte=str(corte),
        estudios_admitidos=sorted(e['estudio'] for e in encuestas),n_solicitado=n_solicitado,
        n_por_variante_principal=max(n_solicitado//2,500),
        semillas={v:sum(map(ord,v))+corte.toordinal() for v in P.VARIANTES},
        parametros=dict(tau=.15,industria=P.INDUSTRIA_PRINCIPAL,rho_bloque=P.RHO_BLOQUE,sd_prov=.08,
                        correccion_industria=P.FRACCION_SESGO,mezcla='tres variantes, pesos iguales',publicacion='documentada'),
        reconstruccion='El historial se recalcula con este código; no equivale a pronósticos emitidos en esas fechas.',
        publicaciones_observadas='modelo/registro/publicados: solo capturas con evidencia de publicación real.')

#!/usr/bin/env python3
"""Contrastes identificables desde el cubo agregado; nunca inventa cruces ausentes."""
from pathlib import Path
import hashlib
import json
import math
ROOT=Path(__file__).resolve().parents[1]

def contrastar(cube, groups):
    """Misma elegibilidad PROBVOTO válida en ambos extremos; no cambia recuerdo.

    Las métricas 2 y 3 del cubo son PESO y PESO*PROBVOTO/10 sobre las mismas
    entrevistas con probabilidad válida. No hay sumas de pesos cuadrados: Kish
    no es recuperable. Las celdas NO_CANDIDATURA permanecen en la base total.
    """
    total=[sum(cell[2] for party in method for cell in party) for method in cube]
    if not math.isclose(total[0],total[1],abs_tol=.05):raise ValueError('Bases incompatibles entre preguntas')
    out={}
    for m,method in enumerate(cube):
        for metric,name in [(2,'peso'),(3,'participacion')]:
            counts={g:sum(method[i][r][metric] for r in range(2)) for i,g in enumerate(groups)}
            allbase=sum(counts.values());candbase=allbase-counts['NO_CANDIDATURA']
            if candbase<=0 or allbase<=0:raise ValueError('Denominador vacío')
            out[f'{m}_{name}']=dict(base_total=allbase,base_candidaturas=candbase,
                masa=counts,porcentaje_total={g:100*v/allbase for g,v in counts.items()},
                porcentaje_candidaturas={g:100*v/candbase for g,v in counts.items() if g!='NO_CANDIDATURA'})
    comparisons=[]
    for name,a,b in [('simpatia_peso','0_peso','1_peso'),('participacion_directa','0_peso','0_participacion'),('participacion_simpatia','1_peso','1_participacion')]:
        x,y=out[a],out[b];d={}
        for g in groups:
            if g=='NO_CANDIDATURA':continue
            numerator=100*(y['masa'][g]-x['masa'][g])/x['base_candidaturas']
            denominator=100*y['masa'][g]*(1/y['base_candidaturas']-1/x['base_candidaturas'])
            d[g]=dict(cambio_total_pp=y['porcentaje_total'][g]-x['porcentaje_total'][g],
                cambio_candidaturas_pp=y['porcentaje_candidaturas'][g]-x['porcentaje_candidaturas'][g],
                termino_numerador_pp=numerator,termino_denominador_pp=denominator)
        comparisons.append(dict(componente=name,base=a,alternativa=b,descomposicion=d))
    return dict(escenarios=out,comparaciones=comparisons)

def main():
    path=ROOT/'data/microdatos/cubo_decisiones_cis.json';source=json.loads(path.read_text());results={}
    for study,s in source['studies'].items():results[study]=contrastar(s['cube'],source['groups'])
    out=dict(esquema=1,naturaleza='contrastes_controlados_agregados_no_causales',entrada=str(path.relative_to(ROOT)),sha256=hashlib.sha256(path.read_bytes()).hexdigest(),
        elegibilidad='Mismas entrevistas con PESO admisible y PROBVOTO explícita 0–10 en cada estudio. Sin filtrar por recuerdo.',
        elecciones_con_resultado_observable=1,estudios_historicos=['3411','3415'],estudio_actual_no_evaluable='3582',
        participantes_exactos=None,n_efectivo=None,
        limitaciones=['El cubo no conserva n de PROBVOTO válida ni suma de pesos cuadrados; no se inventan n ni Kish.',
         'Directa y voto+simpatía cambian respuestas clasificadas como candidatura; se muestran bases totales, de candidaturas y el término algebraico de denominador.',
         'Recuerdo, transferencias e indecisos no son aislables con este cubo. Requieren cruces individuales o un cubo ampliado y homologación por ciclo.',
         'Dos estudios de 2023 no son dos elecciones. La receta adaptada de 2019 no es un contraste de componentes homologado.',
         'No se incorpora ninguna de estas recetas al pronóstico principal.'],estudios=results)
    target=ROOT/'data/microdatos/cohorte-comun.json';target.write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n');print('Cohorte común:',list(results),'· solo agregados · Kish no identificable')
if __name__=='__main__':main()

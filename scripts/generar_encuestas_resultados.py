#!/usr/bin/env python3
"""Exporta el archivo retrospectivo, sin entrenar ni cambiar el pronóstico."""
import csv
import hashlib
import json
import sys
from datetime import date
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT))
from modelo.motor import fuentes as F

def normalizar(e,eleccion):
    e=dict(e)
    try:
        for k in ('campo_ini','campo_fin','publicacion'):
            if isinstance(e.get(k),str):e[k]=date.fromisoformat(e[k])
    except ValueError:return None
    if not all(e.get(k) for k in ('campo_ini','campo_fin','publicacion')):return None
    if e.get('campo_supuesto') or e.get('fecha_publicacion_desconocida'):return None
    if not e['campo_ini']<=e['campo_fin']<=e['publicacion']<date.fromisoformat(eleccion):return None
    return dict(id=eleccion+':'+e['estudio'],eleccion=eleccion,estudio=e['estudio'],casa=F.casa_canonica(e['casa']),
        denominacion_original=e.get('denominacion_original',e['casa']),
        campo_ini=e['campo_ini'].isoformat(),campo_fin=e['campo_fin'].isoformat(),publicacion=e['publicacion'].isoformat(),
        voto=e['voto'],n=None if e.get('n_supuesto') else e.get('n'),modo=e.get('modo') or None,
        origen=e.get('origen'),contraste=e.get('contraste'),fuente=e.get('contraste_url') or e.get('url'),fuente_registro=e.get('url'),evidencia_publicacion=e.get('evidencia_publicacion',[]))

def generar():
    path=ROOT/'data/historico/multieleccion.json';d=json.loads(path.read_text());cycles=d['elecciones'];raw=list(d['encuestas'])
    official=json.loads((ROOT/'data/election.json').read_text())
    cycles.append(dict(fecha='2023-07-23',fecha_publicacion_resultado='2023-09-01',resultado=F.resultado_23j(),fuente=official['source'],agrupaciones_nota='PSOE incluye PSC; las demás agrupaciones siguen el mapa explícito de resultado_23j en modelo/motor/fuentes.py.'))
    for e in F.todas():
        if date(2023,1,1)<=e['campo_fin']<date(2023,7,23) and e.get('publicacion') and e['origen']!='prensa-sin-verificar':raw.append(dict(e,eleccion='2023-07-23'))
    with (ROOT/'data/districts.csv').open(encoding='utf-8-sig') as f:cycles[-1]['votos_validos']=sum(int(r['valid']) for r in csv.DictReader(f) if r['election']=='2023-07-23')
    rows=[];excluded=0
    for e in raw:
        row=normalizar(e,e['eleccion'])
        if row:rows.append(row)
        else:excluded+=1
    # IDs must identify a source study; never silently replace another record.
    ids=[r['id'] for r in rows]
    if len(ids)!=len(set(ids)):raise ValueError('Identificadores repetidos')
    files=[path,ROOT/'data/election.json',ROOT/'data/polls.json',ROOT/'data/results.csv',ROOT/'data/districts.csv',ROOT/'modelo/motor/fuentes.py',Path(__file__)]+sorted((ROOT/'modelo/externos').glob('*.*'))
    return dict(esquema=1,tipo='archivo_retrospectivo_descriptivo',soporte_comun=['PP','PSOE'],
        calidad=d['calidad'],reglas=dict(horizontes=[90,60,30,15,7],ventana_campo_dias=180,
        seleccion='Última publicación documentada de cada casa disponible al corte; desempate por fin de campo e identificador. Todas las candidaturas seleccionadas deben estar presentes.',
        deduplicacion='Misma casa, campo y voto sobre el soporte seleccionado: primera publicación conocida al corte.',
        error='Estimación menos resultado oficial, en puntos porcentuales. MAE: media del valor absoluto sobre las candidaturas seleccionadas.'),
        elecciones=cycles,encuestas=rows,excluidas_por_fechas=excluded,fuentes_conservadas=d['fuentes'],
        reproducibilidad=dict(comando='python scripts/generar_encuestas_resultados.py',sha256={str(p.relative_to(ROOT)):hashlib.sha256(p.read_bytes()).hexdigest() for p in files}))
if __name__=='__main__':
    out=ROOT/'data/historico/encuestas-resultados.json';data=generar();out.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n');print(f"{len(data['elecciones'])} elecciones; {len(data['encuestas'])} registros fechados; {data['excluidas_por_fechas']} excluidos por fechas.")

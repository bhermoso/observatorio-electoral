"""Inserta el taller calculado y conserva íntegro el corte visual anterior.

Uso: python scripts/actualizar_propuesta_taller.py original.html salida.html
La salida se guarda como nueva versión de la misma propuesta, no como sustituto del sitio publicado.
"""
import argparse
import json
import re
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]


def construir(original):
    if 'id="taller-data"' in original:raise ValueError('La entrada ya contiene el taller; usar el corte base conservado')
    data=json.loads((ROOT/'data/microdatos/taller-integrado.json').read_text())
    fragment=(ROOT/'propuesta-taller-fragmento.html').read_text()
    css=(ROOT/'taller-integrado.css').read_text()
    js=(ROOT/'taller-integrado-ui.mjs').read_text()
    text=original.replace('</style>',css+'\n</style>',1)
    text=re.sub(r'<title>.*?</title>','<title>Observatorio Electoral · El taller de cocina electoral</title>',text,count=1)
    text=re.sub(r'<nav aria-label="Principal">.*?</nav>',
        '<nav aria-label="Principal"><a href="#taller">Estimación</a><a href="#tl-cocina">La cocina</a><a href="#tl-comparar">Las casas</a><a href="#tl-evidencia">Evidencia</a><a href="#contexto">Eventos</a><a href="#historicas">Archivo</a></nav>',text,count=1)
    text=text.replace('<div class="intro">',fragment+'\n<details class="tl-archive" id="tl-archive"><summary>Archivo, evolución y motor anterior · conservar el recorrido completo</summary><p class="tl-subtle">El contenido de este archivo conserva el corte previo. Su pronóstico sobre estimaciones publicadas es una referencia distinta de los escenarios del taller superior. Los gráficos históricos pertenecen a ese motor anterior.</p>\n<div class="intro">',1)
    text=text.replace('</main>','</details>\n</main>',1)
    payload=json.dumps(data,ensure_ascii=False).replace('</','<\\/')
    text=text.replace('</body>',f'<script id="taller-data" type="application/json">{payload}</script>\n<script>\n{js}\n</script>\n</body>')
    text=text.replace('PROPUESTA VISUAL 01','TALLER EXPERIMENTAL · PROPUESTA 01')
    text=text.replace('PROPUESTA VISUAL / 01','TALLER / EXPERIMENTAL')
    text=text.replace('Interacciones de demostración · La web publicada y el modelo permanecen sin cambios',
        'Escenarios calculados · Propuesta sin despliegue en la web publicada')
    return text


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('original',type=Path);parser.add_argument('salida',type=Path)
    args=parser.parse_args()
    args.salida.write_text(construir(args.original.read_text()))

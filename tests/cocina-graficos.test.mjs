import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {evaluarRecetas,tablaEvaluacionMicrodatos} from '../evaluacion-microdatos.mjs';
import {extraerResultadosCocina,renderTablaCocina} from '../cocina-resultados.mjs';
const json=path=>JSON.parse(readFileSync(new URL(path,import.meta.url),'utf8'));

test('CIS y 40dB se visualizan sin ocultar las matrices auditables',()=>{
 const d=evaluarRecetas(json('../data/microdatos/auditoria_cocina_23j.json'),json('../data/microdatos/40db-retrospectiva-2023.json'));
 const html=tablaEvaluacionMicrodatos(d);
 assert.match(html,/cocina-error-figure/);
 assert.match(html,/cocina-error-track/);
 assert.match(html,/cocina-diff-zero/);
 assert.match(html,/cocina-diff-dot/);
 assert.equal((html.match(/class="cocina-diff-row"/g)||[]).length,8);
 assert.equal((html.match(/class="cocina-datos-detalle"/g)||[]).length,2);
 assert.match(html,/una sola elección observada/);
});
test('Medidas CIS muestran comparación gráfica sin confundir denominadores',()=>{
 const d=extraerResultadosCocina(json('../data/microdatos/analisis_3582.json'),json('../data/microdatos/auditoria_cocina_23j.json'));
 const html=renderTablaCocina(d);
 assert.match(html,/cocina-medidas-figura/);
 assert.equal((html.match(/class="cocina-medida-fila"/g)||[]).length,6);
 assert.match(html,/No se suman ni se interpretan como una secuencia causal/);
 assert.equal((html.match(/class="cocina-datos-detalle"/g)||[]).length,2);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {panelPartido,panelBloque,panelEncuesta} from '../portada-panel.mjs';
import {encuestasRecientes,renderHemiciclo,renderTarjetas} from '../portada-hub.mjs';
import {promedioPublicado,pollsFromModelInputs} from '../capas.mjs';

const forecast=JSON.parse(fs.readFileSync('modelo/salida/pronostico.json','utf8'));
const polls=JSON.parse(fs.readFileSync('data/polls.json','utf8'));
const prom=promedioPublicado(pollsFromModelInputs(forecast.entradas),{corte:forecast.corte});
const recientes=encuestasRecientes(forecast,polls,{limite:500});

test('panel de partido: capas, encuestas del promedio y provincias, sin huecos',()=>{
 for(const id of ['PP','PSOE','VOX','SUMAR','PODEMOS']){
  const html=panelPartido(id,{forecast,prom,recientes});
  assert.doesNotMatch(html.replace(/<[^>]+>/g,''),/NaN|undefined|null/);
  assert.match(html,/capa 3, referencia/);
  assert.match(html,/href="#pronostico-territorio"/);
 }
 const pp=panelPartido('PP',{forecast,prom,recientes});
 assert.match(pp,/Encuestas del promedio/);
 assert.match(pp,/Dónde saca sus escaños/);
});
test('panel de bloque y de encuesta',()=>{
 assert.match(panelBloque('PP+VOX',{forecast}),/176 o más/);
 const x=recientes[0];
 const html=panelEncuesta(x);
 assert.match(html,/Trabajo de campo/);
 assert.doesNotMatch(html.replace(/<[^>]+>/g,''),/NaN|undefined/);
});
test('la portada marca qué abre el panel',()=>{
 assert.match(renderHemiciclo(forecast),/data-panel="partido:PP"/);
 assert.match(renderHemiciclo(forecast),/data-panel="bloque:PP\+VOX"/);
 assert.match(renderTarjetas(recientes.slice(0,2)),/data-panel="encuesta:/);
 assert.match(fs.readFileSync('home-impact.mjs','utf8'),/bindPanel\(root,/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {history,territory} from '../pronostico-vista.mjs';

test('pronóstico territorial muestra 12 barras y retiene 52 circunscripciones en detalle',()=>{
 const provincias=Array.from({length:52},(_,i)=>({
  provincia:'Circunscripción '+String(i+1),escanos:52-i,
  reparto:{PP:(52-i)*0.4,PSOE:(52-i)*0.3,VOX:(52-i)*0.2,SUMAR:(52-i)*0.1}
 }));
 const html=territory({principal:{provincias},geo_sensibilidad:null});
 assert.equal((html.match(/class="pr-territory-row"/g)||[]).length,12);
 assert.equal((html.match(/class="pr-prov"/g)||[]).length,52);
 assert.match(html,/<details class="pr-territory-detail">/);
 assert.match(html,/no hay encuestas provinciales en el motor/);
 assert.match(html,/Circunscripción 52/);
});
test('el historial muestra indicador y mantiene tabla accesible',()=>{
 const hist=[
 {fecha:'2026-11-10',version:'1',n_encuestas:3,nuevas:['a'],escanos:{PP:[130],PSOE:[112],VOX:[60]},bloques:{'PP+VOX':{mediana:190,p_mayoria:0.5}}},
 {fecha:'2026-11-11',version:'2',n_encuestas:4,nuevas:['b'],escanos:{PP:[129],PSOE:[114],VOX:[61]},bloques:{'PP+VOX':{mediana:190,p_mayoria:0.5}}}
 ];
 const html=history(hist);
 assert.equal((html.match(/class="pr-history-item"/g)||[]).length,3);
 assert.match(html,/<details class="pr-history-detail">/);
 assert.match(html,/cambio de versión del modelo/);
 assert.match(html,/a,|>a</);
 assert.match(html,/b/);
});

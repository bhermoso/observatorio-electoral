import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chain} from '../pronostico-vista.mjs';

test('la cocina operativa empieza con flujo visual y mantiene los siete pasos',()=>{
 const f=JSON.parse(readFileSync(new URL('../modelo/salida/pronostico.json',import.meta.url),'utf8'));
 const html=chain(f);
 assert.equal((html.match(/class="pr-chain-node"/g)||[]).length,5);
 assert.match(html,/cocina experimental de entrevistas individuales no alimenta esta secuencia/);
 assert.match(html,/<details class="pr-chain-detail">/);
 assert.equal((html.match(/class="step-n"/g)||[]).length,7);
 assert.match(html,/52 circunscripciones/);
 assert.match(html,/El motor recibe porcentajes publicados, no entrevistas/);
 assert.match(html,/Lo que no hace el motor/);
 assert.doesNotMatch(html,/NaN|undefined/);
});
test('la sensibilidad sigue auditándose sin reemplazar la estimación vigente',()=>{
 const f=JSON.parse(readFileSync(new URL('../modelo/salida/pronostico.json',import.meta.url),'utf8'));
 const html=chain(f);
 if(f.sensibilidad_cocina?.experimentos?.length){
  assert.match(html,/class="pr-chain-detail pr-sensibilidad"/);
  assert.match(html,/Auditar sensibilidad/);
  assert.equal((html.match(/<th>Experimento<\/th>/g)||[]).length,1);
 }
});

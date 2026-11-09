import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {calculate} from '../cocina-secuencial.mjs';
const html=fs.readFileSync('tutorial-estimacion.html','utf8');
const js=fs.readFileSync('tutorial-estimacion.mjs','utf8');
const cube=JSON.parse(fs.readFileSync('data/microdatos/cubo_decisiones_cis.json','utf8'));
test('Tutorial paso a paso disponible y publicado desde home y laboratorio',()=>{
 for(let i=1;i<=8;i++)assert.match(html,new RegExp('id="paso'+i+'"'));
 assert.match(html,/id="ejercicio"/);
 assert.match(html,/id="tut-study"/);
 assert.match(html,/id="tut-scenario"/);
 assert.match(html,/href="construye-estimacion.html#cocina-secuencia"/);
 assert.match(fs.readFileSync('scripts/build.mjs','utf8'),/tutorial-estimacion.mjs/);
 assert.match(fs.readFileSync('construye-estimacion.html','utf8'),/tutorial-estimacion.html/);
 assert.match(fs.readFileSync('casos-cocina.mjs','utf8'),/tutorial-estimacion.html/);
});
test('Ejercicio usa el motor real y conserva denominadores y advertencias',()=>{
 assert.match(js,/calculate\(cube/);
 assert.match(js,/cubo_decisiones_cis.json/);
 assert.match(js,/No se pudieron recuperar los agregados/);
 for(const study of ['3411','3415','3582']){
  const direct=calculate(cube,{study,weighted:true,decided:false});
  const decided=calculate(cube,{study,weighted:true,decided:true});
  assert.ok(decided.shares.PSOE>direct.shares.PSOE);
  assert.ok(Math.abs(decided.sum_all_shares-100)<1e-8);
 }
 assert.match(html,/no.*calibraci[oó]n/i);
});

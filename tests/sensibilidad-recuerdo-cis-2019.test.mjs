import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validarSensibilidad2019,renderSensibilidad2019,tablaSensibilidad2019} from '../sensibilidad-recuerdo-cis-2019.mjs';
const d=JSON.parse(fs.readFileSync('data/microdatos/sensibilidad-recuerdo-cis-2019.json','utf8'));
test('sensibilidad 2019: mismas cuatro candidaturas y dos originales registrados',()=>{
 const [a,n]=validarSensibilidad2019(d);
 assert.equal(a.n,16194);assert.equal(n.n,17650);
 assert.deepEqual(d.partidos_evaluados,['PP','PSOE','VOX','CS']);
 assert.equal(a.escenarios.sin_calibracion.mae_pp,2.8844);
 assert.equal(a.escenarios.calibracion_100.mae_pp,1.8998);
 assert.equal(n.escenarios.sin_calibracion.mae_pp,5.5763);
 assert.equal(n.escenarios.calibracion_100.mae_pp,2.7544);
});
test('intensidad crecente disminuye MAE en la rejilla observada',()=>{
 const rows=validarSensibilidad2019(d);
 const keys=['sin_calibracion','calibracion_25','calibracion_50','calibracion_75','calibracion_100'];
 for(const x of rows){
  const maes=keys.map(k=>x.escenarios[k].mae_pp);
  assert.ok(maes.every((v,i)=>i===0||v<maes[i-1]));
 }
 assert.ok(rows[0].escenarios.solo_pp_psoe_vox_cs.mae_pp<rows[0].escenarios.calibracion_100.mae_pp);
 assert.ok(rows[1].escenarios.solo_pp_psoe_vox_cs.mae_pp>rows[1].escenarios.calibracion_100.mae_pp);
 assert.equal(rows[0].escenarios.cuatro_mas_otros.mae_pp,2.3337);
 assert.equal(rows[1].escenarios.cuatro_mas_otros.mae_pp,2.7681);
 assert.equal(rows[0].escenarios.cuatro_mas_up.mae_pp,1.8188);
});
test('bloqueo motor y cautela sobre confundidores territoriales',()=>{
 const html=tablaSensibilidad2019(d);
 assert.match(html,/No identifica aisladamente el efecto territorial/);
 assert.match(html,/Motor 29N/);
 assert.match(renderSensibilidad2019(),/cocina-sensibilidad-2019-tabla/);
 const cocina=fs.readFileSync('cocina.mjs','utf8');
 const build=fs.readFileSync('scripts/build.mjs','utf8');
 assert.match(cocina,/renderSensibilidad2019\(\)/);
 assert.match(cocina,/bindSensibilidad2019\(\)/);
 assert.match(build,/sensibilidad-recuerdo-cis-2019\.mjs/);
 const bad=structuredClone(d);
 bad.estado='ADMITIR';
 assert.throws(()=>validarSensibilidad2019(bad),/no autorizados/);
});

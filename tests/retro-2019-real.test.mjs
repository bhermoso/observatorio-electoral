import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {historicalStudy2019,retrospective2019} from '../validacion-2019-retrospectiva.mjs';
const data=JSON.parse(fs.readFileSync('data/microdatos/diagnostico_2019_original.json','utf8'));
test('Resultados de dos elecciones 2019 conservan cuatro comparaciones precisas',()=>{
 const result=retrospective2019(data);
 assert.equal(result.rows.length,4);
 assert.equal(result.distinctElectionsRetrospective,2);
 assert.equal(result.independentProspectiveTests,0);
 for(const row of result.rows)for(const r of row.studies){
  assert.equal(r.metrics.length,4);
  assert.ok(r.mae>=0&&r.mae<20);
  assert.ok(Math.abs(r.metrics.reduce((a,p)=>a+p.absolute_error_pp,0)/4-r.mae)<1e-10);
  assert.ok(Math.abs(r.initial_denominator+r.assigned_weight-r.final_denominator)<0.01);
 }
});
test('La imputación proporcional completa no cambia proporciones',()=>{
 for(const id of ['3242','3263']){
  const baseline=historicalStudy2019(data,id,'exclude');
  const prop=historicalStudy2019(data,id,'proportional');
  assert.ok(Math.abs(baseline.mae-prop.mae)<1e-9);
  assert.ok(prop.final_denominator>baseline.final_denominator);
 }
});
test('No se proclama ganadora la receta con un único error histórico favorable',()=>{
 const result=retrospective2019(data);
 const baseline=result.rows.find(r=>r.method==='exclude');
 const sympathy=result.rows.find(r=>r.method==='sympathy');
 assert.ok(sympathy.studies[0].mae<baseline.studies[0].mae);
 assert.ok(sympathy.studies[1].mae>baseline.studies[1].mae);
});
test('Backtesting histórico enlazado y empaquetado',()=>{
 const html=fs.readFileSync('validacion-recetas.html','utf8');
 const ui=fs.readFileSync('validacion-imputaciones-ui.mjs','utf8');
 const build=fs.readFileSync('scripts/build.mjs','utf8');
 assert.match(html,/vh-2019-retro/);
 assert.match(ui,/retrospective2019/);
 assert.match(build,/validacion-2019-retrospectiva.mjs/);
});

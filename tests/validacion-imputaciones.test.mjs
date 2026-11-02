import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {auditImputations,score} from '../validacion-imputaciones.mjs';
const ledger=JSON.parse(fs.readFileSync('data/microdatos/ledger_imputacion_cis.json','utf8'));
const truth=JSON.parse(fs.readFileSync('data/microdatos/validacion_23j.json','utf8'));
const audit=auditImputations(ledger,truth);
test('16 tratamientos × 2 estudios contrastados contra una elección',()=>{
 assert.equal(audit.rows.length,16);
 assert.equal(audit.coverage.elections,1);
 assert.equal(audit.coverage.studies,2);
 assert.equal(audit.coverage.independentElectionTests,0);
 assert.equal(audit.decision.selectedRecipe,null);
 assert.equal(audit.coverage.validatedForDeployment,false);
 for(const row of audit.rows){
  assert.equal(row.studies.length,2);
  for(const s of row.studies){
   assert.ok(Number.isFinite(s.mae)&&s.mae>=0);
   assert.ok(Math.abs(Object.values(s.absolute).reduce((a,b)=>a+b,0)/4-s.mae)<1e-9);
   assert.ok(Math.abs(s.errors.PP-(s.vote.PP-truth.official_vote_valid_percent.PP))<1e-10);
  }
 }
});
test('Imputación proporcional completa no altera porcentajes de la base',()=>{
 const r=audit.rows.find(r=>r.id==='proportional__proportional');
 const b=audit.rows.find(r=>r.id==='exclude__exclude');
 for(let i=0;i<2;i++){
  assert.ok(Math.abs(r.studies[i].mae-b.studies[i].mae)<1e-9);
  assert.ok(r.studies[i].denominator>b.studies[i].denominator);
 }
});
test('Error CIS oficial compara las mismas cuatro candidaturas',()=>{
 assert.equal(audit.published.length,2);
 for(const r of audit.published){
  const expected=score(truth.studies[r.study].scenarios.published_cis,truth.official_vote_valid_percent);
  assert.ok(Math.abs(r.mae-expected.mae)<1e-12);
 }
});
test('Página, gráficos, pruebas y distinción prospectiva publicados',()=>{
 const html=fs.readFileSync('validacion-recetas.html','utf8');
 const ui=fs.readFileSync('validacion-imputaciones-ui.mjs','utf8');
 const build=fs.readFileSync('scripts/build.mjs','utf8');
 const dashboard=fs.readFileSync('dashboard-validacion.mjs','utf8');
 assert.match(html,/una elección no equivale/i);
 assert.match(html,/id="vh-table"/);
 assert.match(html,/id="vh-detail"/);
 assert.match(ui,/auditImputations/);
 assert.match(build,/validacion-recetas.html/);
 assert.match(build,/validacion-imputaciones-ui.mjs/);
 assert.match(dashboard,/href="validacion-recetas.html"/);
});

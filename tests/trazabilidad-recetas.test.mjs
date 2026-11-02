import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {explainRecipe,evidenceStatus} from '../trazabilidad-recetas.mjs';
const ledger=JSON.parse(fs.readFileSync('data/microdatos/ledger_imputacion_cis.json','utf8'));
const audit=JSON.parse(fs.readFileSync('data/microdatos/auditoria_cocina_23j.json','utf8'));
const rules=['exclude','proportional','sympathy','hybrid'];
test('Los componentes algebraicos explican exactamente cada cambio en las 48 recetas',()=>{
 for(const study of ['3411','3415','3582'])for(const indecision of rules)for(const nonresponse of rules){
  const x=explainRecipe(ledger,{study,indecision,nonresponse});
  assert.ok(x.result.check.closes);
  for(const p of x.parties){
   assert.ok(p.closes);
   assert.ok(Math.abs(p.start+p.numeratorChange+p.denominatorEffect-p.end)<1e-9);
   assert.ok(Math.abs(p.contributions.reduce((a,c)=>a+c.weight,0)+p.numerator-p.finalNumerator)<1e-6);
  }
 }
});
test('Cero validaciones independientes: no se publica una receta como ganadora',()=>{
 for(const study of ['3411','3415','3582']){
  const s=evidenceStatus(study,audit);
  assert.equal(s.independentBacktests,0);
  assert.equal(s.supportedRecommendation,false);
  assert.equal(s.observedElection,study==='3582'?null:'2023-07-23');
 }
});
test('La guía de evidencia está integrada en web y build',()=>{
 const html=fs.readFileSync('metodo-evidencia.html','utf8');
 const ui=fs.readFileSync('metodo-evidencia-ui.mjs','utf8');
 const home=fs.readFileSync('home-impact.mjs','utf8');
 const build=fs.readFileSync('scripts/build.mjs','utf8');
 assert.match(html,/id="contabilidad"/);
 assert.match(html,/id="evidencia"/);
 assert.match(html,/Polling Forecast/);
 assert.match(ui,/explainRecipe\(ledger,config\)/);
 assert.match(ui,/denominatorEffect/);
 assert.match(home,/metodo-evidencia.html/);
 assert.match(build,/metodo-evidencia-ui.mjs/);
 assert.match(build,/trazabilidad-recetas.mjs/);
});

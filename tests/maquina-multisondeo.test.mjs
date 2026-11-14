import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {journey,seatScenario} from '../viaje-sondeo-motor.mjs';
import {explainStep,accountHTML,diagnosticRows} from '../viaje-sondeo-explicaciones.mjs';
const registry=JSON.parse(fs.readFileSync('data/microdatos/maquina/index.json'));
const sources=registry.studies.map(s=>JSON.parse(fs.readFileSync(s.file)));
const election=JSON.parse(fs.readFileSync('data/election.json'));
const near=(a,b,e=1e-6)=>assert.ok(Math.abs(a-b)<e,`${a} != ${b}`);
test('Selector multisondeo: originales únicos, dos casas y noviembre como apertura',()=>{
 assert.equal(sources.length,12);
 assert.equal(registry.default,'40db-2026-11-14');
 assert.equal(new Set(registry.studies.map(s=>s.house)).size,2);
 assert.equal(new Set(registry.studies.map(s=>s.sha256_zip)).size,12);
 for(let i=1;i<registry.studies.length;i++)assert.ok(registry.studies[i-1].published>=registry.studies[i].published);
 for(const d of sources){assert.equal(d.n,Object.values(d.categories).reduce((a,b)=>a+b,0));assert.ok(d.meta.variables.recall);assert.equal(d.meta.id,d.study);}
});
test('Las 384 combinaciones conservan sus masas, sus bases y su imputación',()=>{
 for(const d of sources)for(const o of Object.values(d.scenarios)){
  near(Object.values(o.shares).reduce((a,b)=>a+b,0),100);
  near(Object.values(o.masses).reduce((a,b)=>a+b,0),o.denominator);
  assert.ok(o.neff>0&&o.neff<=o.contributors+1e-6);
  for(const p of Object.keys(o.shares)){
   near(o.observed[p]+o.imputed[p],o.masses[p]);
   near(o.shares[p],100*o.masses[p]/o.denominator);
   near(Object.entries(o.imputation_groups).reduce((a,[g,x])=>a+x.mass*(o.transfers[g][p]||0),0),o.imputed[p]);
  }
 }
});
test('Recuerdo: cada operación reproduce el producto por grupo, también en historias de 2019',()=>{
 for(const d of sources){
  const o=d.scenarios['10100'];
  for(const [p,gs] of Object.entries(o.recall_ledger))for(const [g,x] of Object.entries(gs))near(x.before*(o.factors[g]??1),x.after,1e-5);
  const diag=diagnosticRows(d);assert.ok(diag.length>5);
  for(const r of diag){assert.ok(r.factor>=.2&&r.factor<=5);assert.ok(Number.isFinite(r.after));near(r.delta,r.weighted-r.target);}
 }
 assert.equal(sources.find(d=>d.study==='cis-3411').meta.recallElection,'10N 2019');
});
test('Explicaciones de entrada, cuenta y salida existen para todas las candidaturas y etapas',()=>{
 for(const d of sources){
  const stages=journey(d,{peso:true,simpatia:true,recuerdo:true,indecisos:true,participacion:true});
  for(let i=0;i<9;i++)for(const p of Object.keys(stages[i].outcome.shares)){
   const r=explainStep(d,stages,i,p),html=accountHTML(r)+r.details;
   assert.ok(r.why.length>10);assert.ok(r.calculation.value.length>0);
   assert.doesNotMatch(html,/NaN|undefined|Infinity/);
  }
  assert.equal(seatScenario(election,stages[6].outcome,{fourth:d.meta.fourth}).diagnostics.totalSeats,350);
 }
});
test('Frente Amplio y coaliciones territoriales permanecen separadas en el dato de noviembre',()=>{
 const d=sources.find(d=>d.study==='40db-2026-11-14');
 assert.equal(d.meta.fourth,'FA');
 for(const p of ['FA','COMPROMIS','ARA_MES','UPC','UPN_PP'])assert.ok(Object.hasOwn(d.scenarios['00000'].shares,p));
 assert.equal(d.n,1500);assert.equal(d.scenarios['00000'].counts.PSOE,422);assert.equal(d.scenarios['00000'].counts.PP,300);assert.equal(d.scenarios['00000'].counts.VOX,281);
});

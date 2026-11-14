import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {journey,scenarioKey,seatScenario,INGREDIENTS} from '../viaje-sondeo-motor.mjs';
const data=JSON.parse(fs.readFileSync('data/microdatos/viaje-sondeo-3582.json'));
const recipe=JSON.parse(fs.readFileSync('data/microdatos/cocina_cis_3582.json'));
const election=JSON.parse(fs.readFileSync('data/election.json'));
const flags=Object.fromEntries(INGREDIENTS.map(k=>[k,true]));
const close=(a,b,e=1e-7)=>assert.ok(Math.abs(a-b)<e,`${a} != ${b}`);
test('32 combinaciones: masas, denominadores e imputaciones cuadran',()=>{
 assert.equal(Object.keys(data.scenarios).length,32);
 assert.equal(data.n,5024);
 assert.equal(Object.values(data.categories).reduce((a,b)=>a+b,0),data.n);
 for(const [key,o] of Object.entries(data.scenarios)){
  assert.equal(scenarioKey(o.flags),key);
  close(Object.values(o.shares).reduce((a,b)=>a+b,0),100);
  close(Object.values(o.masses).reduce((a,b)=>a+b,0),o.denominator);
  assert.ok(o.neff>0&&o.neff<=o.contributors+1e-6);
  for(const p of Object.keys(o.shares)){
   close(o.observed[p]+o.imputed[p],o.masses[p]);
   close(100*o.masses[p]/o.denominator,o.shares[p]);
   close(Object.entries(o.imputation_groups).reduce((a,[g,x])=>a+x.mass*(o.transfers[g][p]||0),0),o.imputed[p]);
  }
  if(!o.flags.indecisos)close(Object.values(o.imputed).reduce((a,b)=>a+b,0),0);
 }
});
test('El recorrido completo reproduce las seis etapas de la receta original',()=>{
 const stages=journey(data,flags);
 assert.equal(stages.length,9);
 for(let i=0;i<6;i++)for(const [p,v] of Object.entries(recipe.pasos[i].estimacion))close(stages[i+1].outcome.shares[p],v,.00051);
});
test('Desactivar un ingrediente recalcula la combinación y conserva los pasos omitidos',()=>{
 const stages=journey(data,{...flags,peso:false,simpatia:false,indecisos:false});
 assert.equal(stages[2].outcome,stages[1].outcome);
 assert.equal(stages[3].outcome,stages[2].outcome);
 assert.equal(stages[5].outcome,stages[4].outcome);
 assert.equal(stages[6].outcome,data.scenarios['00101']);
});
test('Cada combinación tiene 350 escaños y cocientes que reproducen el reparto provincial',()=>{
 for(const o of Object.values(data.scenarios)){
  const projected=seatScenario(election,o);
  assert.equal(Object.values(projected.seats).reduce((a,b)=>a+b,0),350);
  close(Object.values(projected.targets).reduce((a,b)=>a+b,0),100);
  for(const d of projected.districts){
   assert.equal(d.trace.length,d.seats);
   assert.equal(Object.values(d.votes).reduce((a,b)=>a+b,0)+d.blank,d.valid);
   for(const id of Object.keys(d.votes))assert.equal(d.trace.filter(t=>t.party===id).length,d.partySeats[id]);
   for(const t of d.trace){assert.ok(d.eligible.includes(t.party));close(t.quotient,d.votes[t.party]/t.divisor);}
  }
 }
});

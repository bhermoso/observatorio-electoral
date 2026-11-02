import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {estimate,PARTIES,POLICIES} from '../motor-imputacion.mjs';
const cube=JSON.parse(fs.readFileSync('data/microdatos/ledger_imputacion_cis.json','utf8'));
const sum=a=>a.reduce((x,y)=>x+y,0);
test('La partición de indecisos y no contestan conserva tamaño y PESO',()=>{
 for(const [sid,s] of Object.entries(cube.studies)){
  assert.equal(sum(Object.values(s.direct).map(v=>v[0])),s.n);
  for(const g of Object.values(s.groups)){
   assert.equal(sum(Object.values(g.sympathy).map(v=>v[0])),g.n);
   assert.ok(Math.abs(sum(Object.values(g.sympathy).map(v=>v[1]))-g.w)<0.002);
   assert.equal(sum(Object.values(g.recall)),g.n);
  }
 }
});
test('El libro mayor cierra numeradores y denominadores en todas las combinaciones',()=>{
 for(const sid of Object.keys(cube.studies))for(const indecision of Object.keys(POLICIES))for(const nonresponse of Object.keys(POLICIES)){
  const r=estimate(cube,{study:sid,indecision,nonresponse});
  assert.ok(r.check.closes);
  assert.equal(r.entries.length,2);
  assert.ok(Math.abs(sum(Object.values(r.final.votes))-100)<1e-8);
  assert.ok(Math.abs(sum(PARTIES.map(p=>r.final.numerators[p]))-r.final.denominator)<.001);
  assert.ok(Math.abs(r.baseline.denominator+sum(r.entries.map(e=>e.assigned_weight))-r.final.denominator)<.001);
 }
});
test('No imputar no mueve el resultado y proporcional conserva cuotas',()=>{
 for(const study of ['3411','3415','3582']){
  const baseline=estimate(cube,{study,indecision:'exclude',nonresponse:'exclude'});
  const prop=estimate(cube,{study,indecision:'proportional',nonresponse:'proportional'});
  for(const party of PARTIES)assert.ok(Math.abs(baseline.final.votes[party]-prop.final.votes[party])<1e-9);
  assert.equal(baseline.check.allocated_total,0);
  assert.ok(prop.check.allocated_total>0);
 }
});
test('VOTOSIMG identificable y los residuos se contabilizan por separado',()=>{
 const a=estimate(cube,{study:'3582',indecision:'sympathy',nonresponse:'exclude'});
 const b=estimate(cube,{study:'3582',indecision:'hybrid',nonresponse:'exclude'});
 assert.ok(a.entries[0].not_assigned_weight>0);
 assert.ok(Math.abs(b.entries[0].not_assigned_weight)<1e-8);
 assert.ok(a.entries[0].assigned_weight<b.entries[0].assigned_weight);
});
test('Interfaz de trazabilidad conectada al diagnóstico previo y exportación',()=>{
 const source=fs.readFileSync('laboratorio-imputaciones.mjs','utf8');
 const html=fs.readFileSync('laboratorio-imputaciones.html','utf8');
 const build=fs.readFileSync('scripts/build.mjs','utf8');
 assert.match(source,/estimate\(ledger,state\)/);
 assert.match(source,/denominator_before/);
 assert.match(source,/led-export/);
 assert.match(html,/radiografía sin imputaciones/);
 assert.match(html,/VOTOSIMG/);
 assert.match(build,/motor-imputacion.mjs/);
 assert.match(fs.readFileSync('diagnostico-cis.html','utf8'),/laboratorio-imputaciones.html/);
});

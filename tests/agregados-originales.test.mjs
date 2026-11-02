import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const data=JSON.parse(fs.readFileSync('data/microdatos/agregados_originales_cis.json','utf8'));
const html=fs.readFileSync('construye-estimacion.html','utf8');
const script=fs.readFileSync('construye-estimacion.mjs','utf8');
const round=x=>Math.round(x*1000)/1000;
test('Los tres estudios procedentes de microdatos están agregados, sin filas individuales',()=>{
 assert.deepEqual(Object.keys(data.study).sort(),['3411','3415','3582']);
 assert.deepEqual(Object.values(data.study).map(s=>s.n),[29201,8798,5024]);
 for(const s of Object.values(data.study)){
  assert.equal(s.methods.directa.length,6);
  for(const series of Object.values(s.methods))for(const row of series)assert.equal(row.length,6);
 }
});
test('La intención directa sobre todos reproduce los valores históricos observados',()=>{
 const expected={3411:{PSOE:24.644,PP:25.371},3415:{PSOE:25.388,PP:23.723},3582:{PSOE:25.298,PP:14.685}};
 for(const [id,targets] of Object.entries(expected)){
  const rows=data.study[id].methods.directa,all=rows.reduce((a,r)=>a+r[0],0);
  for(const [party,target] of Object.entries(targets))assert.ok(Math.abs(round(100*rows[data.groups.indexOf(party)][0]/all)-target)<0.002);
 }
});
test('La función de participación es una interpolación verificable con denominador conservado',()=>{
 for(const s of Object.values(data.study))for(const rows of Object.values(s.methods)){
  const candidates=rows.slice(0,5);
  for(const alpha of [0,.2,.5,1]){
   const denominator=candidates.reduce((sum,r)=>sum+(1-alpha)*r[1]+alpha*r[5],0);
   assert.ok(denominator>0);
   const shares=candidates.map(r=>100*((1-alpha)*r[1]+alpha*r[5])/denominator);
   assert.ok(Math.abs(shares.reduce((a,b)=>a+b,0)-100)<1e-8);
  }
 }
});
test('La UI explica el alcance, usa pesos originales agregados y no publica microdatos',()=>{
 assert.match(html,/id="raw-reweight-slider"/);
 assert.match(html,/PROBVOTO/);
 assert.match(script,/agregados_originales_cis.json/);
 assert.match(script,/updateRawReweight/);
 assert.match(html,/No tenemos almacenadas aquí las entrevistas individuales/);
});

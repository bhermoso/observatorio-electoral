import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {calculate,pipeline} from '../cocina-secuencial.mjs';
import {projection} from '../cocina-escanos.mjs';
const cube=JSON.parse(fs.readFileSync('data/microdatos/cubo_decisiones_cis.json','utf8'));
const election=JSON.parse(fs.readFileSync('data/election.json','utf8'));
const approx=(x,y,e=.012)=>assert.ok(Math.abs(x-y)<e, `${x} vs ${y}`);
test('El cubo procede de 3 encuestas con clasificación incluida de Otro partido',()=>{
 assert.deepEqual(Object.keys(cube.studies).sort(),['3411','3415','3582']);
 assert.equal(cube.groups[4],'OTROS');
 assert.equal(cube.groups[5],'NO_CANDIDATURA');
 for(const id of Object.keys(cube.studies)){
  const study=cube.studies[id];
  assert.equal(study.cube.length,2);
  for(const method of study.cube)assert.equal(method.length,6);
  const n=study.cube[0].flat(1).reduce((sum,cell)=>sum+cell[0],0);
  assert.equal(n,study.n);
 }
});
test('El pipeline reproduce respuestas directas y porcentajes entre decididos',()=>{
 const expected={3411:[24.644,31.295],3415:[25.388,33.673],3582:[25.298,36.231]};
 for(const [study,[direct,decided]] of Object.entries(expected)){
  const raw=calculate(cube,{study,weighted:true});
  const counted=calculate(cube,{study,weighted:true,decided:true});
  approx(raw.shares.PSOE,direct);
  approx(counted.shares.PSOE,decided);
  approx(counted.sum_all_shares,100,.00001);
 }
});
test('Cada decisión tiene su resultado y no se suman recetas',()=>{
 const c={study:'3411',weighted:true,decided:true,sympathy:true,participation:.6,recallOnly:true};
 const states=pipeline(cube,c);
 assert.equal(states.length,6);
 assert.equal(states[0].config.weighted,false);
 assert.equal(states[1].config.weighted,true);
 assert.equal(states[2].config.decided,true);
 assert.equal(states[3].config.sympathy,true);
 assert.equal(states[4].config.participation,.6);
 assert.equal(states[5].config.recallOnly,true);
 for(const row of states){assert.ok(Number.isFinite(row.outcome.shares.PP));approx(row.outcome.sum_all_shares,100,.00001)}
});
test('La participación se activa solo después de aplicar PESO',()=>{
 assert.throws(()=>calculate(cube,{participation:1,weighted:false}),/PESO/);
 const a=calculate(cube,{weighted:true,decided:true,participation:0});
 const b=calculate(cube,{weighted:true,decided:true,participation:1});
 assert.notEqual(a.shares.PP,b.shares.PP);
});
test('La cocina terminada puede repartirse en exactamente 350 escaños',()=>{
 const row=calculate(cube,{weighted:true,decided:true,study:'3415'});
 const groups=Object.fromEntries(['PP','PSOE','VOX','SUMAR'].map(p=>[p,row.shares[p]]));
 const result=projection(election,groups);
 assert.equal(result.diagnostics.totalSeats,350);
 assert.equal(result.diagnostics.districts,52);
});
test('No se publican entrevistas individuales ni se confunde el laboratorio con el motor operativo',()=>{
 const html=fs.readFileSync('construye-estimacion.html','utf8');
 const js=fs.readFileSync('cocina-secuencial-ui.mjs','utf8');
 const build=fs.readFileSync('scripts/build.mjs','utf8');
 assert.match(html,/id="cocina-secuencia"/);
 assert.match(js,/pipeline\(cube,cfg\)/);
 assert.match(js,/projection\(election/);
 assert.match(js,/NO.*Motor 29N/i);
 assert.match(build,/cocina-secuencial-ui.mjs/);
});

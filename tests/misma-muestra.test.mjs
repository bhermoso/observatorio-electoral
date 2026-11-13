import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {sameSample3584,sameSampleMicro,compareStages} from '../misma-muestra-motor.mjs';
const read=f=>JSON.parse(fs.readFileSync(f));
const source=read('data/sources/cis-3584.json'),polls=read('data/polls.json');
test('3584 conserva las 18 etiquetas, usa la misma fuente y normaliza solo las respuestas válidas',()=>{
 const d=sameSample3584(source);assert.equal(d.n,45074);assert.equal(d.keys.length,18);assert.ok(Math.abs(d.denominator-79.3)<1e-9);
 const r=d.stages.find(s=>s.id==='proporcional');assert.ok(Math.abs(Object.values(r.values).reduce((a,b)=>a+b,0)-100)<1e-9);assert.equal(r.values.PP,100*17.2/d.denominator);assert.equal(r.values['ERC-Podemos'],100*2.4/d.denominator);assert.equal(d.unallocated['No sabe'],15.8);
 assert.deepEqual(d.stages.map(s=>s.id),['censo','proporcional','oficial']);assert.throws(()=>compareStages(d,'recuerdo','oficial'),/no disponible/);
});
test('no se restan porcentajes de censo y voto válido ni se imputa cero para categoría ausente',()=>{
 const d=sameSample3584(source),mix=compareStages(d,'censo','oficial');assert.equal(mix.compatible,false);assert.ok(mix.rows.every(r=>r.delta===null));
 const valid=compareStages(d,'proporcional','oficial');assert.ok(valid.compatible);assert.ok(valid.rows.find(r=>r.key==='PP').delta>0);assert.ok(valid.rows.find(r=>r.key==='PSOE').delta<0);
 const bad=structuredClone(source);delete bad.voto_directo_original.Junts;assert.throws(()=>sameSample3584(bad),/Faltan categorías/);
});
test('tres recetas individuales se ligan por ID, número de entrevistas y secuencia a su propio CIS',()=>{
 for(const study of ['3411','3415','3582']){
  const recipe=read('data/microdatos/cocina_cis_'+study+'.json'),d=sameSampleMicro(recipe,polls),r=compareStages(d,'peso','participacion');
  assert.equal(d.study,study);assert.equal(r.rows.find(r=>r.key==='PP').b,recipe.resultado.estimacion.PP);assert.equal(d.n,recipe.pasos[0].entrevistas);
  const bad=structuredClone(recipe);bad.pasos[0].entrevistas++;assert.throws(()=>sameSampleMicro(bad,polls),/misma muestra/);
 }
});
test('una cifra oficial no transcrita queda ausente; no se fabrican candidaturas de 2023',()=>{
 const d=sameSampleMicro(read('data/microdatos/cocina_cis_3411.json'),polls),r=compareStages(d,'directa','participacion');
 assert.equal(r.rows.find(r=>r.key==='BNG').official,null);assert.equal(r.rows.find(r=>r.key==='BNG').versusOfficial,null);assert.ok(!d.keys.includes('PODEMOS')&&!d.keys.includes('SALF'));
});

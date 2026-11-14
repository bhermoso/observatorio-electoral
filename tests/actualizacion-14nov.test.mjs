import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validatePolls} from '../schema.mjs';
import {renderReferenceNumbers,renderReferenceDirectory} from '../polls.mjs';
import {encuestasRecientes} from '../portada-hub.mjs';
const polls=JSON.parse(fs.readFileSync('data/polls.json')),refs=JSON.parse(fs.readFileSync('data/references.json'));
test('nuevas entregas verificadas: identidad, campo, muestra y cifras del original',()=>{
 validatePolls(polls,refs);const p=polls.find(p=>p.id==='40db-2026-11-13-tracking-dia01');assert.equal(p.sample,1000);assert.equal(p.fieldStart,'2026-11-10');assert.equal(p.values['Frente Amplio (sin candidaturas territoriales)'],3.5);assert.equal(p.values['Compromís: Front Valencià'],1.1);assert.deepEqual(p.seats.PP,{point:126,min:122,max:135});assert.equal(Object.values(p.seats).reduce((s,r)=>s+r.point,0),350);
 const a=polls.find(p=>p.id==='sigma-dos-2026-11-12-tracking'),b=polls.find(p=>p.id==='sigma-dos-2026-11-13-tracking');assert.equal(a.sample,3870);assert.equal(b.sample,4620);assert.equal(a.fieldEnd,'2026-11-11');assert.equal(b.fieldEnd,'2026-11-12');assert.deepEqual(b.seats.PSOE,{min:104,max:109});
});
test('promedios y reestimaciones tienen cifras consultables y no se convierten en encuestas',()=>{
 for(const id of ['elpais-promedio-2026-11-14','eldiario-promedio-2026-11-13','democrata-media-2026-11-14']){const r=refs.find(r=>r.id===id);assert.equal(r.kind,'aggregate-model');assert.ok(!polls.some(p=>p.id===id));assert.match(renderReferenceNumbers(r),/<table>/);}
 const a=refs.find(r=>r.id==='ateneo-reestimacion-cis-3584-2026-11-12');assert.equal(a.kind,'editorial-analysis');assert.equal(a.sampleStudyId,'cis-3584');assert.equal(a.values.PSOE,30.14);assert.equal(a.modelSeatRanges.PSOE.min,113);assert.match(renderReferenceDirectory([a]),/Reestimación de la misma muestra/);
 const n=refs.find(r=>r.id==='nc-report-estimacion-2026-11-09-ficha-incompleta');assert.equal(n.kind,'editorial-analysis');assert.equal(n.values.PP,32.6);assert.match(renderReferenceDirectory([n]),/ficha incompleta/);
});
test('una horquilla y un cero externo se mantienen distintos de una ausencia',()=>{
 const html=renderReferenceNumbers({published:'2026-11-14',values:{PP:0,PSOE:30},modelSeatRanges:{PP:{point:0},PSOE:{min:100,max:110},Otro:{point:1}}});assert.match(html,/>0 %</);assert.match(html,/>100–110</);assert.match(html,/<td>—<\/td><td>1</);assert.doesNotMatch(html,/undefined|NaN/);
});
test('la portada conserva distintas oleadas en el archivo pero muestra una publicación por casa',()=>{
 const list=polls.map(p=>({estudio:p.id,casa:p.institute,publicacion:p.published,campo_ini:p.fieldStart,campo_fin:p.fieldEnd,n:p.sample,voto:p.values}));
 const all=encuestasRecientes({entradas:list},[],{limite:100});assert.ok(all.filter(p=>p.casa==='Sigma Dos').length>1);
 const recent=encuestasRecientes({entradas:list},[],{limite:3,latestPerHouse:true,deduplicate:true});assert.equal(recent.length,new Set(recent.map(r=>r.casa)).size);assert.equal(recent.find(r=>r.casa==='Sigma Dos').id,'sigma-dos-2026-11-13-tracking');
});

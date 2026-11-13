import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validatePolls} from '../schema.mjs';
import {canonicalValues} from '../capas.mjs';
import {pollAverage} from '../analysis.mjs';
import {fieldRelation} from '../events.mjs';
const polls=JSON.parse(fs.readFileSync('data/polls.json'));
const p=polls.find(x=>x.id==='cis-3584');
const src=JSON.parse(fs.readFileSync('data/sources/cis-3584.json'));
test('CIS 3584: ficha oficial completa y cifras nacionales, sin usar intención directa como estimación',()=>{
 assert.ok(p);validatePolls(polls,JSON.parse(fs.readFileSync('data/references.json')));assert.equal(p.sample,45074);assert.equal(p.published,'2026-11-12');assert.equal(p.fieldStart,'2026-10-07');assert.equal(p.fieldEnd,'2026-10-30');assert.deepEqual([p.values.PSOE,p.values.PP,p.values.VOX],[33.3,25.5,18.4]);assert.equal(src.voto_directo_original.PSOE,28.7);assert.equal(Object.keys(p.values).length,18);assert.ok(Math.abs(Object.values(p.values).reduce((a,b)=>a+b,0)-100)<1e-9);
});
test('Candidaturas desglosadas conservan nombres originales y no se suman a otras siglas',()=>{
 for(const [label,v] of Object.entries(p.values))assert.equal(v,src.estimacion_nacional_original[p.sourceLabels[label]||label]);
 const c=canonicalValues(p.values).values;assert.equal(c.PSOE,33.3);for(const k of ['SUMAR','PODEMOS','ERC','UPN','CC'])assert.equal(c[k],undefined);
 const a=pollAverage([p],{asOf:'2026-11-13'}).average;assert.equal(a['Sumar/FA'].count,0);assert.equal(a.Podemos.count,0);assert.equal(a.PP.count,1);
});
test('52 circunscripciones y 14 horquillas nacionales originales; guion no es cero',()=>{
 assert.equal(src.provincias.length,52);assert.equal(new Set(src.provincias.map(p=>p.provincia)).size,52);assert.equal(Object.keys(p.seats).length,14);assert.deepEqual(p.seats.PSOE,{min:134,max:143});assert.deepEqual(p.seats.PP,{min:98,max:106});assert.equal(p.seats.SALF,undefined);assert.equal(p.seats['CC-Municipalistas Primero Canarias'],undefined);
});
test('Publicar tras la huelga no implica campo posterior',()=>{
 assert.equal(fieldRelation(p,'2026-11-11'),'before');assert.equal(fieldRelation(p,'2026-10-28'),'overlap');
});

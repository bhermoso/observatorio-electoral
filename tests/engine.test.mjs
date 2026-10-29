import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {allocate,weightedVotes,simulate} from '../engine.mjs';
const data=JSON.parse(fs.readFileSync(new URL('../data/election.json',import.meta.url)));
test('52 circunscripciones, 350 escaños y totales oficiales coherentes',()=>{
 assert.equal(data.districts.length,52);assert.equal(new Set(data.districts.map(d=>d.name)).size,52);
 const sum=k=>data.districts.reduce((s,d)=>s+d[k],0);
 assert.equal(sum('seats'),350);assert.equal(sum('electors'),37469458);assert.equal(sum('turnout'),24952447);assert.equal(sum('valid'),24688087);assert.equal(sum('blank'),200673);
 for(const d of data.districts){assert.equal(Object.values(d.votes).reduce((a,b)=>a+b,0),d.candidacy,d.name);assert.equal(d.candidacy+d.blank,d.valid);assert.equal(d.valid+d.invalid,d.turnout);assert.equal(Object.values(d.officialSeats).reduce((a,b)=>a+b,0),d.seats);}
});
for(const d of data.districts)test(`D’Hondt reproduce el reparto oficial en ${d.name}`,()=>{
 const r=allocate(d.votes,d.seats,{blank:d.blank,singleMember:['Ceuta','Melilla'].includes(d.name)});
 for(const p of data.parties)assert.equal(r.seats[p.id]||0,d.officialSeats[p.id]||0,p.label);
});
test('El escenario de pesos unitarios reproduce los 350 escaños',()=>{
 const r=simulate(data.districts);assert.equal(Object.values(r.totals).reduce((a,b)=>a+b,0),350);assert.equal(r.totals.p0,137);assert.equal(r.totals.p1+r.totals.p4,121);assert.equal(r.totals.p2,33);assert.equal(r.totals.p3,31);
});
test('Ejemplo de la LOREG: 8 escaños',()=>assert.deepEqual(allocate({A:168000,B:104000,C:72000,D:64000,E:40000,F:32000},8).seats,{A:4,B:2,C:1,D:1,E:0,F:0}));
test('El voto en blanco modifica la elegibilidad del 3 %',()=>{assert.ok(allocate({a:9700,b:300},35).eligible.includes('b'));assert.ok(!allocate({a:9700,b:300},35,{blank:100}).eligible.includes('b'));});
test('Igual cociente: gana quien tiene más votos',()=>assert.deepEqual(allocate({a:100,b:50},2).seats,{a:2,b:0}));
test('Empate total: sorteo reproducible y alternancia',()=>{const r=allocate({a:100,b:100},4,{seed:42});assert.deepEqual(r.seats,{a:2,b:2});assert.ok(r.ties.length);assert.deepEqual(r,allocate({a:100,b:100},4,{seed:42}));});
test('Ceuta/Melilla: mayoría simple sin umbral',()=>assert.equal(allocate({a:2,b:1},1,{blank:1000,singleMember:true}).seats.a,1));
test('Rechaza entradas inválidas y escenario vacío',()=>{for(const v of [-1,NaN,Infinity,1.5])assert.throws(()=>allocate({a:v},3));assert.throws(()=>allocate({a:0},3));assert.throws(()=>allocate({a:1},0));assert.throws(()=>weightedVotes({a:1},{a:-1}));assert.throws(()=>weightedVotes({a:1},{a:6}));});
test('Pesos: redondeo explícito, peso nulo y neutral',()=>assert.deepEqual(weightedVotes({a:3,b:10,c:8},{a:1.5,b:0}),{a:5,b:0,c:8}));
test('Conservación de escaños en escenarios deterministas',()=>{for(let k=1;k<=30;k++){const weights=Object.fromEntries(data.parties.map((p,i)=>[p.id,0.5+((i+k)%17)/10]));const r=simulate(data.districts,weights);assert.equal(Object.values(r.totals).reduce((a,b)=>a+b,0),350);assert.ok(Object.values(r.totals).every(n=>Number.isInteger(n)&&n>=0));}});
test('Huellas de los originales conservados',()=>{const hashes=JSON.parse(fs.readFileSync(new URL('../data/source-hashes.json',import.meta.url)));for(const [f,h] of Object.entries(hashes))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(new URL('../data/sources/'+f,import.meta.url))).digest('hex'),h);});
test('Archivo de encuestas: metadatos y procedencia',()=>{const polls=JSON.parse(fs.readFileSync(new URL('../data/polls.json',import.meta.url)));assert.equal(polls.length,2);for(const p of polls){assert.ok(p.fieldStart<=p.fieldEnd&&p.fieldEnd<=p.published);assert.ok(p.sample>0);assert.equal(new URL(p.source).hostname,'www.cis.es');assert.equal(new URL(p.catalog).hostname,'datos.gob.es');assert.equal(p.kind,'poll-estimate');}});

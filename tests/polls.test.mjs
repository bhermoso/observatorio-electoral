import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {filterPollRecords,latestByInstitute,partyKey,seatLabel,renderPollArchive,renderReferenceDirectory} from '../polls.mjs';
import {validatePolls} from '../schema.mjs';
const polls=JSON.parse(fs.readFileSync(new URL('../data/polls.json',import.meta.url)));
const refs=JSON.parse(fs.readFileSync(new URL('../data/references.json',import.meta.url)));
test('Archivo sin duplicados, con instituciones, fechas y fuentes explícitas',()=>{
 assert.equal(new Set(polls.map(p=>p.id)).size,polls.length);
 assert.ok(polls.length>=8);assert.ok(new Set(polls.map(p=>p.institute)).size>=6);
 for(const p of polls){assert.equal(p.kind,'poll-estimate');assert.ok(p.publisher&&p.scope&&p.scenario&&p.verification&&p.sourcePages);assert.ok(p.fieldStart<=p.fieldEnd&&p.fieldEnd<=p.published&&p.published<=p.verified,p.id);assert.ok(p.sample>0&&Number.isInteger(p.sample));for(const key of ['source','technical'])assert.equal(new URL(p[key]).protocol,'https:');for(const v of Object.values(p.values))assert.ok(Number.isFinite(v)&&v>=0&&v<=100);for(const s of Object.values(p.seats||{})){assert.ok(s.point!==undefined||s.min!==undefined);if(s.point!==undefined)assert.ok(Number.isInteger(s.point)&&s.point>=0&&s.point<=350);if(s.min!==undefined){assert.ok(Number.isInteger(s.min)&&Number.isInteger(s.max)&&s.min>=0&&s.min<=s.max&&s.max<=350);if(s.point!==undefined)assert.ok(s.point>=s.min&&s.point<=s.max);}}}
});
test('Ordenar y filtrar conserva instituto, año y solapamiento de campo',()=>{
 const knownIds=new Set(['3411','3415','cis-3582','40db-2026-10-flash','gad3-2026-10','imop-2026-10-ola2','dym-2026-10','ateneo-2026-10-25']);
 const initial=polls.filter(p=>knownIds.has(p.id));
 assert.equal(filterPollRecords(initial,{year:'2026'}).length,6);
 assert.equal(filterPollRecords(initial,{institute:'CIS'}).length,3);
 assert.equal(filterPollRecords(initial,{year:'2026',seatsOnly:true}).length,4);
 assert.equal(filterPollRecords(polls,{query:'michavila'}).length,0); // aliases must not invent records
 assert.equal(filterPollRecords(polls,{query:'Confidencial'})[0].institute,'IMOP Insights');
 const during=filterPollRecords(initial,{from:'2026-10-08',until:'2026-10-08'});assert.deepEqual(new Set(during.map(p=>p.institute)),new Set(['GAD3','40dB.']));
 assert.equal(filterPollRecords(initial,{from:'2026-10-28'}).length,0); // this fixed historical selection predates the accident
 assert.equal(latestByInstitute(initial).length,6);assert.equal(latestByInstitute(initial).find(p=>p.institute==='CIS').id,'cis-3582');
});
test('Ausencia, cero publicado, punto y horquilla son diferentes',()=>{
 assert.equal(seatLabel(null),'No publicado / no transcrito');assert.equal(seatLabel({point:0}),'0');assert.equal(seatLabel({min:139,max:143}),'139–143');assert.equal(seatLabel({point:132,min:123,max:140}),'132 (123–140)');
 const cis=polls.find(p=>p.id==='cis-3582');assert.equal(cis.seats,null);
 const imop=polls.find(p=>p.institute==='IMOP Insights');assert.equal(imop.values['Frente Amplio'],undefined);assert.equal(imop.seats.SALF.point,0);assert.equal(partyKey(imop,'Sumar/FA'),'Frente Amplio');
});
test('Congresos puntuales completos conservan 350 sin sumar extremos',()=>{
 for(const id of ['gad3-2026-10','40db-2026-10-flash','imop-2026-10-ola2']){
  const p=polls.find(p=>p.id===id);assert.equal(Object.values(p.seats).reduce((s,x)=>s+x.point,0),350,id);
 }
 assert.equal(polls.find(p=>p.institute==='DYM').seats.PP.point,undefined);
});
test('Escenarios y límites originales permanecen visibles',()=>{
 const flash=polls.find(p=>p.institute==='40dB.');assert.ok(flash.scope.includes('excepto Ceuta y Melilla'));assert.ok(flash.scenario.includes('separadas'));assert.equal(flash.values['Sumar/FA'],5.3);
 assert.ok(polls.find(p=>p.institute==='IMOP Insights').publicationNote);
 assert.ok(polls.find(p=>p.institute==='GAD3').notes.includes('no suma 100'));
});
test('Metroscopia y el promedio externo no se cuentan como sondeos adicionales',()=>{
 assert.equal(refs.find(r=>r.id==='metroscopia').status,'pending-electoral-record');
 const aggregate=refs.find(r=>r.kind==='aggregate-model');assert.equal(aggregate.published,'2026-10-03');assert.equal(Object.values(aggregate.modelSeats).reduce((a,b)=>a+b,0),350);assert.ok(!polls.some(p=>p.id===aggregate.id));
 assert.ok(renderReferenceDirectory(refs).includes('Agregador externo'));assert.ok(renderPollArchive(polls).includes(`${polls.length} estudios / ${new Set(polls.map(p=>p.institute)).size} institutos`));
});
test('La validación de publicación bloquea duplicados, fechas y horquillas inválidas',()=>{
 assert.equal(validatePolls(polls,refs).polls,polls.length);
 assert.throws(()=>validatePolls([...polls,polls[0]],refs),/duplicado/);
 const bad=structuredClone(polls);bad[0].seats.PP={min:140,max:122};assert.throws(()=>validatePolls(bad,refs),/horquilla/);
 const future=structuredClone(polls);future[0].fieldEnd='2099-01-01';assert.throws(()=>validatePolls(future,refs),/fechas/);
});
test('Exportaciones no convierten ausentes en undefined ni ceros inventados',()=>{
 const csv=fs.readFileSync(new URL('../data/poll-results.csv',import.meta.url),'utf8');assert.ok(!csv.includes('undefined'));assert.ok(csv.includes('"not-transcribed"'));assert.ok(csv.includes('"published-range"'));assert.ok(csv.includes('"published-point-and-range"'));
});

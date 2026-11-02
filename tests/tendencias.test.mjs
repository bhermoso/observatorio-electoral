import test from 'node:test';
import assert from 'node:assert/strict';
import {measurePoll,publishedSeries,renderPublishedSeries} from '../tendencias.mjs';

const mk=(id,institute,published,values,fieldEnd=published)=>({
 id,institute,published,fieldEnd,fieldStart:fieldEnd,kind:'poll-estimate',
 source:'https://example.org/original',values
});
const event='2026-10-28';
test('Bloques solo suman partidos efectivamente declarados en la misma encuesta',()=>{
 assert.equal(measurePoll(mk('a','A','2026-10-01',{PP:30,VOX:18}),['PP','VOX']),48);
 assert.equal(measurePoll(mk('a','A','2026-10-01',{PP:30}),['PP','VOX']),null);
 assert.equal(measurePoll(mk('a','A','2026-10-01',{PSOE:27,'Frente Amplio':8,Podemos:3}),['PSOE','SUMAR','PODEMOS']),38);
});
test('Promedio solo usa última encuesta por casa y no introduce valores inexistentes',()=>{
 const rows=[
  mk('a1','A','2026-10-01',{PP:30,VOX:20}),
  mk('a2','A','2026-10-10',{PP:32,VOX:18}),
  mk('b1','B','2026-10-12',{PP:28}),
  mk('c1','C','2026-10-11',{PP:26,VOX:17})
 ];
 const pp=publishedSeries(rows,event,'PP',90);
 assert.deepEqual(pp.snapshots.map(p=>p.mean),[30,32,29,(32+26+28)/3]); 
 const bloc=publishedSeries(rows,event,'PP_VOX',90);
 assert.equal(bloc.rows.length,3);
 assert.equal(bloc.snapshots.at(-1).houses,2);
 assert.equal(bloc.snapshots.at(-1).mean,(50+43)/2);
 assert.equal(pp.houses.find(h=>h.institute==='A').observations.length,2);
});
test('Sin encuestas no se fabrica línea ni promedio',()=>{
 const r=renderPublishedSeries([],event,'PSOE_SUMAR_PODEMOS',90);
 assert.equal(r.series.rows.length,0);
 assert.equal(r.series.snapshots.length,0);
 assert.match(r.html,/No existen encuestas completas/);
});
test('No incluye una publicación futura fuera de la ventana',()=>{
 const rows=[mk('old','A','2025-01-01',{PP:31}),mk('new','B','2026-11-05',{PP:32})];
 const s=publishedSeries(rows,event,'PP',7);
 assert.deepEqual(s.rows.map(p=>p.id),[]);
});

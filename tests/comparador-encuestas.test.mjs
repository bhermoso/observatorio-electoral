import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {selectStudies,studyDifference,selectionCSV,readSelection,selectionQuery,renderComparisonChart} from '../comparador-encuestas.mjs';
const polls=JSON.parse(fs.readFileSync('data/polls.json'));
const fixture=[{id:'a',institute:'Casa A',fieldEnd:'2026-10-01',published:'2026-10-03',values:{PP:0,PSOE:30,'Frente Amplio':5}},{id:'b',institute:'Casa A',fieldEnd:'2026-11-01',published:'2026-11-03',values:{PP:20,PSOE:32}},{id:'c',institute:'Casa B',fieldEnd:'2026-10-10',published:'2026-10-15',values:{PP:21,'Frente Amplio (sin candidaturas territoriales)':4}}];
test('selección por varias casas y fin de campo, inclusiva; última por casa dentro del periodo',()=>{
 const state={houses:['Casa A','Casa B'],from:'2026-10-01',until:'2026-10-10',mode:'latest'};
 assert.deepEqual(selectStudies(fixture,state).map(p=>p.id),['c','a']);
 assert.deepEqual(selectStudies(fixture,{...state,until:'2026-11-02'}).map(p=>p.id),['b','c']);
 assert.deepEqual(selectStudies(fixture,{...state,from:'2026-11-02'}),[]);
 assert.deepEqual(selectStudies(fixture,{...state,houses:[]}),[]);
});
test('B menos A conserva cero y ausencia; no homologa coaliciones distintas',()=>{
 const diff=studyDifference(fixture[0],fixture[2],['PP','PSOE','Frente Amplio','Frente Amplio (sin candidaturas territoriales)']);
 assert.equal(diff[0].delta,21);assert.equal(diff[0].a,0);assert.equal(diff[1].delta,null);assert.equal(diff[2].delta,null);assert.equal(diff[3].delta,null);
 assert.equal(studyDifference({values:{PP:33.3}},{values:{PP:33.4}},['PP'])[0].delta,.1);
});
test('enlace conserva selección vacía, fechas y dos estudios; ignora etiquetas ajenas al archivo',()=>{
 const state={houses:[],parties:[],from:'',until:'2026-11-12',mode:'latest',a:'cis-3584',b:'gad3'};
 assert.deepEqual(readSelection(polls,selectionQuery(state)),state);
 const defaults=readSelection(polls);assert.equal(defaults.parties.length,3);assert.equal(defaults.houses.length,new Set(polls.map(p=>p.institute)).size);
 assert.deepEqual(readSelection(polls,'casas=seleccion&casa=INVENTADA&partidos=seleccion&partido=INVENTADO').parties,[]);
});
test('CSV incluye fuentes, cero y celda vacía para ausencia, escapando comillas',()=>{
 const csv=selectionCSV([{...fixture[0],source:'https://example.org/"fuente"'}],['PP','Ausente']);
 assert.match(csv,/"0","","https:\/\/example.org\/""fuente"""/);assert.doesNotMatch(csv,/undefined|null/);
});
test('gráfico usa escala común y muestra cada fuente con botón y fecha de campo',()=>{
 const chart=renderComparisonChart(fixture,'PP',{houses:['Casa A','Casa B'],top:40,start:Date.parse('2026-10-01T12:00:00Z'),end:Date.parse('2026-11-01T12:00:00Z')});
 assert.equal((chart.match(/<circle /g)||[]).length,3);assert.match(chart,/0 por ciento/);assert.match(chart,/40 %/);assert.match(chart,/data-study="a" role="button" tabindex="0"/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {recientesPrimero,cronologico,menorError,errorMedioAbsoluto,antiguedad,porTexto} from '../orden.mjs';

const est=[
 {casa:'B',fin:'2026-10-08',pub:'2026-10-12'},
 {casa:'A',fin:'2026-11-04',pub:'2026-11-08'},
 {casa:'C',fin:'2025-09-05',pub:'2025-09-08'},
 {casa:'D',fin:'2026-10-08',pub:'2026-10-09'},
];
const get={fin:x=>x.fin,pub:x=>x.pub,casa:x=>x.casa};

test('Estudios: el más reciente primero por fin de campo; desempate por publicación',()=>{
 assert.deepEqual([...est].sort(recientesPrimero(get)).map(x=>x.casa),['A','B','D','C']);
});
test('Alrededor de un acontecimiento: de antes a después por fin de campo',()=>{
 assert.deepEqual([...est].sort(cronologico(get)).map(x=>x.casa),['C','D','B','A']);
});
test('Errores: de menor a mayor valor absoluto, sin dato al final',()=>{
 const e=[{n:'x',v:-3},{n:'y',v:1},{n:'z',v:NaN},{n:'w',v:-0.5}];
 assert.deepEqual(e.sort(menorError(x=>x.v,x=>x.n)).map(x=>x.n),['w','y','x','z']);
 assert.equal(errorMedioAbsoluto([-3,1]),2);
});
test('Antigüedad legible',()=>{
 assert.equal(antiguedad('2026-11-04','2026-11-09').texto,'5 días');
 assert.equal(antiguedad('2026-05-28','2026-11-09').texto,'5 meses');
 assert.equal(antiguedad('2025-09-05','2026-11-09').texto,'1 año y 2 meses');
 assert.equal(porTexto('Ávila','Asturias')>0,true);
});
test('Las listas de estudios y registros usan los criterios comunes',()=>{
 const src=f=>fs.readFileSync(f,'utf8');
 assert.match(src('pronostico-vista.mjs'),/sort\(recientesPrimero\(\{fin:e=>e\.campo_fin/);
 assert.match(src('pronostico-vista.mjs'),/Antigüedad al corte/);
 assert.match(src('polls.mjs'),/sort\(recientesPrimero\(\{fin:p=>p\.fieldEnd/);
 assert.match(src('events.mjs'),/sort\(cronologico\(\{fin:p=>p\.fieldEnd/);
 assert.match(src('cocina-leccion.mjs'),/sort\(menorError\(/);
 assert.match(src('scripts/build.mjs'),/'orden\.mjs'/);
});

test('regla general: las tablas de acontecimientos y Tendencias listan primero lo más reciente',async()=>{
 const fs=await import('node:fs');
 const ev=fs.readFileSync(new URL('../events.mjs',import.meta.url),'utf8');
 assert.match(ev,/const cells=\[\.\.\.studies\]\.sort\(recientesPrimero/);
 const te=fs.readFileSync(new URL('../tendencias.mjs',import.meta.url),'utf8');
 assert.match(te,/const table=\[\.\.\.s\.rows\]\.sort\(\(a,b\)=>b\.published/);
 assert.match(te,/const history=\[\.\.\.s\.snapshots\]\.sort\(\(a,b\)=>b\.date/);
});

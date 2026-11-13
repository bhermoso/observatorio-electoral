import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {directoryRecords,directoryCard} from '../institutos.mjs';
const polls=JSON.parse(fs.readFileSync('data/polls.json')),book=JSON.parse(fs.readFileSync('modelo/recetario/recetas.json'));
test('directorio conserva todas las casas y separa documentación sin encuesta',()=>{
 const rows=directoryRecords(polls,book);
 assert.equal(rows.reduce((n,r)=>n+r.polls.length,0),polls.length);
 for(const name of new Set(polls.map(p=>p.institute)))assert.ok(rows.find(r=>r.name===name)?.polls.length);
 const reference=rows.find(r=>r.name==='Metroscopia');assert.equal(reference.polls.length,0);assert.match(directoryCard(reference,book),/sin encuesta incorporada/);
 const cis=rows.find(r=>r.name==='CIS');assert.equal(cis.polls[0].id,'cis-3584');assert.match(directoryCard(cis,book),/instituto=CIS#encuestas/);
});

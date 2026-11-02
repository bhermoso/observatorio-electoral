import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {projection,GROUPS} from '../cocina-escanos.mjs';
const election=JSON.parse(fs.readFileSync('data/election.json','utf8'));
test('Simula 52 circunscripciones y distribuye exactamente 350 diputados',()=>{
 const r=projection(election,{PP:33.06,PSOE:31.68,VOX:12.38,SUMAR:12.33});
 assert.equal(r.districts.length,52);
 assert.equal(r.diagnostics.totalSeats,350);
 assert.equal(Object.values(r.referenceSeats).reduce((a,b)=>a+b,0),350);
 assert.equal(Object.values(r.seats).reduce((a,b)=>a+b,0),350);
 assert.ok(r.diagnostics.maxTargetErrorPP<0.5);
});
test('Cambiar el voto de cocina modifica diputados sin simular microdatos provinciales',()=>{
 const a=projection(election,{PP:33,PSOE:32,VOX:12,SUMAR:12});
 const b=projection(election,{PP:42,PSOE:24,VOX:12,SUMAR:12});
 assert.ok(b.seats.PP>a.seats.PP,'El PP debería ganar escaños con +9 puntos');
 assert.ok(b.seats.PSOE<a.seats.PSOE,'El PSOE debería perder escaños con -8 puntos');
 assert.deepEqual(GROUPS,['PP','PSOE','VOX','SUMAR','OTROS']);
});
test('Rechaza cuotas incompatibles y no asigna escaños ficticios',()=>{
 assert.throws(()=>projection(election,{PP:80,PSOE:30,VOX:3,SUMAR:3}),/100/);
 assert.throws(()=>projection(election,{PP:NaN,PSOE:20,VOX:10,SUMAR:10}),/inválidos/);
});
test('Conexión visual: receta, microdatos reponderados y entrada manual',()=>{
 const html=fs.readFileSync('construye-estimacion.html','utf8');
 const js=fs.readFileSync('cocina-escanos-ui.mjs','utf8');
 const build=fs.readFileSync('scripts/build.mjs','utf8');
 assert.match(html,/id="craft-seat-source"/);
 assert.match(html,/Introducir mi propia estimación/);
 assert.match(html,/id="craft-seat-result"/);
 assert.match(js,/projection\(election,values\)/);
 assert.match(js,/raw-reweight-slider/);
 assert.match(build,/cocina-escanos-ui.mjs/);
 assert.match(fs.readFileSync('flujograma.html','utf8'),/construye-estimacion.html#craft-seats/);
});

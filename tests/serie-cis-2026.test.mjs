import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validarSerieCis2026,renderSerieCis2026,tablaSerieCis2026} from '../serie-cis-2026.mjs';
const data=JSON.parse(fs.readFileSync('data/microdatos/serie-cis-2026-experimental.json','utf8'));
test('cuatro originales y seis escenarios sin duplicar estudios',()=>{
 const rows=validarSerieCis2026(data);
 assert.deepEqual(rows.map(x=>x.id),['3567','3571','3577','3582']);
 assert.equal(rows.length,4);
 assert.equal(Object.keys(rows[0].pasos).length,6);
 assert.equal(rows[3].pasos.participacion.PP,27.735);
 assert.equal(rows[3].pasos.participacion.PSOE,27.258);
 const old=JSON.parse(fs.readFileSync('data/microdatos/cocina_cis_3582.json','utf8'));
 for(const p of data.partidos) assert.equal(rows[3].pasos.participacion[p],old.resultado.estimacion[p]);
 assert.equal(rows[3].sha256_zip,old.sha256_zip);
});
test('falsos registros y escenarios fuera de rango se rechazan',()=>{
 const bad=structuredClone(data);
 bad.estudios[1].pasos.participacion.PP=105;
 assert.throws(()=>validarSerieCis2026(bad),/incorrecto/);
 const missing=structuredClone(data);delete missing.estudios[0].pasos.indecisos;
 assert.throws(()=>validarSerieCis2026(missing),/incorrecto/);
});
test('serie aparece en Cocina sin tocar las visualizaciones existentes',()=>{
 const html=tablaSerieCis2026(data);
 assert.match(html,/seis tratamientos/);
 assert.match(html,/Motor 29N/);
 assert.match(renderSerieCis2026(),/cocina-serie-cis-tabla/);
 const home=fs.readFileSync('home-impact.mjs','utf8');
 for(const id of ['hub-hemiciclo','hub-promedio','hub-micro-resultado'])assert.match(home,new RegExp('id="'+id+'"'));
 const kitchen=fs.readFileSync('cocina.mjs','utf8');
 assert.match(kitchen,/renderSerieCis2026\(\)/);
 assert.match(kitchen,/bindSerieCis2026\(\)/);
 const build=fs.readFileSync('scripts/build.mjs','utf8');
 assert.match(build,/serie-cis-2026\.mjs/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {auditCoverage} from '../validacion-cobertura.mjs';
const registry=JSON.parse(fs.readFileSync('data/microdatos/registro_validacion_elecciones.json','utf8'));
test('La cobertura no infla una elección por tener varios estudios',()=>{
 const c=auditCoverage(registry);
 assert.equal(c.independent,0);
 assert.equal(c.exploratory,1);
 assert.equal(c.eligibleForMethodSelection,false);
 assert.equal(c.elections.find(e=>e.id==='es-congreso-2023-07').studies.length,2);
 for(const e of ['es-congreso-2019-04','es-congreso-2019-11']){
  assert.equal(c.elections.find(x=>x.id===e).independent,false);
  assert.equal(c.elections.find(x=>x.id===e).comparable,false);
 }
});
test('Una prueba no puede declararse independiente sin protocolo congelado y resultados',()=>{
 const fake=structuredClone(registry);
 fake.elections.find(e=>e.id==='es-congreso-2019-04').independent_election_test=true;
 assert.throws(()=>auditCoverage(fake),/falta trazabilidad/);
 fake.elections[0].independent_election_test=false;
 fake.elections.push({...fake.elections[0]});
 assert.throws(()=>auditCoverage(fake),/repetida/);
});
test('La interfaz y el build publican matriz de elegibilidad sin resultados inventados',()=>{
 const html=fs.readFileSync('validacion-recetas.html','utf8');
 const ui=fs.readFileSync('validacion-imputaciones-ui.mjs','utf8');
 const build=fs.readFileSync('scripts/build.mjs','utf8');
 assert.match(html,/id="vh-coverage"/);
 assert.match(html,/id="vh-election-registry"/);
 assert.match(html,/ninguna prueba prospectiva independiente/i);
 assert.match(ui,/auditCoverage/);
 assert.match(ui,/registro_validacion_elecciones.json/);
 assert.match(build,/validacion-cobertura.mjs/);
 assert.match(fs.readFileSync('scripts/preparar_validacion_2019.py','utf8'),/VARIABLE_REVIEW_REQUIRED/);
});


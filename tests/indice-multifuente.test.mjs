import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validarIndiceMultifuente,renderIndiceMultifuente,pintarIndiceMultifuente,auditarIndiceMultifuente} from '../indice-multifuente.mjs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const data=read('data/microdatos/indice-multifuente-cis-40db-2026.json');
const cis=read('data/microdatos/serie-cis-2026-experimental.json').estudios.find(s=>s.id==='3582');
const db=read('data/microdatos/40db-auditoria-2026.json').olas.find(s=>s.id==='flash');
test('síntesis de dos fuentes originales sin duplicar oleadas y con media de institutos',()=>{
 validarIndiceMultifuente(data);
 assert.equal(data.fuentes.length,2);
 assert.equal(data.uso,'INVESTIGACION_NO_MOTOR_29N');
 for(const p of data.partidos){
  const base=data.escenarios.base.valores[p];
  const rec=data.escenarios.recuerdo.valores[p];
  assert.equal(base.cis,cis.pasos.peso[p]);
  assert.equal(base['40db'],db.directa[p]);
  assert.equal(rec.cis,cis.pasos.recuerdo[p]);
  assert.equal(rec['40db'],db.recuerdo_calibrado[p]);
  assert.ok(Math.abs(base.conjunta-(base.cis+base['40db'])/2)<0.001);
 }
});
test('panorama inicial muestra cuatro partidos sin elección por defecto',()=>{
 const h=renderIndiceMultifuente({compacto:true});
 assert.match(h,/value="todos"/);
 assert.match(h,/data-multi-party/);
 assert.match(h,/data-multi-order/);
 const html=pintarIndiceMultifuente(data);
 const positions=data.partidos.slice().sort((a,b)=>data.escenarios.base.valores[b].conjunta-data.escenarios.base.valores[a].conjunta);
 for(let i=1;i<positions.length;i++)
  assert.ok(html.indexOf('<strong>'+positions[i-1])<html.indexOf('<strong>'+positions[i]));
 assert.match(html,/Distancia/);
 assert.match(html,/no un intervalo de confianza/);
 assert.doesNotMatch(html,/escaños calculados/);
 assert.match(auditarIndiceMultifuente(data),/Motor 29N/);
});
test('elección explícita de partido y escenario preserva trazabilidad',()=>{
 const html=pintarIndiceMultifuente(data,{partido:'VOX',escenario:'recuerdo',orden:'nombre'});
 assert.match(html,/18,4/);
 assert.doesNotMatch(html,/<strong>PP<\/strong>/);
 const bad=structuredClone(data);bad.escenarios.base.valores.PP.conjunta=99;
 assert.throws(()=>validarIndiceMultifuente(bad),/mal calculada/);
 const invalid=structuredClone(data);invalid.uso='MOTOR_29N';
 assert.throws(()=>validarIndiceMultifuente(invalid),/no habilitado/);
});
test('la UI multifuente se sirve en portada, Cocina y build sin invadir el motor',()=>{
 const home=fs.readFileSync('home-impact.mjs','utf8');
 const kitchen=fs.readFileSync('cocina.mjs','utf8');
 const build=fs.readFileSync('scripts/build.mjs','utf8');
 assert.match(home,/renderIndiceMultifuente\(\{compacto:true\}\)/);
 assert.match(kitchen,/renderIndiceMultifuente\(\)/);
 assert.match(build,/indice-multifuente\.mjs/);
 for(const path of ['como-estimamos.html','guia-cocina.html','metodologia-analisis.html','validacion-recetas.html']){
  const doc=fs.readFileSync(path,'utf8');
  assert.match(doc,/lectura-editorial\.mjs/);
  assert.match(doc,/lectura-editorial\.css/);
 }
});

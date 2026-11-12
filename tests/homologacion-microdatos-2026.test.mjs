import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {normalizarAgregados2026,renderHomologacion2026,tablaHomologacion2026} from '../homologacion-microdatos-2026.mjs';
const cis=JSON.parse(fs.readFileSync('data/microdatos/cocina_cis_3582.json','utf8'));
const db=JSON.parse(fs.readFileSync('data/microdatos/40db-auditoria-2026.json','utf8'));
test('homologación conserva identidad de fuente, tratamiento y muestra',()=>{
 const d=normalizarAgregados2026(cis,db);
 assert.equal(d.filas.length,3+db.olas.length*2);
 assert.equal(new Set(d.filas.map(x=>x.id)).size,d.filas.length);
 assert.equal(d.filas.filter(x=>x.casa==='CIS').length,3);
 assert.equal(d.filas.filter(x=>x.casa==='40dB').length,6);
 assert.deepEqual(d.partidos,['PP','PSOE','VOX','SUMAR']);
 assert.equal(d.filas.find(x=>x.id==='cis-3582-directa').voto.PP,22.416);
 assert.equal(d.filas.find(x=>x.id==='cis-3582-ponderada').voto.PP,20.104);
 assert.equal(d.filas.find(x=>x.id==='cis-3582-receta').voto.PP,27.735);
 assert.equal(d.filas.find(x=>x.id==='40db-octubre-directa').voto.PP,24.174);
 assert.equal(d.filas.find(x=>x.id==='40db-octubre-recuerdo').voto.PP,28.84);
 assert.equal(d.filas.filter(x=>x.estatus==='receta_no_validada').length,4);
});
test('tabla aclara que no es una estimación conjunta ni proyección de escaños',()=>{
 const html=tablaHomologacion2026(normalizarAgregados2026(cis,db));
 assert.match(html,/experimento NO validado/i);
 assert.match(html,/no agregables/);
 assert.match(html,/ponderador publicado/);
 assert.match(html,/no reconstruyen la estimación oficial de 40dB/);
 assert.match(html,/ninguna de estas filas se incorpora automáticamente/i);
 assert.match(renderHomologacion2026(),/cocina-homologacion-tabla/);
});
test('no se pueden incorporar porcentajes ilegales o una ola duplicada',()=>{
 const bad=structuredClone(db);bad.olas[0].directa.PP=120;
 assert.throws(()=>normalizarAgregados2026(cis,bad),/inválida/);
 const dup=structuredClone(db);dup.olas.push(dup.olas[0]);
 assert.throws(()=>normalizarAgregados2026(cis,dup),/duplicada/);
 assert.throws(()=>normalizarAgregados2026(cis,{}),/Faltan agregados/);
});
test('la integración no modifica las tres visualizaciones de portada',()=>{
 const home=fs.readFileSync('home-impact.mjs','utf8');
 const cocina=fs.readFileSync('cocina.mjs','utf8');
 const build=fs.readFileSync('scripts/build.mjs','utf8');
 for(const id of ['hub-hemiciclo','hub-promedio','hub-micro-resultado'])assert.match(home,new RegExp('id="'+id+'"'));
 assert.match(cocina,/renderHomologacion2026\(\)/);
 assert.match(cocina,/bindHomologacion2026\(\)/);
 assert.match(build,/homologacion-microdatos-2026\.mjs/);
});

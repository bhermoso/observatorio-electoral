import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {renderMicrodatosPortada} from '../portada-microdatos.mjs';
import {renderHomeImpact} from '../home-impact.mjs';

const receta=JSON.parse(fs.readFileSync('data/microdatos/cocina_cis_3582.json','utf8'));
test('el tercer panel muestra exclusivamente la estimación propia sobre microdatos',()=>{
 const page=renderHomeImpact();
 for(const id of ['hub-hemiciclo','hub-promedio','hub-microdatos','hub-micro-resultado'])assert.match(page,new RegExp('id="'+id+'"'));
 assert.ok(page.indexOf('id="hub-hemiciclo"')<page.indexOf('id="hub-microdatos"'));
 assert.ok(page.indexOf('id="hub-promedio"')<page.indexOf('id="hub-microdatos"'));
 assert.ok(page.indexOf('id="hub-microdatos"')<page.indexOf('id="portada-ultimas"'));
 const src=fs.readFileSync('home-impact.mjs','utf8');
 assert.match(src,/data\/microdatos\/cocina_cis_3582\.json/);
 assert.match(src,/renderMicrodatosPortada\(d\)/);
 assert.match(fs.readFileSync('scripts/build.mjs','utf8'),/portada-microdatos\.mjs/);
});
test('la vista no fabrica escaños ni confunde el estudio de octubre con el motor 29N',()=>{
 const html=renderMicrodatosPortada(receta);
 for(const key of ['PP','PSOE','VOX','SUMAR','PODEMOS'])assert.match(html,new RegExp(receta.resultado.estimacion[key].toLocaleString('es-ES',{minimumFractionDigits:1,maximumFractionDigits:1}).replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
 assert.match(html,/Octubre 2026/);
 assert.match(html,/no extrapola a noviembre ni asigna escaños/);
 assert.match(html,/no entra en el Motor 29N/);
 assert.match(html,/cocina-propia/);
 assert.doesNotMatch(html,/350 escaños|mayoría parlamentaria/);
});
test('si no hay microdatos válidos, no se sustituyen por pronósticos de agregados',()=>{
 assert.throws(()=>renderMicrodatosPortada({}),/receta/);
 assert.throws(()=>renderMicrodatosPortada({...receta,estudio:'otro'}),/receta/);
});

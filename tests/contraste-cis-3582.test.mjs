import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {contrastarCis3582,renderContrasteCis3582,tablaContrasteCis3582} from '../contraste-cis-3582.mjs';
const receta=JSON.parse(fs.readFileSync('data/microdatos/cocina_cis_3582.json','utf8'));
const polls=JSON.parse(fs.readFileSync('data/polls.json','utf8'));
test('el CIS publicado se compara con una sola receta microdata sin inventar segunda encuesta',()=>{
 const c=contrastarCis3582(receta,polls);
 assert.equal(c.estudio,'3582');
 assert.equal(c.oficial_id,'cis-3582');
 assert.equal(c.filas.length,13);
 assert.equal(polls.filter(x=>x.id==='cis-3582').length,1);
 const pp=c.filas.find(x=>x.key==='PP');
 assert.equal(pp.oficial,22.2);
 assert.equal(pp.experimental,27.735);
 assert.equal(pp.diferencia_pp,5.535);
 const psoe=c.filas.find(x=>x.key==='PSOE');
 assert.equal(psoe.oficial,34);
 assert.equal(psoe.experimental,27.258);
 assert.equal(psoe.diferencia_pp,-6.742);
});
test('el contraste diferencia estimaciones y nunca las declara aciertos ni motor',()=>{
 const html=tablaContrasteCis3582(contrastarCis3582(receta,polls));
 assert.match(html,/Lo que publica|CIS 3582/);
 assert.match(html,/no entra en el Motor 29N/);
 assert.match(html,/La estimación oficial del CIS consta una sola vez/);
 assert.match(renderContrasteCis3582(),/cocina-cis-3582-tabla/);
});
test('no permite duplicar el estudio CIS ni porcentajes faltantes',()=>{
 assert.throws(()=>contrastarCis3582(receta,[...polls,polls.find(x=>x.id==='cis-3582')]),/única/);
 const bad=structuredClone(receta);bad.resultado.estimacion.PP=null;
 assert.throws(()=>contrastarCis3582(bad,polls),/inválido/);
 assert.throws(()=>contrastarCis3582({...receta,estudio:'otra'},polls),/no es válida/);
});
test('se mantiene intacta la portada y se incorpora solo el módulo en Cocina',()=>{
 const home=fs.readFileSync('home-impact.mjs','utf8');
 const kitchen=fs.readFileSync('cocina.mjs','utf8');
 const build=fs.readFileSync('scripts/build.mjs','utf8');
 for(const id of ['hub-hemiciclo','hub-promedio','hub-micro-resultado'])
  assert.match(home,new RegExp('id="'+id+'"'));
 assert.match(kitchen,/renderContrasteCis3582\(\)/);
 assert.match(kitchen,/bindContrasteCis3582\(\)/);
 assert.match(build,/contraste-cis-3582\.mjs/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {renderPronostico} from '../pronostico-vista.mjs';
import {renderContraste} from '../contraste-capas.mjs';
import {renderInteriorGuide} from '../interiores.mjs';
import {readFileSync} from 'node:fs';

test('el pronóstico tiene tres niveles inequívocos y conserva cada panel original',()=>{
 const html=renderPronostico(renderContraste());
 for(const id of ['pronostico-comprender','pronostico-comparar','pronostico-auditar'])assert.match(html,new RegExp('id="'+id+'"'));
 assert.equal((html.match(/class="pr-reading-group(?: |")/g)||[]).length,3);
 assert.equal((html.match(/class="pr-reading-group pr-reading-disclosure"/g)||[]).length,2);
 assert.ok(html.indexOf('id="pronostico-comprender"')<html.indexOf('id="pronostico-comparar"'));
 assert.ok(html.indexOf('id="pronostico-comparar"')<html.indexOf('id="pronostico-auditar"'));
 for(const id of ['pronostico-principal','pronostico-cocina','pronostico-variantes','pronostico-capas','pronostico-bloques','pronostico-evolucion','pronostico-territorio','pronostico-fuentes','pronostico-evaluacion','pronostico-externos']){
  assert.ok(html.includes('id="'+id+'"'),id);
 }
 assert.match(html,/15|última encuesta de cada instituto/);
 assert.match(html,/el motor utiliza los estudios históricos/);
 assert.match(html,/ni se suma el promedio como entrada/);
});
test('la guía y la ruta mantienen niveles y anclas accesibles',()=>{
 const guide=renderInteriorGuide('pronostico');
 for(const id of ['pronostico-comprender','pronostico-comparar','pronostico-auditar'])assert.match(guide,new RegExp('href="#'+id+'"'));
 const app=readFileSync(new URL('../app.mjs',import.meta.url),'utf8');
 assert.match(app,/renderPronostico\(renderContraste\(\)\)/);
 const src=readFileSync(new URL('../interiores.mjs',import.meta.url),'utf8');
 assert.match(src,/parent\.tagName==='DETAILS'\)parent\.open=true/);
});

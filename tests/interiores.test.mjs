import test from 'node:test';
import assert from 'node:assert/strict';
import {renderInteriorGuide,renderSeatChanges} from '../interiores.mjs';
import {renderPollScatter} from '../encuestas-visual.mjs';
import {renderCandidates} from '../encuestas-servicio.mjs';
import fs from 'node:fs';
test('Las guías distinguen cuatro naturalezas y la investigación sin alterar el motor',()=>{
 for(const route of ['pronostico','encuestas','cocina','contexto','metodologia','atlas','laboratorio']){
  const html=renderInteriorGuide(route);assert.match(html,/Niveles de exploración/);assert.match(html,/Cuatro naturalezas de estimación/);assert.match(html,/Investigación, no incorporada/);
 }
});
test('Dispersión conserva ceros, ausencias y etiquetas originales; no inventa equivalencia de coaliciones',()=>{
 const rows=[{id:'a',institute:'Casa <A>',fieldEnd:'2026-11-01',values:{PP:0,Sumar:10}},
 {id:'b',institute:'B',fieldEnd:'2026-11-02',values:{PP:30,'Frente Amplio':15}}];
 const before=JSON.stringify(rows),html=renderPollScatter(rows,'PP');
 assert.equal((html.match(/<circle /g)||[]).length,2);assert.match(html,/0 %/);assert.match(html,/Casa &lt;A&gt;/);assert.equal(JSON.stringify(rows),before);
 assert.equal((renderPollScatter(rows,'Sumar').match(/<circle /g)||[]).length,1);
 assert.match(renderPollScatter(rows,'Podemos'),/No hay cifras/);
});
test('Diferencias del laboratorio conservan su signo y no cambian los datos',()=>{
 const html=renderSeatChanges([{id:'a',label:'A',seats:5},{id:'b',label:'B',seats:1}],[{id:'a',seats:2},{id:'b',seats:4}]);
 assert.match(html,/simétrica ±3/);assert.match(html,/>\+3</);assert.match(html,/>-3</);
});
test('Búsqueda parcial no se presenta como un intento posterior al éxito',()=>{
 assert.match(renderCandidates({status:'partial',sources:[],results:[]}),/Cobertura parcial/);
});
test('La vigilancia solicita Pages tras el push y solo con fichas nuevas validadas',()=>{
 const yaml=fs.readFileSync(new URL('../.github/workflows/vigilancia-encuestas.yml',import.meta.url),'utf8');
 assert.ok(yaml.indexOf('git push origin HEAD:main')<yaml.indexOf('gh workflow run pages.yml --ref main'));
 assert.match(yaml,/if: success\(\) && steps.publish.outputs.updated == 'true'/);
 assert.match(yaml,/python scripts.vigilar_encuestas.py/);assert.doesNotMatch(yaml,/actualizar_servicio|--service|supabase/);assert.match(yaml,/actions: write/);assert.match(yaml,/github.ref == 'refs\/heads\/main'/);
});

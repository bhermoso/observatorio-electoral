import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const html=fs.readFileSync('construye-estimacion.html','utf8');
const js=fs.readFileSync('construye-estimacion.mjs','utf8');
const data=JSON.parse(fs.readFileSync('data/microdatos/validacion_23j.json','utf8'));
const data26=JSON.parse(fs.readFileSync('data/microdatos/analisis_3582.json','utf8'));
test('Laboratorio usa datos CIS 3411 3415 y 3582 sin inventar respuestas',()=>{
 assert.match(html,/CIS 3411/);assert.match(html,/CIS 3415/);assert.match(html,/CIS 3582/);
 assert.match(js,/validacion_23j.json/);assert.match(js,/analisis_3582.json/);
 assert.match(js,/escenarios agregados/i);
 assert.ok(data.studies['3411'].scenarios.decided.PSOE>0);
 assert.ok(data26.comparison.some(x=>x.party==='PP'));
});
test('Se distingue muestra completa, decididos y recetas alternativas',()=>{
 assert.match(js,/direct_all/);assert.match(js,/decided/);
 assert.match(js,/turnout_decided/);assert.match(js,/sympathy_decided/);
 assert.match(js,/recall_experiment/);
 assert.match(js,/no se aplican una tras otra/);
});
test('Errores históricos no se usan como resultado de 2026',()=>{
 assert.match(js,/id==='3582'\?null/);
 assert.match(js,/Error predictivo/);
 assert.match(js,/No calculable/);
 assert.match(js,/receta==='direct_all'/);
});
test('Operaciones, código documental y exportación interactiva',()=>{
 assert.match(html,/id="craft-steps"/);assert.match(html,/id="craft-stage"/);
 assert.match(js,/descripción/i);
 assert.match(js,/JSON.stringify\(file,null,2\)/);
 assert.match(js,/aria-current="step"/);
});
test('El generador copia la aplicación y existe un acceso desde cocina',()=>{
 const build=fs.readFileSync('scripts/build.mjs','utf8');
 assert.match(build,/construye-estimacion.html/);
 assert.match(build,/construye-estimacion.mjs/);
 assert.match(fs.readFileSync('cocina.mjs','utf8'),/CONSTRUYE UNA ESTIMACIÓN/);
});

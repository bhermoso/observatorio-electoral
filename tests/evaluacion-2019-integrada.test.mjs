import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {renderEvaluacion2019,renderResultados2019} from '../evaluacion-2019.mjs';
import {retrospective2019} from '../validacion-2019-retrospectiva.mjs';
import {renderPronostico} from '../pronostico-vista.mjs';

const data=JSON.parse(fs.readFileSync('data/microdatos/diagnostico_2019_original.json','utf8'));

test('2019 aporta comparaciones calculadas por dos convocatorias y cuatro métodos',()=>{
 const r=retrospective2019(data);
 assert.equal(r.distinctElectionsRetrospective,2);
 assert.equal(r.independentProspectiveTests,0);
 assert.equal(r.rows.length,4);
 const baseline=r.rows.find(row=>row.method==='exclude');
 const sympathy=r.rows.find(row=>row.method==='sympathy');
 assert.ok(Math.abs(baseline.studies[0].mae-3.323)<0.002);
 assert.ok(Math.abs(baseline.studies[1].mae-5.278)<0.002);
 assert.ok(Math.abs(sympathy.studies[0].mae-2.971)<0.002);
 assert.ok(Math.abs(sympathy.studies[1].mae-5.653)<0.002);
 assert.ok(sympathy.studies[0].mae<baseline.studies[0].mae);
 assert.ok(sympathy.studies[1].mae>baseline.studies[1].mae);
});
test('Evaluación visual es verificable y no anuncia receta ganadora',()=>{
 const html=renderResultados2019(data);
 assert.match(html,/Dos elecciones históricas estudiadas/);
 assert.match(html,/0 pruebas prospectivas/);
 for(const v of ['3,32 pp','5,28 pp','2,97 pp','5,65 pp'])assert.ok(html.includes(v),v);
 assert.match(html,/La mejora de abril no se reproduce en noviembre/);
 assert.match(html,/candidaturas \+ voto blanco/);
 assert.match(html,/no validan prospectivamente ninguna corrección del Motor 29N/);
 assert.match(html,/Indecisión 94: VOTOSIMG identificable/);
 assert.match(html,/Desglosar errores por partido/);
 assert.match(html,/BOE/);
 assert.match(html,/table/);
 assert.match(renderEvaluacion2019(),/id="historical-2019-data"/);
});
test('No se ocultan fuentes incompletas ni se inventan resultados',()=>{
 assert.throws(()=>renderResultados2019({studies:{}}),/dos estudios CIS/);
 assert.throws(()=>renderResultados2019({...data,studies:{...data.studies,'3242':{...data.studies['3242'],groups:{INDECISION:{...data.studies['3242'].groups.INDECISION,w:0}}}}}),/asignación excede el grupo/);
});
test('El módulo está integrado en Pronóstico y empaquetado en GitHub Pages',()=>{
 const forecast=fs.readFileSync('pronostico-vista.mjs','utf8');
 const build=fs.readFileSync('scripts/build.mjs','utf8');
 const page=renderPronostico();
 assert.match(page,/id="historical-2019-data"/);
 assert.match(forecast,/bindEvaluacion2019\(\)/);
 assert.match(page,/Evaluación histórica de encuestas y recetas/);
 assert.match(page,/id="pronostico-evaluacion"/);
 assert.ok(build.includes("'evaluacion-2019.mjs'"));
 assert.ok(build.includes("'validacion-2019-retrospectiva.mjs'"));
});

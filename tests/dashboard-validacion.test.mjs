import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {renderValidationDashboard} from '../dashboard-validacion.mjs';
const html=renderValidationDashboard();
const forecast=JSON.parse(fs.readFileSync('modelo/salida/pronostico.json','utf8'));
const audit=JSON.parse(fs.readFileSync('data/microdatos/auditoria_cocina_23j.json','utf8'));
test('Home integra auditoría histórica navegable, no cifras inventadas',()=>{
 const home=fs.readFileSync('home-impact.mjs','utf8');
 const build=fs.readFileSync('scripts/build.mjs','utf8');
 assert.match(home,/renderValidationDashboard\(\)/);
 assert.match(home,/bindValidationDashboard\(\)/);
 assert.match(build,/dashboard-validacion.mjs/);
 assert.match(html,/id="auditoria"/);
 assert.match(html,/id="audit-party"/);
 assert.match(html,/id="audit-study"/);
 assert.match(html,/id="audit-houses"/);
 assert.match(html,/id="audit-recipes"/);
 assert.match(html,/id="audit-retro"/);
 assert.match(html,/23J de 2023/);
 assert.match(html,/Llaneras/);
});
test('El dashboard usa errores reales e identifica limitación histórica',()=>{
 const source=fs.readFileSync('dashboard-validacion.mjs','utf8');
 assert.match(source,/forecast.error_23j/);
 assert.match(source,/audit.resultados_por_estudio/);
 assert.match(source,/forecast.retroprueba_23j/);
 assert.match(source,/no prueba independiente/);
 assert.ok(Object.keys(forecast.error_23j).length>1);
 for(const study of ['3411','3415']){
  for(const method of ['decided','sympathy_decided','turnout_decided','published_cis'])
   assert.ok(Number.isFinite(audit.resultados_por_estudio[study][method].mae_pp),study+method);
 }
});

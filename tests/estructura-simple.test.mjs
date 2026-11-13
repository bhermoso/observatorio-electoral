import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {primaryNavigation,surveyNavigation} from '../navegacion.mjs';
import {encuestasRecientes} from '../portada-hub.mjs';
test('cuatro destinos estables y herramientas dentro de Encuestas',()=>{
 const nav=primaryNavigation();assert.equal((nav.match(/<a /g)||[]).length,4);for(const label of ['Panorama','Encuestas','Cocina','Método'])assert.ok(nav.includes('>'+label+'</a>'));
 const tools=surveyNavigation();for(const target of ['comparador-encuestas.html','institutos.html','encuestas-resultados.html'])assert.ok(tools.includes(target));
});
test('deduplicar las tarjetas conserva la auditoría original y distintas oleadas',()=>{
 const entry={estudio:'verificada',casa:'DYM',campo_ini:'2026-11-04',campo_fin:'2026-11-06',publicacion:'2026-11-10',n:1025,voto:{PP:33.1,PSOE:27.3}};
 const forecast={entradas:[entry],excluidas:[{...entry,estudio:'duplicada',motivo:'Campo solapado'},{...entry,estudio:'otra-oleada',campo_ini:'2026-10-01',campo_fin:'2026-10-05',publicacion:'2026-10-06'}]};
 assert.equal(encuestasRecientes(forecast,[]).length,3);const visible=encuestasRecientes(forecast,[],{deduplicate:true});assert.equal(visible.length,2);assert.equal(visible[0].id,'verificada');assert.ok(visible.some(p=>p.id==='otra-oleada'));
});
test('el menú principal de portada no vuelve a acumular herramientas',()=>{
 const html=fs.readFileSync('index.html','utf8'),nav=html.match(/<nav class="principal-nav"[^>]*>([\s\S]*?)<\/nav>/)[1];assert.equal((nav.match(/<a /g)||[]).length,4);assert.doesNotMatch(nav,/comparador-encuestas|institutos|encuestas-resultados/);
});

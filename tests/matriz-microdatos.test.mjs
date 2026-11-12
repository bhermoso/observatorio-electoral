import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {prepararMatrizFuentes,renderMatrizFuentes,tablaMatrizFuentes} from '../matriz-microdatos.mjs';
const read=n=>JSON.parse(fs.readFileSync('data/microdatos/'+n+'.json','utf8'));
const sources={cis:read('cocina_cis_3582'),db26:read('40db-auditoria-2026'),db23:read('40db-retrospectiva-2023'),socio:read('sociometrica-2025-agregados'),custodia:read('custodia')};
test('se registran únicamente estudios de origen y nivel de procesamiento verificable',()=>{
 const rows=prepararMatrizFuentes(sources);
 assert.equal(rows.length,1+3+3+4+4);
 assert.equal(new Set(rows.map(x=>x.id)).size,rows.length);
 assert.equal(rows.filter(x=>x.uso==='experimental').length,4);
 assert.equal(rows.filter(x=>x.uso==='validacion_exploratoria').length,3);
 assert.equal(rows.filter(x=>x.uso==='pendiente_homologacion').length,8);
 assert.equal(rows.filter(x=>x.fuente==='More in Common').length,4);
 assert.equal(rows.filter(x=>x.fuente==='SocioMétrica').length,4);
 assert.ok(rows.every(x=>x.documento.startsWith('data/microdatos/')));
 assert.ok(rows.filter(x=>x.fuente==='More in Common').every(x=>x.n===null));
});
test('denominadores incompatibles permanecen separados y sin inventar pronósticos',()=>{
 const html=tablaMatrizFuentes(prepararMatrizFuentes(sources));
 assert.match(html,/Todos los registros; no equiparable al voto válido/);
 assert.match(html,/Voto válido declarado; ponderador ponde/);
 assert.match(html,/Pendiente de inspección de variables y denominador/);
 assert.match(html,/no se atribuyen estimaciones/);
 assert.doesNotMatch(html,/media ponderada interinstitucional|estimación conjunta 2026|proyección de escaños/);
});
test('la matriz no sustituye hemiciclo ni promedio de la portada',()=>{
 const kitchen=fs.readFileSync('cocina.mjs','utf8');
 const home=fs.readFileSync('home-impact.mjs','utf8');
 const build=fs.readFileSync('scripts/build.mjs','utf8');
 assert.match(kitchen,/renderMatrizFuentes\(\)/);
 assert.match(kitchen,/bindMatrizFuentes\(\)/);
 assert.match(build,/matriz-microdatos\.mjs/);
 for(const id of ['hub-hemiciclo','hub-promedio','hub-micro-resultado'])assert.match(home,new RegExp('id="'+id+'"'));
 assert.match(renderMatrizFuentes(),/id="cocina-matriz-datos"/);
});
test('no se aceptan fuentes parciales como si fueran estimaciones armonizadas',()=>{
 assert.throws(()=>prepararMatrizFuentes({...sources,custodia:{}}),/Faltan fuentes/);
 const altered=structuredClone(sources);altered.db26.olas[0].directa.PP=null;
 assert.throws(()=>prepararMatrizFuentes(altered),/incompleto/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {evaluarRecetas,tablaEvaluacionMicrodatos,REGLAS} from '../evaluacion-microdatos.mjs';
const cis=JSON.parse(readFileSync(new URL('../data/microdatos/auditoria_cocina_23j.json',import.meta.url),'utf8'));
const db=JSON.parse(readFileSync(new URL('../data/microdatos/40db-retrospectiva-2023.json',import.meta.url),'utf8'));

test('una sola elección independiente y recetas separadas del motor',()=>{
 const d=evaluarRecetas(cis,db);
 assert.equal(d.elections,1);
 assert.equal(d.operational,false);
 assert.equal(REGLAS.operational,false);
 assert.equal(d.cisTrials.length,2);
 assert.equal(d.dbTrials.length,3);
 assert.equal(d.keys.length,8);
});
test('errores reconstituidos y referencias, no sumas de encuestas independientes',()=>{
 const d=evaluarRecetas(cis,db);
 assert.ok(Math.abs(d.cisTrials[0].difference-0.32325)<0.00001);
 const ponderada=d.dbTrials[0].candidates.find(x=>x.id==='ponde');
 assert.ok(Math.abs(ponderada.difference-(2.854-2.43))<0.00001);
 const html=tablaEvaluacionMicrodatos(d);
 assert.match(html,/1 elección independiente/);
 assert.match(html,/0 recetas incorporadas/);
 assert.match(html,/No produce un nuevo pronóstico|Evidencia insuficiente/);
});
test('rechaza auditorías incompatibles',()=>{
 assert.throws(()=>evaluarRecetas({...cis,eleccion:'2024-01-01'},db),/no coincide/);
 assert.throws(()=>evaluarRecetas(cis,{...db,estudios:[]}),/incompletas/);
});

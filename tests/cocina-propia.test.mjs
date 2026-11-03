import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {tablaPasos,tablaValidacion} from '../cocina-propia.mjs';
const receta=JSON.parse(fs.readFileSync('data/microdatos/cocina_cis_3582.json','utf8'));
const val=JSON.parse(fs.readFileSync('data/microdatos/validacion_cocina_cis.json','utf8'));
test('la receta publica solo agregados y sus pasos son acumulativos y trazables',()=>{
 assert.deepEqual(receta.receta,['directa','peso','simpatia','recuerdo','indecisos','participacion']);
 for(const p of receta.pasos.slice(1))for(const [k,v] of Object.entries(p.variacion_pp))assert.ok(Math.abs(v-(p.estimacion[k]-receta.pasos[receta.pasos.indexOf(p)-1].estimacion[k]))<0.002);
 assert.doesNotMatch(JSON.stringify(receta),/"(edad|sexo|provincia|municipio|id_entrevista)"/i);
 assert.match(tablaPasos(receta),/Calibración por recuerdo/);
});
test('la validación compara cada paso y la cifra publicada del CIS con el resultado oficial',()=>{
 for(const e of ['3411','3415']){const pasos=val.estudios[e].map(x=>x.paso);assert.ok(pasos.includes('cis_publicado'));assert.ok(pasos.includes('participacion'));
  for(const x of val.estudios[e]){const mae=Object.values(x.error).reduce((a,b)=>a+Math.abs(b),0)/4;assert.ok(Math.abs(mae-x.mae)<0.01);}}
 assert.match(tablaValidacion(val),/Veredicto/);
});
test('una receta que acierta peor que el CIS publicado no entra en el pronóstico',()=>{
 const peor=val.resumen.participacion>val.resumen.cis_publicado;
 const f=JSON.parse(fs.readFileSync('modelo/salida/pronostico.json','utf8'));
 const usaCocina=(f.entradas||[]).some(e=>/cocina/i.test(e.origen||''));
 if(peor)assert.equal(usaCocina,false);
 assert.match(val.veredicto,peor?/no entra en el pronóstico/:/./);
});

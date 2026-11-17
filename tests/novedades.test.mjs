import test from 'node:test';
import assert from 'node:assert/strict';
import {candidateType,readUpdateData,renderUpdateSummary,renderPollUpdate} from '../encuestas-servicio.mjs';
test('clasifica hallazgos, sin convertir una noticia o un PDF en una matriz',()=>{
 for(const [title,url,want] of [['Promedio de encuestas','','Promedios'],['Microdatos del sondeo','','Microdatos'],['Estimación de escaños','','Estimaciones'],['Sondeo de noviembre','','Encuestas'],['Huelga general','','Noticias'],['Cuestionario y pesos','','Documentación'],['Descargar','https://a.es/matriz.sav','Microdatos']])assert.equal(candidateType({title,url}),want);
});
test('una consulta fallida puede usar copia publicada y no envía credenciales',async()=>{
 const calls=[];const r=await readUpdateData('data/vigilancia/microdatos.json',{fetcher:async(u,o)=>{calls.push({u,o});return {ok:calls.length===2,json:async()=>({candidates:[]})}}});
 assert.equal(r.origin,'copia publicada');assert.equal(calls.length,2);assert.equal(calls[0].o.headers,undefined);
 await assert.rejects(readUpdateData('x',{fetcher:async()=>({ok:false})}),/No disponible/);
});
test('el resumen distingue archivo, laboratorio, enlaces y entradas reales; ausencia no es cero',()=>{
 const html=renderUpdateSummary({polls:[{}],references:[{},{}],machine:{studies:[{}]},micro:{candidates:[{estado:'nuevo_enlace_sin_auditar'},{estado:'ya_catalogado'}]},forecast:{corte:'2026-11-17',entradas:[{},{}]}});
 assert.match(html,/1 encuestas/);assert.match(html,/2 promedios/);assert.match(html,/1 estudios/);assert.match(html,/2 registros de entrada/);assert.match(html,/1 enlaces pendientes/);assert.match(html,/no alimentan el pronóstico/);
 assert.match(renderUpdateSummary(),/sin confirmar/);assert.doesNotMatch(renderUpdateSummary(),/undefined|NaN/);
 assert.match(renderPollUpdate(),/Run workflow/);assert.match(renderPollUpdate(),/no confirma/);
});

import {consultationFeedback} from '../encuestas-servicio.mjs';
test('consultar diferencia primera carga, mismo informe y publicaciones añadidas sin afirmar nueva búsqueda',()=>{
 const before={checked_at:'2026-11-17T12:00:00Z',last_attempt_at:'2026-11-17T12:00:00Z',results:[{url:'https://a.es/1'}],report_origin:'GitHub'};
 assert.match(consultationFeedback(null,before),/Informe cargado: 1/);
 const same=consultationFeedback(before,structuredClone(before));assert.match(same,/Mismo informe/);assert.match(same,/Consultado a las/);assert.match(same,/no inicia otra búsqueda/);
 assert.match(consultationFeedback(before,{...before,checked_at:'2026-11-17T13:00:00Z',results:[...before.results,{url:'https://a.es/2'}]}),/1 publicación nueva/);
});
test('consulta versionada usa URL nueva para evitar reutilizar la copia CDN',async()=>{
 let url;await readUpdateData('data/vigilancia/microdatos.json',{fetcher:async u=>{url=u;return {ok:true,json:async()=>({})}}});assert.ok(new URL(url).searchParams.has('consulta'));
});

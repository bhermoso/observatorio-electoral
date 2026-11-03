import test from 'node:test';
import assert from 'node:assert/strict';
import {reviewStatus,fetchPublishedPolls,renderPollUpdate,triggerPollReview,pollReviewQueue,renderPollReviewQueue} from '../actualizar-encuestas.mjs';
test('La búsqueda distingue ausencia, ejecución, fallo y éxito sin afirmar incorporación',()=>{
 assert.match(reviewStatus(),/no consta/);
 assert.match(reviewStatus({status:'in_progress'}),/en curso/);
 assert.match(reviewStatus({status:'completed',conclusion:'failure'}),/no terminó/);
 assert.match(reviewStatus({status:'completed',conclusion:'success',updated_at:'2026-11-03T10:00:00Z'}),/requieren verificación/);
 assert.match(renderPollUpdate(),/no publica sondeos por sí sola/);
});
test('Recarga sin caché y rechaza errores HTTP y archivos inválidos',async()=>{
 let options;
 assert.deepEqual(await fetchPublishedPolls(async(url,o)=>{options=o;return {ok:true,json:async()=>[{id:'nuevo'}]};}),[{id:'nuevo'}]);
 assert.equal(options.cache,'no-store');
 await assert.rejects(fetchPublishedPolls(async()=>({ok:false})),/No se pudieron/);
 await assert.rejects(fetchPublishedPolls(async()=>({ok:true,json:async()=>({})})),/no es válido/);
});

test('Lanzar revisión llama a GitHub con credencial limitada y main',async()=>{
 let uri,options;
 assert.equal(await triggerPollReview('  github_pat_test  ',async(u,o)=>{uri=u;options=o;return {status:204}}),true);
 assert.match(uri,/vigilancia-encuestas[.]yml[/]dispatches$/);
 assert.equal(options.method,'POST');
 assert.equal(options.headers.Authorization,'Bearer github_pat_test');
 assert.deepEqual(JSON.parse(options.body),{ref:'main'});
});
test('Token ausente y permisos insuficientes producen errores claros',async()=>{
 await assert.rejects(triggerPollReview(''),/Introduce una autorización/);
 await assert.rejects(triggerPollReview('token',async()=>({status:403})),/Actions: Read and write/);
});

test('La cola no confunde issues de PR ni noticias con datos verificados',()=>{
 const rows=pollReviewQueue([
  {title:'[Vigilancia] Encuestas y análisis pendientes',html_url:'https://github.com/bhermoso/observatorio-electoral/issues/1',updated_at:'2026-11-03T00:00:00Z',body:'Propuestas: 3\\n- **CIS** · Sondeo pendiente'},
  {title:'Cambio en código',pull_request:{url:'test'}}
 ]);
 assert.equal(rows.length,1);
 assert.match(renderPollReviewQueue(rows),/Sondeo pendiente/);
 assert.match(renderPollReviewQueue(rows),/Revisar candidatos/);
});

import {renderEstadoCircuito} from '../actualizar-encuestas.mjs';
test('estado del circuito: muestra antes/después, rechazadas y errores sin inventar datos',()=>{
 const html=renderEstadoCircuito({ultima_busqueda:'2026-11-03T07:40:00Z',candidatos_detectados:12,bandeja_validadas:1,incorporadas:['sintetica-1'],rechazadas:[{id:'sintetica-2',motivo:'faltan source'}],registros_antes:13,registros_despues:14,errores_busqueda:['GAD3: timeout'],naturaleza_candidatos:'Titulares'},{construido:'2026-11-03T08:00:00Z',corte_modelo:'2026-11-03'});
 assert.match(html,/13 → 14/);assert.match(html,/sintetica-2: faltan source/);assert.match(html,/GAD3: timeout/);assert.match(html,/corte del modelo 2026-11-03/);
 const empty=renderEstadoCircuito(null,null);
 assert.match(empty,/sin registro/);assert.doesNotMatch(empty,/undefined|NaN/);
});

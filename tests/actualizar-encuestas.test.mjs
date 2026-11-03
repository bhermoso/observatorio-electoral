import test from 'node:test';
import assert from 'node:assert/strict';
import {reviewStatus,fetchPublishedPolls,renderPollUpdate,triggerPollReview} from '../actualizar-encuestas.mjs';
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

import test from 'node:test';
import assert from 'node:assert/strict';
import {serviceRequest,renderCandidates,renderPollUpdate,parsePercentages} from '../encuestas-servicio.mjs';
const report={schema:2,status:'partial',checked_at:'2026-11-11T12:00:00Z',last_attempt_at:'2026-11-11T12:01:00Z',results:[],sources:[{name:'Productor A',ok:false,error:'HTTP 503',attempts:2}]};
test('El nuevo actualizador consulta un informe y no solicita claves ni anuncia una búsqueda nueva',()=>{
 const html=renderPollUpdate();assert.match(html,/Consultar novedades/);assert.match(html,/no inicia|último informe/);assert.match(html,/GitHub/);assert.doesNotMatch(html,/Clave de edición|SUPABASE|supabase|poll-editor|type="password"/);
});
test('Lee el informe versionado por GET, sin claves; puede usar la copia del sitio',async()=>{
 const seen=[];const result=await serviceRequest('status',{key:'no-enviar',fetcher:async(u,o)=>{seen.push({u,o});return {ok:true,json:async()=>report};}});
 assert.equal(result.status,'partial');assert.match(seen[0].u,/raw.githubusercontent/);assert.equal(seen[0].o.body,undefined);assert.equal(seen[0].o.headers,undefined);assert.equal(seen[0].o.cache,'no-store');
 let tries=0;await serviceRequest('status',{fetcher:async()=>{if(++tries===1)throw Error('offline');return {ok:true,json:async()=>report};}});assert.equal(tries,2);
 await assert.rejects(serviceRequest('submit'),/revisión en GitHub/);
});
test('Respuesta mal formada o caída de ambos orígenes nunca confirma una búsqueda',async()=>{
 for(const value of [null,{},[],{results:[],sources:'bad'}])await assert.rejects(serviceRequest('status',{fetcher:async()=>({ok:true,json:async()=>value})}),/vigilancia/);
 await assert.rejects(serviceRequest('status',{fetcher:async()=>({ok:false,status:503})}),/503/);
});
test('El informe diferencia cobertura parcial, fallo total y ausencia de novedades',()=>{
 assert.match(renderCandidates(report),/Cobertura parcial/);assert.match(renderCandidates(report),/HTTP 503/);
 const failed=renderCandidates({...report,status:'failed'});assert.match(failed,/Búsqueda fallida/);assert.match(failed,/se conserva|Se conserva/);assert.match(failed,/no equivale/);
 assert.match(renderCandidates({...report,status:'complete',sources:[]}),/No hay candidatos/);
});
test('Enlaces directos seguros y contenido escapado; se muestran candidatos sin fecha sin inventarla',()=>{
 const html=renderCandidates({...report,results:[{title:'Sondeo <img onerror=x>',url:'javascript:x',topic:'<script>'},{title:'Sondeo original',url:'https://example.org/encuesta',topic:'Casa'}]});
 assert.doesNotMatch(html,/<img|<script|href="javascript/);assert.match(html,/&lt;img/);assert.match(html,/https:\/\/example.org/);assert.match(html,/Fecha no indicada/);
});
test('Se conserva el lector decimal para las fichas editoriales',()=>{
 assert.deepEqual(parsePercentages('PP: 30,2\nPSOE: 28.1 %'),{PP:30.2,PSOE:28.1});
 for(const x of ['','PP: 101','PP: 30\nPP: 40','__proto__: 2'])assert.throws(()=>parsePercentages(x));
});

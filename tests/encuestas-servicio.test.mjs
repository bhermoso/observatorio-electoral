import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {parsePercentages,serviceRequest,renderCandidates,renderPollUpdate,SERVICE_URL} from '../encuestas-servicio.mjs';
import {validateSubmission,fingerprint,parseFeed,inBlackout} from '../supabase/functions/encuestas/core.mjs';
const fixture=()=>({...JSON.parse(fs.readFileSync(new URL('../data/polls.json',import.meta.url)))[0],id:'cis-prueba',seats:null});
test('El botón y el formulario no piden acceso a GitHub',()=>{
 const html=renderPollUpdate();assert.match(html,/Actualizar encuestas/);assert.match(html,/Clave de edición/);assert.doesNotMatch(html,/github_pat|ghp_|access.token/i);assert.match(html,/07:40 UTC/);
});
test('Acepta coma decimal, conserva ausencias y rechaza duplicados o datos inválidos',()=>{
 assert.deepEqual(parsePercentages('PP: 30,2\nPSOE: 28.1 %'),{PP:30.2,PSOE:28.1});
 for(const text of ['', 'PP: 30\nPP: 31','PP: -1','PP: 101','__proto__: 3','PP 30'])assert.throws(()=>parsePercentages(text));
});
test('La clave solo sale hacia la operación de edición del servicio fijo',async()=>{
 const seen=[];const fetcher=async(url,options)=>{seen.push({url,options});return {ok:true,json:async()=>({saved:true})};};
 await serviceRequest('scan',{key:'secreto',fetcher});assert.equal(seen[0].options.headers['X-Editor-Key'],undefined);
 await serviceRequest('submit',{key:' secreto ',record:{id:'x'},fetcher});assert.equal(seen[1].url,SERVICE_URL+'?action=submit');assert.equal(seen[1].options.headers['X-Editor-Key'],'secreto');assert.equal(seen[1].options.cache,'no-store');
 await assert.rejects(serviceRequest('submit',{fetcher}),/clave/);
 await assert.rejects(serviceRequest('scan',{fetcher:async()=>({ok:false,json:async()=>({error:'Fuentes no disponibles'})})}),/Fuentes no disponibles/);
});
test('Los titulares no permiten HTML ni enlaces ejecutables',()=>{
 const html=renderCandidates({candidates:[{title:'<img onerror=alert(1)>',url:'javascript:alert(1)'}],errors:[]});
 assert.doesNotMatch(html,/<img|href="javascript:/);assert.match(html,/&lt;img/);assert.match(html,/pistas para revisar/);
});
test('Separa última búsqueda exitosa, incidencia posterior y vigilancia GitHub Actions',()=>{
 const html=renderCandidates({checked_at:'2026-11-04T12:00:00Z',
  candidates:[{title:'Titular anterior',url:'https://news.google.com/rss/articles/1'}],
  errors:['2026-11-04T12:05:00Z · Búsqueda no disponible']});
 assert.match(html,/Última búsqueda con resultados/);
 assert.match(html,/Incidencias de un intento posterior/);
 assert.match(html,/12:05:00Z/);
 assert.match(html,/Titular anterior/);
 const panel=renderPollUpdate();
 assert.match(panel,/Dos procesos distintos/);
 assert.match(panel,/GitHub Actions/);
});
test('La ficha exige muestra, fechas reales y ordenadas, fuentes HTTPS y cifras',()=>{
 const now=new Date('2026-11-04T15:00:00Z'),p=fixture();assert.equal(validateSubmission(p,now).id,p.id);
 for(const patch of [{sample:0},{sample:true},{fieldStart:'2023-02-30'},{published:'2027-01-01'},{source:'javascript:alert(1)'},{technical:'http://example.org'},{values:{PP:NaN}},{values:{PP:80,PSOE:30}},{scope:'Madrid'},{seats:{PP:{point:120}}},{title:'<script>'}])assert.throws(()=>validateSubmission({...p,...patch},now),JSON.stringify(patch));
 assert.equal(fingerprint(p),fingerprint({...p,institute:' CIS '}));
});
test('El lector RSS distingue error de búsqueda de lista vacía y limita enlaces',()=>{
 assert.throws(()=>parseFeed('<html>Error</html>'),/RSS/);
 assert.deepEqual(parseFeed('<rss></rss>'),[]);
 const items=parseFeed('<rss><item><title><![CDATA[PP &amp; PSOE]]></title><link>https://news.google.com/rss/articles/1</link><pubDate>hoy</pubDate></item><item><title>X</title><link>javascript:x</link></item></rss>');
 assert.equal(items.length,1);assert.equal(items[0].title,'PP & PSOE');assert.equal(items[0].verified,false);
});
test('El servicio respeta los mismos límites temporales de veda que el sitio',()=>{
 assert.equal(inBlackout(new Date('2026-11-23T22:59:59Z')),false);assert.equal(inBlackout(new Date('2026-11-23T23:00:00Z')),true);assert.equal(inBlackout(new Date('2026-11-29T18:59:59Z')),true);assert.equal(inBlackout(new Date('2026-11-29T19:00:00Z')),false);
});

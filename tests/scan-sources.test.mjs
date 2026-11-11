import test from 'node:test';
import assert from 'node:assert/strict';
import {scanSources} from '../docs/archivo-tecnico/supabase/functions/encuestas/scan.mjs';
const xml='<rss><channel><item><title>Sondeo</title><link>https://news.google.com/rss/articles/a</link><pubDate>Wed, 11 Nov 2026 08:00:00 GMT</pubDate></item></channel></rss>';
const options={queries:['uno','dos'],now:()=> '2026-11-11T10:00:00Z'};
test('RSS real y duplicación entre consultas; cero resultados es un éxito válido',async()=>{
 const r=await scanSources({...options,fetcher:async()=>new Response(xml)});
 assert.equal(r.candidates.length,1);assert.equal(r.failed,false);assert.equal(r.partial,false);
 const empty=await scanSources({...options,fetcher:async()=>new Response('<rss/>')});
 assert.equal(empty.failed,false);assert.deepEqual(empty.candidates,[]);
});
test('Reintenta un 502 transitorio y conserva diagnóstico de fallo parcial',async()=>{
 let calls=0;
 const r=await scanSources({...options,fetcher:async u=>{
  if(new URL(u).searchParams.get('q')==='dos')return new Response('no',{status:403});
  return ++calls===1?new Response('gateway',{status:502}):new Response(xml);
 }});
 assert.equal(calls,2);assert.equal(r.partial,true);assert.equal(r.failed,false);
 assert.equal(r.candidates.length,1);assert.match(r.errors[0],/HTTP 403/);
});
test('Fallo total, HTML inesperado, cuerpo excesivo y timeout no parecen cero novedades',async()=>{
 for(const fetcher of [async()=>new Response('<html>captcha</html>'),async()=>new Response('<rss><channel>'),async()=>new Response('a'.repeat(2000001)),async()=>{throw new DOMException('timeout','TimeoutError');}]){
  const r=await scanSources({...options,fetcher});assert.equal(r.failed,true);assert.equal(r.errors.length,2);
 }
});

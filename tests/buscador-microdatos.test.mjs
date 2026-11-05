import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fileLinks,microNews,safeHttp,choosePages,knownLinks,makeCandidates} from '../supabase/functions/microdatos/core.mjs';
import {renderMicrodataResults,renderBuscadorMicrodatos,consultMicrodata,MICRODATA_ENDPOINT} from '../buscador-microdatos.mjs';
import {renderPollUpdate} from '../encuestas-servicio.mjs';
const read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');
test('Botones significan operaciones distintas y el antiguo no sugiere actualizar el modelo',()=>{
 const html=renderPollUpdate()+renderBuscadorMicrodatos();
 assert.match(html,/Buscar titulares recientes/);
 assert.match(html,/Buscar enlaces de microdatos ahora/);
 assert.match(html,/no descarga microdatos y no recalcula el pronóstico/);
 assert.doesNotMatch(html,/id="dispatch-polls">Actualizar encuestas/);
 assert.match(read('../app.mjs'),/bindBuscadorMicrodatos\(\)/);
 assert.match(read('../scripts/build.mjs'),/'buscador-microdatos\.mjs'/);
});
test('Se consulta la operación real con GET y POST, sin transmitir claves',async()=>{
 const seen=[];
 const fetcher=async(u,o)=>{seen.push([u,o]);return {ok:true,json:async()=>({checked_at:'2026-11-05T05:20:00Z',candidates:[]})}};
 await consultMicrodata('status',{fetcher});
 await consultMicrodata('scan',{fetcher});
 assert.equal(seen[0][0],MICRODATA_ENDPOINT+'?action=status');
 assert.equal(seen[0][1].method,'GET');
 assert.equal(seen[1][1].method,'POST');
 assert.equal(seen[1][1].cache,'no-store');
 assert.equal(seen[1][1].headers,undefined);
 await assert.rejects(consultMicrodata('unknown',{fetcher}),/no permitida/);
 await assert.rejects(consultMicrodata('scan',{fetcher:async()=>({ok:false,json:async()=>({error:'Sin fuentes'})})}),/Sin fuentes/);
});
test('Detecta enlaces ZIP/SAV y descarta javascript, datos y http no seguro',()=>{
 const hrefs='<a href="/descargable.sav?x=1">SAV</a><a href="https://casa.es/zip-a.zip">ZIP</a><a href="javascript:alert(1)">x</a><a href="http://no.es/d.csv">x</a><a href="https://casa.es/manual.pdf">PDF</a>';
 assert.deepEqual(fileLinks(hrefs,'https://casa.es/estudio/'),['https://casa.es/descargable.sav?x=1','https://casa.es/zip-a.zip']);
 assert.equal(safeHttp('http://no.es'),null);
 assert.equal(safeHttp('https://127.0.0.1/file.zip'),null);
 const known=new Set(['https://casa.es/zip-a.zip']);
 const made=makeCandidates([{titulo:'Ola A',pagina:'https://casa.es',productor:'GAD3',files:['https://casa.es/zip-a.zip','https://casa.es/descargable.sav?x=1']}],known);
 assert.equal(made.length,2);
 assert.equal(made[0].estado,'ya_catalogado');
 assert.equal(made[1].estado,'nuevo_enlace_sin_auditar');
});
test('RSS de noticias de microdatos no se cuenta como archivo descargado',()=>{
 const xml='<rss><channel><item><title><![CDATA[Microdatos de encuesta 2026]]></title><link>https://news.google.com/rss/articles/abc</link><pubDate>Thu, 05 Nov 2026</pubDate></item><item><title>Fiesta nacional</title><link>https://news.google.com/rss/articles/def</link></item></channel></rss>';
 const rows=microNews(xml,'40dB');
 assert.equal(rows.length,1);
 assert.equal(rows[0].tipo,'noticia_sobre_microdatos');
 const shown=renderMicrodataResults({checked_at:'2026-11-05T05:00:00Z',candidates:rows,errors:[],summary:{paginas_accesibles:3,paginas_consultadas:5}});
 assert.match(shown,/0 archivos enlazados/);
 assert.match(shown,/0 matrices descargadas/);
});
test('Las noticias o fuentes maliciosas se escapan en pantalla',()=>{
 const html=renderMicrodataResults({checked_at:'2026-11-05T05:00:00Z',candidates:[{tipo:'enlace_a_archivo',titulo:'<script>alert(1)</script>',url:'javascript:alert(1)',fuente:'test'}],errors:['<img onerror="x">'],summary:{}});
 assert.doesNotMatch(html,/<script|href="javascript:|<img/);
 assert.match(html,/&lt;script/);
});
test('Ordena páginas reales y no mezcla URL conocidas con enlaces nuevos',()=>{
 const d=JSON.parse(read('../data/microdatos/catalogo-publico.json'));
 const pages=choosePages(d,16);
 assert.ok(pages.length>3&&pages.length<=16);
 assert.ok(pages.every(x=>x.fecha>='2025-01-01'));
 assert.ok(knownLinks(d).size>=d.estudios.length/2);
});

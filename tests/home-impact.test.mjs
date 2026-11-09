import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {calculate} from '../cocina-secuencial.mjs';
import {projection} from '../cocina-escanos.mjs';
const cube=JSON.parse(fs.readFileSync('data/microdatos/cubo_decisiones_cis.json','utf8'));
const election=JSON.parse(fs.readFileSync('data/election.json','utf8'));
test('Portada publica síntesis visual con cifras reales y dos fuentes separadas',()=>{
 const app=fs.readFileSync('app.mjs','utf8');
 const homepage=fs.readFileSync('home-impact.mjs','utf8');
 const css=fs.readFileSync('styles.css','utf8');
 const build=fs.readFileSync('scripts/build.mjs','utf8');
 assert.match(app,/renderHomeImpact\(references,events\)/);
 assert.match(app,/bindHomeImpact\(polls,events\)/);
 assert.match(build,/home-impact.mjs/);
 assert.match(homepage,/data\/modelo\/pronostico.json/);
 const casos=fs.readFileSync('casos-cocina.mjs','utf8');
 assert.match(casos,/data\/microdatos\/cubo_decisiones_cis.json/);
 assert.match(casos,/data\/election.json/);
 // La portada muestra la estimación de referencia (capa 3 = principal) y nunca una variante en su lugar.
 assert.match(homepage,/capaModelo\(ctx\.forecast,3\)/);
 assert.doesNotMatch(homepage,/variantes\.consenso_privadas|variants\.consenso_privadas/);
 assert.match(homepage,/href="#pronostico"/);
 assert.doesNotMatch(homepage,/href="#analisis">Ver pronóstico completo/);
 assert.match(css,/prefers-reduced-motion/);
});
test('La comparación de recetas utiliza mismo estudio y el mismo traslado territorial',()=>{
 const js=fs.readFileSync('comparador-cocina.mjs','utf8');
 const html=fs.readFileSync('construye-estimacion.html','utf8');
 assert.match(html,/id="comparador-recetas"/);
 assert.match(js,/calculate\(cube/);
 assert.match(js,/projection\(election/);
 assert.match(js,/experimentos-cocina-oee.json/);
 const a=calculate(cube,{study:'3415',weighted:true,decided:true});
 const b=calculate(cube,{study:'3415',weighted:true,decided:true,sympathy:true});
 assert.notEqual(a.shares.PP,b.shares.PP);
 const sa=projection(election,{PP:a.shares.PP,PSOE:a.shares.PSOE,VOX:a.shares.VOX,SUMAR:a.shares.SUMAR});
 const sb=projection(election,{PP:b.shares.PP,PSOE:b.shares.PSOE,VOX:b.shares.VOX,SUMAR:b.shares.SUMAR});
 assert.equal(sa.diagnostics.totalSeats,350);
 assert.equal(sb.diagnostics.totalSeats,350);
});

test('El contraste de capas vive en Pronóstico, sin pliegues, con su procedencia',async()=>{
 const {renderContraste}=await import('../contraste-capas.mjs');
 const html=renderContraste();
 for(const id of ['pronostico-capas','matrix-table','matrix-toggle','panorama-editorial','pronostico-cambios','pronostico-procedencia'])assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(html,/Promedio de encuestas:/);assert.match(html,/Pronóstico propio:/);
 assert.match(html,/Cocina sobre microdatos:/);assert.match(html,/Noticias y otros modelos:/);
 assert.doesNotMatch(html,/<details|<summary/);
 const js=fs.readFileSync('contraste-capas.mjs','utf8');
 assert.match(js,/drawEditorial\(ctx\)/);
 assert.match(js,/ctx\.prom\.partidos\[id\]\?\.valor/);
 const app=fs.readFileSync('app.mjs','utf8');
 assert.match(app,/pronostico:\(\)=>renderPronostico\(\)\+renderContraste\(\)/);
 assert.match(app,/bindContraste\(polls\)/);
 const css=fs.readFileSync('styles.css','utf8');
 assert.match(css,/--oee-body-size:15px/);
 assert.match(css,/\.panorama-source-grid/);
});

test('Panorama es un resumen sin pliegues: titular, hemiciclo y promedio, evolución, últimas encuestas y accesos',async()=>{
 const {renderHomeImpact}=await import('../home-impact.mjs');
 const html=renderHomeImpact();
 const order=['id="portada-titular"','id="portada-hub"','id="home-series"','id="portada-ultimas"','id="portada-secciones"'];
 for(const id of order)assert.ok(html.includes(id),'Falta '+id);
 for(let i=1;i<order.length;i++)assert.ok(html.indexOf(order[i-1])<html.indexOf(order[i]),order[i-1]+' debe ir antes que '+order[i]);
 assert.doesNotMatch(html,/<details|<summary/);
 assert.doesNotMatch(html,/role="tab"|role="tabpanel"/);
 assert.doesNotMatch(html,/id="matrix-table"|id="portada-caso"|id="portada-microdatos"/);
 assert.match(html,/<h1 id="impact-heading">Panorama 29N<\/h1>/);
 const app=fs.readFileSync('app.mjs','utf8');
 assert.match(app,/function dashboard\(\)\{[\s\S]*?return renderHomeImpact\(references,events\);/);
 // Portada única: Panorama se monta una vez en #main y las secciones se abren en el visor.
 assert.match(app,/if\(!portadaLista\)\{\$\('#main'\)\.innerHTML=dashboard\(\);bindHomeImpact\(polls,events\)/);
 assert.match(app,/\$\('#visor-contenido'\)\.innerHTML=/);
 const css=fs.readFileSync('styles.css','utf8');
 assert.doesNotMatch(css,/body\.dashboard-route\{[^}]*height:100dvh/);
 assert.doesNotMatch(css,/body\.dashboard-route #main\{[^}]*overflow:hidden/);
 assert.doesNotMatch(css,/\.panorama-pane/);
 assert.match(html+fs.readFileSync('portada-series.mjs','utf8'),/class="portada-grafico"/);
 assert.doesNotMatch(css,/\.portada-grafico\{[^}]*min-width:[1-9]/);
 assert.match(css,/@media\(max-width:1300px\)\{header>nav\{flex:1 0 100%;order:3\}\}/);
});

test('El titular da primera fuerza e intervalo sin valores vacíos',async()=>{
 const {renderTitular}=await import('../home-impact.mjs');
 const forecast=JSON.parse(fs.readFileSync('modelo/salida/pronostico.json','utf8'));
 const titular=renderTitular(forecast);
 assert.match(titular,/primera fuerza estimada/);
 assert.match(titular,/90 % de las simulaciones/);
 assert.match(titular,/en la estimación central/);
 assert.doesNotMatch(titular,/NaN|undefined/);
 assert.match(renderTitular(null),/No hay una estimación publicada/);
});

test('El gráfico común cruza cortes y publicaciones con ambos acontecimientos',async()=>{
 const {collectSeries,eventComparison,renderSeriesChart}=await import('../portada-series.mjs');
 const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
 const events=read('data/events.json');
 const forecast=read('modelo/salida/pronostico.json');
 const series=collectSeries(read('data/polls.json'),forecast,read('modelo/registro/historial.json'),'2026-11-08');
 assert.ok(series.some(s=>s.id==='casa-CIS'));
 assert.ok(series.some(s=>s.id==='casa-40dB.'));
 assert.ok(series.some(s=>s.type==='external'));
 const visible=series.map(s=>({...s,points:s.points.filter(p=>p.date>='2026-10-01'&&Number.isFinite(p.values.PP)).map(p=>({...p,value:p.values.PP}))}));
 const html=renderSeriesChart(visible,events,'2026-10-01','2026-11-08','PP',null,330);
 assert.match(html,/Urda/);
 assert.match(html,/Midterms de EE\. UU\./);
 assert.doesNotMatch(html,/NaN/);
 assert.doesNotMatch(html,/class="series-mark house"[^>]*><path/);
 const {niceScale}=await import('../portada-series.mjs');
 assert.deepEqual(niceScale([21.9,34.2]).ticks,[20,25,30,35]);
 assert.deepEqual(niceScale([1.2,33]).ticks,[0,10,20,30,40]);
 const points=[
  {date:'2026-10-30',start:'2026-10-23',end:'2026-10-26',value:30},
  {date:'2026-10-31',start:'2026-10-25',end:'2026-10-28',value:33},
  {date:'2026-11-02',start:'2026-10-29',end:'2026-10-30',value:31}
 ];
 assert.equal(eventComparison(points,'2026-10-28','house').change,1);
 assert.equal(eventComparison(points,'2026-11-03','house').change,null);
});

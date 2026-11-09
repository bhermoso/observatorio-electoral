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
 assert.match(homepage,/data\/microdatos\/cubo_decisiones_cis.json/);
 assert.match(homepage,/data\/election.json/);
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

test('Panorama editorial compacto separa encuesta, modelo, microdatos y noticias',async()=>{
 const {renderHomeImpact}=await import('../home-impact.mjs');
 const html=renderHomeImpact();
 assert.ok(html.indexOf('forecast-lead')<html.indexOf('portada-capas'));
 assert.match(html,/id="panorama-editorial"/);
 assert.match(html,/Promedio de encuestas:/);
 assert.match(html,/Pronóstico propio:/);
 assert.match(html,/Cocina sobre microdatos:/);
 assert.match(html,/Noticias y otros modelos:/);
 assert.match(html,/class="portada-plegable"/);
 assert.match(html,/No son respuestas individuales|No son respuestas individuales/i);
 const js=fs.readFileSync('home-impact.mjs','utf8');
 assert.match(js,/drawEditorial\(ctx\)/);
 assert.match(js,/ctx\.prom\.partidos\[id\]\?\.valor/);
 const css=fs.readFileSync('styles.css','utf8');
 assert.match(css,/--oee-body-size:15px/);
 assert.match(css,/\.panorama-source-grid/);
});

test('Panorama se lee de arriba abajo: titular, escaños, evolución, capas y detalle, sin pestañas ni altura fija',async()=>{
 const {renderHomeImpact}=await import('../home-impact.mjs');
 const html=renderHomeImpact();
 const order=['id="portada-titular"','id="forecast-lead-results"','id="home-series"','id="portada-capas"','id="portada-cambios"','id="portada-fuentes"','id="portada-microdatos"'];
 for(const id of order)assert.ok(html.includes(id),'Falta '+id);
 for(let i=1;i<order.length;i++)assert.ok(html.indexOf(order[i-1])<html.indexOf(order[i]),order[i-1]+' debe ir antes que '+order[i]);
 assert.doesNotMatch(html,/role="tab"|role="tabpanel"/);
 assert.match(html,/<h1 id="impact-heading">Panorama 29N<\/h1>/);
 assert.match(html,/id="matrix-table"/);
 assert.match(html,/id="matrix-toggle"/);
 const app=fs.readFileSync('app.mjs','utf8');
 assert.match(app,/function dashboard\(\)\{[\s\S]*?return renderHomeImpact\(references,events\);/);
 assert.match(app,/classList\.toggle\('dashboard-route',route==='dashboard'\)/);
 const css=fs.readFileSync('styles.css','utf8');
 // La portada se desplaza con normalidad: sin alto de ventana fijo ni scroll interno.
 assert.doesNotMatch(css,/body\.dashboard-route\{[^}]*height:100dvh/);
 assert.doesNotMatch(css,/body\.dashboard-route #main\{[^}]*overflow:hidden/);
 assert.doesNotMatch(css,/\.panorama-pane/);
 // El gráfico de la portada no hereda el ancho mínimo del de Tendencias.
 assert.match(html+fs.readFileSync('portada-series.mjs','utf8'),/class="portada-grafico"/);
 assert.doesNotMatch(css,/\.portada-grafico\{[^}]*min-width:[1-9]/);
 // Menú en su propia fila en pantallas estrechas.
 assert.match(css,/@media\(max-width:1300px\)\{header>nav\{flex:1 0 100%;order:3\}\}/);
});

test('La portada dibuja los bloques y la tabla por partido con intervalos',async()=>{
 const {renderForecastOverview,renderTitular}=await import('../home-impact.mjs');
 const forecast=JSON.parse(fs.readFileSync('modelo/salida/pronostico.json','utf8'));
 const history=JSON.parse(fs.readFileSync('modelo/registro/historial.json','utf8'));
 const html=renderForecastOverview(forecast,history);
 const parties=Object.keys(forecast.principal.partidos).length;
 assert.equal((html.match(/<tr>\s*<th scope="row">/g)||[]).length,parties);
 assert.equal((html.match(/class="portada-bloc"/g)||[]).length,Object.keys(forecast.principal.bloques).length);
 assert.match(html,/href="#pronostico-principal"/);
 assert.match(html,/href="#pronostico-bloques"/);
 assert.doesNotMatch(html,/NaN|undefined/);
 const withoutHistory=renderForecastOverview(forecast,[]);
 assert.match(withoutHistory,/Sin cambio comparable/);
 const titular=renderTitular(forecast);
 assert.match(titular,/primera fuerza estimada/);
 assert.match(titular,/90 % de las simulaciones/);
 assert.match(titular,/no probabilidades de pacto/);
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

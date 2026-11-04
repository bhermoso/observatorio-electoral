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
 assert.match(app,/renderHomeImpact\(\)/);
 assert.match(app,/bindHomeImpact\(polls\)/);
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
 assert.ok(html.indexOf('forecast-lead')<html.indexOf('matrix-panel'));
 assert.match(html,/id="panorama-editorial"/);
 assert.match(html,/Promedio de encuestas:/);
 assert.match(html,/Pronóstico propio:/);
 assert.match(html,/Cocina sobre microdatos:/);
 assert.match(html,/Noticias y otros modelos:/);
 assert.match(html,/panorama-secondary/);
 assert.match(html,/No son respuestas individuales|No son respuestas individuales/i);
 const js=fs.readFileSync('home-impact.mjs','utf8');
 assert.match(js,/drawEditorial\(ctx\)/);
 assert.match(js,/ctx\.prom\.partidos\[id\]\?\.valor/);
 const css=fs.readFileSync('styles.css','utf8');
 assert.match(css,/--oee-body-size:15px/);
 assert.match(css,/\.panorama-source-grid/);
});

test('Panorama ocupa una vista inicial, conserva todo el contenido por pestañas y evita scroll en escritorio',async()=>{
 const {renderHomeImpact}=await import('../home-impact.mjs');
 const html=renderHomeImpact();
 const ids=['resultados','comparar','variacion','fuentes','microdatos'];
 for(const id of ids){
  assert.match(html,new RegExp('id="panorama-tab-'+id+'"'));
  assert.match(html,new RegExp('id="panorama-panel-'+id+'"'));
 }
 assert.equal((html.match(/role="tabpanel"/g)||[]).length,5);
 assert.equal((html.match(/role="tab"/g)||[]).length,5);
 assert.match(html,/data-panorama-tab="resultados"[^>]*>Resultados/);
 assert.match(html,/data-panorama-panel="fuentes"[^>]*hidden/);
 assert.match(html,/forecast-lead-content/);
 assert.ok(html.indexOf('forecast-lead')<html.indexOf('panorama-editorial'));
 const app=fs.readFileSync('app.mjs','utf8');
 assert.match(app,/function dashboard\(\)\{[\s\S]*?return renderHomeImpact\(\);/);
 assert.match(app,/classList\.toggle\('dashboard-route',route==='dashboard'\)/);
 const css=fs.readFileSync('styles.css','utf8');
 assert.match(css,/body\.dashboard-route\{height:100dvh;overflow:hidden/);
 assert.match(css,/#impact \.forecast-lead-content\{display:grid/);
 const js=fs.readFileSync('home-impact.mjs','utf8');
 assert.match(js,/function bindPanoramaTabs\(root\)/);
 assert.match(js,/ArrowRight/);
 assert.match(js,/panel\.hidden=panel\.dataset\.panoramaPanel!==name/);
});

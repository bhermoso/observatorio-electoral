import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {renderAnalysis,selectStudies,pollAverage} from '../analysis.mjs';
import {renderHouseComparison,houseValue} from '../promedios-comparador.mjs';
import {renderEvents} from '../events.mjs';
import {analizarAcontecimiento} from '../acontecimiento.mjs';
import {renderEventVisual} from '../eventos-visual.mjs';
const polls=JSON.parse(fs.readFileSync('data/polls.json','utf8'));
const events=JSON.parse(fs.readFileSync('data/events.json','utf8'));

test('Promedios privilegia casas y fechas, conserva ausencias y enlaces originales',()=>{
 const studies=selectStudies(polls,'2026-11-04',45);
 const result=pollAverage(studies,{asOf:'2026-11-04'});
 const html=renderHouseComparison(studies,result,'PSOE');
 assert.ok(studies.length>=4);
 assert.match(html,/Qué publica cada encuestadora/);
 assert.match(html,/Promedio de casas activas/);
 assert.match(html,/Partido del gráfico/);
 assert.match(html,/Frente Amplio|Sumar\/FA/);
 assert.match(html,/href="https:\/\//);
 assert.match(html,/target="_blank"/);
 assert.match(html,/—/);
 assert.ok(html.indexOf('house-chart')<html.indexOf('house-matrix'));
 assert.ok(html.indexOf('Sigma Dos')>=0);
 assert.ok(houseValue({values:{PSOE:0}},'PSOE')===0);
 assert.equal(houseValue({values:{PP:30}},'PSOE'),null);
 const original=renderAnalysis(studies);
 assert.ok(original.indexOf('id="analysis-compare"')<original.indexOf('id="analysis-studies"'));
 assert.match(original,/analysis-weights-detail/);
});
test('Casas excluidas quedan visibles, pero no se confunden con quienes forman el promedio',()=>{
 const studies=[
  {id:'A',kind:'poll-estimate',institute:'Casa A',fieldStart:'2026-10-25',fieldEnd:'2026-10-26',source:'https://example.org/a',published:'2026-10-27',sample:1000,values:{PP:30,PSOE:25}},
  {id:'B',kind:'poll-estimate',institute:'Casa B',fieldStart:'2026-10-25',fieldEnd:'2026-10-26',source:'https://example.org/b',published:'2026-10-27',sample:1200,values:{PP:40}}
 ];
 const summary=pollAverage(studies,{asOf:'2026-11-04',weights:{'Casa B':0}});
 const html=renderHouseComparison(studies,summary,'PP');
 assert.equal(summary.average.PP.value,30);
 assert.match(html,/Casa B/);
 assert.match(html,/Excluida del promedio/);
 assert.match(html,/30,0 %/);
 assert.match(html,/40,0 %/);
});
test('Acontecimientos muestra el hecho y las dos encuestas originales con comparabilidad limitada',()=>{
 const reading=analizarAcontecimiento(events[0],polls,{ventana:30});
 const html=renderEventVisual(reading,events[0]);
 assert.equal(reading.fichasPosteriores.length,1);
 assert.match(html,/Sigma Dos/);
 assert.match(html,/Datos|Evidencia observada/);
 assert.match(html,/24,6 %/);
 assert.match(html,/26,1 %/);
 assert.match(html,/−1,5 pp/);
 assert.match(html,/Encuesta anterior/);
 assert.match(html,/Encuesta posterior/);
 assert.match(html,/Comparabilidad/);
 assert.match(html,/no atribuye causalidad/i);
 const page=renderEvents(events);
 assert.match(page,/Acontecimientos: datos y evolución/);
 assert.match(page,/Metodología y cautelas/);
 const js=fs.readFileSync('events.mjs','utf8');
 assert.match(js,/renderEventVisual\(reading,event\)\+renderLectura\(reading,event\)/);
});
test('KPIs clicables y densidad editorial sin recortar el contenido',()=>{
 const home=fs.readFileSync('home-impact.mjs','utf8');
 assert.match(home,/forecast-lead-kpis/);
 assert.match(home,/href="#pronostico-principal"/);
 assert.match(home,/href="#pronostico-bloques"/);
 assert.match(home,/Diferencia entre las medianas/);
 const css=fs.readFileSync('styles.css','utf8');
 assert.match(css,/body:not\(\.dashboard-route\) #main/);
 assert.match(css,/#impact \.forecast-mini-kpi/);
 assert.match(css,/\.house-matrix/);
 assert.match(css,/\.event-visual-row/);
});

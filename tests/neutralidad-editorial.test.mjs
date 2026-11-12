import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {renderHouseComparison} from '../promedios-comparador.mjs';
import {renderAccesos} from '../portada-hub.mjs';
import {chain} from '../pronostico-vista.mjs';

const source=p=>fs.readFileSync(p,'utf8');
test('partido inicial es elección: ningún comparador arranca con PP implícito',()=>{
 const series=source('portada-series.mjs');
 const analysis=source('analysis.mjs');
 const house=source('promedios-comparador.mjs');
 const forecast=source('pronostico-vista.mjs');
 assert.match(series,/if\(party.value===ALL\)/);
 assert.match(series,/data-choose-party/);
 assert.doesNotMatch(series,/party.value===ALL\?'PP'/);
 assert.match(analysis,/selectedParty='todos'/);
 assert.match(house,/selected='todos'/);
 assert.doesNotMatch(forecast,/const main='PP'/);
 assert.match(forecast,/Object\.entries\(con\.partidos/);
});
test('el archivo abre con panorama que conserva todas las casas y fuentes',()=>{
 const polls=JSON.parse(source('data/polls.json'));
 const samples=polls.filter(x=>x.kind==='poll-estimate').slice(0,3);
 const rows=samples.map(p=>({poll:p,weight:1}));
 const average={PP:{value:30,count:3},PSOE:{value:29,count:3},VOX:{value:20,count:3},'Sumar/FA':{value:6,count:2},Podemos:{value:3,count:2}};
 const html=renderHouseComparison(samples,{rows,average});
 assert.match(html,/value="todos" selected/);
 assert.match(html,/Panorama de todos los partidos/);
 assert.match(html,/tabla completa de institutos y fuentes/);
 assert.match(html,/PSOE/);
 assert.match(html,/PP/);
});
test('los accesos muestran la fuerza con más escaños, sea cual sea su partido',()=>{
 const fake={corte:'2026-11-12',entradas:[],excluidas:[],principal:{partidos:{PP:{escanos:[100,90,110]},PSOE:{escanos:[140,130,150]},VOX:{escanos:[50,40,60]}}}};
 const html=renderAccesos({forecast:fake,polls:[],events:[]});
 assert.match(html,/Primera fuerza estimada: PSOE · 140 escaños/);
 assert.doesNotMatch(html,/Primera fuerza estimada: PP/);
});
test('páginas extensas tienen navegación accesible y preservan texto íntegro sin JS',()=>{
 for(const path of ['como-estimamos.html','guia-cocina.html','metodologia-analisis.html','validacion-recetas.html']){
  const html=source(path);
  assert.match(html,/lectura-editorial\.mjs/);
  assert.match(html,/<section/);
 }
 const controller=source('lectura-editorial.mjs');
 assert.match(controller,/data-reading-mode="guiada"/);
 assert.match(controller,/data-reading-mode="completa"/);
 assert.match(controller,/section.hidden=mode==='guiada'/);
 assert.match(controller,/aria-pressed/);
});

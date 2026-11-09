import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {asientos,hemiciclo,renderHemiciclo,encuestasRecientes,renderTarjetas,renderAccesos,renderPromedio} from '../portada-hub.mjs';
import {promedioPublicado} from '../capas.mjs';

const forecast=JSON.parse(fs.readFileSync('modelo/salida/pronostico.json','utf8'));
const polls=JSON.parse(fs.readFileSync('data/polls.json','utf8'));

test('hemiciclo: 350 posiciones, de izquierda a derecha',()=>{
 const p=asientos(350);
 assert.equal(p.length,350);
 assert.ok(p[0].x<0&&p.at(-1).x>0);
});
test('hemiciclo: un punto por escaño y en gris lo que las medianas no suman',()=>{
 const {svg,suma}=hemiciclo({PP:{escanos:[130]},PSOE:{escanos:[110]},VOX:{escanos:[60]}});
 assert.equal(suma,300);
 assert.equal((svg.match(/<circle/g)||[]).length,350);
 assert.equal((svg.match(/data-p="resto"/g)||[]).length,50);
 assert.match(svg,/>176</);
 const html=renderHemiciclo(forecast);
 assert.doesNotMatch(html,/NaN|undefined/);
});
test('últimas encuestas: la más reciente primero, con estado y cambio frente a la oleada anterior',()=>{
 const lista=encuestasRecientes(forecast,polls,{limite:50});
 assert.ok(lista.length>0);
 for(let i=1;i<lista.length;i++)assert.ok(String(lista[i-1].pub)>=String(lista[i].pub));
 const html=renderTarjetas(lista);
 assert.doesNotMatch(html,/NaN|undefined/);
 assert.match(html,/En el pronóstico|Fuera del pronóstico|Pendiente|Archivo verificado/);
});
test('últimas encuestas: una exclusión muestra su motivo',()=>{
 const f={corte:'2026-11-09',entradas:[],excluidas:[{estudio:'x',casa:'Casa',campo_fin:'2026-11-05',publicacion:'2026-11-08',motivo:'Cita de prensa',voto:{PP:30,PSOE:28}}]};
 const html=renderTarjetas(encuestasRecientes(f,[]));
 assert.match(html,/Fuera del pronóstico<small>Cita de prensa/);
});
test('promedio y accesos sin valores vacíos',()=>{
 const prom=promedioPublicado(polls,{corte:forecast.corte});
 assert.doesNotMatch(renderPromedio(prom),/NaN|undefined/);
 const acc=renderAccesos({forecast,polls,events:[],references:[]});
 for(const r of ['#pronostico','#encuestas','#analisis','#contexto','#cocina','#atlas','#laboratorio','#metodologia'])assert.match(acc,new RegExp('href="'+r+'"'));
});

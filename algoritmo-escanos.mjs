// Mini simulador integrado en el recorrido del algoritmo, fases territorio y escaños.
import {projection} from './cocina-escanos.mjs';
let cachePromise;
const r2=n=>Number(n).toLocaleString('es-ES',{maximumFractionDigits:2,minimumFractionDigits:2});
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ids=['PP','PSOE','VOX','SUMAR'];
function getData(){
 if(!cachePromise)cachePromise=Promise.all(['data/election.json','data/microdatos/validacion_23j.json','data/microdatos/analisis_3582.json'].map(async url=>{const res=await fetch(url);if(!res.ok)throw Error('No se pudo cargar '+url);return res.json()}));
 return cachePromise;
}
export function renderSimulador(){
 return '<section class="alg-live" style="margin-top:22px;border:1px solid #b7d1c0;background:#f3f8f0;border-radius:12px;padding:17px"><span class="alg-kicker">OPERACIÓN EN VIVO · COCINA → DIPUTADOS</span>'
 +'<h3>Transforma las cifras del CIS en escaños</h3><p>Cambia el estudio, la receta o el voto de entrada. Se ajusta el voto nacional a la geografía del 23J y se reparte por D’Hondt, sin ocultar los supuestos.</p>'
 +'<div style="display:flex;gap:9px;flex-wrap:wrap"><label>Estudio<select id="alg-live-study"><option value="3411">CIS 3411</option><option value="3415">CIS 3415</option><option value="3582">CIS 3582</option></select></label>'
 +'<label>Receta<select id="alg-live-recipe"><option value="decided">Entre decididos</option><option value="sympathy_decided">Voto + simpatía</option><option value="turnout_decided">Ponderación por participación</option><option value="published_cis">CIS publicado</option></select></label></div>'
 +'<div id="alg-live-inputs" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:12px"></div>'
 +'<div id="alg-live-result" role="status"><p>Consultando datos nacionales y distritos…</p></div>'
 +'<p class="alg-caution"><b>Advertencia:</b> este resultado es una proyección determinista de una receta experimental sobre la geografía 2023, no la distribución probabilística del Motor 29N. Los partidos no desagregados mantienen el patrón de otras candidaturas del 23J.</p>'
 +'<p><a href="construye-estimacion.html#craft-seats">Abrir el laboratorio completo y examinar cada provincia →</a></p></section>';
}
export async function bindSimulador(){
 const el=document.querySelector('#alg-live-result');if(!el)return;
 let data;
 try{data=await getData()}catch(e){if(el.isConnected)el.textContent='No se pudieron cargar los datos: '+e.message;return}
 if(!el.isConnected)return;
 const [electoral,old,newer]=data,study=document.querySelector('#alg-live-study'),recipe=document.querySelector('#alg-live-recipe'),inputs=document.querySelector('#alg-live-inputs');
 let current;
 const options={decided:'decided',sympathy_decided:'sympathy',turnout_decided:'turnout',published_cis:'official'};
 function values(){
  const sid=study.value,k=recipe.value;
  return Object.fromEntries(ids.map(p=>[p,sid==='3582'?newer.comparison.find(r=>r.party===p)?.[options[k]]:old.studies[sid].scenarios[k]?.[p]]));
 }
 function output(){
  if(!el.isConnected)return;
  try{
   const v=Object.fromEntries(ids.map(p=>[p:Number(inputs.querySelector('[data-party="'+p+'"]').value)]));
   const o=projection(electoral,v);
   el.innerHTML='<div class="alg-stat"><div><span>Escaños totales</span><b>350</b><small>52 circunscripciones</small></div><div><span>PP + Vox</span><b>'+(o.seats.PP+o.seats.VOX)+'</b><small>'+(o.seats.PP+o.seats.VOX>=176?'Supera 176 en el escenario':'No llega a 176')+'</small></div></div>'
     +'<div style="overflow-x:auto"><table><thead><tr><th>Partido</th><th>Voto objetivo</th><th>Diputados 2023</th><th>Diputados proyectados</th><th>Variación</th></tr></thead><tbody>'
     +[...ids,'OTROS'].map(p=>{const delta=o.seats[p]-o.referenceSeats[p];return '<tr><td>'+escape(p)+'</td><td>'+r2(o.targets[p])+' %</td><td>'+o.referenceSeats[p]+'</td><td><strong>'+o.seats[p]+'</strong></td><td>'+(delta>0?'+':'')+delta+'</td></tr>'}).join('')
     +'</tbody></table></div><p class="alg-tiny">Desajuste máximo con el objetivo nacional: '+r2(o.diagnostics.maxTargetErrorPP)+' pp. Hipótesis: distribución provincial de 2023 con ajuste de márgenes.</p>';
  }catch(e){el.innerHTML='<p class="alg-caution">'+escape(e.message)+'</p>'}
 }
 function choose(){
  current=values();
  inputs.innerHTML=ids.map(p=>'<label style="font-size:12px">'+escape(p)+' (%)<input type="number" inputmode="decimal" min="0" max="99" step="0.1" data-party="'+p+'" style="width:100%;margin-top:3px" value="'+Number(current[p]||0).toFixed(3)+'"></label>').join('');
  output();
 }
 study.addEventListener('change',choose);recipe.addEventListener('change',choose);inputs.addEventListener('change',output);choose();
}

// Portada (Panorama 29N): resumen sin pliegues. Titular → hemiciclo y promedio → evolución →
// últimas encuestas → accesos a todas las secciones.
// Capa 3 = `principal` del Motor 29N. Ninguna variante la sustituye. Solo presentación.
// El contraste de capas está en Pronóstico (contraste-capas.mjs); el caso 40dB y el experimento
// con microdatos del CIS, en Cocina (casos-cocina.mjs).
import {bindPortadaSeries} from './portada-series.mjs';
import {renderHemiciclo,renderPromedio,encuestasRecientes,renderTarjetas,renderAccesos} from './portada-hub.mjs';
import {PARTIES,promedioPublicado,capaModelo} from './capas.mjs';

const h=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=(v,d=1)=>Number(v).toLocaleString('es-ES',{minimumFractionDigits:d,maximumFractionDigits:d});
const fdate=s=>s?new Date(String(s).slice(0,10)+'T12:00:00Z').toLocaleDateString('es-ES',{day:'numeric',month:'short',year:'numeric',timeZone:'Europe/Madrid'}):'—';
const fday=s=>s?new Date(String(s).slice(0,10)+'T12:00:00Z').toLocaleDateString('es-ES',{day:'numeric',month:'short',timeZone:'Europe/Madrid'}):'—';
const flong=s=>new Date(String(s).slice(0,10)+'T12:00:00Z').toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long',year:'numeric',timeZone:'Europe/Madrid'});
const share=p=>p<0.005?'menos del 1 %':p>0.995?'más del 99 %':fmt(p*100,0)+' %';
const name=id=>PARTIES.find(x=>x.id===id)?.label||id;
const todayMadrid=()=>new Date().toLocaleDateString('sv-SE',{timeZone:'Europe/Madrid'});
let refsPortada=[];

export function renderHomeImpact(references=[],events=[]){
 refsPortada=references;
 return `<section class="impact portada" id="impact" aria-labelledby="impact-heading">
 <div class="portada-cabecera">
  <p class="portada-cuenta" id="portada-cuenta">Elecciones generales · 29 de noviembre de 2026</p>
  <h1 id="impact-heading">Panorama 29N</h1>
  <div class="portada-titular" id="portada-titular" aria-live="polite"><p>Cargando la estimación publicada…</p></div>
  <p class="portada-fechas" id="portada-fechas"></p>
 </div>

 <div class="hub-panel" id="portada-hub">
  <section class="hub-caja" aria-labelledby="hub-hemi-t"><div class="portada-bloque-cabeza"><div><span class="eyebrow">Motor 29N · pronóstico propio (capa 3)</span><h2 id="hub-hemi-t">Escaños estimados</h2></div><a class="panel-link" href="#pronostico">Pronóstico completo →</a></div><div id="hub-hemiciclo" aria-live="polite"><p class="muted">Cargando…</p></div></section>
  <section class="hub-caja" aria-labelledby="hub-prom-t"><div class="portada-bloque-cabeza"><div><span class="eyebrow">Encuestas publicadas · promedio simple (capa 1)</span><h2 id="hub-prom-t">Promedio de encuestas</h2></div><a class="panel-link" href="#pronostico-capas">Promedio frente a pronóstico →</a></div><div id="hub-promedio" aria-live="polite"><p class="muted">Cargando…</p></div></section>
 </div>

 <section class="portada-bloque" id="home-series" aria-labelledby="series-heading"><h2 id="series-heading">Evolución de las estimaciones</h2><p class="muted">Cargando series…</p></section>

 <section class="portada-bloque" id="portada-ultimas" aria-labelledby="hub-ult-t">
  <div class="portada-bloque-cabeza"><div><span class="eyebrow">La más reciente primero · cambio frente a la oleada anterior de cada casa</span><h2 id="hub-ult-t">Últimas encuestas</h2></div><a class="panel-link" href="#encuestas">Archivo completo y fichas →</a></div>
  <div id="hub-tarjetas" aria-live="polite"><p class="muted">Cargando…</p></div>
 </section>

 <section class="portada-bloque" id="portada-secciones" aria-labelledby="hub-sec-t"><h2 id="hub-sec-t">Todo el Observatorio</h2><div id="hub-accesos"></div></section>
</section>`;
}

// Titular: lo que el lector viene a saber, con el estatuto de estimación explícito. Los bloques
// están en el hemiciclo, justo debajo.
export function renderTitular(forecast){
 const p=forecast?.principal;
 if(!p?.partidos)return '<p>No hay una estimación publicada para este corte. Se muestra solo el promedio de encuestas.</p>';
 const es=Object.entries(p.partidos).filter(([,v])=>Number.isFinite(v?.escanos?.[0])).sort((a,b)=>b[1].escanos[0]-a[1].escanos[0]);
 const [first,second]=es;
 if(!first)return '<p>El pronóstico publicado no contiene escaños por partido.</p>';
 const [m,lo,hi]=first[1].escanos;
 const lead=`<p class="portada-titular-cifra">${h(name(first[0]))}, primera fuerza estimada: <strong>${fmt(m,0)} escaños</strong></p>`;
 const range=`Entre ${fmt(lo,0)} y ${fmt(hi,0)} en el 90 % de las simulaciones${second?`; ${fmt(m-second[1].escanos[0],0)} más que ${h(name(second[0]))} en la estimación central`:''}.`;
 const firstShare=Number.isFinite(first[1].primero)?` Queda primero en ${share(first[1].primero)} de las simulaciones.`:'';
 return `${lead}<p class="portada-titular-texto">${range}${firstShare}</p>`;
}

function renderFechas(forecast,polls){
 if(!forecast?.corte)return '';
 const later=polls.filter(p=>p.kind==='poll-estimate'&&p.published>forecast.corte).sort((a,b)=>b.published.localeCompare(a.published));
 const pending=later.length?` Después se ${later.length===1?'ha publicado 1 encuesta que el modelo aún no incorpora':`han publicado ${later.length} encuestas que el modelo aún no incorpora`}: ${later.map(p=>`${h(p.institute)} (${h(fday(p.published))})`).join(', ')}.`:'';
 return `Motor 29N, corte del ${h(fdate(forecast.corte))}: usa las encuestas publicadas hasta ese día.${pending} <a href="#pronostico-evolucion">Cortes anteriores</a>`;
}

function renderCuenta(forecast){
 const eleccion=forecast?.eleccion||'2026-11-29';
 const days=Math.round((Date.parse(eleccion)-Date.parse(todayMadrid()))/86400000);
 const when=days>1?`faltan ${days} días`:days===1?'mañana':days===0?'hoy':'elecciones ya celebradas; esta es la última estimación publicada antes de la veda, no el resultado';
 return `Elecciones generales · ${h(flong(eleccion))} · ${when}`;
}

function drawHead(ctx){
 const set=(sel,html)=>{const el=document.querySelector(sel);if(el)el.innerHTML=html;};
 set('#portada-cuenta',renderCuenta(ctx.forecast));
 set('#portada-titular',ctx.forecast?renderTitular(ctx.forecast):`<p>El pronóstico del Motor 29N no está disponible (${h(ctx.error||'sin datos')}). Se muestra solo el promedio de encuestas publicadas.</p>`);
 set('#portada-fechas',renderFechas(ctx.forecast,ctx.polls));
}

function drawHub(ctx){
 const set=(sel,html)=>{const el=document.querySelector(sel);if(el)el.innerHTML=html;};
 set('#hub-hemiciclo',renderHemiciclo(ctx.forecast));
 set('#hub-promedio',renderPromedio(ctx.prom));
 const desde=new Date(Date.parse(ctx.corte+'T12:00:00Z')-21*86400000).toISOString().slice(0,10);
 set('#hub-tarjetas',renderTarjetas(encuestasRecientes(ctx.forecast,ctx.polls,{desde,limite:8})));
 set('#hub-accesos',renderAccesos({forecast:ctx.forecast,polls:ctx.polls,events:ctx.events,references:refsPortada}));
}

export async function bindHomeImpact(polls,events=[]){
 const root=document.querySelector('#impact');if(!root)return;
 const ctx={polls,events,corte:todayMadrid(),forecast:null,history:null,prom:null};
 try{
  const r=await fetch('data/modelo/pronostico.json',{cache:'no-store'});if(!r.ok)throw Error('pronóstico no publicado (HTTP '+r.status+')');
  ctx.forecast=await r.json();ctx.corte=ctx.forecast.corte;
  // La portada muestra la estimación de referencia (capa 3), nunca una variante.
  capaModelo(ctx.forecast,3);
 }catch(err){ctx.error=err.message;}
 if(!root.isConnected)return;
 try{ctx.prom=promedioPublicado(polls,{corte:ctx.corte,ventana:30,cis:true,ponderacion:'igual'});}catch{ctx.prom=null;}
 drawHead(ctx);drawHub(ctx);
 const chart=root.querySelector('#home-series');
 const drawSeries=()=>bindPortadaSeries(chart,{polls,forecast:ctx.forecast,history:ctx.history,events,cutoff:todayMadrid()});
 if(ctx.forecast){
  fetch('data/modelo/historial.json',{cache:'no-store'}).then(r=>r.ok?r.json():[]).catch(()=>[])
   .then(history=>{ctx.history=Array.isArray(history)?history:[];if(root.isConnected)drawSeries();});
 }else drawSeries();
}

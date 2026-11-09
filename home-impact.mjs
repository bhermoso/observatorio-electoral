// Portada (Panorama 29N). Solo presentación: las cifras proceden de capas.mjs y del Motor 29N.
// Orden de lectura: titular con la estimación de referencia → reparto de escaños y bloques →
// tabla por partido → evolución → contraste con encuestas y otros modelos → detalle plegado.
// Capa 3 = `principal` del Motor 29N. Ninguna variante la sustituye.
import {bindPortadaSeries,PARTY_COLORS} from './portada-series.mjs';
import {calculate} from './cocina-secuencial.mjs';
import {projection} from './cocina-escanos.mjs';
import {renderRecuento} from './recuento-encuestas.mjs';
import {bindCaso} from './caso-escanos.mjs';
import {LAYERS,PARTIES,BLOCKS,BLOCK_NOTE,promedioPublicado,capaModelo,capasExternas,matriz,diferencias,efectoCocina,pollsFromModelInputs} from './capas.mjs';

const h=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=(v,d=1)=>Number(v).toLocaleString('es-ES',{minimumFractionDigits:d,maximumFractionDigits:d});
const fdate=s=>s?new Date(String(s).slice(0,10)+'T12:00:00Z').toLocaleDateString('es-ES',{day:'numeric',month:'short',year:'numeric',timeZone:'Europe/Madrid'}):'—';
const fday=s=>s?new Date(String(s).slice(0,10)+'T12:00:00Z').toLocaleDateString('es-ES',{day:'numeric',month:'short',timeZone:'Europe/Madrid'}):'—';
const flong=s=>new Date(String(s).slice(0,10)+'T12:00:00Z').toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long',year:'numeric',timeZone:'Europe/Madrid'});
const signed=(v,d=1)=>(v>0?'+':v<0?'−':'±')+fmt(Math.abs(v),d);
const share=p=>p<0.005?'menos del 1 %':p>0.995?'más del 99 %':fmt(p*100,0)+' %';
const name=id=>PARTIES.find(x=>x.id===id)?.label||id;
const color=id=>PARTY_COLORS[id]||'#7b8784';
const todayMadrid=()=>new Date().toLocaleDateString('sv-SE',{timeZone:'Europe/Madrid'});
const CIS_PARTIES=['PP','PSOE','VOX','SUMAR'];
const MAIN_PARTIES=5; // PP, PSOE, Vox, Sumar y Podemos: filas visibles por defecto en el contraste de capas
const state={vista:'voto',ventana:30,cis:true,ponderacion:'igual',base:'archivo',todos:false};

export function renderHomeImpact(references=[],events=[]){
 const latest=(items,key)=>[...items].sort((a,b)=>b[key].localeCompare(a[key]))[0];
 const average=latest(references.filter(r=>r.kind==='aggregate-model'&&r.published),'published');
 return `<section class="impact portada" id="impact" aria-labelledby="impact-heading">
 <div class="portada-cabecera">
  <p class="portada-cuenta" id="portada-cuenta">Elecciones generales · 29 de noviembre de 2026</p>
  <h1 id="impact-heading">Panorama 29N</h1>
  <div class="portada-titular" id="portada-titular" aria-live="polite"><p>Cargando la estimación publicada…</p></div>
  <p class="portada-fechas" id="portada-fechas"></p>
 </div>

 <section class="portada-bloque" id="portada-escanos" aria-labelledby="forecast-lead-title">
  <div class="portada-bloque-cabeza"><div><span class="eyebrow">Motor 29N · estimación de referencia (capa 3)</span><h2 id="forecast-lead-title">Escaños estimados</h2></div><a class="panel-link" href="#pronostico">Pronóstico completo y circunscripciones →</a></div>
  <div id="forecast-lead-results" class="forecast-lead" aria-live="polite"><p class="muted">Cargando estimación publicada…</p></div>
 </section>

 <section class="portada-bloque" id="home-series" aria-labelledby="series-heading"><h2 id="series-heading">Evolución de las estimaciones</h2><p class="muted">Cargando series…</p></section>

 <section class="portada-bloque" id="portada-capas" aria-labelledby="matrix-heading">
  <div class="portada-bloque-cabeza"><div><span class="eyebrow">Promedio, pronóstico y otros modelos</span><h2 id="matrix-heading">Qué es promedio y qué es pronóstico</h2></div><a class="panel-link" href="#analisis">Promedios con pesos propios →</a></div>
  <p class="muted" id="matrix-sub">Cargando datos…</p>
  <div class="matrix-controls">
   <fieldset class="portada-seg" id="matrix-view"><legend>Mostrar</legend>
    <label><input type="radio" name="mview" value="voto" checked> % de voto</label>
    <label><input type="radio" name="mview" value="escanos"> Escaños</label>
    <label><input type="radio" name="mview" value="cambio"> Cambio desde el corte anterior</label></fieldset>
   <details class="matrix-options"><summary>Reglas del promedio publicado (capa 1)</summary><div class="toolbar">
    <label>Ventana de campo<select id="m-window"><option value="30">30 días</option><option value="45">45 días</option><option value="90">90 días</option></select></label>
    <label>CIS<select id="m-cis"><option value="1">Con CIS</option><option value="0">Sin CIS</option></select></label>
    <label>Ponderación<select id="m-weight"><option value="igual">Igual peso por instituto</option><option value="recencia">Por recencia (semivida 14 días)</option></select></label>
    <label>Estudios<select id="m-base"><option value="archivo">Archivo verificado (data/polls.json)</option><option value="modelo">Mismas entradas que el Motor 29N</option></select></label></div>
    <p class="muted">Siempre: último estudio de cada instituto con fin de campo dentro de la ventana y publicado antes del corte. Pesos manuales por instituto en <a href="#analisis">Promedios y proyección experimental</a>.</p></details>
  </div>
  <div class="table-wrap"><table class="matrix portada-matriz" id="matrix-table" data-todos="false"><caption class="vh">Comparación de capas</caption><tbody><tr><td>Cargando…</td></tr></tbody></table></div>
  <button type="button" class="portada-mas-filas" id="matrix-toggle" aria-controls="matrix-table" aria-expanded="false">Mostrar todos los partidos</button>
  <div class="panorama-editorial" id="panorama-editorial" aria-live="polite">Calculando el contraste con las encuestas…</div>
  <div id="matrix-notes" class="matrix-notes"></div>
 </section>

 <section class="portada-detalle" aria-label="Detalle y procedencia">
 <details class="portada-plegable portada-caso" id="portada-caso"><summary>Un caso completo: de una encuesta de 40dB a los escaños de Madrid y Jaén</summary>
  <div id="caso-contenido" aria-live="polite"><p class="muted">Cargando el caso…</p></div>
 </details>
 <details class="portada-plegable" id="portada-cambios"><summary>Qué ha cambiado desde el corte anterior y qué añaden nuestros ajustes</summary>
  <div class="portada-dos"><section aria-labelledby="changes-heading"><h3 id="changes-heading">Cambios entre cortes</h3><div id="home-changes">Cargando…</div></section>
  <section aria-labelledby="cocina-heading"><h3 id="cocina-heading">Sin cocina (capa 2) y con cocina (capa 3)</h3><p class="muted">Las variantes del motor cambian la selección de anclas, las correcciones históricas y el error de industria. Ninguna repondera entrevistas individuales.</p><div id="home-cocina">Cargando…</div></section></div>
 </details>

 <details class="portada-plegable" id="portada-fuentes"><summary>De dónde sale cada cifra</summary>
  <div class="panorama-source-grid"><p><b>Promedio de encuestas:</b> agregamos estimaciones que ya publicaron los institutos. No son respuestas individuales.</p><p><b>Pronóstico propio:</b> tendencia, sesgos, calibración histórica y simulación de escaños; utiliza estimaciones publicadas, no microdatos.</p><p><b>Cocina sobre microdatos:</b> experimentos con respuestas del CIS; no alimentan este pronóstico.</p><p><b>Noticias y otros modelos:</b> pistas para verificar originales y comparadores externos, nunca encuestas añadidas automáticamente.</p></div>
  <ol class="layer-legend" aria-label="Las cuatro capas">${Object.entries(LAYERS).map(([k,l])=>`<li class="layer-${k}"><span class="layer-num" aria-hidden="true">${l.capa}</span><div><b>${h(l.nombre)}</b> <small>${h(l.naturaleza)}</small><p>${h(l.explica)}</p></div></li>`).join('')}</ol>
  <h3>Recuentos de las fuentes</h3><div id="home-counts"></div>
  <nav class="impact-links" aria-label="Método"><a href="flujograma.html">Cómo se calcula</a><a href="como-estimamos.html">Método y validación</a><a href="#pronostico-evaluacion">Retropruebas y errores</a><a href="construye-estimacion.html#cocina-secuencia">Cocina electoral</a><a href="#encuestas">Archivo de encuestas</a>${average?`<a href="#pronostico-externos">${h(average.publisher)} · ${h(fdate(average.published))}</a>`:''}</nav>
 </details>

 <details class="portada-plegable experiment" id="portada-microdatos" aria-labelledby="exp-heading"><summary id="exp-heading">Experimento separado: cocina sobre respuestas del CIS</summary>
  <p class="muted"><span class="badge sim">Microdatos · fuera del pronóstico</span> Cocina aplicada a <b>microdatos individuales</b> de un solo instituto (CIS). No alimenta el Motor 29N ni el contraste de capas. La proyección de escaños es ilustrativa: ajuste proporcional sobre el mapa de 2023 y D’Hondt.</p>
  <div class="toolbar"><label>Estudio <select id="impact-cis"><option value="3411">CIS 3411 · 2023</option><option value="3415">CIS 3415 · 2023</option><option value="3582" selected>CIS 3582 · 2026</option></select></label><label>Procedimiento <select id="impact-recipe"><option value="decided">Ponderación + solo decididos</option><option value="sympathy">Ponderación + voto o simpatía</option><option value="turnout">Ponderación + decididos + participación</option></select></label></div>
  <div id="impact-recipe-output" class="impact-visual" aria-live="polite">Recalculando…</div>
  <p class="muted"><a href="construye-estimacion.html">Construye una estimación, decisión a decisión →</a> · <a href="tutorial-estimacion.html">Tutorial</a> · <a href="metodo-evidencia.html">Por qué cambia la estimación</a> · <a href="#cocina">Cocina electoral →</a> · <a href="#laboratorio">Laboratorio D’Hondt →</a></p>
 </details>
 </section>
</section>`;
}

// Cambio de escaños de cada partido respecto al corte anterior del historial, solo si ambos
// cortes usan la misma versión del modelo (si no, la diferencia sería en parte metodológica).
function seatChanges(forecast,history){
 const before=(history||[]).filter(c=>c?.fecha<forecast.corte).sort((a,b)=>a.fecha.localeCompare(b.fecha)).at(-1);
 if(!before||before.version!==forecast.version_modelo)return {fecha:before?.fecha??null,cambios:null};
 const cambios={};
 for(const [id,v] of Object.entries(forecast.principal.partidos)){
  const prior=before.escanos?.[id]?.[0];
  if(Number.isFinite(prior))cambios[id]=v.escanos[0]-prior;
 }
 return {fecha:before.fecha,cambios};
}

function seatBar(parties){
 const total=parties.reduce((s,[,v])=>s+v.escanos[0],0);
 const rest=350-total;
 const label=parties.map(([id,v])=>`${name(id)} ${fmt(v.escanos[0],0)}`).join(', ');
 const segs=parties.filter(([,v])=>v.escanos[0]>0).map(([id,v])=>{
  const n=v.escanos[0];
  return `<span class="portada-seg-partido" style="flex:${n} 0 0;--c:${color(id)}" title="${h(name(id))} · ${fmt(n,0)} escaños">${n>=20?`<b>${h(name(id))}</b> ${fmt(n,0)}`:''}</span>`;
 }).join('');
 const gap=rest>0?`<span class="portada-seg-resto" style="flex:${rest} 0 0" title="${rest} escaños no repartidos en la suma de medianas"></span>`:'';
 const small=parties.filter(([,v])=>v.escanos[0]>0&&v.escanos[0]<20);
 return `<div class="portada-barra" role="img" aria-label="Escaños estimados (mediana de cada partido): ${h(label)}.">${segs}${gap}</div>
 ${small.length?`<p class="portada-leyenda">${small.map(([id,v])=>`<span><i style="--c:${color(id)}"></i>${h(name(id))} ${fmt(v.escanos[0],0)}</span>`).join('')}</p>`:''}
 ${rest!==0?`<p class="portada-nota">Cada barra es la mediana de las simulaciones de ese partido. Las medianas no tienen por qué sumar 350: aquí suman ${fmt(total,0)}.</p>`:''}`;
}

function blocRows(p){
 const rows=BLOCKS.filter(b=>Number.isFinite(p.bloques?.[b.id]?.mediana)).map(b=>{
  const x=p.bloques[b.id],lo=x.p5,hi=x.p95,m=x.mediana,pct=v=>(v/350*100).toFixed(2)+'%';
  return `<li class="portada-bloc">
   <div class="portada-bloc-nombre"><b>${h(b.label)}</b><small>${Number.isFinite(x.p_mayoria)?`176 o más en ${share(x.p_mayoria)} de las simulaciones`:''}</small></div>
   <div class="portada-bloc-cifra"><strong>${fmt(m,0)}</strong><small>${Number.isFinite(lo)&&Number.isFinite(hi)?`${fmt(lo,0)}–${fmt(hi,0)}`:''}</small></div>
   <div class="portada-pista" role="img" aria-label="${fmt(m,0)} escaños; intervalo del 90 %: ${fmt(lo,0)} a ${fmt(hi,0)}; la mayoría absoluta está en 176">
    <span class="iv" style="left:${pct(lo)};width:${pct(hi-lo)}"></span><span class="md" style="left:${pct(m)}"></span><i style="left:${pct(176)}"></i></div>
  </li>`;
 }).join('');
 return rows?`<div class="portada-bloques"><div class="portada-subcabeza"><h3>Sumas por bloques</h3><a href="#pronostico-bloques">Bloques en el pronóstico →</a></div>
 <ul>${rows}</ul><p class="portada-nota">${h(BLOCK_NOTE)} Intervalo del 90 % de las simulaciones; la línea vertical marca 176 escaños.</p></div>`:'';
}

function partyTable(parties,average,changes,caution){
 const max=Math.max(...parties.map(([,v])=>v.escanos[2]),1);
 const pct=v=>(v/max*100).toFixed(2)+'%';
 const anyChange=changes.cambios&&Object.values(changes.cambios).some(v=>v!==0);
 const rows=parties.map(([id,v])=>{
  const pub=average?.partidos?.[id]?.valor;
  const ch=changes.cambios?.[id];
  return `<tr>
   <th scope="row"><i class="portada-punto" style="--c:${color(id)}"></i>${h(name(id))}${caution.has(id)?'<small>Sin encuestas propias</small>':''}</th>
   <td class="num"><b>${fmt(v.voto[0])} %</b><small>${fmt(v.voto[1])}–${fmt(v.voto[2])}</small></td>
   <td class="num"><b>${fmt(v.escanos[0],0)}</b><small>${fmt(v.escanos[1],0)}–${fmt(v.escanos[2],0)}</small></td>
   <td class="portada-rango" aria-hidden="true"><div><span class="iv" style="left:${pct(v.escanos[1])};width:${pct(v.escanos[2]-v.escanos[1])};--c:${color(id)}"></span><span class="md" style="left:${pct(v.escanos[0])}"></span></div></td>
   <td class="num cambio">${ch==null?'—':ch===0?'<span class="igual">=</span>':signed(ch,0)}</td>
   <td class="num capa1">${Number.isFinite(pub)?fmt(pub)+' %':'—'}</td>
  </tr>`;
 }).join('');
 return `<div class="portada-subcabeza"><h3>Por partido</h3><a href="#pronostico-principal">Tabla completa del pronóstico →</a></div>
 <div class="table-wrap"><table class="portada-tabla">
  <caption class="vh">Voto y escaños estimados por partido, con intervalos del 90 %</caption>
  <thead><tr><th scope="col">Partido</th><th scope="col" class="num">Voto estimado</th><th scope="col" class="num">Escaños</th><th scope="col" class="portada-rango-cab"><span class="vh">Intervalo de escaños</span></th><th scope="col" class="num cambio">Cambio${changes.fecha?`<small>desde ${h(fday(changes.fecha))}</small>`:''}</th><th scope="col" class="num capa1">Promedio de encuestas<small>capa 1</small></th></tr></thead>
  <tbody>${rows}</tbody></table></div>
 <p class="portada-nota">Cifra central: mediana de las simulaciones; debajo, intervalo del 90 %. ${changes.cambios?(anyChange?'«=» indica que la mediana de escaños no ha cambiado.':'Ninguna mediana de escaños ha cambiado desde el corte anterior.'):'Sin cambio comparable: el corte anterior usa otra versión del modelo o no consta.'} El promedio de encuestas no es una estimación del Observatorio.</p>`;
}

export function renderForecastOverview(forecast,history,average){
 const p=forecast?.principal;
 if(!p?.partidos)return '<p class="empty">Pronóstico no disponible para este corte.</p>';
 const parties=Object.entries(p.partidos).filter(([,v])=>Array.isArray(v?.escanos)&&Array.isArray(v?.voto))
  .sort((a,b)=>b[1].escanos[0]-a[1].escanos[0]||b[1].voto[0]-a[1].voto[0]);
 const changes=history===null?{fecha:null,cambios:null}:seatChanges(forecast,history);
 return `<div class="forecast-lead-content">
  <div class="portada-reparto">${seatBar(parties)}${blocRows(p)}</div>
  <div class="portada-partidos">${partyTable(parties,average,changes,new Set(p.sin_encuestas||[]))}</div>
 </div>`;
}

// Titular: lo que el lector viene a saber, con el estatuto de estimación explícito.
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
 const blocs=['PP+VOX','PSOE+SUMAR+PODEMOS'].map(id=>({b:BLOCKS.find(x=>x.id===id),x:p.bloques?.[id]})).filter(({b,x})=>b&&Number.isFinite(x?.p_mayoria));
 const blocText=blocs.length?` ${blocs.map(({b,x},i)=>i===0?`${h(b.label)} suma 176 escaños o más en ${share(x.p_mayoria)} de las simulaciones`:`${h(b.label)}, en ${share(x.p_mayoria)}`).join('; ')}. Son sumas aritméticas, no probabilidades de pacto.`:'';
 return `${lead}<p class="portada-titular-texto">${range}${firstShare}${blocText}</p>`;
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

function drawForecastLead(ctx){
 const el=document.querySelector('#forecast-lead-results');
 if(el)el.innerHTML=renderForecastOverview(ctx.forecast,ctx.history,ctx.prom);
}

function drawEditorial(ctx){
 const el=document.querySelector('#panorama-editorial');if(!el)return;
 const p=ctx.forecast?.principal;
 if(!p?.partidos||!ctx.prom){el.textContent='No hay datos suficientes para comparar el promedio con el pronóstico; no se fabrican conclusiones.';return;}
 const ds=['PP','PSOE','VOX','SUMAR'].flatMap(id=>{
  const a=ctx.prom.partidos[id]?.valor,b=p.partidos[id]?.voto?.[0];
  return Number.isFinite(a)&&Number.isFinite(b)?[{id,a,b,d:b-a}]:[];
 }).sort((a,b)=>Math.abs(b.d)-Math.abs(a.d));
 const d=ds[0],compare=d?'Entre los cuatro partidos principales, la mayor diferencia entre el promedio seleccionado y el pronóstico es la de '+name(d.id)+': '+fmt(d.a)+' % publicado frente a '+fmt(d.b)+' % estimado ('+signed(d.d)+' pp). No demuestra qué método acertará.':'Los datos no permiten contrastar los principales partidos.';
 el.innerHTML='<p><b>Contraste.</b> '+h(compare)+'</p><p class="panorama-editorial-note">Promedio: '+ctx.prom.estudios.filter(x=>x.weight>0).length+' estudios seleccionados. Motor: '+h(ctx.entradas??'—')+' entradas. Las noticias y los experimentos con microdatos no se cuentan como encuestas.</p>';
}

function headerCell(col,ctx){
 if(col.layer==='externo'){
  const x=col.externo;
  return `<th scope="col" class="col-ext"><span class="layer-tag">Capa 4</span>${h(x.nombre)}<small>${h(fdate(x.fecha))} · ${h(x.fecha_tipo||'')}</small><small class="${x.verificado?'ok':'warn'}">${x.verificado?'Original consultado':'Original no consultado'}${x.aproximado?' · cifras aproximadas':''}</small></th>`;
 }
 const l=LAYERS[col.layer];
 const extra=col.layer==='promedio'?`${ctx.prom.estudios.length} estudios · ${ctx.prom.institutos} institutos · ${ctx.prom.ventana} días${ctx.prom.cis?'':' · sin CIS'}`
  :`Motor 29N · corte ${fdate(ctx.corte)} · ${ctx.entradas} estudios`;
 return `<th scope="col" class="col-${col.layer}"><span class="layer-tag">Capa ${l.capa}</span>${h(l.corto)}<small>${h(extra)}</small><small>${h(l.naturaleza)}</small></th>`;
}
function cellHTML(c,ref){
 if(c==null||c.valor==null)return `<td class="na${ref?' ref':''}"><span aria-hidden="true">—</span><span class="vh">Sin dato: </span><small class="na-why">${h(c?.motivo||'Sin dato')}</small></td>`;
 const d=c.unidad==='esc.'?0:1;
 const main=c.signo?signed(c.valor,d):fmt(c.valor,d);
 const unit=c.unidad==='%'?' %':c.unidad==='pp'?' pp':'';
 const iv=c.intervalo?`<small>${fmt(c.intervalo[0],d)}–${fmt(c.intervalo[1],d)}</small>`:'';
 const meta=[c.n?`n=${c.n}`:'',c.aprox?'suma de medianas':'',c.hipotesis?'sin encuestas: voto del 23J':'',c.p!=null?`≥176 en ${fmt(c.p*100,0)} %`:''].filter(Boolean).join(' · ');
 return `<td class="${ref?'ref':''}"><b>${main}${unit}</b>${iv}${meta?`<small class="meta">${h(meta)}</small>`:''}</td>`;
}
function drawMatrix(ctx){
 const table=document.querySelector('#matrix-table');if(!table)return;
 const m=matriz({promedio:ctx.prom,sinCocina:ctx.sin,conCocina:ctx.con,externos:ctx.ext,promedioAnterior:ctx.promPrev,corteAnterior:ctx.forecast?.corte_anterior},state.vista);
 const refIdx=m.columns.findIndex(c=>c.layer==='conCocina');
 const diffs=diferencias(m);
 const diffCol=state.vista!=='cambio';
 const promIdx=m.columns.findIndex(c=>c.layer==='promedio'),sinIdx=m.columns.findIndex(c=>c.layer==='sinCocina');
 const compare=state.vista==='voto'?promIdx:sinIdx;
 const compareName=state.vista==='voto'?'promedio publicado':'sin cocina';
 const head=`<thead><tr><th scope="col">Partido / bloque</th>${m.columns.map(c=>headerCell(c,ctx)).join('')}${diffCol?`<th scope="col" class="col-diff">Referencia − ${compareName}<small>${state.vista==='voto'?'puntos':'escaños'}</small></th>`:''}</tr></thead>`;
 let lastType='partido',partyIndex=0;
 const body=m.rows.map((r,i)=>{
  const sep=r.tipo!==lastType?`<tr class="row-sep"><th colspan="${m.columns.length+1+(diffCol?1:0)}" scope="rowgroup">Bloques · ${h(BLOCK_NOTE)}</th></tr>`:'';lastType=r.tipo;
  const minor=r.tipo==='partido'&&partyIndex++>=MAIN_PARTIES;
  const dv=diffs[i][compare];
  const diff=diffCol?`<td class="diff">${dv==null?'<span aria-hidden="true">—</span><span class="vh">Sin diferencia calculable</span>':signed(dv,state.vista==='voto'?1:0)}</td>`:'';
  return `${sep}<tr class="${r.tipo}${minor?' menor':''}"><th scope="row">${h(r.label)}${r.aviso&&r.tipo==='partido'?`<small class="warn" title="${h(r.aviso)}">equivalencia de etiquetas ⓘ</small>`:''}</th>${r.cells.map((c,j)=>cellHTML(c,j===refIdx)).join('')}${diff}</tr>`;
 }).join('');
 table.innerHTML=`<caption class="vh">Comparación de capas · vista ${h(state.vista)}</caption>${head}<tbody>${body}</tbody>`;
 const toggle=document.querySelector('#matrix-toggle');
 if(toggle){const hidden=Math.max(0,partyIndex-MAIN_PARTIES);toggle.hidden=hidden===0;toggle.textContent=state.todos?'Mostrar solo los cinco partidos principales':`Mostrar los ${partyIndex} partidos (${hidden} más)`;}
 const sumar=PARTIES.find(p=>p.id==='SUMAR');
 const labels=ctx.prom.partidos.SUMAR?.etiquetas?.join(', ');
 document.querySelector('#matrix-notes').innerHTML=`<ul>
  <li><b>Capa 1</b>: estudios usados ${ctx.prom.estudios.map(e=>`${h(e.institute)} (${h(fdate(e.fieldEnd))}${state.base==='modelo'&&e.origin!=='verificada'?', '+h(e.origin):''})`).join(', ')||'ninguno'}.${ctx.prom.excluidos.length?' Excluidos por filtro: '+ctx.prom.excluidos.map(e=>h(e.institute)).join(', ')+'.':''}</li>
  <li><b>Capas 2 y 3</b>: Motor 29N con ${ctx.entradas} estudios (${Object.entries(ctx.con?.porOrigen||{}).map(([k,v])=>`${v} ${h(k)}`).join(', ')}); ${ctx.forecast?.excluidas?.length??0} registros excluidos por la puerta de calidad (<a href="#pronostico">ver motivos</a>). Intervalos del 90 % de las simulaciones. Son estimaciones condicionadas a los supuestos del modelo, no resultados.</li>
  <li><b>Capa 4</b>: no entra en nuestros cálculos. Se muestra el registro más reciente de dos productores, primero los consultados en origen; ${ctx.ext.length>2?`<a href="#pronostico-externos">${ctx.ext.length} registros en total</a>`:'todos los registrados'}. «Original no consultado» indica cifras tomadas de una cita o un resumen.</li>
  <li>${h(sumar.aviso)}${labels?' Etiquetas en la selección: '+h(labels)+'.':''}</li>
  ${state.vista==='cambio'?`<li>Cambio respecto al corte del ${h(fdate(ctx.forecast?.corte_anterior?.fecha))}. La capa 3 compara dos entradas del historial calculadas con el mismo método${ctx.forecast?.corte_anterior?.cambio_metodo?'; <b>entre ambos cortes cambió la versión del modelo</b>, así que parte de la variación es metodológica':''}.</li>`:''}
 </ul>`;
 document.querySelector('#matrix-sub').textContent=`Corte ${fdate(ctx.corte)}. «—» significa que la capa no publica o no calcula ese valor; nunca se sustituye por cero.`;
}
function drawChanges(ctx){
 const el=document.querySelector('#home-changes');if(!el)return;
 const c=ctx.forecast?.corte_anterior;
 if(!c){el.innerHTML='<p class="empty">No hay un corte anterior registrado.</p>';return;}
 const rows=['PP','PSOE','VOX','SUMAR','PODEMOS'].filter(p=>p in (c.escanos||{})).map(p=>`<tr><th scope="row">${h(name(p))}</th><td>${c.voto?.[p]!=null?signed(c.voto[p],1)+' pp':'—'}</td><td>${signed(c.escanos[p],0)}</td></tr>`).join('');
 el.innerHTML=`<p>Del ${h(fdate(c.fecha))} al ${h(fdate(c.fecha_actual))}. Estudios nuevos ese día: ${c.nuevas?.length?c.nuevas.map(h).join(', '):'ninguno'}.</p>
 ${c.cambio_metodo?`<p class="notice">Cambio de método entre cortes (versión ${h(c.version_anterior)} → ${h(c.version_actual)}). La variación no se debe solo a datos nuevos.</p>`:''}
 <div class="table-wrap"><table><thead><tr><th>Partido</th><th>Voto (mediana)</th><th>Escaños (mediana)</th></tr></thead><tbody>${rows}</tbody></table></div>
 <p class="muted">PP + Vox: ${signed(c.bloques?.['PP+VOX']??0,0)} escaños. Estimación de referencia; ${h(c.nota||'')} Sin estudios nuevos ni cambio de método, las diferencias pequeñas son ruido de simulación.</p>`;
}
function drawCocina(ctx){
 const el=document.querySelector('#home-cocina');if(!el)return;
 if(!ctx.sin||!ctx.con){el.textContent='Pronóstico no disponible.';return;}
 const e=efectoCocina(ctx.sin,ctx.con);const def=ctx.forecast?.capas?.con_cocina;
 const rows=PARTIES.filter(p=>e[p.id]&&!ctx.con.sinEncuestas.includes(p.id)).slice(0,7).map(p=>`<tr><th scope="row">${h(p.label)}</th><td>${fmt(ctx.sin.partidos[p.id].voto[0])} %</td><td>${fmt(ctx.con.partidos[p.id].voto[0])} %</td><td>${signed(e[p.id].voto,1)} pp</td><td>${fmt(ctx.sin.partidos[p.id].escanos[0],0)} → ${fmt(ctx.con.partidos[p.id].escanos[0],0)} (${signed(e[p.id].escanos,0)})</td></tr>`).join('');
 const pm=x=>x?.bloques?.['PP+VOX']?.p_mayoria;
 el.innerHTML=`<div class="table-wrap"><table><thead><tr><th>Partido</th><th>Sin cocina (capa 2)</th><th>Con cocina (capa 3)</th><th>Diferencia de voto</th><th>Escaños</th></tr></thead><tbody>${rows}</tbody></table></div>
 <p>PP + Vox con 176 o más: <b>${fmt(pm(ctx.sin)*100,0)} %</b> de las simulaciones sin cocina frente a <b>${fmt(pm(ctx.con)*100,0)} %</b> con cocina. La diferencia principal es nuestra corrección de la mitad del sesgo que tuvieron las encuestadoras en el 23J (${Object.entries(ctx.forecast?.principal?.correccion_industria?.puntos||{}).map(([k,v])=>`${h(name(k))} ${signed(v,2)}`).join(' · ')||'no aplicada'}). <a href="#cocina-observatorio">La cocina del Observatorio, explicada →</a></p>
 <details><summary>Decisiones aplicadas y no aplicadas</summary><p><b>Tipo:</b> ${h(def?.tipo_cocina||'')}</p><ul>${(def?.decisiones||[]).map(d=>`<li>${h(d.descripcion)}${d.valor!=null?' ('+h(String(d.valor))+')':''}</li>`).join('')}</ul><p><b>No se aplica</b> (no hay datos individuales en el motor): ${h((def?.no_aplicado||[]).join(', '))}.</p><p><a href="#pronostico-cocina">Descomposición por variante →</a></p></details>`;
}
function computeLayer1(ctx){
 const polls=state.base==='modelo'?pollsFromModelInputs(ctx.forecast?.entradas):ctx.polls;
 const opts={corte:ctx.corte,ventana:state.ventana,cis:state.cis,ponderacion:state.ponderacion,semivida:14};
 ctx.prom=promedioPublicado(polls,opts);
 const prev=ctx.forecast?.corte_anterior?.fecha;
 ctx.promPrev=prev?promedioPublicado(polls,{...opts,corte:prev}):null;
}
function drawHead(ctx){
 const set=(sel,html)=>{const el=document.querySelector(sel);if(el)el.innerHTML=html;};
 set('#portada-cuenta',renderCuenta(ctx.forecast));
 set('#portada-titular',ctx.forecast?renderTitular(ctx.forecast):`<p>El pronóstico del Motor 29N no está disponible (${h(ctx.error||'sin datos')}). Se muestra solo el promedio de encuestas publicadas.</p>`);
 set('#portada-fechas',renderFechas(ctx.forecast,ctx.polls));
}

export async function bindHomeImpact(polls,events=[]){
 const root=document.querySelector('#impact');if(!root)return;
 const ctx={polls,corte:todayMadrid(),forecast:null,history:null,sin:null,con:null,ext:[],entradas:null};
 try{
  const r=await fetch('data/modelo/pronostico.json',{cache:'no-store'});if(!r.ok)throw Error('pronóstico no publicado (HTTP '+r.status+')');
  ctx.forecast=await r.json();
  ctx.corte=ctx.forecast.corte;ctx.con=capaModelo(ctx.forecast,3);ctx.sin=capaModelo(ctx.forecast,2);ctx.ext=capasExternas(ctx.forecast);ctx.entradas=ctx.con.entradas;
 }catch(err){
  ctx.error=err.message;
  const sub=document.querySelector('#matrix-sub');if(sub)sub.textContent='Motor 29N no disponible: '+err.message+'. Solo se muestra el promedio publicado.';
 }
 if(!root.isConnected)return;
 const redraw=()=>{try{computeLayer1(ctx);drawForecastLead(ctx);drawMatrix(ctx);drawEditorial(ctx);document.querySelector('#home-counts').innerHTML=renderRecuento({forecast:ctx.forecast,archivo:polls.length,seleccion:{estudios:ctx.prom.estudios.filter(e=>e.weight>0).length,institutos:ctx.prom.institutos,detalle:`${state.ventana} días · ${state.base==='archivo'?'archivo verificado':'entradas del motor'}${state.cis?'':' · sin CIS'}`}});}catch(e){document.querySelector('#matrix-table').innerHTML=`<tbody><tr><td role="alert">No se puede calcular: ${h(e.message)}</td></tr></tbody>`;}};
 drawHead(ctx);redraw();drawChanges(ctx);drawCocina(ctx);
 bindCaso(root.querySelector('#portada-caso'),polls);
 const chart=root.querySelector('#home-series');
 const cutoff=todayMadrid();
 const drawSeries=()=>bindPortadaSeries(chart,{polls,forecast:ctx.forecast,history:ctx.history,events,cutoff});
 if(ctx.forecast){
  fetch('data/modelo/historial.json',{cache:'no-store'})
   .then(r=>r.ok?r.json():[])
   .catch(()=>[])
   .then(history=>{
    ctx.history=Array.isArray(history)?history:[];
    if(root.isConnected){drawForecastLead(ctx);drawSeries();}
   });
 }else drawSeries();
 const toggle=document.querySelector('#matrix-toggle');
 toggle?.addEventListener('click',()=>{state.todos=!state.todos;const t=document.querySelector('#matrix-table');t.dataset.todos=String(state.todos);toggle.setAttribute('aria-expanded',String(state.todos));redraw();});
 document.querySelector('#matrix-table').dataset.todos=String(state.todos);toggle?.setAttribute('aria-expanded',String(state.todos));
 document.querySelectorAll('input[name=mview]').forEach(i=>i.addEventListener('change',()=>{state.vista=i.value;redraw();}));
 const bindSel=(id,fn)=>{const el=document.querySelector(id);if(!el)return;el.addEventListener('change',()=>{fn(el.value);redraw();});};
 const sync=(id,v)=>{const el=document.querySelector(id);if(el)el.value=String(v);};
 sync('#m-window',state.ventana);sync('#m-cis',state.cis?1:0);sync('#m-weight',state.ponderacion);sync('#m-base',state.base);
 document.querySelector(`input[name=mview][value=${state.vista}]`).checked=true;
 bindSel('#m-window',v=>state.ventana=Number(v));bindSel('#m-cis',v=>state.cis=v==='1');bindSel('#m-weight',v=>state.ponderacion=v);
 bindSel('#m-base',v=>{if(v==='modelo'&&!ctx.forecast?.entradas){alertInline();return;}state.base=v;});
 function alertInline(){const s=document.querySelector('#matrix-sub');if(s)s.textContent='Las entradas del motor no están publicadas en este corte.';}
 try{
  const [c,e]=await Promise.all(['data/microdatos/cubo_decisiones_cis.json','data/election.json'].map(async uri=>{const r=await fetch(uri);if(!r.ok)throw Error(uri+': '+r.status);return r.json()}));
  if(!root.isConnected)return;
  const study=document.querySelector('#impact-cis'),recipe=document.querySelector('#impact-recipe'),el=document.querySelector('#impact-recipe-output');
  const draw=()=>{
   const kind=recipe.value,params={study:study.value,weighted:true,decided:true,sympathy:kind==='sympathy',participation:kind==='turnout'?1:0};
   try{
    const calc=calculate(c,params);
    const out=projection(e,Object.fromEntries(CIS_PARTIES.map(p=>[p,calc.shares[p]])));
    el.innerHTML=CIS_PARTIES.map(p=>`<div class="impact-line"><span>${h(name(p))}</span><div class="impact-track"><div style="width:${Math.min(100,calc.shares[p]/42*100)}%"></div></div><b>${fmt(calc.shares[p])} %</b><small>${out.seats[p]} esc. ilustrativos</small></div>`).join('')+`<p class="muted">PP + Vox: ${out.seats.PP+out.seats.VOX} escaños ilustrativos. Experimento sobre un único estudio.</p>`;
   }catch(err){el.textContent='No puede calcularse este escenario: '+err.message}
  };
  study.addEventListener('change',draw);recipe.addEventListener('change',draw);draw();
 }catch(err){const el=document.querySelector('#impact-recipe-output');if(el)el.textContent='Microdatos agregados no disponibles: '+err.message}
}

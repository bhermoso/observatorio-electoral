// Portada: corte temporal, cuatro capas inequívocas y matriz comparativa.
// Capa 3 = `principal` del Motor 29N. Ninguna variante la sustituye.
import {calculate} from './cocina-secuencial.mjs';
import {projection} from './cocina-escanos.mjs';
import {renderRecuento} from './recuento-encuestas.mjs';
import {LAYERS,PARTIES,BLOCKS,BLOCK_NOTE,promedioPublicado,capaModelo,capasExternas,matriz,diferencias,efectoCocina,pollsFromModelInputs} from './capas.mjs';

const h=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=(v,d=1)=>Number(v).toLocaleString('es-ES',{minimumFractionDigits:d,maximumFractionDigits:d});
const fdate=s=>s?new Date(String(s).slice(0,10)+'T12:00:00Z').toLocaleDateString('es-ES',{day:'numeric',month:'short',year:'numeric',timeZone:'Europe/Madrid'}):'—';
const signed=(v,d=1)=>(v>0?'+':v<0?'−':'±')+fmt(Math.abs(v),d);
const CIS_PARTIES=['PP','PSOE','VOX','SUMAR'];
const state={vista:'voto',ventana:30,cis:true,ponderacion:'igual',base:'archivo'};

export function renderHomeImpact(){
 return `<section class="impact" id="impact" aria-labelledby="impact-heading">
 <div class="impact-head">
  <div class="impact-intro"><span class="impact-kicker"><i></i> <span id="impact-cut">Cargando corte…</span></span>
  <h1 id="impact-heading">Panorama <em>29N</em></h1>
  <a class="impact-direct-link" href="#pronostico">Pronóstico completo y circunscripciones →</a></div>
  <dl class="impact-facts" id="impact-facts" aria-live="polite"><div><dt>Corte</dt><dd>…</dd></div></dl>
 </div>
 <nav class="panorama-tabs" role="tablist" aria-label="Explorar Panorama"><button type="button" role="tab" id="panorama-tab-resultados" aria-controls="panorama-panel-resultados" aria-selected="true" tabindex="0" data-panorama-tab="resultados">Resultados</button><button type="button" role="tab" id="panorama-tab-comparar" aria-controls="panorama-panel-comparar" aria-selected="false" tabindex="-1" data-panorama-tab="comparar">Promedio y modelo</button><button type="button" role="tab" id="panorama-tab-variacion" aria-controls="panorama-panel-variacion" aria-selected="false" tabindex="-1" data-panorama-tab="variacion">Cambios y ajustes</button><button type="button" role="tab" id="panorama-tab-fuentes" aria-controls="panorama-panel-fuentes" aria-selected="false" tabindex="-1" data-panorama-tab="fuentes">Fuentes</button><button type="button" role="tab" id="panorama-tab-microdatos" aria-controls="panorama-panel-microdatos" aria-selected="false" tabindex="-1" data-panorama-tab="microdatos">Microdatos CIS</button></nav>
 <div class="panorama-pane" id="panorama-panel-resultados" data-panorama-panel="resultados" role="tabpanel" aria-labelledby="panorama-tab-resultados">
 <section class="forecast-lead panel" aria-labelledby="forecast-lead-title">
  <div class="forecast-lead-header"><div><span class="eyebrow">Motor 29N · pronóstico propio</span><h2 id="forecast-lead-title">Voto y escaños estimados</h2></div><a class="panel-link" href="#pronostico">Ver pronóstico, método y circunscripciones →</a></div>
  <div id="forecast-lead-results" aria-live="polite"><p class="muted">Cargando estimación publicada…</p></div>
 </section>
 <div class="panorama-editorial" id="panorama-editorial" aria-live="polite">Calculando el contraste con las encuestas…</div>
 </div>
 <div class="panorama-pane" id="panorama-panel-fuentes" data-panorama-panel="fuentes" role="tabpanel" aria-labelledby="panorama-tab-fuentes" hidden>
 <nav class="impact-links" aria-label="Método y navegación ampliada"><a href="flujograma.html">Cómo se calcula</a><a href="construye-estimacion.html#cocina-secuencia">Cocina electoral</a><a href="como-estimamos.html">Método y validación</a><a href="#contexto">Urda</a></nav>
 <details class="panorama-sources" open><summary>Qué procede de encuestas, modelo, microdatos y noticias</summary>
 <div class="panorama-source-grid"><p><b>Promedio de encuestas:</b> agregamos estimaciones que ya publicaron los institutos. No son respuestas individuales.</p><p><b>Pronóstico propio:</b> tendencia, sesgos, calibración histórica y simulación de escaños; utiliza estimaciones publicadas, no microdatos.</p><p><b>Cocina sobre microdatos:</b> experimentos con respuestas del CIS; no alimentan este pronóstico.</p><p><b>Noticias y otros modelos:</b> pistas para verificar originales y comparadores externos, nunca encuestas añadidas automáticamente.</p></div>
 <ol class="layer-legend" aria-label="Las cuatro capas">${Object.entries(LAYERS).map(([k,l])=>`<li class="layer-${k}"><span class="layer-num" aria-hidden="true">${l.capa}</span><div><b>${h(l.nombre)}</b><small>${h(l.naturaleza)}</small><details><summary>¿Qué es exactamente?</summary><p>${h(l.explica)}</p></details></div></li>`).join('')}</ol></details>
 <details class="panorama-secondary" open><summary>Recuentos completos de las fuentes</summary><div id="home-counts"></div></details></div>
 <div class="panorama-pane" id="panorama-panel-comparar" data-panorama-panel="comparar" role="tabpanel" aria-labelledby="panorama-tab-comparar" hidden>
 <details class="panel matrix-panel panorama-secondary" open><summary>Contrastar promedio y pronóstico, partido a partido</summary>
  <div class="panel-head"><div><span class="eyebrow">Diferenciar procesos</span><h2 id="matrix-heading">Qué es promedio y qué es pronóstico</h2><p class="muted" id="matrix-sub">Cargando datos…</p></div></div>
  <div class="matrix-controls">
   <fieldset class="seg" id="matrix-view"><legend>Mostrar</legend>
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
  <div class="table-wrap"><table class="matrix" id="matrix-table"><caption class="vh">Comparación de capas</caption><tbody><tr><td>Cargando…</td></tr></tbody></table></div>
  <div id="matrix-notes" class="matrix-notes"></div>
 </details></div>
 <div class="panorama-pane" id="panorama-panel-variacion" data-panorama-panel="variacion" role="tabpanel" aria-labelledby="panorama-tab-variacion" hidden>
 <details class="panorama-secondary" open><summary>Detalle por bloques y evolución diaria</summary><div class="home-grid">
  <section class="panel" aria-labelledby="blocks-heading"><span class="eyebrow">Pronóstico · bloques ampliados</span><h2 id="blocks-heading">Escaños por bloques</h2><p class="muted">${h(BLOCK_NOTE)} Mayoría absoluta: 176 de 350.</p><div id="home-blocks" class="home-blocks">Cargando…</div></section>
  <section class="panel" aria-labelledby="changes-heading"><span class="eyebrow">Corte anterior</span><h2 id="changes-heading">Qué ha cambiado</h2><div id="home-changes">Cargando…</div></section>
 </div></details>
 <details class="panel panorama-secondary" aria-labelledby="cocina-heading"><summary>Qué cambia por nuestros ajustes estadísticos e históricos</summary><span class="eyebrow">Ajustes sobre estimaciones publicadas</span><h2 id="cocina-heading">La diferencia entre dos variantes del motor</h2><p class="muted">Las variantes del motor cambian la selección de anclas, las correcciones históricas y el error de industria. Ninguna de ellas repondera entrevistas individuales.</p><div id="home-cocina">Cargando…</div></details></div>
 <div class="panorama-pane" id="panorama-panel-microdatos" data-panorama-panel="microdatos" role="tabpanel" aria-labelledby="panorama-tab-microdatos" hidden>
 <details class="panel experiment panorama-secondary" open aria-labelledby="exp-heading"><summary>Experimento separado: cocina sobre respuestas del CIS</summary><span class="badge sim">Microdatos · fuera del pronóstico</span><h2 id="exp-heading">Qué cambia al trabajar con entrevistas del CIS</h2>
  <p class="muted">Cocina aplicada a <b>microdatos individuales</b> de un solo instituto (CIS). No alimenta el Motor 29N ni la matriz. La proyección de escaños es ilustrativa: ajuste proporcional sobre el mapa de 2023 y D’Hondt.</p>
  <div class="toolbar"><label>Estudio <select id="impact-cis"><option value="3411">CIS 3411 · 2023</option><option value="3415">CIS 3415 · 2023</option><option value="3582" selected>CIS 3582 · 2026</option></select></label><label>Procedimiento <select id="impact-recipe"><option value="decided">Ponderación + solo decididos</option><option value="sympathy">Ponderación + voto o simpatía</option><option value="turnout">Ponderación + decididos + participación</option></select></label></div>
  <div id="impact-recipe-output" class="impact-visual" aria-live="polite">Recalculando…</div>
  <p class="muted"><a href="construye-estimacion.html">Construye una estimación, decisión a decisión →</a> · <a href="tutorial-estimacion.html">Tutorial</a> · <a href="metodo-evidencia.html">Por qué cambia la estimación</a> · <a href="#cocina">Cocina electoral →</a> · <a href="#laboratorio">Laboratorio D’Hondt →</a></p></details></div></section>`;
}

function drawForecastLead(ctx){
 const el=document.querySelector('#forecast-lead-results');if(!el)return;
 const p=ctx.forecast?.principal;
 if(!p?.partidos||!Object.keys(p.partidos).length){
  el.innerHTML='<p class="empty">No existe una estimación publicada para este corte. No se muestran cifras sustitutas ni resultados de 2023 como pronóstico.</p>';
  return;
 }
 const parties=Object.entries(p.partidos)
  .filter(([,v])=>Array.isArray(v?.voto)&&Array.isArray(v?.escanos)&&Number.isFinite(v.voto[0])&&Number.isFinite(v.escanos[0]))
  .sort((a,b)=>b[1].escanos[0]-a[1].escanos[0]);
 const major=parties.slice(0,8);
 const first=parties[0];
 const blocks=['PP+VOX','PSOE+SUMAR+PODEMOS'].map(id=>[id,p.bloques?.[id]]).filter(([,b])=>b&&Number.isFinite(b.mediana));
 const bName=id=>BLOCKS.find(b=>b.id===id)?.label||id.replaceAll('+',' + ');
 const caution=new Set(p.sin_encuestas||[]);
 el.innerHTML=`
 <div class="forecast-lead-status"><span>Corte: <b>${h(fdate(ctx.forecast.corte))}</b></span><span>${h(ctx.entradas??'—')} estudios utilizados</span><span>Mayoría absoluta: <b>176 escaños</b></span></div>
 <div class="forecast-lead-content"><div class="forecast-lead-side"><div class="forecast-lead-overview">
  <div class="forecast-lead-winner"><span class="eyebrow">Primera fuerza · mediana de escaños</span><strong>${h(PARTIES.find(x=>x.id===first?.[0])?.label||first?.[0]||'—')}</strong><div><b>${fmt(first?.[1]?.escanos?.[0]??0,0)}</b> escaños <small>90 %: ${fmt(first?.[1]?.escanos?.[1]??0,0)}–${fmt(first?.[1]?.escanos?.[2]??0,0)}</small></div><p>Estimación de primera fuerza por mediana, no probabilidad de formar Gobierno.</p></div>
  <div class="forecast-lead-blocs"><h3>Bloques y mayoría absoluta: 176</h3>${blocks.map(([id,b])=>`<div class="forecast-lead-bloc"><span>${h(bName(id))}</span><b>${fmt(b.mediana,0)} <small>escaños</small></b><span class="forecast-lead-prob">${Number.isFinite(b.p_mayoria)?fmt(100*b.p_mayoria,0)+' % de simulaciones con 176 o más':'Probabilidad no disponible'}</span></div>`).join('')||'<p class="muted">Sin estimación de bloques disponible.</p>'}</div>
 </div></div>
 <div class="table-wrap forecast-lead-table-holder"><table class="forecast-lead-table"><caption>Estimación por partido. Mediana e intervalo del 90 % del modelo.</caption><thead><tr><th scope="col">Partido</th><th scope="col">Voto estimado</th><th scope="col">Escaños estimados</th></tr></thead><tbody>${major.map(([id,v])=>`<tr><th scope="row">${h(PARTIES.find(x=>x.id===id)?.label||id)}${caution.has(id)?' <small class="warn">sin encuestas propias</small>':''}</th><td><b>${fmt(v.voto[0])} %</b><small>${fmt(v.voto[1])}–${fmt(v.voto[2])} %</small></td><td><strong>${fmt(v.escanos[0],0)}</strong><small>${fmt(v.escanos[1],0)}–${fmt(v.escanos[2],0)}</small></td></tr>`).join('')}</tbody></table></div></div>
 <p class="muted forecast-lead-foot">Pronóstico condicionado a las fuentes y supuestos del modelo. ${h(p.n??'—')} simulaciones; los intervalos expresan incertidumbre, no garantías. ${parties.length>major.length?`Se muestran ${major.length} de ${parties.length} candidaturas; <a href="#pronostico">ver todas</a>.`:' '} <a href="#metodologia">Metodología y fuentes</a>.</p>`;
}


function drawEditorial(ctx){
 const el=document.querySelector('#panorama-editorial');if(!el)return;
 const p=ctx.forecast?.principal;
 if(!p?.partidos||!ctx.prom){el.textContent='No hay datos suficientes para comparar el promedio con el pronóstico; no se fabrican conclusiones.';return;}
 const name=id=>PARTIES.find(x=>x.id===id)?.label||id;
 const es=Object.entries(p.partidos).filter(([,r])=>Number.isFinite(r?.escanos?.[0])).sort((a,b)=>b[1].escanos[0]-a[1].escanos[0]);
 const first=es[0],second=es[1],bloc=p.bloques?.['PP+VOX'];
 const ds=['PP','PSOE','VOX','SUMAR'].flatMap(id=>{
  const a=ctx.prom.partidos[id]?.valor,b=p.partidos[id]?.voto?.[0];
  return Number.isFinite(a)&&Number.isFinite(b)?[{id,a,b,d:b-a}]:[];
 }).sort((a,b)=>Math.abs(b.d)-Math.abs(a.d));
 const winner=first?name(first[0])+' encabeza la estimación central con '+fmt(first[1].escanos[0],0)+' escaños'+(second?', frente a '+fmt(second[1].escanos[0],0)+' de '+name(second[0]):'')+'.':'No hay escaños comparables.';
 const majority=Number.isFinite(bloc?.p_mayoria)?'PP + Vox logra al menos 176 en '+fmt(bloc.p_mayoria*100,0)+' % de las simulaciones. Esto no es la probabilidad de un pacto.':'No hay probabilidad simulada de mayoría.';
 const d=ds[0],compare=d?'La mayor diferencia entre el promedio seleccionado y el pronóstico, entre los cuatro partidos principales con datos, es '+name(d.id)+': '+fmt(d.a)+' % publicado frente a '+fmt(d.b)+' % estimado ('+signed(d.d)+' pp). No demuestra qué método acertará.':'Los datos no permiten contrastar los principales partidos.';
 el.innerHTML='<p><b>Lectura.</b> '+h(winner)+' '+h(majority)+'</p><p><b>Contraste.</b> '+h(compare)+'</p><p class="panorama-editorial-note">Promedio: '+ctx.prom.estudios.filter(x=>x.weight>0).length+' estudios seleccionados. Motor: '+h(ctx.entradas??'—')+' entradas. Las noticias y los experimentos con microdatos no se cuentan como encuestas.</p>';
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
 let lastType='partido';
 const body=m.rows.map((r,i)=>{
  const sep=r.tipo!==lastType?`<tr class="row-sep"><th colspan="${m.columns.length+1+(diffCol?1:0)}" scope="rowgroup">Bloques · ${h(BLOCK_NOTE)}</th></tr>`:'';lastType=r.tipo;
  const dv=diffs[i][compare];
  const diff=diffCol?`<td class="diff">${dv==null?'<span aria-hidden="true">—</span><span class="vh">Sin diferencia calculable</span>':signed(dv,state.vista==='voto'?1:0)}</td>`:'';
  return `${sep}<tr class="${r.tipo}"><th scope="row">${h(r.label)}${r.aviso&&r.tipo==='partido'?`<small class="warn" title="${h(r.aviso)}">equivalencia de etiquetas ⓘ</small>`:''}</th>${r.cells.map((c,j)=>cellHTML(c,j===refIdx)).join('')}${diff}</tr>`;
 }).join('');
 table.innerHTML=`<caption class="vh">Comparación de capas · vista ${h(state.vista)}</caption>${head}<tbody>${body}</tbody>`;
 const sumar=PARTIES.find(p=>p.id==='SUMAR');
 const labels=ctx.prom.partidos.SUMAR?.etiquetas?.join(', ');
 document.querySelector('#matrix-notes').innerHTML=`<ul>
  <li><b>Capa 1</b>: estudios usados ${ctx.prom.estudios.map(e=>`${h(e.institute)} (${h(fdate(e.fieldEnd))}${state.base==='modelo'&&e.origin!=='verificada'?', '+h(e.origin):''})`).join(', ')||'ninguno'}.${ctx.prom.excluidos.length?' Excluidos por filtro: '+ctx.prom.excluidos.map(e=>h(e.institute)).join(', ')+'.':''}</li>
  <li><b>Capas 2 y 3</b>: Motor 29N con ${ctx.entradas} estudios (${Object.entries(ctx.con?.porOrigen||{}).map(([k,v])=>`${v} ${h(k)}`).join(', ')}); ${ctx.forecast?.excluidas?.length??0} registros excluidos por la puerta de calidad (<a href="#pronostico">ver motivos</a>). Intervalos del 90 % de las simulaciones. Son estimaciones condicionadas a los supuestos del modelo, no resultados.</li>
  <li><b>Capa 4</b>: no entra en nuestros cálculos. Solo se muestran los dos productores más recientes; ${ctx.ext.length>2?`<a href="#pronostico-externos">${ctx.ext.length} registrados</a>`:'todos los registrados'}.</li>
  <li>${h(sumar.aviso)}${labels?' Etiquetas en la selección: '+h(labels)+'.':''}</li>
  ${state.vista==='cambio'?`<li>Cambio respecto al corte del ${h(fdate(ctx.forecast?.corte_anterior?.fecha))}. La capa 3 compara dos entradas del historial calculadas con el mismo método${ctx.forecast?.corte_anterior?.cambio_metodo?'; <b>entre ambos cortes cambió la versión del modelo</b>, así que parte de la variación es metodológica':''}.</li>`:''}
 </ul>`;
 document.querySelector('#matrix-sub').textContent=`Corte ${fdate(ctx.corte)}. «—» significa que la capa no publica o no calcula ese valor; nunca se sustituye por cero.`;
}
function drawBlocks(ctx){
 const el=document.querySelector('#home-blocks');if(!el)return;
 if(!ctx.con){el.textContent='Pronóstico no disponible.';return;}
 el.innerHTML=BLOCKS.map(b=>{const x=ctx.con.bloques[b.id];if(!x?.escanos)return '';const [m,lo,hi]=x.escanos;
  return `<article class="block-card"><h3>${h(b.label)}</h3><div class="block-main"><strong>${fmt(m,0)}</strong><span>escaños (90 %: ${fmt(lo,0)}–${fmt(hi,0)})</span></div>
  <div class="block-track" role="img" aria-label="${fmt(m,0)} escaños; intervalo ${fmt(lo,0)} a ${fmt(hi,0)}; mayoría en 176"><span class="iv" style="left:${lo/350*100}%;width:${(hi-lo)/350*100}%"></span><span class="md" style="left:${m/350*100}%"></span><i style="left:${176/350*100}%"></i></div>
  <small>${x.p_mayoria!=null?`176 o más en el ${fmt(x.p_mayoria*100,0)} % de las simulaciones`:''}${x.voto!=null?` · voto ${fmt(x.voto,1)} % (suma de medianas)`:''}</small></article>`;}).join('');
}
function drawChanges(ctx){
 const el=document.querySelector('#home-changes');if(!el)return;
 const c=ctx.forecast?.corte_anterior;
 if(!c){el.innerHTML='<p class="empty">No hay un corte anterior registrado.</p>';return;}
 const rows=['PP','PSOE','VOX','SUMAR','PODEMOS'].filter(p=>p in (c.escanos||{})).map(p=>`<tr><th scope="row">${h(PARTIES.find(x=>x.id===p)?.label||p)}</th><td>${c.voto?.[p]!=null?signed(c.voto[p],1)+' pp':'—'}</td><td>${signed(c.escanos[p],0)}</td></tr>`).join('');
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
 const pm=(k,x)=>x?.bloques?.['PP+VOX']?.p_mayoria;
 el.innerHTML=`<div class="table-wrap"><table><thead><tr><th>Partido</th><th>Sin cocina (capa 2)</th><th>Con cocina (capa 3)</th><th>Diferencia de voto</th><th>Escaños</th></tr></thead><tbody>${rows}</tbody></table></div>
 <p>PP + Vox con 176 o más: <b>${fmt(pm(0,ctx.sin)*100,0)} %</b> de las simulaciones sin cocina frente a <b>${fmt(pm(0,ctx.con)*100,0)} %</b> con cocina. La diferencia principal es nuestra corrección de la mitad del sesgo que tuvieron las encuestadoras en el 23J (${Object.entries(ctx.forecast?.principal?.correccion_industria?.puntos||{}).map(([k,v])=>`${h(PARTIES.find(p=>p.id===k)?.label||k)} ${signed(v,2)}`).join(' · ')||'no aplicada'}). <a href="#cocina-observatorio">La cocina del Observatorio, explicada →</a></p>
 <details><summary>Decisiones aplicadas y no aplicadas</summary><p><b>Tipo:</b> ${h(def?.tipo_cocina||'')}</p><ul>${(def?.decisiones||[]).map(d=>`<li>${h(d.descripcion)}${d.valor!=null?' ('+h(String(d.valor))+')':''}</li>`).join('')}</ul><p><b>No se aplica</b> (no hay datos individuales en el motor): ${h((def?.no_aplicado||[]).join(', '))}.</p><p><a href="#pronostico-cocina">Descomposición por variante →</a></p></details>`;
}
function computeLayer1(ctx){
 const polls=state.base==='modelo'?pollsFromModelInputs(ctx.forecast?.entradas):ctx.polls;
 const opts={corte:ctx.corte,ventana:state.ventana,cis:state.cis,ponderacion:state.ponderacion,semivida:14};
 ctx.prom=promedioPublicado(polls,opts);
 const prev=ctx.forecast?.corte_anterior?.fecha;
 ctx.promPrev=prev?promedioPublicado(polls,{...opts,corte:prev}):null;
}
function drawFacts(ctx){
 const days=ctx.forecast?Math.round((Date.parse(ctx.forecast.eleccion)-Date.parse(ctx.corte))/86400000):null;
 const arch=ctx.polls.filter(p=>p.kind==='poll-estimate');
 const y26=arch.filter(p=>p.fieldEnd>='2026-01-01');
 document.querySelector('#impact-cut').textContent=`CORTE ${fdate(ctx.corte).toUpperCase()}${days!=null?` · ELECCIÓN 29N EN ${days} DÍAS`:''}`;
 document.querySelector('#impact-facts').innerHTML=`
  <div><dt>Corte temporal</dt><dd>${h(fdate(ctx.corte))}<small>Encuestas publicadas hasta ese día</small></dd></div>
  <div><dt>Encuestas en el archivo verificado</dt><dd>${y26.length}<small>${new Set(y26.map(p=>p.institute)).size} institutos · 2026 (${arch.length} con 2023)</small></dd></div>
  <div><dt>Estudios en el Motor 29N</dt><dd>${ctx.entradas??'—'}<small>${Object.entries(ctx.con?.porOrigen||{}).map(([k,v])=>`${v} ${k}`).join(' · ')||'—'}</small></dd></div>
  <div><dt>Última publicación</dt><dd>${h(fdate(arch.map(p=>p.published).sort().at(-1)))}<small>Archivo verificado</small></dd></div>`;
}
function bindPanoramaTabs(root){
 const tabs=[...root.querySelectorAll('[data-panorama-tab]')];
 const activate=(name,focus=false)=>{
  for(const tab of tabs){
   const selected=tab.dataset.panoramaTab===name;
   tab.setAttribute('aria-selected',String(selected));tab.tabIndex=selected?0:-1;
  }
  for(const panel of root.querySelectorAll('[data-panorama-panel]')){
   panel.hidden=panel.dataset.panoramaPanel!==name;
  }
  if(focus)tabs.find(tab=>tab.dataset.panoramaTab===name)?.focus();
 };
 tabs.forEach((tab,index)=>{
  tab.addEventListener('click',()=>activate(tab.dataset.panoramaTab));
  tab.addEventListener('keydown',event=>{
   if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
   event.preventDefault();
   const next=event.key==='Home'?0:event.key==='End'?tabs.length-1:
    (index+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;
   activate(tabs[next].dataset.panoramaTab,true);
  });
 });
 activate('resultados');
}

export async function bindHomeImpact(polls){
 const root=document.querySelector('#impact');if(!root)return;
 bindPanoramaTabs(root);
 const ctx={polls,corte:new Date().toISOString().slice(0,10),forecast:null,sin:null,con:null,ext:[],entradas:null};
 try{
  const r=await fetch('data/modelo/pronostico.json',{cache:'no-store'});if(!r.ok)throw Error('pronóstico no publicado (HTTP '+r.status+')');
  ctx.forecast=await r.json();
  ctx.corte=ctx.forecast.corte;ctx.con=capaModelo(ctx.forecast,3);ctx.sin=capaModelo(ctx.forecast,2);ctx.ext=capasExternas(ctx.forecast);ctx.entradas=ctx.con.entradas;
 }catch(err){
  ctx.error=err.message;
  const sub=document.querySelector('#matrix-sub');if(sub)sub.textContent='Motor 29N no disponible: '+err.message+'. Solo se muestra el promedio publicado.';
 }
 if(!root.isConnected)return;
 const redraw=()=>{try{computeLayer1(ctx);drawMatrix(ctx);drawEditorial(ctx);document.querySelector('#home-counts').innerHTML=renderRecuento({forecast:ctx.forecast,archivo:polls.length,seleccion:{estudios:ctx.prom.estudios.filter(e=>e.weight>0).length,institutos:ctx.prom.institutos,detalle:`${state.ventana} días · ${state.base==='archivo'?'archivo verificado':'entradas del motor'}${state.cis?'':' · sin CIS'}`}});}catch(e){document.querySelector('#matrix-table').innerHTML=`<tbody><tr><td role="alert">No se puede calcular: ${h(e.message)}</td></tr></tbody>`;}};
 drawFacts(ctx);drawForecastLead(ctx);redraw();drawBlocks(ctx);drawChanges(ctx);drawCocina(ctx);
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
    el.innerHTML=CIS_PARTIES.map(p=>`<div class="impact-line"><span>${h(PARTIES.find(x=>x.id===p).label)}</span><div class="impact-track"><div style="width:${Math.min(100,calc.shares[p]/42*100)}%"></div></div><b>${fmt(calc.shares[p])} %</b><small>${out.seats[p]} esc. ilustrativos</small></div>`).join('')+`<p class="muted">PP + Vox: ${out.seats.PP+out.seats.VOX} escaños ilustrativos. Experimento sobre un único estudio.</p>`;
   }catch(err){el.textContent='No puede calcularse este escenario: '+err.message}
  };
  study.addEventListener('change',draw);recipe.addEventListener('change',draw);draw();
 }catch(err){const el=document.querySelector('#impact-recipe-output');if(el)el.textContent='Microdatos agregados no disponibles: '+err.message}
}

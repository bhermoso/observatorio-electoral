// Portada: corte temporal, cuatro capas inequívocas y matriz comparativa.
// Capa 3 = `principal` del Motor 29N. Ninguna variante la sustituye.
import {calculate} from './cocina-secuencial.mjs';
import {projection} from './cocina-escanos.mjs';
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
  <div><span class="impact-kicker"><i></i> <span id="impact-cut">Cargando corte…</span></span>
  <h1 id="impact-heading">Qué dicen las encuestas<br><em>y qué estima el Observatorio.</em></h1>
  <p>Cuatro capas que no se mezclan: lo que publican las encuestadoras, nuestra estimación estadística sin ajustes, nuestra estimación de referencia con cocina y lo que publican otros modelos.</p>
  <div class="impact-links"><a class="impact-primary" href="#pronostico">Pronóstico completo · Motor 29N →</a><a href="#encuestas">Encuestas y actualización</a><a href="#contexto">Acontecimientos: Urda</a></div></div>
  <dl class="impact-facts" id="impact-facts" aria-live="polite"><div><dt>Corte</dt><dd>…</dd></div></dl>
 </div>
 <ol class="layer-legend" aria-label="Las cuatro capas">${Object.entries(LAYERS).map(([k,l])=>`<li class="layer-${k}"><span class="layer-num" aria-hidden="true">${l.capa}</span><div><b>${h(l.nombre)}</b><small>${h(l.naturaleza)}</small><details><summary>¿Qué es exactamente?</summary><p>${h(l.explica)}</p></details></div></li>`).join('')}</ol>
 </section>
 <section class="panel matrix-panel" aria-labelledby="matrix-heading">
  <div class="panel-head"><div><span class="eyebrow">Comparación central</span><h2 id="matrix-heading">Partidos y bloques en las cuatro capas</h2><p class="muted" id="matrix-sub">Cargando datos…</p></div></div>
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
 </section>
 <div class="home-grid">
  <section class="panel" aria-labelledby="blocks-heading"><span class="eyebrow">Capa 3 · Estimación de referencia</span><h2 id="blocks-heading">Escaños por bloques</h2><p class="muted">${h(BLOCK_NOTE)} Mayoría absoluta: 176 de 350.</p><div id="home-blocks" class="home-blocks">Cargando…</div></section>
  <section class="panel" aria-labelledby="changes-heading"><span class="eyebrow">Corte anterior</span><h2 id="changes-heading">Qué ha cambiado</h2><div id="home-changes">Cargando…</div></section>
 </div>
 <section class="panel" aria-labelledby="cocina-heading"><span class="eyebrow">Capa 3 − capa 2</span><h2 id="cocina-heading">Qué añade la cocina del Observatorio</h2><p class="muted">Diferencia conjunta entre dos configuraciones: cambian la mezcla de variantes y el error de industria (1,5 frente a 2,2 pp). No aísla el efecto de cada ajuste ni mide un efecto político.</p><div id="home-cocina">Cargando…</div></section>
 <section class="panel experiment" aria-labelledby="exp-heading"><span class="badge sim">Experimento · fuera de las cuatro capas</span><h2 id="exp-heading">Una decisión cambia la estimación (microdatos del CIS)</h2>
  <p class="muted">Cocina aplicada a <b>microdatos individuales</b> de un solo instituto (CIS). No alimenta el Motor 29N ni la matriz. La proyección de escaños es ilustrativa: ajuste proporcional sobre el mapa de 2023 y D’Hondt.</p>
  <div class="toolbar"><label>Estudio <select id="impact-cis"><option value="3411">CIS 3411 · 2023</option><option value="3415">CIS 3415 · 2023</option><option value="3582" selected>CIS 3582 · 2026</option></select></label><label>Procedimiento <select id="impact-recipe"><option value="decided">Ponderación + solo decididos</option><option value="sympathy">Ponderación + voto o simpatía</option><option value="turnout">Ponderación + decididos + participación</option></select></label></div>
  <div id="impact-recipe-output" class="impact-visual" aria-live="polite">Recalculando…</div>
  <p class="muted"><a href="construye-estimacion.html">Construye una estimación, decisión a decisión →</a> · <a href="tutorial-estimacion.html">Tutorial</a> · <a href="metodo-evidencia.html">Por qué cambia la estimación</a> · <a href="#cocina">Cocina electoral →</a> · <a href="#laboratorio">Laboratorio D’Hondt →</a></p></section>`;
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
 <p>PP + Vox con 176 o más: <b>${fmt(pm(0,ctx.sin)*100,0)} %</b> de las simulaciones sin cocina frente a <b>${fmt(pm(0,ctx.con)*100,0)} %</b> con cocina. La configuración de referencia fija el error común de la industria en ${h(String(def?.decisiones?.find(d=>d.id==='error_industria')?.valor??'—'))} pp.</p>
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
  <div><dt>Corte temporal</dt><dd>${h(fdate(ctx.corte))}</dd><small>Encuestas publicadas hasta ese día</small></div>
  <div><dt>Encuestas en el archivo verificado</dt><dd>${y26.length}</dd><small>${new Set(y26.map(p=>p.institute)).size} institutos · 2026 (${arch.length} con 2023)</small></div>
  <div><dt>Estudios en el Motor 29N</dt><dd>${ctx.entradas??'—'}</dd><small>${Object.entries(ctx.con?.porOrigen||{}).map(([k,v])=>`${v} ${k}`).join(' · ')||'—'}</small></div>
  <div><dt>Última publicación</dt><dd>${h(fdate(arch.map(p=>p.published).sort().at(-1)))}</dd><small>Archivo verificado</small></div>`;
}
export async function bindHomeImpact(polls){
 const root=document.querySelector('#impact');if(!root)return;
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
 const redraw=()=>{try{computeLayer1(ctx);drawMatrix(ctx);}catch(e){document.querySelector('#matrix-table').innerHTML=`<tbody><tr><td role="alert">No se puede calcular: ${h(e.message)}</td></tr></tbody>`;}};
 drawFacts(ctx);redraw();drawBlocks(ctx);drawChanges(ctx);drawCocina(ctx);
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

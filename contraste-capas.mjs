// Contraste de capas (promedio publicado, motor sin y con cocina, otros modelos), cambios entre
// cortes y procedencia de las cifras. Vive en Pronóstico completo; antes estaba plegado en Panorama.
// Solo presentación: las cifras proceden de capas.mjs y del Motor 29N.
import {LAYERS,PARTIES,BLOCK_NOTE,promedioPublicado,capaModelo,capasExternas,matriz,diferencias,efectoCocina,pollsFromModelInputs} from './capas.mjs';

const h=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=(v,d=1)=>Number(v).toLocaleString('es-ES',{minimumFractionDigits:d,maximumFractionDigits:d});
const fdate=s=>s?new Date(String(s).slice(0,10)+'T12:00:00Z').toLocaleDateString('es-ES',{day:'numeric',month:'short',year:'numeric',timeZone:'Europe/Madrid'}):'—';
const signed=(v,d=1)=>(v>0?'+':v<0?'−':'±')+fmt(Math.abs(v),d);
const name=id=>PARTIES.find(x=>x.id===id)?.label||id;
const todayMadrid=()=>new Date().toLocaleDateString('sv-SE',{timeZone:'Europe/Madrid'});
const MAIN_PARTIES=5; // PP, PSOE, Vox, Sumar y Podemos: filas visibles por defecto
const state={vista:'voto',ventana:30,cis:true,ponderacion:'igual',base:'archivo',todos:false};

export function renderContraste(){
 return `<section class="panel contraste" id="pronostico-capas" aria-labelledby="matrix-heading">
  <h2 id="matrix-heading">G. Promedio, pronóstico y otros modelos</h2>
  <p class="muted" id="matrix-sub">Cargando datos…</p>
  <div class="matrix-controls">
   <fieldset class="portada-seg" id="matrix-view"><legend>Mostrar</legend>
    <label><input type="radio" name="mview" value="voto" checked> % de voto</label>
    <label><input type="radio" name="mview" value="escanos"> Escaños</label>
    <label><input type="radio" name="mview" value="cambio"> Cambio desde el corte anterior</label></fieldset>
   <div class="toolbar matrix-reglas" aria-label="Reglas del promedio publicado (capa 1)">
    <label>Ventana de campo<select id="m-window"><option value="30">30 días</option><option value="45">45 días</option><option value="90">90 días</option></select></label>
    <label>CIS<select id="m-cis"><option value="1">Con CIS</option><option value="0">Sin CIS</option></select></label>
    <label>Ponderación<select id="m-weight"><option value="igual">Igual peso por instituto</option><option value="recencia">Por recencia (semivida 14 días)</option></select></label>
    <label>Estudios<select id="m-base"><option value="archivo">Archivo verificado (data/polls.json)</option><option value="modelo">Mismas entradas que el Motor 29N</option></select></label></div>
   <p class="muted">Capa 1: último estudio de cada instituto con fin de campo dentro de la ventana y publicado antes del corte. Pesos manuales por instituto en <a href="#analisis">Promedios y proyección experimental</a>.</p>
  </div>
  <div class="table-wrap"><table class="matrix portada-matriz" id="matrix-table" data-todos="false"><caption class="vh">Comparación de capas</caption><tbody><tr><td>Cargando…</td></tr></tbody></table></div>
  <button type="button" class="portada-mas-filas" id="matrix-toggle" aria-controls="matrix-table" aria-expanded="false">Mostrar todos los partidos</button>
  <div class="panorama-editorial" id="panorama-editorial" aria-live="polite">Calculando el contraste con las encuestas…</div>
  <div id="matrix-notes" class="matrix-notes"></div>
 </section>
 <section class="panel" id="pronostico-cambios" aria-labelledby="changes-heading">
  <h2 id="changes-heading">H. Qué ha cambiado desde el corte anterior y qué añaden nuestros ajustes</h2>
  <div class="portada-dos"><section><h3>Cambios entre cortes</h3><div id="home-changes">Cargando…</div></section>
  <section><h3>Sin cocina (capa 2) y con cocina (capa 3)</h3><p class="muted">Las variantes del motor cambian la selección de anclas, las correcciones históricas y el error de industria. Ninguna repondera entrevistas individuales.</p><div id="home-cocina">Cargando…</div></section></div>
 </section>
 <section class="panel" id="pronostico-procedencia" aria-labelledby="fuentes-heading">
  <h2 id="fuentes-heading">I. De dónde sale cada cifra</h2>
  <div class="panorama-source-grid"><p><b>Promedio de encuestas:</b> agregamos estimaciones que ya publicaron los institutos. No son respuestas individuales.</p><p><b>Pronóstico propio:</b> tendencia, sesgos, calibración histórica y simulación de escaños; utiliza estimaciones publicadas, no microdatos.</p><p><b>Cocina sobre microdatos:</b> experimentos con respuestas del CIS; no alimentan este pronóstico.</p><p><b>Noticias y otros modelos:</b> pistas para verificar originales y comparadores externos, nunca encuestas añadidas automáticamente.</p></div>
  <ol class="layer-legend" aria-label="Las cuatro capas">${Object.entries(LAYERS).map(([k,l])=>`<li class="layer-${k}"><span class="layer-num" aria-hidden="true">${l.capa}</span><div><b>${h(l.nombre)}</b> <small>${h(l.naturaleza)}</small><p>${h(l.explica)}</p></div></li>`).join('')}</ol>
  <nav class="impact-links" aria-label="Método"><a href="flujograma.html">Cómo se calcula</a><a href="como-estimamos.html">Método y validación</a><a href="#pronostico-evaluacion">Retropruebas y errores</a><a href="construye-estimacion.html#cocina-secuencia">Cocina electoral</a><a href="#encuestas">Archivo de encuestas</a></nav>
 </section>`;
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
  <li><b>Capa 4</b>: no entra en nuestros cálculos. Se muestra el registro más reciente de dos productores, el más reciente primero; ${ctx.ext.length>2?`<a href="#pronostico-externos">${ctx.ext.length} registros en total</a>`:'todos los registrados'}. «Original no consultado» indica cifras tomadas de una cita o un resumen.</li>
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

export async function bindContraste(polls){
 const root=document.querySelector('#pronostico-capas');if(!root)return;
 const ctx={polls,corte:todayMadrid(),forecast:null,sin:null,con:null,ext:[],entradas:null};
 try{
  const r=await fetch('data/modelo/pronostico.json',{cache:'no-store'});if(!r.ok)throw Error('pronóstico no publicado (HTTP '+r.status+')');
  ctx.forecast=await r.json();
  ctx.corte=ctx.forecast.corte;ctx.con=capaModelo(ctx.forecast,3);ctx.sin=capaModelo(ctx.forecast,2);ctx.ext=capasExternas(ctx.forecast);ctx.entradas=ctx.con.entradas;
 }catch(err){
  ctx.error=err.message;
  const sub=document.querySelector('#matrix-sub');if(sub)sub.textContent='Motor 29N no disponible: '+err.message+'. Solo se muestra el promedio publicado.';
 }
 if(!root.isConnected)return;
 const redraw=()=>{try{computeLayer1(ctx);drawMatrix(ctx);drawEditorial(ctx);}catch(e){document.querySelector('#matrix-table').innerHTML=`<tbody><tr><td role="alert">No se puede calcular: ${h(e.message)}</td></tr></tbody>`;}};
 redraw();drawChanges(ctx);drawCocina(ctx);
 const toggle=document.querySelector('#matrix-toggle');
 toggle?.addEventListener('click',()=>{state.todos=!state.todos;const t=document.querySelector('#matrix-table');t.dataset.todos=String(state.todos);toggle.setAttribute('aria-expanded',String(state.todos));redraw();});
 document.querySelector('#matrix-table').dataset.todos=String(state.todos);toggle?.setAttribute('aria-expanded',String(state.todos));
 document.querySelectorAll('input[name=mview]').forEach(i=>i.addEventListener('change',()=>{state.vista=i.value;redraw();}));
 const bindSel=(id,fn)=>{const el=document.querySelector(id);if(!el)return;el.addEventListener('change',()=>{fn(el.value);redraw();});};
 const sync=(id,v)=>{const el=document.querySelector(id);if(el)el.value=String(v);};
 sync('#m-window',state.ventana);sync('#m-cis',state.cis?1:0);sync('#m-weight',state.ponderacion);sync('#m-base',state.base);
 document.querySelector(`input[name=mview][value=${state.vista}]`).checked=true;
 bindSel('#m-window',v=>state.ventana=Number(v));bindSel('#m-cis',v=>state.cis=v==='1');bindSel('#m-weight',v=>state.ponderacion=v);
 bindSel('#m-base',v=>{if(v==='modelo'&&!ctx.forecast?.entradas){const s=document.querySelector('#matrix-sub');if(s)s.textContent='Las entradas del motor no están publicadas en este corte.';return;}state.base=v;});
}

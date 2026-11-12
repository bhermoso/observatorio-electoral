// Vista «Pronóstico completo» (#pronostico): la salida real del Motor 29N.
// Lee data/modelo/pronostico.json y data/modelo/historial.json. No recalcula nada.
import {renderIntervalos} from './pronostico-orden.mjs';
import {renderTiposEstimacion} from './tipos-estimacion.mjs';
import {PARTY_COLORS} from './portada-series.mjs';
import {PARTIES,BLOCKS,BLOCK_NOTE,LAYERS,capaModelo,capasExternas,efectoCocina} from './capas.mjs';
import {renderTrazabilidad,bindTrazabilidad} from './trazabilidad.mjs';
import {renderInvestidura,bindInvestidura} from './investidura.mjs';
import {renderValidationDashboard,bindValidationDashboard} from './dashboard-validacion.mjs';
import {renderRecuento} from './recuento-encuestas.mjs';
import {recientesPrimero,porTexto,antiguedad} from './orden.mjs';

const h=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=(v,d=1)=>Number.isFinite(Number(v))?Number(v).toLocaleString('es-ES',{minimumFractionDigits:d,maximumFractionDigits:d}):'—';
const signed=(v,d=1)=>Number.isFinite(v)?(v>0?'+':v<0?'−':'±')+fmt(Math.abs(v),d):'—';
const fdate=s=>s?new Date(String(s).slice(0,10)+'T12:00:00Z').toLocaleDateString('es-ES',{day:'numeric',month:'short',year:'numeric',timeZone:'Europe/Madrid'}):'—';
const label=id=>PARTIES.find(p=>p.id===id)?.label||id;
const CONTRASTE={original:['Ficha del archivo verificado','ok'],original_consultado:['Original consultado','ok'],corregido_con_original:['Corregido con el original','ok'],solo_secundaria:['Solo fuente secundaria','warn'],discrepancia_secundaria:['Secundarias discrepantes','warn'],cifras_confirmadas_sin_ficha:['Cifras del original; campo o muestra sin publicar','warn'],sin_contrastar:['Sin contrastar','warn']};
export const VARIANTS=[
 {id:'principal',nombre:'Estimación de referencia (principal)',def:'Mezcla a partes iguales de las tres variantes, con error de industria ampliado. Es la cifra que el Observatorio publica como pronóstico.'},
 {id:'consenso_privadas',nombre:'Consenso de privadas',def:'Sesgo cero = media de las casas privadas activas; el CIS no fija el nivel.'},
 {id:'consenso_todas',nombre:'Consenso de todas (capa 2, sin cocina)',def:'Sesgo cero = media de todas las casas activas, CIS incluido.'},
 {id:'calibrada_23j',nombre:'Calibrada con el 23J',def:'Cada casa parte con un sesgo igual a la mitad de su error en el 23J (PP, PSOE, Vox); sin ancla de consenso.'}
];

export function renderPronostico(comparacion=''){
 return `<div class="hero"><div><div class="eyebrow">Motor 29N · capa 3 · estimación de referencia</div><h1>Pronóstico completo.</h1><p id="fc-lead">Cargando la salida publicada del Motor 29N…</p></div><div class="hero-aside"><span class="badge sim">Estimación modelizada</span><p>Las cifras son estimaciones condicionadas a los supuestos del modelo, no resultados electorales. Intervalos del 90 % de las simulaciones.</p><a href="pronostico.html">Informe técnico completo ↗</a></div></div>
 <nav class="pr-reading-nav" aria-label="Tres niveles de lectura"><a href="#pronostico-comprender"><b>01 · Comprender</b><span>Qué pronosticamos y cómo llegamos al resultado</span></a><a href="#pronostico-comparar"><b>02 · Comparar</b><span>Variantes, bloques, evolución y proyección</span></a><a href="#pronostico-auditar"><b>03 · Auditar</b><span>Fuentes, decisiones, exclusiones y validación</span></a></nav>
 <div id="fc-error" role="alert"></div>
 <div id="fc-counts"></div>
 <section class="pr-reading-group" id="pronostico-comprender" aria-labelledby="pr-heading-comprender"><div class="pr-reading-heading"><span>01</span><div><h2 id="pr-heading-comprender">Comprender el pronóstico</h2><p>Primero, el resultado y el recorrido real del dato publicado al escaño.</p></div></div>
 <section class="panel" id="pronostico-principal"><h3>Escaños y voto por partido</h3><div id="fc-main">Cargando…</div></section>
 <section class="panel" id="pronostico-cocina"><h3>Cómo se calcula: del dato al escaño</h3><div id="fc-chain">Cargando…</div></section>
 </section>
 <details class="pr-reading-group pr-reading-disclosure" id="pronostico-comparar"><summary><span class="pr-reading-number">02</span><span><strong>Comparar estimaciones y escenarios</strong><small>Variantes de cocina, diferencias con el promedio, bloques, territorio y evolución</small></span><span class="pr-reading-action">Explorar</span></summary><div class="pr-reading-body">
 <section class="panel" id="pronostico-variantes"><h3>Cómo varía el pronóstico con otros supuestos</h3><p class="muted">Las variantes cambian el anclaje estadístico; sus diferencias no son intervalos de probabilidad.</p><div id="fc-variants">Cargando…</div></section>
 <details class="pr-reading-subdetail"><summary>Contrastar el promedio y los modelos externos, cifra a cifra</summary><p class="muted">El promedio reciente utiliza la última encuesta de cada instituto en su ventana; el motor utiliza los estudios históricos que superan su propia puerta de calidad. No son recuentos equivalentes ni se suma el promedio como entrada.</p>${comparacion}</details>
 <section class="panel" id="pronostico-bloques"><h3>Bloques y mayorías</h3><p class="muted">${h(BLOCK_NOTE)}</p><div id="fc-blocks">Cargando…</div></section>
 ${renderInvestidura()}
 <section class="panel" id="pronostico-evolucion"><h3>Evolución por cortes</h3><p class="muted">Serie retrospectiva recalculada con el método actual y las encuestas conocidas en cada fecha; no equivale a las versiones publicadas entonces. Los cambios de versión del modelo se identifican.</p><div id="fc-history">Cargando…</div></section>
 <section class="panel" id="pronostico-territorio"><h3>Proyección territorial</h3><div id="fc-territory">Cargando…</div></section>
 </div></details>
 <details class="pr-reading-group pr-reading-disclosure" id="pronostico-auditar"><summary><span class="pr-reading-number">03</span><span><strong>Auditar el resultado</strong><small>Qué datos entran, qué se excluye, parámetros, límites y evaluación histórica</small></span><span class="pr-reading-action">Explorar</span></summary><div class="pr-reading-body">
 <p class="pr-naturalezas">Estás viendo la <strong>estimación propia del Observatorio basada en estimaciones publicadas</strong>, no una reconstrucción de entrevistas individuales. Consulta el <a href="#pronostico-capas">promedio y las capas</a> solo como contraste; la cocina de microdatos se evalúa por separado.</p>
 <details class="pr-tipos"><summary>Distinguir los cuatro tipos de estimación</summary>${renderTiposEstimacion({compacto:true})}</details>
 ${renderTrazabilidad()}
 <section class="panel" id="pronostico-fuentes"><h3>Estudios usados, excluidos y motivos</h3><div id="fc-sources">Cargando…</div></section>
 <section class="panel" id="pronostico-evaluacion"><h3>Evaluación histórica de encuestas y recetas</h3><p class="muted">La auditoría temporal de promedios sobre el 23J y las pruebas retrospectivas de microdatos CIS en 2019 son ejercicios distintos. Ninguno calibra las probabilidades de mayoría del Motor 29N.</p><div id="fc-validation-publica"></div>${renderValidationDashboard()}<p class="pr-remite">Las comprobaciones con microdatos se documentan también en <a href="#cocina-cap4">Cocina · ¿Qué receta acierta?</a></p></section>
 <section class="panel" id="pronostico-externos"><h3>Otros observatorios y modelos</h3><p class="muted">${h(LAYERS.externo.explica)}</p><div id="fc-external">Cargando…</div></section>
 </div></details>`;
}

function publicValidation(f){
 const v=f.validacion_publica,g=f.geografia_publica;
 if(!v)return '<p class="muted">Aún no se ha publicado la evaluación temporal independiente del ajuste del motor.</p>';
 const rows=(v.elecciones||[]).flatMap(e=>(e.cortes||[]).map(c=>`<tr><td>${h(e.eleccion)}</td><td>${h(c.fecha)}</td><td>${fmt(c.dias_antes,0)} días</td><td>${fmt(c.n,0)}</td><td>${c.mae==null?'—':fmt(c.mae)+' pp'}</td></tr>`)).join('');
 return `<h3>Auditoría de disponibilidad: encuestas conocidas en cada fecha</h3>
 <p>Convocatorias independientes comprobadas: <b>${fmt(v.elecciones_independientes,0)}</b>. Se incluyen varios cortes de una misma elección, pero <b>no cuentan como varias elecciones</b>. Este cálculo no usa el resultado del 23J para ajustar el promedio; tampoco valida los parámetros históricos ni las probabilidades de mayoría del motor.</p>
 <div class="table-wrap"><table><thead><tr><th>Elección</th><th>Corte disponible</th><th>Antelación</th><th>Institutos</th><th>Error medio absoluto</th></tr></thead><tbody>${rows}</tbody></table></div>
 <p class="muted">Durante la veda se congela la última fecha legal de publicación. Los sondeos sin fecha documentada o con campo supuesto no se incorporan a la evaluación. ${h(v.nota||'')}</p>
 ${g?`<p><b>Proyección provincial:</b> ${h(g.mapa_base)}. Las europeas de 2024 tienen <a href="${h(g.fuente_2024)}" target="_blank" rel="noopener">datos públicos oficiales disponibles</a>, pero <b>todavía no se utilizan</b> en el pronóstico. Las candidaturas deben homologarse y la mejora necesita una comprobación fuera de muestra.</p>`:''}`;
}

function partyTable(f){return renderIntervalos(f);}
export function variantsTable(f){
 const src=id=>id==='principal'?f.principal:f.variantes?.[id];
 const ids=['PP','PSOE','VOX','SUMAR','PODEMOS'];
 const head=VARIANTS.map(v=>`<th scope="col"${v.id==='principal'?' class="ref"':''}>${h(v.nombre)}</th>`).join('');
 const rows=ids.map(id=>`<tr><th scope="row">${h(label(id))}</th>${VARIANTS.map(v=>{const x=src(v.id)?.partidos?.[id];return `<td${v.id==='principal'?' class="ref"':''}>${x?`${fmt(x.voto[0])} % · <b>${fmt(x.escanos[0],0)}</b> <small>(${fmt(x.escanos[1],0)}–${fmt(x.escanos[2],0)})</small>`:'—'}</td>`;}).join('')}</tr>`).join('');
 const brow=BLOCKS.slice(0,3).map(b=>`<tr class="bloque"><th scope="row">${h(b.label)}</th>${VARIANTS.map(v=>{const x=src(v.id)?.bloques?.[b.id];return `<td${v.id==='principal'?' class="ref"':''}>${x?`<b>${fmt(x.mediana,0)}</b> · ≥176: ${fmt(x.p_mayoria*100,0)} %`:'—'}</td>`;}).join('')}</tr>`).join('');
 const labelMetric={voto:'Porcentaje de voto',escanos:'Escaños estimados (valor central)'};
 const plot=metric=>{
  const current=ids.flatMap(id=>VARIANTS.map(v=>src(v.id)?.partidos?.[id]?.[metric]?.[0]).filter(Number.isFinite));
  if(!current.length)return '<p class="muted">Sin cifras comparables de variantes.</p>';
  const min=Math.max(0,Math.floor(Math.min(...current)-(metric==='voto'?1:5)));
  const max=Math.ceil(Math.max(...current)+(metric==='voto'?1:5));
  const span=Math.max(1,max-min);
  const at=n=>Math.max(0,Math.min(100,(n-min)/span*100)).toFixed(2)+'%';
  const details=ids.map(id=>{
   const values=VARIANTS.map(v=>({v,value:src(v.id)?.partidos?.[id]?.[metric]?.[0]})).filter(x=>Number.isFinite(x.value));
   const own=values.find(x=>x.v.id==='principal')?.value;
   const others=values.filter(x=>x.v.id!=='principal');
   const extrema=others.length?[Math.min(...others.map(x=>x.value)),Math.max(...others.map(x=>x.value))]:null;
   const tip=others.map(x=>x.v.nombre+': '+fmt(x.value,metric==='voto'?1:0)).join(' · ');
   return `<div class="pr-variant-row"><strong>${h(label(id))}</strong><div class="pr-variant-track" role="img" aria-label="${h(label(id))}: ${metric==='voto'?'porcentaje de voto':'escaños'} principal ${Number.isFinite(own)?fmt(own,metric==='voto'?1:0):'no disponible'}; otras variantes: ${h(tip||'sin datos')}">${extrema?`<span class="pr-variant-span" style="left:${at(extrema[0])};width:${Math.max(.5,(extrema[1]-extrema[0])/span*100).toFixed(2)}%"></span>`:''}${others.map(x=>`<i class="pr-variant-point" style="left:${at(x.value)}" title="${h(x.v.nombre)}: ${fmt(x.value,metric==='voto'?1:0)}"></i>`).join('')}${Number.isFinite(own)?`<b class="pr-variant-main-mark" style="left:${at(own)}" title="Estimación de referencia: ${fmt(own,metric==='voto'?1:0)}"></b>`:''}</div><span>${Number.isFinite(own)?fmt(own,metric==='voto'?1:0)+(metric==='voto'?' %':' esc.'):'—'}</span></div>`;
  }).join('');
  return `<figure class="pr-variant-plot"><figcaption>${labelMetric[metric]}</figcaption><div class="pr-variant-scale"><span>${fmt(min,metric==='voto'?1:0)}${metric==='voto'?' %':''}</span><span>${fmt(max,metric==='voto'?1:0)}${metric==='voto'?' %':''}</span></div>${details}</figure>`;
 };
 return `<div class="pr-variants-visual"><p class="pr-variants-legend"><span><i class="pr-variant-key-main"></i> Referencia vigente</span><span><i class="pr-variant-key-other"></i> Variantes alternativas</span></p>${plot('voto')}${plot('escanos')}<p class="muted">La banda horizontal abarca solo los valores centrales de las tres variantes alternativas. <b>No es un intervalo de confianza ni de probabilidad.</b> La marca oscura representa el pronóstico vigente. Los resultados de voto y escaños utilizan escalas diferentes.</p></div>
 <details class="pr-variants-detail"><summary>Ver matriz completa, intervalos y supuestos de las variantes</summary>
 <div class="table-wrap"><table class="variants"><thead><tr><th>Partido / bloque</th>${head}</tr></thead><tbody>${rows}${brow}</tbody></table></div><dl class="defs">${VARIANTS.map(v=>`<dt>${h(v.nombre)}</dt><dd>${h(v.def)}</dd>`).join('')}</dl>
 <p class="muted">Las variantes se simulan con error de industria de 1,5 pp; la referencia, con ${fmt(f.principal.industria,1)} pp. Por eso la referencia tiene intervalos más anchos y frecuencias de mayoría más prudentes.</p></details>`;
}
export function chain(f){
 const sin=capaModelo(f,2),con=capaModelo(f,3),e=efectoCocina(sin,con);
 const v=id=>f.variantes?.[id]?.partidos;
 const ids=['PP','PSOE','VOX','SUMAR'];
 const step=(n,t,d)=>`<li><span class="step-n">${n}</span><div><b>${h(t)}</b><p>${d}</p></div></li>`;
 const ps=f.promedio_simple||{};
 const dec=f.capas?.con_cocina;
 const delta=(a,b,p)=>a?.[p]&&b?.[p]?signed(a[p].voto[0]-b[p].voto[0],1):'—';
 const main='PP';
 const mainLabel=label(main);
 const vot=id=>Number.isFinite(id?.partidos?.[main]?.voto?.[0])?fmt(id.partidos[main].voto[0])+' %':'—';
 const scan=id=>Number.isFinite(id?.partidos?.[main]?.escanos?.[0])?fmt(id.partidos[main].escanos[0],0):'—';
 const numCasas=new Set((f.entradas||[]).map(x=>x.casa)).size;
 const summary=[
  ['01','Fuentes',fmt(f.entradas?.length??0,0)+' estudios',fmt(numCasas,0)+' casas; estimaciones publicadas'],
  ['02','Modelo temporal',vot(sin),mainLabel+' · tendencias y efectos de casa'],
  ['03','Cocina de agregados',vot(con),mainLabel+' · estimación operativa'],
  ['04','Escaños',scan(con),mainLabel+' · mediana de simulaciones']
 ];
 const visual=`<figure class="pr-chain-figure" aria-label="Secuencia metodológica del pronóstico"><figcaption>Del dato publicado al escaño · ejemplo: ${h(mainLabel)}</figcaption><div class="pr-chain-flow">${summary.map(([n,t,value,note])=>`<div class="pr-chain-node"><small>${n} · ${h(t)}</small><strong>${h(value)}</strong><span>${h(note)}</span></div>`).join('')}</div><p class="pr-chain-reference"><b>Comparación externa al flujo:</b> promedio descriptivo de ${h(mainLabel)}, ${Number.isFinite(ps[main])?fmt(ps[main])+' %':'—'}. Se calcula para comparar; <strong>no entra como una encuesta adicional</strong>.</p><p class="muted">El ejemplo sigue a ${h(mainLabel)}. El motor utiliza estimaciones publicadas de las casas, no el promedio como observación independiente. La cocina experimental de entrevistas individuales no alimenta esta secuencia.</p></figure>`;
 return `${visual}<details class="pr-chain-detail"><summary>Desplegar los siete pasos, cálculos y supuestos del motor</summary><ol class="chain">
  ${step(1,'Entrada original',`${f.entradas?.length??'—'} estimaciones publicadas por ${new Set((f.entradas||[]).map(e=>e.casa)).size} casas (<a href="#pronostico-fuentes">lista completa</a>). El motor recibe porcentajes publicados, no entrevistas.`)}
  ${step(2,'Promedio descriptivo',`Última encuesta de cada casa en 30 días, mismo peso: ${ids.map(p=>`${label(p)} ${fmt(ps[p])} %`).join(' · ')}.`)}
  ${step(3,'Tendencia estadística (capa 2)',`Modelo diario con efecto de casa y ancla en el consenso de todas las casas: ${ids.map(p=>`${label(p)} ${fmt(sin.partidos[p]?.voto[0])} %`).join(' · ')}.`)}
  ${step(4,'Ajustes aplicados (cocina sobre agregados)',`Excluir el CIS del ancla: ${ids.map(p=>`${label(p)} ${delta(v('consenso_privadas'),v('consenso_todas'),p)}`).join(' · ')} pp. Calibrar con el error del 23J: ${ids.map(p=>`${label(p)} ${delta(v('calibrada_23j'),v('consenso_todas'),p)}`).join(' · ')} pp. Corrección de la mitad del sesgo de las casas en el 23J: ${Object.entries(f.principal.correccion_industria?.puntos||{}).map(([p,v])=>`${label(p)} ${signed(v,2)}`).join(' · ')||'no aplicada'} pp. Mezcla de las tres variantes y error de industria ${fmt(f.principal.industria,1)} pp. <a href="#cocina-observatorio">Por qué</a>.`)}
  ${step(5,'Estimación resultante (capa 3)',`${ids.map(p=>`${label(p)} ${fmt(con.partidos[p]?.voto[0])} % (${signed(e[p]?.voto,1)} pp frente a la capa 2)`).join(' · ')}.`)}
  ${step(6,'Reparto territorial',`Cada simulación traslada el voto nacional a las 52 circunscripciones en proporción a la geografía del 23J, con ruido provincial (lognormal, sd 0,08).`)}
  ${step(7,'Escaños',`D’Hondt provincial en cada simulación: ${ids.map(p=>`${label(p)} ${fmt(con.partidos[p]?.escanos[0],0)}`).join(' · ')} (medianas).`)}
 </ol></details>
 <p><b>Lo que no hace el motor:</b> ${h((dec?.no_aplicado||[]).join(', '))}. ${h(dec?.tipo_cocina||'')} La cocina propia sobre microdatos del CIS se examinó frente al 23J y no lo supera, por eso no entra (<a href="#cocina-cap5">ver la receta y su error</a>).</p>
 ${f.sensibilidad_cocina?.experimentos?`<details class="pr-chain-detail pr-sensibilidad"><summary>Auditar sensibilidad: qué pasa si se retira una decisión (${f.sensibilidad_cocina.experimentos.length} pruebas)</summary><div><h3>Qué pasa si se retira una decisión (${f.sensibilidad_cocina.experimentos.length} experimentos)</h3><div class="table-wrap"><table><thead><tr><th>Experimento</th><th>PP</th><th>PSOE</th><th>Vox</th><th>PP+Vox (escaños)</th><th>Δ frecuencia ≥176</th></tr></thead><tbody>${f.sensibilidad_cocina.experimentos.map(x=>`<tr><th scope="row">${h(x.nombre)}</th>${['PP','PSOE','VOX'].map(p=>`<td>${signed(x.comparacion?.cambio_voto_pp?.[p],2)} pp</td>`).join('')}<td>${signed(x.comparacion?.bloques?.['PP+VOX']?.cambio_mediana_escanos,0)}</td><td>${signed(x.comparacion?.bloques?.['PP+VOX']?.cambio_frecuencia_umbral_puntos,1)} pts</td></tr>`).join('')}</tbody></table></div><p class="muted">${h(f.sensibilidad_cocina.tipo||'')}. ${fmt(f.sensibilidad_cocina.n_por_variante,0)} simulaciones por variante: diferencias pequeñas pueden ser ruido.</p></div></details>`:''}`;
}
function blocks(f){
 const p=f.principal;
 return `<div class="home-blocks">${BLOCKS.map(b=>{const x=p.bloques?.[b.id];if(!x)return '';const votes=b.parties.map(id=>p.partidos[id]?.voto?.[0]);
  return `<article class="block-card"><h3>${h(b.label)}</h3><div class="block-main"><strong>${fmt(x.mediana,0)}</strong><span>escaños (90 %: ${fmt(x.p5,0)}–${fmt(x.p95,0)})</span></div><div class="block-track" role="img" aria-label="Intervalo ${fmt(x.p5,0)} a ${fmt(x.p95,0)}; mayoría en 176"><span class="iv" style="left:${x.p5/350*100}%;width:${(x.p95-x.p5)/350*100}%"></span><span class="md" style="left:${x.mediana/350*100}%"></span><i style="left:${176/350*100}%"></i></div><small>176 o más en el ${fmt(x.p_mayoria*100,0)} % de las simulaciones${votes.every(Number.isFinite)?` · voto ${fmt(votes.reduce((a,b)=>a+b,0))} % (suma de medianas)`:''}</small></article>`;}).join('')}</div>`;
}
export function history(hist){
 if(!Array.isArray(hist)||!hist.length)return '<p class="empty">Historial no publicado.</p>';
 const W=900,H=260,L=44,R=16,T=16,B=36,xs=hist.map((_,i)=>L+i*(W-L-R)/Math.max(1,hist.length-1));
 const series=[['PP','#2470a6'],['PSOE','#b8323f'],['VOX','#3d7f3a']];
 const max=Math.max(150,...hist.flatMap(x=>series.map(([p])=>x.escanos?.[p]?.[0]||0)))+10;
 const y=v=>T+(1-v/max)*(H-T-B);
 const lines=series.map(([p,c],k)=>`<polyline fill="none" stroke="${c}" stroke-width="2.5" ${k===1?'stroke-dasharray="7 4"':k===2?'stroke-dasharray="2 3"':''} points="${hist.map((x,i)=>`${xs[i].toFixed(1)},${y(x.escanos?.[p]?.[0]??0).toFixed(1)}`).join(' ')}"/><text x="${W-R}" y="${y(hist.at(-1).escanos?.[p]?.[0]??0)-6}" text-anchor="end" font-size="12" fill="${c}">${label(p)} ${fmt(hist.at(-1).escanos?.[p]?.[0],0)}</text>`).join('');
 const marks=hist.map((x,i)=>x.nuevas?.length?`<line x1="${xs[i]}" x2="${xs[i]}" y1="${H-B}" y2="${H-B+6}" stroke="#173331"/>`:'').join('');
 const versions=hist.map((x,i)=>i&&x.version!==hist[i-1].version?`<line x1="${xs[i]}" x2="${xs[i]}" y1="${T}" y2="${H-B}" stroke="#aa540d" stroke-dasharray="3 3"/>`:'').join('');
 const svg=`<svg viewBox="0 0 ${W} ${H}" class="history-svg" role="img" aria-label="Escaños medianos de PP, PSOE y Vox por día de corte">${[0,50,100,150].map(v=>`<line x1="${L}" x2="${W-R}" y1="${y(v)}" y2="${y(v)}" stroke="#e1e9e4"/><text x="${L-6}" y="${y(v)+4}" text-anchor="end" font-size="11" fill="#60736e">${v}</text>`).join('')}${versions}${lines}${marks}<text x="${L}" y="${H-8}" font-size="11" fill="#60736e">${fdate(hist[0].fecha)}</text><text x="${W-R}" y="${H-8}" text-anchor="end" font-size="11" fill="#60736e">${fdate(hist.at(-1).fecha)}</text></svg>`;
 const rows=[...hist].reverse().filter((x,i)=>i===0||x.nuevas?.length).slice(0,15).map((x,i,arr)=>`<tr><td>${h(fdate(x.fecha))}</td><td>${x.n_encuestas}</td><td>${['PP','PSOE','VOX'].map(p=>`${label(p)} ${fmt(x.escanos?.[p]?.[0],0)}`).join(' · ')}</td><td>${fmt(x.bloques?.['PP+VOX']?.mediana,0)} · ${fmt((x.bloques?.['PP+VOX']?.p_mayoria||0)*100,0)} %</td><td>${h((x.nuevas||[]).join(', ')||'—')}</td><td>${h(x.version||'1')}</td></tr>`).join('');
 const ultima=hist.at(-1);
 const indicador=`<div class="pr-history-summary">${series.map(([p,color])=>`<div class="pr-history-item"><i style="background:${color}"></i><span>${h(label(p))}</span><strong>${fmt(ultima.escanos?.[p]?.[0],0)}</strong><small>escaños · último corte</small></div>`).join('')}</div>`;
 return `${indicador}<div class="chart-wrap">${svg}</div><p class="muted">Línea continua PP, discontinua PSOE, punteada Vox. Marcas en el eje: días con estudios nuevos. Línea naranja vertical: cambio de versión del modelo. Las variaciones entre versiones del motor no deben interpretarse solo como cambios de opinión.</p><details class="pr-history-detail"><summary>Consultar cortes, encuestas nuevas y versiones del motor</summary><div class="table-wrap"><table><caption>Días con estudios nuevos (más reciente primero)</caption><thead><tr><th>Corte</th><th>Estudios</th><th>Escaños (mediana)</th><th>PP+Vox · ≥176</th><th>Estudios nuevos</th><th>Versión</th></tr></thead><tbody>${rows}</tbody></table></div></details>`;
}
export function territory(f){
 const pr=f.principal?.provincias;
 if(!Array.isArray(pr))return '<p class="empty">El reparto provincial no está publicado en este corte.</p>';
 const geo=f.geo_sensibilidad;
 const rows=pr.map(x=>`<tr><th scope="row">${h(x.provincia)}</th><td>${x.escanos}</td><td>${Object.entries(x.reparto).sort((a,b)=>b[1]-a[1]).map(([p,v])=>`${h(label(p))} ${fmt(v,1)}`).join(' · ')}</td></tr>`).join('');
 // Lectura inicial concentrada: las 12 circunscripciones de mayor magnitud.
 // Los 52 repartos continúan disponibles abajo, sin descartar partidos.
 const grandes=[...pr].sort((a,b)=>b.escanos-a.escanos||String(a.provincia).localeCompare(String(b.provincia),'es')).slice(0,12);
 const resumen=`<figure class="pr-territory-summary" aria-label="Reparto medio simulado en las doce circunscripciones de mayor magnitud">
 <figcaption>Doce circunscripciones de mayor magnitud · escaños medios simulados</figcaption>
 <div class="pr-territory-legend">${['PP','PSOE','VOX','SUMAR','PODEMOS'].map(p=>`<span><i style="background:${PARTY_COLORS[p]}"></i>${h(label(p))}</span>`).join('')}<span>Otros: colores según candidatura</span></div>
 ${grandes.map(x=>{const rep=Object.entries(x.reparto||{}).filter(([,v])=>Number.isFinite(v)&&v>0).sort((a,b)=>b[1]-a[1]);
  const suma=rep.reduce((n,[,v])=>n+v,0);
  const info=rep.map(([p,v])=>`${label(p)} ${fmt(v,1)}`).join(' · ');
  return `<div class="pr-territory-row"><strong>${h(x.provincia)}</strong><div class="pr-territory-track" role="img" aria-label="${h(x.provincia)}: ${h(info)}">${rep.map(([p,v])=>`<i style="width:${(100*v/Math.max(suma,x.escanos,1)).toFixed(2)}%;background:${PARTY_COLORS[p]||'#9aa5a0'}" title="${h(label(p))}: ${fmt(v,1)}"></i>`).join('')}</div><span>${fmt(x.escanos,0)} esc.</span></div>`}).join('')}
 <p class="muted">Segmentos: escaños medios de cada partido; no son resultados provinciales observados. Las provincias pequeñas y el detalle de todas las candidaturas se conservan abajo.</p></figure>`;

 return `<div class="notice"><b>Qué está estimado y qué no.</b> El voto nacional procede del modelo. Su distribución entre provincias reproduce la geografía relativa del 23J con ruido aleatorio; no hay encuestas provinciales en el motor. Los valores son escaños medios de las simulaciones, por eso tienen decimales.</div>
 ${geo?`<p>Sensibilidad al método de traslado: con traslado uniforme (mismos puntos en todas las provincias) PP + Vox llegan a 176 en el ${fmt((geo.p_mayoria?.uniforme||0)*100,0)} % de las simulaciones, frente al ${fmt((geo.p_mayoria?.proporcional||0)*100,0)} % del traslado proporcional usado. ${['PP','PSOE','VOX'].map(p=>`${label(p)}: ${fmt(geo.proporcional?.[p]?.[0],0)} → ${fmt(geo.uniforme?.[p]?.[0],0)}`).join(' · ')}.</p>`:''}
 ${resumen}
 <details class="pr-territory-detail"><summary>Explorar las ${pr.length} circunscripciones y todas las candidaturas</summary>
 <div class="pr-provincias" aria-label="Escaños medios simulados en las ${pr.length} circunscripciones">${pr.map(x=>{const rep=Object.entries(x.reparto).sort((a,b)=>b[1]-a[1]);const todo=rep.map(([p,v])=>`${label(p)} ${fmt(v,1)}`).join(' · ');return `<div class="pr-prov" title="${h(todo)}"><div class="pr-prov-cab"><b>${h(x.provincia)}</b><span>${x.escanos}</span></div><div class="pr-prov-barra" role="img" aria-label="${h(x.provincia)}: ${h(todo)}">${rep.filter(([,v])=>v>0).map(([p,v])=>`<i style="width:${(v/x.escanos*100).toFixed(2)}%;background:${PARTY_COLORS[p]||'#9aa5a0'}"></i>`).join('')}</div><small>${rep.filter(([,v])=>v>=0.5).map(([p,v])=>`${h(label(p))} ${fmt(v,1)}`).join(' · ')}</small></div>`;}).join('')}</div></details>
 <p class="muted">Cada tarjeta: escaños en juego y reparto medio simulado; el texto muestra los partidos con medio escaño o más y el reparto completo aparece al pasar el cursor.</p>
 <p class="muted">La proyección experimental de <a href="#analisis">Promedios</a> es otro cálculo (promedio + ajuste proporcional) y no es este pronóstico.</p>`;
}
function sources(f){
 const ent=[...(f.entradas||[])].sort(recientesPrimero({fin:e=>e.campo_fin,pub:e=>e.publicacion,casa:e=>e.casa}));
 const exc=[...(f.excluidas||[])].sort((a,b)=>porTexto(a.casa,b.casa)||porTexto(a.estudio,b.estudio));
 const edad=e=>antiguedad(e.campo_fin,f.corte);
 const antiguos=ent.filter(e=>edad(e).dias>60);
 const sv=f.sensibilidad_fuentes;
 return `<p>${ent.length} estudios entran en el pronóstico (${Object.entries(f.auditoria_fuentes?.por_origen||{}).map(([k,v])=>`${v} ${h(k)}`).join(', ')}). ${exc.length} se excluyen. Criterio: ${h(f.auditoria_fuentes?.criterio||'')}.</p>
 <ul class="pr-notas">
  <li><b>Orden y antigüedad.</b> Del fin de campo más reciente al más antiguo; «antigüedad» son los días hasta el corte del ${h(fdate(f.corte))}. El motor sitúa cada estudio en el día central de su campo y deja que la intención cambie de un día a otro: cuanto más antiguo, menos pesa.${antiguos.length?` Con más de dos meses: ${antiguos.map(e=>`${h(e.casa)} (${h(edad(e).texto)})`).join(', ')}.`:''}</li>
  <li><b>Origen.</b> «verificada»: ficha del archivo del Observatorio con original consultado. «terceros-29n»: registro de un repositorio externo que enlaza la publicación; puede no incluir toda la ficha técnica. «prensa-original-consultado»: cifras confirmadas en el original, campo o muestra sin publicar.</li>
  <li><b>Supuestos.</b> Sin fecha de publicación, fin de campo + 2 días. Sin muestra, n = 1000, marcada «supuesta». La correlación entre bloques (0,5) es un supuesto, no una estimación.</li>
 </ul>
 <div class="table-wrap"><table class="fc-estudios"><caption>Estudios usados</caption><thead><tr><th>Casa</th><th>Campo</th><th>Antigüedad al corte</th><th>Publicación</th><th>Muestra</th><th>Origen</th><th>Contraste con el original</th><th>PP · PSOE · Vox</th><th>Ancla</th></tr></thead><tbody>${ent.map(e=>`<tr><td>${e.url?`<a href="${h(e.url)}" target="_blank" rel="noopener">${h(e.casa)}</a>`:h(e.casa)}</td><td>${h(e.campo_ini?fdate(e.campo_ini)+' – ':'')}${h(fdate(e.campo_fin))}</td><td class="${edad(e).dias>60?'warn fc-antiguo':''}">${h(edad(e).texto)}</td><td>${h(fdate(e.publicacion))}</td><td>${fmt(e.n,0)}${e.n_supuesto?' (supuesta)':''}</td><td>${h(e.origen)}</td><td class="${CONTRASTE[e.contraste]?.[1]||'warn'}">${e.contraste_url?`<a href="${h(e.contraste_url)}" target="_blank" rel="noopener">${h(CONTRASTE[e.contraste]?.[0]||e.contraste||'—')}</a>`:h(CONTRASTE[e.contraste]?.[0]||e.contraste||'—')}</td><td>${['PP','PSOE','VOX'].map(p=>fmt(e.voto?.[p])).join(' · ')}</td><td>${e.ancla_privadas?'privadas':'—'}</td></tr>`).join('')}</tbody></table></div>
 <div class="table-wrap"><table><caption>Estudios excluidos y motivo</caption><thead><tr><th>Casa</th><th>Registro</th><th>Origen</th><th>Motivo</th></tr></thead><tbody>${exc.map(x=>`<tr><td>${h(x.casa)}</td><td>${x.url?`<a href="${h(x.url)}" target="_blank" rel="noopener">${h(x.estudio)}</a>`:h(x.estudio)}</td><td>${h(x.origen)}</td><td>${h(x.motivo)}</td></tr>`).join('')||'<tr><td colspan="4">Ninguno</td></tr>'}</tbody></table></div>
 ${sv?`<p><b>Sensibilidad a las fuentes de terceros.</b> Con el mismo método (menos simulaciones, inicio reajustado a su selección) y solo los ${sv.n_estudios} registros verificados: ${['PP','PSOE','VOX'].map(p=>`${label(p)} ${fmt(sv.partidos?.[p]?.voto?.[0])} % (${fmt(sv.partidos?.[p]?.escanos?.[0],0)} esc.)`).join(' · ')}; PP + Vox ≥176 en el ${fmt((sv.bloques?.['PP+VOX']?.p_mayoria||0)*100,0)} % de las simulaciones.</p>`:''}`;
}
function external(f){
 const x=[...capasExternas(f)].sort((a,b)=>String(b.fecha).localeCompare(String(a.fecha))||porTexto(a.nombre,b.nombre));
 if(!x.length)return '<p class="empty">No hay modelos externos registrados.</p>';
 return `<div class="table-wrap"><table><thead><tr><th>Productor</th><th>Fecha</th><th>PP</th><th>PSOE</th><th>Vox</th><th>Sumar</th><th>Escaños publicados</th><th>Método declarado</th><th>Verificación</th></tr></thead><tbody>${x.map(r=>`<tr><td>${r.url?`<a href="${h(r.url)}" target="_blank" rel="noopener">${h(r.nombre)}</a>`:h(r.nombre)}</td><td>${h(fdate(r.fecha))}<small> ${h(r.fecha_tipo||'')}</small></td>${['PP','PSOE','VOX','SUMAR'].map(p=>`<td>${Number.isFinite(r.partidos[p])?fmt(r.partidos[p]):'—'}</td>`).join('')}<td>${Object.entries(r.escanosPartidos).map(([p,v])=>`${h(label(p))} ${v}`).join(' · ')||'—'}</td><td>${h(r.metodo||'No declarado')}</td><td class="${r.verificado?'ok':'warn'}">${r.verificado?'Original consultado':'Original no consultado'}${r.aproximado?' · aproximado':''}<small> ${h(r.notas||'')}</small></td></tr>`).join('')}</tbody></table></div>
 <p class="muted">Del registro más reciente al más antiguo. No se suman a nuestros promedios: sus encuestas pueden coincidir con las nuestras y se contarían dos veces.</p>`;
}
export async function bindPronostico(){
 const err=document.querySelector('#fc-error');if(!err)return;
 let f,hist=null;
 try{
  const r=await fetch('data/modelo/pronostico.json',{cache:'no-store'});if(!r.ok)throw Error('El pronóstico no está publicado (HTTP '+r.status+').');
  f=await r.json();if(!f.principal?.partidos)throw Error('La salida publicada no contiene la estimación principal.');
 }catch(e){err.className='error';err.textContent=e.message;document.querySelectorAll('[id^=fc-]').forEach(el=>{if(el!==err&&el.textContent==='Cargando…')el.textContent='No disponible.';});return;}
 try{const r=await fetch('data/modelo/historial.json',{cache:'no-store'});if(r.ok)hist=await r.json();}catch{}
 if(!err.isConnected)return;
 const days=Math.round((Date.parse(f.eleccion)-Date.parse(f.corte))/86400000);
 document.querySelector('#fc-lead').innerHTML=`Corte del <b>${h(fdate(f.corte))}</b> · elección objetivo: generales del <b>${h(fdate(f.eleccion))}</b> (faltan ${days} días) · versión del modelo ${h(f.version_modelo||'1')}.`;
 const set=(id,fn)=>{const el=document.querySelector(id);try{el.innerHTML=fn();}catch(e){el.textContent='No se puede mostrar: '+e.message;}};
 set('#fc-counts',()=>renderRecuento({forecast:f}));
 set('#fc-validation-publica',()=>publicValidation(f));
 set('#fc-main',()=>partyTable(f));set('#fc-variants',()=>variantsTable(f));set('#fc-chain',()=>chain(f));set('#fc-blocks',()=>blocks(f));
 set('#fc-history',()=>history(hist));set('#fc-territory',()=>territory(f));set('#fc-sources',()=>sources(f));set('#fc-external',()=>external(f));
 void bindTrazabilidad();void bindInvestidura();void bindValidationDashboard();
}

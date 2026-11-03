// Vista «Pronóstico completo» (#pronostico): la salida real del Motor 29N.
// Lee data/modelo/pronostico.json y data/modelo/historial.json. No recalcula nada.
import {PARTIES,BLOCKS,BLOCK_NOTE,LAYERS,capaModelo,capasExternas,efectoCocina} from './capas.mjs';
import {renderTrazabilidad,bindTrazabilidad} from './trazabilidad.mjs';
import {renderInvestidura,bindInvestidura} from './investidura.mjs';
import {renderValidationDashboard,bindValidationDashboard} from './dashboard-validacion.mjs';

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

export function renderPronostico(){
 return `<div class="hero"><div><div class="eyebrow">Motor 29N · capa 3 · estimación de referencia</div><h1>Pronóstico completo.</h1><p id="fc-lead">Cargando la salida publicada del Motor 29N…</p></div><div class="hero-aside"><span class="badge sim">Estimación modelizada</span><p>Las cifras son estimaciones condicionadas a los supuestos del modelo, no resultados electorales. Intervalos del 90 % de las simulaciones.</p><a href="pronostico.html">Informe técnico completo ↗</a></div></div>
 <nav class="subnav" aria-label="Secciones del pronóstico"><a href="#pronostico-principal">Principal</a><a href="#pronostico-variantes">Variantes</a><a href="#pronostico-cocina">Cocina y trazabilidad</a><a href="#pronostico-bloques">Bloques</a><a href="#pronostico-evolucion">Evolución</a><a href="#pronostico-territorio">52 circunscripciones</a><a href="#pronostico-fuentes">Estudios usados y excluidos</a><a href="#pronostico-evaluacion">Evaluación 23J</a><a href="#pronostico-externos">Otros modelos</a></nav>
 <div id="fc-error" role="alert"></div>
 <section class="panel" id="pronostico-principal"><h2>A. Pronóstico principal</h2><div id="fc-main">Cargando…</div></section>
 <section class="panel" id="pronostico-variantes"><h2>B. Variantes del modelo</h2><p class="muted">La diferencia entre variantes es incertidumbre de método: depende de qué casas fijan el «sesgo cero». Ninguna variante sustituye a la estimación de referencia.</p><div id="fc-variants">Cargando…</div></section>
 <section class="panel" id="pronostico-cocina"><h2>C. Cocina y trazabilidad: del dato al escaño</h2><div id="fc-chain">Cargando…</div></section>
 ${renderTrazabilidad()}
 <section class="panel" id="pronostico-bloques"><h2>D. Bloques</h2><p class="muted">${h(BLOCK_NOTE)}</p><div id="fc-blocks">Cargando…</div></section>
 ${renderInvestidura()}
 <section class="panel" id="pronostico-evolucion"><h2>E. Evolución por cortes</h2><p class="muted">Serie retrospectiva recalculada con el método actual y las encuestas disponibles en cada corte; no es un archivo de lo que se publicó entonces. La versión 2 (3-nov-2026) recalculó toda la serie; para recuperar versiones anteriores hay que consultar el historial del repositorio. Las entradas con otra versión del modelo se señalan: su diferencia no es solo cambio en los datos.</p><div id="fc-history">Cargando…</div></section>
 <section class="panel" id="pronostico-territorio"><h2>F. Proyección territorial</h2><div id="fc-territory">Cargando…</div></section>
 <section class="panel" id="pronostico-fuentes"><h2>Estudios usados y excluidos</h2><div id="fc-sources">Cargando…</div></section>
 <section class="panel" id="pronostico-evaluacion"><h2>Evaluación frente al 23J</h2><p class="muted">Única elección evaluada. No es una validación independiente entre convocatorias.</p>${renderValidationDashboard()}</section>
 <section class="panel" id="pronostico-externos"><h2>Capa 4 · Otros observatorios y modelos</h2><p class="muted">${h(LAYERS.externo.explica)}</p><div id="fc-external">Cargando…</div></section>`;
}

function partyTable(f){
 const p=f.principal,sin=new Set(p.sin_encuestas||[]);
 const rows=Object.entries(p.partidos).sort((a,b)=>b[1].escanos[0]-a[1].escanos[0]).map(([id,x])=>`<tr><th scope="row">${h(label(id))}${sin.has(id)?' <small class="warn">sin encuestas · hipótesis 23J</small>':''}</th><td><b>${fmt(x.voto[0])} %</b> <small>${fmt(x.voto[1])}–${fmt(x.voto[2])}</small></td><td><b>${fmt(x.escanos[0],0)}</b> <small>${fmt(x.escanos[1],0)}–${fmt(x.escanos[2],0)}</small></td><td>${x.primero>0?fmt(x.primero*100,0)+' %':'—'}</td></tr>`).join('');
 return `<div class="table-wrap"><table><caption>Mediana e intervalo del 90 % de ${fmt(p.n,0)} simulaciones. Error de industria ${fmt(p.industria,1)} pp para un partido del 25 %.</caption><thead><tr><th>Partido</th><th>Voto</th><th>Escaños</th><th>Primera fuerza en simulaciones</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}
function variantsTable(f){
 const src=id=>id==='principal'?f.principal:f.variantes?.[id];
 const ids=['PP','PSOE','VOX','SUMAR','PODEMOS'];
 const head=VARIANTS.map(v=>`<th scope="col"${v.id==='principal'?' class="ref"':''}>${h(v.nombre)}</th>`).join('');
 const rows=ids.map(id=>`<tr><th scope="row">${h(label(id))}</th>${VARIANTS.map(v=>{const x=src(v.id)?.partidos?.[id];return `<td${v.id==='principal'?' class="ref"':''}>${x?`${fmt(x.voto[0])} % · <b>${fmt(x.escanos[0],0)}</b> <small>(${fmt(x.escanos[1],0)}–${fmt(x.escanos[2],0)})</small>`:'—'}</td>`;}).join('')}</tr>`).join('');
 const brow=BLOCKS.slice(0,3).map(b=>`<tr class="bloque"><th scope="row">${h(b.label)}</th>${VARIANTS.map(v=>{const x=src(v.id)?.bloques?.[b.id];return `<td${v.id==='principal'?' class="ref"':''}>${x?`<b>${fmt(x.mediana,0)}</b> · ≥176: ${fmt(x.p_mayoria*100,0)} %`:'—'}</td>`;}).join('')}</tr>`).join('');
 return `<div class="table-wrap"><table class="variants"><thead><tr><th>Partido / bloque</th>${head}</tr></thead><tbody>${rows}${brow}</tbody></table></div><dl class="defs">${VARIANTS.map(v=>`<dt>${h(v.nombre)}</dt><dd>${h(v.def)}</dd>`).join('')}</dl>
 <p class="muted">Las variantes se simulan con error de industria de 1,5 pp; la referencia, con ${fmt(f.principal.industria,1)} pp. Por eso la referencia tiene intervalos más anchos y frecuencias de mayoría más prudentes.</p>`;
}
function chain(f){
 const sin=capaModelo(f,2),con=capaModelo(f,3),e=efectoCocina(sin,con);
 const v=id=>f.variantes?.[id]?.partidos;
 const ids=['PP','PSOE','VOX','SUMAR'];
 const step=(n,t,d)=>`<li><span class="step-n">${n}</span><div><b>${h(t)}</b><p>${d}</p></div></li>`;
 const ps=f.promedio_simple||{};
 const dec=f.capas?.con_cocina;
 const delta=(a,b,p)=>a?.[p]&&b?.[p]?signed(a[p].voto[0]-b[p].voto[0],1):'—';
 return `<ol class="chain">
  ${step(1,'Entrada original',`${f.entradas?.length??'—'} estimaciones publicadas por ${new Set((f.entradas||[]).map(e=>e.casa)).size} casas (<a href="#pronostico-fuentes">lista completa</a>). El motor recibe porcentajes publicados, no entrevistas.`)}
  ${step(2,'Promedio descriptivo',`Última encuesta de cada casa en 30 días, mismo peso: ${ids.map(p=>`${label(p)} ${fmt(ps[p])} %`).join(' · ')}.`)}
  ${step(3,'Tendencia estadística (capa 2)',`Modelo diario con efecto de casa y ancla en el consenso de todas las casas: ${ids.map(p=>`${label(p)} ${fmt(sin.partidos[p]?.voto[0])} %`).join(' · ')}.`)}
  ${step(4,'Ajustes aplicados (cocina sobre agregados)',`Excluir el CIS del ancla: ${ids.map(p=>`${label(p)} ${delta(v('consenso_privadas'),v('consenso_todas'),p)}`).join(' · ')} pp. Calibrar con el error del 23J: ${ids.map(p=>`${label(p)} ${delta(v('calibrada_23j'),v('consenso_todas'),p)}`).join(' · ')} pp. Mezcla de las tres variantes y error de industria ${fmt(f.principal.industria,1)} pp.`)}
  ${step(5,'Estimación resultante (capa 3)',`${ids.map(p=>`${label(p)} ${fmt(con.partidos[p]?.voto[0])} % (${signed(e[p]?.voto,1)} pp frente a la capa 2)`).join(' · ')}.`)}
  ${step(6,'Reparto territorial',`Cada simulación traslada el voto nacional a las 52 circunscripciones en proporción a la geografía del 23J, con ruido provincial (lognormal, sd 0,08).`)}
  ${step(7,'Escaños',`D’Hondt provincial en cada simulación: ${ids.map(p=>`${label(p)} ${fmt(con.partidos[p]?.escanos[0],0)}`).join(' · ')} (medianas).`)}
 </ol>
 <p><b>Lo que no hace el motor:</b> ${h((dec?.no_aplicado||[]).join(', '))}. ${h(dec?.tipo_cocina||'')} La cocina sobre microdatos del CIS es un experimento aparte (<a href="#cocina">Cocina</a>).</p>
 ${f.sensibilidad_cocina?.experimentos?`<details><summary>Sensibilidad: qué pasa si se retira una decisión (${f.sensibilidad_cocina.experimentos.length} experimentos)</summary><div class="table-wrap"><table><thead><tr><th>Experimento</th><th>PP</th><th>PSOE</th><th>Vox</th><th>PP+Vox (escaños)</th><th>Δ frecuencia ≥176</th></tr></thead><tbody>${f.sensibilidad_cocina.experimentos.map(x=>`<tr><th scope="row">${h(x.nombre)}</th>${['PP','PSOE','VOX'].map(p=>`<td>${signed(x.comparacion?.cambio_voto_pp?.[p],2)} pp</td>`).join('')}<td>${signed(x.comparacion?.bloques?.['PP+VOX']?.cambio_mediana_escanos,0)}</td><td>${signed(x.comparacion?.bloques?.['PP+VOX']?.cambio_frecuencia_umbral_puntos,1)} pts</td></tr>`).join('')}</tbody></table></div><p class="muted">${h(f.sensibilidad_cocina.tipo||'')}. ${fmt(f.sensibilidad_cocina.n_por_variante,0)} simulaciones por variante: diferencias pequeñas pueden ser ruido.</p></details>`:''}`;
}
function blocks(f){
 const p=f.principal;
 return `<div class="home-blocks">${BLOCKS.map(b=>{const x=p.bloques?.[b.id];if(!x)return '';const votes=b.parties.map(id=>p.partidos[id]?.voto?.[0]);
  return `<article class="block-card"><h3>${h(b.label)}</h3><div class="block-main"><strong>${fmt(x.mediana,0)}</strong><span>escaños (90 %: ${fmt(x.p5,0)}–${fmt(x.p95,0)})</span></div><div class="block-track" role="img" aria-label="Intervalo ${fmt(x.p5,0)} a ${fmt(x.p95,0)}; mayoría en 176"><span class="iv" style="left:${x.p5/350*100}%;width:${(x.p95-x.p5)/350*100}%"></span><span class="md" style="left:${x.mediana/350*100}%"></span><i style="left:${176/350*100}%"></i></div><small>176 o más en el ${fmt(x.p_mayoria*100,0)} % de las simulaciones${votes.every(Number.isFinite)?` · voto ${fmt(votes.reduce((a,b)=>a+b,0))} % (suma de medianas)`:''}</small></article>`;}).join('')}</div>`;
}
function history(hist){
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
 return `<div class="chart-wrap">${svg}</div><p class="muted">Línea continua PP, discontinua PSOE, punteada Vox. Marcas en el eje: días con estudios nuevos. Línea naranja vertical: cambio de versión del modelo.</p><div class="table-wrap"><table><caption>Días con estudios nuevos (más reciente primero)</caption><thead><tr><th>Corte</th><th>Estudios</th><th>Escaños (mediana)</th><th>PP+Vox · ≥176</th><th>Estudios nuevos</th><th>Versión</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}
function territory(f){
 const pr=f.principal?.provincias;
 if(!Array.isArray(pr))return '<p class="empty">El reparto provincial no está publicado en este corte.</p>';
 const geo=f.geo_sensibilidad;
 const rows=pr.map(x=>`<tr><th scope="row">${h(x.provincia)}</th><td>${x.escanos}</td><td>${Object.entries(x.reparto).sort((a,b)=>b[1]-a[1]).map(([p,v])=>`${h(label(p))} ${fmt(v,1)}`).join(' · ')}</td></tr>`).join('');
 return `<div class="notice"><b>Qué está estimado y qué no.</b> El voto nacional procede del modelo. Su distribución entre provincias reproduce la geografía relativa del 23J con ruido aleatorio; no hay encuestas provinciales en el motor. Los valores son escaños medios de las simulaciones, por eso tienen decimales.</div>
 ${geo?`<p>Sensibilidad al método de traslado: con traslado uniforme (mismos puntos en todas las provincias) PP + Vox llegan a 176 en el ${fmt((geo.p_mayoria?.uniforme||0)*100,0)} % de las simulaciones, frente al ${fmt((geo.p_mayoria?.proporcional||0)*100,0)} % del traslado proporcional usado. ${['PP','PSOE','VOX'].map(p=>`${label(p)}: ${fmt(geo.proporcional?.[p]?.[0],0)} → ${fmt(geo.uniforme?.[p]?.[0],0)}`).join(' · ')}.</p>`:''}
 <details><summary>Ver las ${pr.length} circunscripciones</summary><div class="table-wrap"><table><thead><tr><th>Circunscripción</th><th>Escaños</th><th>Reparto medio simulado</th></tr></thead><tbody>${rows}</tbody></table></div></details>
 <p class="muted">La proyección experimental de <a href="#analisis">Promedios</a> es otro cálculo (promedio + ajuste proporcional) y no es este pronóstico.</p>`;
}
function sources(f){
 const ent=f.entradas||[],exc=f.excluidas||[];
 const sv=f.sensibilidad_fuentes;
 return `<p>${ent.length} estudios entran en el pronóstico (${Object.entries(f.auditoria_fuentes?.por_origen||{}).map(([k,v])=>`${v} ${h(k)}`).join(', ')}). ${exc.length} se excluyen. Criterio: ${h(f.auditoria_fuentes?.criterio||'')}.</p>
 <p class="muted">«verificada» = ficha del archivo del Observatorio con original consultado. «terceros-29n» = registro de un repositorio externo que enlaza la publicación; puede no incluir toda la ficha técnica.</p>
 <p class="muted">Si no consta publicación, el motor supone fin de campo + 2 días para decidir cuándo estaba disponible. Los cargadores históricos usan n=1000 cuando falta muestra; se marca como supuesta en las entradas que conservan ese indicador. La correlación entre bloques (0,5) es un supuesto, no una estimación independiente. La sensibilidad solo verificadas conserva el método, pero usa menos simulaciones y reajusta el inicio a su selección.</p>
 <div class="table-wrap"><table><caption>Estudios usados</caption><thead><tr><th>Casa</th><th>Campo</th><th>Publicación</th><th>Muestra</th><th>Origen</th><th>Contraste con el original</th><th>PP · PSOE · Vox</th><th>Ancla</th></tr></thead><tbody>${ent.map(e=>`<tr><td>${e.url?`<a href="${h(e.url)}" target="_blank" rel="noopener">${h(e.casa)}</a>`:h(e.casa)}</td><td>${h(e.campo_ini?fdate(e.campo_ini)+' – ':'')}${h(fdate(e.campo_fin))}</td><td>${h(fdate(e.publicacion))}</td><td>${fmt(e.n,0)}${e.n_supuesto?' (supuesta)':''}</td><td>${h(e.origen)}</td><td class="${CONTRASTE[e.contraste]?.[1]||'warn'}">${e.contraste_url?`<a href="${h(e.contraste_url)}" target="_blank" rel="noopener">${h(CONTRASTE[e.contraste]?.[0]||e.contraste||'—')}</a>`:h(CONTRASTE[e.contraste]?.[0]||e.contraste||'—')}</td><td>${['PP','PSOE','VOX'].map(p=>fmt(e.voto?.[p])).join(' · ')}</td><td>${e.ancla_privadas?'privadas':'—'}</td></tr>`).join('')}</tbody></table></div>
 <div class="table-wrap"><table><caption>Estudios excluidos y motivo</caption><thead><tr><th>Casa</th><th>Registro</th><th>Origen</th><th>Motivo</th></tr></thead><tbody>${exc.map(x=>`<tr><td>${h(x.casa)}</td><td>${x.url?`<a href="${h(x.url)}" target="_blank" rel="noopener">${h(x.estudio)}</a>`:h(x.estudio)}</td><td>${h(x.origen)}</td><td>${h(x.motivo)}</td></tr>`).join('')||'<tr><td colspan="4">Ninguno</td></tr>'}</tbody></table></div>
 ${sv?`<p><b>Sensibilidad a las fuentes de terceros.</b> Con el mismo método y solo los ${sv.n_estudios} registros verificados: ${['PP','PSOE','VOX'].map(p=>`${label(p)} ${fmt(sv.partidos?.[p]?.voto?.[0])} % (${fmt(sv.partidos?.[p]?.escanos?.[0],0)} esc.)`).join(' · ')}; PP + Vox ≥176 en el ${fmt((sv.bloques?.['PP+VOX']?.p_mayoria||0)*100,0)} % de las simulaciones.</p>`:''}`;
}
function external(f){
 const x=capasExternas(f);
 if(!x.length)return '<p class="empty">No hay modelos externos registrados.</p>';
 return `<div class="table-wrap"><table><thead><tr><th>Productor</th><th>Fecha</th><th>PP</th><th>PSOE</th><th>Vox</th><th>Sumar</th><th>Escaños publicados</th><th>Método declarado</th><th>Verificación</th></tr></thead><tbody>${x.map(r=>`<tr><td>${r.url?`<a href="${h(r.url)}" target="_blank" rel="noopener">${h(r.nombre)}</a>`:h(r.nombre)}</td><td>${h(fdate(r.fecha))}<small> ${h(r.fecha_tipo||'')}</small></td>${['PP','PSOE','VOX','SUMAR'].map(p=>`<td>${Number.isFinite(r.partidos[p])?fmt(r.partidos[p]):'—'}</td>`).join('')}<td>${Object.entries(r.escanosPartidos).map(([p,v])=>`${h(label(p))} ${v}`).join(' · ')||'—'}</td><td>${h(r.metodo||'No declarado')}</td><td class="${r.verificado?'ok':'warn'}">${r.verificado?'Original consultado':'Original no consultado'}${r.aproximado?' · aproximado':''}<small> ${h(r.notas||'')}</small></td></tr>`).join('')}</tbody></table></div>
 <p class="muted">No se suman a nuestros promedios: sus encuestas pueden coincidir con las nuestras y se contarían dos veces.</p>`;
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
 set('#fc-main',()=>partyTable(f));set('#fc-variants',()=>variantsTable(f));set('#fc-chain',()=>chain(f));set('#fc-blocks',()=>blocks(f));
 set('#fc-history',()=>history(hist));set('#fc-territory',()=>territory(f));set('#fc-sources',()=>sources(f));set('#fc-external',()=>external(f));
 void bindTrazabilidad();void bindInvestidura();void bindValidationDashboard();
}

const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const day=s=>Date.parse(s+'T00:00:00Z')/86400000;
const format=s=>new Date(s+'T12:00:00Z').toLocaleDateString('es-ES',{timeZone:'Europe/Madrid'});
const labels={before:'Anterior',overlap:'Coincide con el día',after:'Posterior'};
export function validDate(s){return typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(day(s))&&new Date(day(s)*86400000).toISOString().slice(0,10)===s;}
export function validateEvents(events){
 if(!Array.isArray(events))throw Error('El registro de acontecimientos debe ser una lista');
 const ids=new Set();
 for(const e of events){
  if(!e.id||ids.has(e.id))throw Error('Acontecimiento sin identificador único');ids.add(e.id);
  if(e.kind!=='documented-event'||e.datePrecision!=='day')throw Error('Tipo o precisión de acontecimiento inválidos');
  for(const k of ['title','category','location','scope','summary','notes'])if(typeof e[k]!=='string'||!e[k].trim())throw Error(`Acontecimiento: falta ${k}`);
  if(!validDate(e.date)||!validDate(e.verified)||e.verified<e.date)throw Error('Fechas de acontecimiento inválidas');
  if(['weights','electoralEffect','partyImpact'].some(k=>k in e))throw Error('Un acontecimiento documentado no admite correcciones electorales');
  if(!Array.isArray(e.sources)||!e.sources.length)throw Error('Acontecimiento sin fuentes');
  for(const s of e.sources)if(!s.publisher||!validDate(s.published)||s.published>e.verified||new URL(s.url).protocol!=='https:')throw Error('Fuente de acontecimiento inválida');
  if(e.sources.every(s=>/^(.*\.)?(x|twitter)\.com$/.test(new URL(s.url).hostname)))throw Error('Las redes sociales no bastan para verificar un acontecimiento');
 }
 return events.length;
}
export function fieldRelation(p,eventDate){
 if(!validDate(eventDate)||!validDate(p.fieldStart)||!validDate(p.fieldEnd)||p.fieldStart>p.fieldEnd)throw Error('Intervalo de campo inválido');
 return p.fieldEnd<eventDate?'before':p.fieldStart>eventDate?'after':'overlap';
}
export function contextPolls(polls,eventDate,windowDays=30){
 if(!validDate(eventDate)||!Number.isInteger(windowDays)||windowDays<1||windowDays>365)throw Error('Ventana temporal inválida');
 const center=day(eventDate);
 return polls.filter(p=>p.kind==='poll-estimate').map(p=>({...p,relation:fieldRelation(p,eventDate)}))
  .filter(p=>day(p.fieldEnd)>=center-windowDays&&day(p.fieldStart)<=center+windowDays)
  .sort((a,b)=>a.fieldStart.localeCompare(b.fieldStart)||a.id.localeCompare(b.id));
}
export function descriptivePairs(polls,eventDate,windowDays=30){
 const groups=new Map();
 for(const p of contextPolls(polls,eventDate,windowDays)){
  // Exact metadata equality is deliberately conservative; missing methods never match.
  if(!['institute','scope','universe','mode','scenario'].every(k=>typeof p[k]==='string'&&p[k].trim()))continue;
  const key=JSON.stringify(['institute','scope','universe','mode','scenario'].map(k=>p[k]));
  if(!groups.has(key))groups.set(key,[]);groups.get(key).push(p);
 }
 const pairs=[];
 for(const records of groups.values()){
  const before=records.filter(p=>p.relation==='before').sort((a,b)=>b.fieldEnd.localeCompare(a.fieldEnd)||a.id.localeCompare(b.id))[0];
  const after=records.filter(p=>p.relation==='after').sort((a,b)=>a.fieldStart.localeCompare(b.fieldStart)||a.id.localeCompare(b.id))[0];
  if(!before||!after)continue;
  const differences=Object.keys(before.values).filter(k=>Number.isFinite(after.values[k])).map(party=>({party,before:before.values[party],after:after.values[party],points:Math.round((after.values[party]-before.values[party])*100)/100}));
  if(differences.length)pairs.push({institute:before.institute,beforeId:before.id,afterId:after.id,differences});
 }
 return pairs;
}
function timeline(records,eventDate,windowDays){
 const center=day(eventDate),position=s=>5+Math.max(0,Math.min(1,(day(s)-center+windowDays)/(2*windowDays)))*90;
 return `<div class="event-timeline"><div class="timeline-axis"><span>−${windowDays} días</span><b>Día del acontecimiento</b><span>+${windowDays} días</span></div>${records.map(p=>`<div class="timeline-row"><span>${esc(p.institute)}<small>${format(p.fieldStart)}–${format(p.fieldEnd)}</small></span><div class="timeline-track"><i class="event-marker"></i><span class="field-interval ${p.relation}" style="left:${position(p.fieldStart)}%;width:${Math.max(.7,position(p.fieldEnd)-position(p.fieldStart))}%"><span class="sr-only">${labels[p.relation]}</span></span></div></div>`).join('')}</div>`;
}
function comparison(pairs){
 if(!pairs.length)return '<p class="empty">Todavía no hay un par anterior y posterior con instituto, método, ámbito, universo y escenario coincidentes en esta ventana.</p>';
 return pairs.map(pair=>`<h3>${esc(pair.institute)}</h3><p class="muted">${esc(pair.beforeId)} → ${esc(pair.afterId)}</p><div class="table-wrap"><table><caption>Diferencia descriptiva en puntos porcentuales. No mide un efecto causal ni significación estadística.</caption><thead><tr><th>Etiqueta original</th><th>Antes</th><th>Después</th><th>Diferencia (pp)</th></tr></thead><tbody>${pair.differences.map(d=>`<tr><td>${esc(d.party)}</td><td>${d.before} %</td><td>${d.after} %</td><td>${d.points>0?'+':''}${d.points.toLocaleString('es-ES')}</td></tr>`).join('')}</tbody></table></div>`).join('');
}
export function renderEvents(events){
 return `<div class="hero"><div><div class="eyebrow">Contexto / trabajo de campo / evidencia</div><h1>Acontecimientos y encuestas.</h1><p>Consulta qué entrevistas se hicieron antes, durante o después de un hecho documentado.</p></div><div class="hero-aside"><span class="badge poll">Contexto documentado</span><p>${events.length} acontecimiento${events.length===1?'':'s'} registrado${events.length===1?'':'s'}</p></div></div><div class="notice">La fecha de publicación de una encuesta no indica cuándo se recogieron las respuestas. La coincidencia temporal permite ordenar los datos; por sí sola no demuestra que un suceso haya cambiado el voto.</div>${events.length?`<div class="toolbar"><label>Acontecimiento<select id="context-event">${[...events].sort((a,b)=>b.date.localeCompare(a.date)).map(e=>`<option value="${esc(e.id)}">${format(e.date)} · ${esc(e.title)}</option>`).join('')}</select></label><label>Ventana a cada lado<select id="context-window"><option value="14">14 días</option><option value="30" selected>30 días</option><option value="90">90 días</option></select></label><button id="export-context" class="secondary">Descargar análisis JSON ↓</button></div><div id="event-context" aria-live="polite"></div>`:'<p class="empty">No hay acontecimientos documentados.</p>'}<section class="panel event-method"><h2>Cómo se incorpora un acontecimiento</h2><p>Fecha, lugar, categoría, descripción neutral, fuentes originales y fecha de revisión. El mismo criterio se aplica a hechos favorables o desfavorables para cualquier formación. No se asignan ganadores, perdedores ni coeficientes de voto.</p><p>Las comparaciones automáticas exigen coincidencia exacta de instituto, método, ámbito, universo y escenario. Conservan las etiquetas originales de los partidos. Puede haber cambios de cuestionario, muestra o ponderación incluso si esos campos coinciden: hay que revisar ambas fichas.</p><p>Con fechas de campo expresadas por días, cualquier estudio que toque el día del suceso queda en «Coincide con el día». No conocemos qué entrevistas se realizaron antes o después de la hora concreta. No se calculan intervalos de confianza a partir de los errores generales de las fichas.</p><a href="docs/events.md">Registro y criterios de análisis →</a> · <a href="data/events.json" download>Acontecimientos JSON ↓</a> · <a href="#laboratorio">Explorar un supuesto en el laboratorio →</a></section>`;
}
export function bindEvents(events,polls){
 if(!events.length)return;
 const select=document.querySelector('#context-event'),windowSelect=document.querySelector('#context-window');
 let analysis;
 function update(){
  const event=events.find(e=>e.id===select.value),windowDays=Number(windowSelect.value),records=contextPolls(polls,event.date,windowDays),pairs=descriptivePairs(polls,event.date,windowDays);
  const count=relation=>records.filter(p=>p.relation===relation).length;
  analysis={schemaVersion:1,kind:'event-context-analysis',event,windowDays,datePrecision:'day',causalEffectEstimated:false,counts:{before:count('before'),overlap:count('overlap'),after:count('after')},polls:records,descriptivePairs:pairs};
  document.querySelector('#event-context').innerHTML=`<section class="panel"><span class="badge">${esc(event.category)}</span><h2>${esc(event.title)}</h2><p class="muted">${format(event.date)} · ${esc(event.location)} · Seguimiento: ${esc(event.scope)} · Revisado: ${format(event.verified)}</p><p>${esc(event.summary)}</p><p>${event.sources.map(s=>`<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.publisher)} · ${format(s.published)} ↗</a>`).join(' · ')}</p><details><summary>Notas de verificación</summary><p>${esc(event.notes)}</p></details></section><div class="stats"><div class="stat"><span>Campo completamente anterior</span><strong>${count('before')}</strong></div><div class="stat"><span>Campo coincidente con ese día</span><strong>${count('overlap')}</strong></div><div class="stat"><span>Campo completamente posterior</span><strong>${count('after')}</strong></div><div class="stat"><span>Ventana seleccionada</span><strong>±${windowDays}</strong><small>días naturales</small></div></div>${!count('after')?'<div class="notice">No hay estudios con campo completamente posterior dentro de la ventana y el archivo cargado. Estos datos todavía no permiten observar una reacción posterior al acontecimiento.</div>':''}<section class="panel"><h2>Cuándo se hicieron las entrevistas</h2><p class="muted">Cada barra representa el intervalo de campo, recortado a la ventana. La línea vertical marca el día del acontecimiento. No representa una evolución de intención de voto.</p>${records.length?timeline(records,event.date,windowDays):'<p class="empty">No hay estudios en esta ventana.</p>'}<div class="table-wrap"><table><caption>Estudios del archivo cuyo trabajo de campo solapa la ventana. La selección temporal incluye los ámbitos publicados; no equipara sus electorados.</caption><thead><tr><th>Instituto</th><th>Campo</th><th>Publicación</th><th>Relación temporal</th><th>Ámbito</th></tr></thead><tbody>${records.map(p=>`<tr><td><a href="${esc(p.source)}" target="_blank" rel="noopener">${esc(p.institute)} ↗</a><small>${esc(p.id)}</small></td><td>${format(p.fieldStart)}–${format(p.fieldEnd)}</td><td>${format(p.published)}</td><td>${labels[p.relation]}</td><td>${esc(p.scope)}</td></tr>`).join('')}</tbody></table></div></section><section class="panel event-method"><h2>Comparación descriptiva antes y después</h2><p class="muted">Último estudio anterior y primero posterior de cada grupo comparable. Los estudios que tocan el día del suceso no se usan en esta comparación.</p>${comparison(pairs)}</section>`;
 }
 select.onchange=update;windowSelect.onchange=update;
 document.querySelector('#export-context').onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(analysis,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download=`oee-contexto-${analysis.event.id}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 update();
}

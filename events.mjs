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

const EVENT_PARTIES=['PP','PSOE','VOX','SUMAR','PODEMOS','ERC','JUNTS'];
function eventCanonical(label){
 const k=String(label).toUpperCase().trim();
 if(k==='SUMAR / FRENTE AMPLIO'||k==='SUMAR/FA'||k==='FRENTE AMPLIO')return 'SUMAR';
 if(k==='EAJ-PNV')return 'PNV';
 if(k==='EH BILDU')return 'BILDU';
 return k;
}
function eventMeasure(p,party){
 const entries=Object.entries(p.values||{}).filter(([k,v])=>eventCanonical(k)===party&&typeof v==='number'&&Number.isFinite(v));
 return entries.length===1?entries[0][1]:null;
}
function eventTrend(records,event,party,windowDays){
 // Never use publication date for the position of a survey.
 const studies=records.filter(p=>eventMeasure(p,party)!==null).sort((a,b)=>a.fieldEnd.localeCompare(b.fieldEnd));
 const before=studies.filter(p=>p.relation==='before'),after=studies.filter(p=>p.relation==='after');
 const max=Math.max(40,...studies.map(p=>eventMeasure(p,party)+3));
 const w=960,h=325,l=56,r=20,t=25,b=52,plotW=w-l-r,plotH=h-t-b;
 const minDay=day(event.date)-windowDays,maxDay=day(event.date)+windowDays;
 const x=d=>l+(day(d)-minDay)/(maxDay-minDay)*plotW;
 const y=n=>t+(1-n/max)*plotH;
 const fmtNum=n=>n.toLocaleString('es-ES',{minimumFractionDigits:1,maximumFractionDigits:1});
 const avg=v=>v.length?v.reduce((a,p)=>a+eventMeasure(p,party),0)/v.length:null;
 const avgBefore=avg(before),avgAfter=avg(after);
 const grid=[0,10,20,30,40].filter(v=>v<=max).map(v=>'<line x1="'+l+'" y1="'+y(v)+'" x2="'+(w-r)+'" y2="'+y(v)+'" stroke="#e1e9e4"/><text x="'+(l-10)+'" y="'+(y(v)+4)+'" text-anchor="end" font-size="12" fill="#5f746e">'+v+' %</text>').join('');
 const place=studies.map(p=>{
  const sx=x(p.fieldStart),ex=x(p.fieldEnd),cy=y(eventMeasure(p,party));
  const color=p.relation==='before'?'#207b68':p.relation==='after'?'#aa681f':'#8d7194';
  const title=esc(p.institute+' · '+p.fieldStart+' a '+p.fieldEnd+' · '+fmtNum(eventMeasure(p,party))+' %');
  return '<g><title>'+title+'</title><line x1="'+sx+'" x2="'+ex+'" y1="'+cy+'" y2="'+cy+'" stroke="'+color+'" stroke-width="3" stroke-linecap="round"/><circle cx="'+ex+'" cy="'+cy+'" r="5" fill="'+color+'" stroke="#fff" stroke-width="1.5"/></g>';
 }).join('');
 const threshold=x(event.date);
 const svg='<svg class="event-values-svg" viewBox="0 0 '+w+' '+h+'" role="img" aria-label="Estimación de '+esc(party)+' por instituto y fecha de trabajo de campo; línea vertical del acontecimiento">'
  +grid+'<line x1="'+threshold+'" y1="'+t+'" x2="'+threshold+'" y2="'+(h-b)+'" stroke="#ba7534" stroke-dasharray="5 5" stroke-width="2"/>'
  +'<text x="'+threshold+'" y="16" text-anchor="middle" font-size="12" fill="#91531e">Acontecimiento · '+format(event.date)+'</text>'
  +place+'<text x="'+l+'" y="'+(h-16)+'" font-size="12" fill="#536960">'+format(new Date(minDay*86400000).toISOString().slice(0,10))+'</text>'
  +'<text x="'+(w-r)+'" y="'+(h-16)+'" text-anchor="end" font-size="12" fill="#536960">'+format(new Date(maxDay*86400000).toISOString().slice(0,10))+'</text></svg>';
 const cells=studies.map(p=>'<tr><td>'+esc(p.institute)+'</td><td>'+esc(p.fieldStart)+'–'+esc(p.fieldEnd)+'</td><td>'+esc(labels[p.relation])+'</td><td class="num">'+fmtNum(eventMeasure(p,party))+' %</td></tr>').join('');
 let comparison='';
 if(before.length&&after.length){
   comparison='<p><b>Media descriptiva anterior:</b> '+fmtNum(avgBefore)+' % ('+before.length+' estudios). <b>Posterior:</b> '+fmtNum(avgAfter)+' % ('+after.length+' estudios). Diferencia: <b>'+(avgAfter-avgBefore>0?'+':'')+fmtNum(avgAfter-avgBefore)+' pp</b>.</p>'
   +'<div class="notice sim">Los institutos o escenarios pueden diferir. Esta diferencia no prueba un efecto causado por el acontecimiento.</div>';
 }else{
   comparison='<div class="notice"><b>Comparación todavía imposible.</b> '+(!after.length?'No hay ninguna encuesta con trabajo de campo completamente posterior al acontecimiento. ':'')+(!before.length?'No hay estudios anteriores en esta ventana. ':'')+'El promedio posterior y su variación no se calculan ni se sustituyen por valores inventados.</div>';
 }
 return '<section class="panel event-charts"><div class="panel-head"><div><h2>Estimaciones por instituto y promedio</h2><p class="muted">Cada marca corresponde a una encuesta y su intervalo real de entrevistas. La línea naranja señala el acontecimiento. No une institutos diferentes como si fueran una única serie.</p></div></div>'
 +'<div class="toolbar"><label>Partido<select id="event-party">'+EVENT_PARTIES.map(v=>'<option value="'+v+'" '+(v===party?'selected':'')+'>'+v+'</option>').join('')+'</select></label></div>'
 +'<div class="event-chart-wrap">'+(studies.length?svg:'<p class="empty">No existen estimaciones de ese partido en esta ventana.</p>')+'</div>'
 +'<div class="event-summary-grid"><div><span>Promedio anterior</span><strong>'+(avgBefore===null?'—':fmtNum(avgBefore)+' %')+'</strong><small>'+before.length+' encuestas con campo anterior</small></div><div><span>Promedio posterior</span><strong>'+(avgAfter===null?'—':fmtNum(avgAfter)+' %')+'</strong><small>'+after.length+' encuestas con campo posterior</small></div><div><span>Cambio observado</span><strong>'+(avgBefore===null||avgAfter===null?'Sin datos':(avgAfter-avgBefore>0?'+':'')+fmtNum(avgAfter-avgBefore)+' pp')+'</strong><small>Solo comparable con ambos períodos</small></div></div>'
 +comparison+'<div class="table-wrap"><table><thead><tr><th>Instituto</th><th>Entrevistas</th><th>Período</th><th>'+esc(party)+'</th></tr></thead><tbody>'+cells+'</tbody></table></div>'
 +'<p class="muted">Media simple de sondeos completos anteriores o posteriores; no se combinan las entrevistas individuales ni se reponderan los institutos. Para estimar cambios por casa se necesitan dos oleadas comparables del mismo instituto.</p></section>';
}


/** Baseline desagregada por instituto: solo campo completamente anterior al suceso.
 *  No inventamos movimiento después de un acontecimiento si no hay encuestas. */
function eventEvidence(records,event,party){
 const before=records.filter(p=>p.relation==='before'),after=records.filter(p=>p.relation==='after');
 const prior=new Map;
 for(const p of [...before].sort((a,b)=>b.fieldEnd.localeCompare(a.fieldEnd)||b.published.localeCompare(a.published)))
  if(!prior.has(p.institute))prior.set(p.institute,p);
 const subsequent=new Map;
 for(const p of [...after].sort((a,b)=>a.fieldStart.localeCompare(b.fieldStart)||a.published.localeCompare(b.published)))
  if(!subsequent.has(p.institute))subsequent.set(p.institute,p);
 const names=['PP','PSOE','VOX','SUMAR','PODEMOS'];
 const f=n=>n.toLocaleString('es-ES',{maximumFractionDigits:1,minimumFractionDigits:1});
 const aggregate=names.map(p=>{
  const previous=[...prior.values()].map(x=>eventMeasure(x,p)).filter(Number.isFinite);
  const later=[...subsequent.values()].map(x=>eventMeasure(x,p)).filter(Number.isFinite);
  const mean=v=>v.length?v.reduce((a,b)=>a+b,0)/v.length:null;
  return {party:p,pre:mean(previous),post:mean(later),nPre:previous.length,nPost:later.length};
 });
 const max=Math.max(35,...aggregate.flatMap(x=>[x.pre,x.post].filter(Number.isFinite)));
 const bars=aggregate.map(r=>'<div class="event-evidence-row"><b>'+esc(r.party)+'</b><div class="event-evidence-graph">'
    +(r.pre===null?'<span class="event-no-data">Sin dato anterior</span>':'<span class="event-evidence-bar" style="width:'+Math.max(0,Math.min(100,r.pre/max*100))+'%"><i></i></span>')
    +(r.post===null?'':'<span class="event-after-bar" style="width:'+Math.min(100,r.post/max*100)+'%"></span>')
    +'</div><span>'+ (r.pre===null?'—':f(r.pre)+' %')+'<small>'+r.nPre+' casas</small></span><span>'+(r.post===null?'—':f(r.post)+' %')+'<small>'+r.nPost+' casas</small></span><strong>'+(r.pre!==null&&r.post!==null?(r.post-r.pre>0?'+':'')+f(r.post-r.pre)+' pp':'—')+'</strong></div>').join('');
 const detail=[...new Set([...prior.keys(),...subsequent.keys()])].sort((a,b)=>a.localeCompare(b)).map(name=>{
   const p=prior.get(name),posterior=subsequent.get(name);
   const same=p&&posterior&&['scope','universe','mode','scenario'].every(k=>p[k]&&posterior[k]&&p[k]===posterior[k]);
   const first=p?eventMeasure(p,party):null,last=posterior?eventMeasure(posterior,party):null;
   const delta=same&&first!==null&&last!==null?last-first:null;
   return '<tr><td><b>'+esc(name)+'</b><small>'+(p?esc(p.fieldStart)+'–'+esc(p.fieldEnd):'Sin campo anterior')+'</small></td>'
     +'<td>'+(first===null?'—':f(first)+' %')+'</td>'
     +'<td>'+(last===null?'—':f(last)+' %')+'</td>'
     +'<td>'+(delta===null?'—':(delta>0?'+':'')+f(delta)+' pp')+'</td>'
     +'<td>'+(same?'Escenario y modo coincidentes':posterior?'No comparable o sin encuesta anterior':'Sin oleada posterior')+'</td></tr>';
 }).join('');
 const common=[...prior.keys()].filter(h=>subsequent.has(h));
 const status=!after.length?'<div class="notice"><b>Resultado principal: todavía no es posible medir cambios posteriores.</b> No hay entrevistas con campo completamente posterior al '+esc(format(event.date))+'. Las cifras siguientes describen la situación <b>antes</b> del acontecimiento. No se infiere ni un ganador ni un perdedor.</div>':
  '<div class="notice sim"><b>Comparación provisional.</b> Los promedios antes/después pueden usar distintas casas. Las comparaciones dentro de una casa exigen también muestras y escenarios equivalentes. Coincidencia temporal no es causalidad.</div>';
 const overview='<section class="panel event-evidence"><div class="panel-head"><div><span class="eyebrow">Estimaciones cuantificadas</span><h2>¿Qué muestran las encuestas alrededor del acontecimiento?</h2><p class="muted">Última encuesta por instituto antes de la fecha; primera posterior cuando existe. Fechas del <b>trabajo de campo</b>, nunca de publicación.</p></div></div>'
 +'<div class="event-evidence-kpis"><div><span>Casas con encuesta anterior</span><strong>'+prior.size+'</strong></div><div><span>Casas con encuesta posterior</span><strong>'+subsequent.size+'</strong></div><div><span>Institutos presentes a ambos lados</span><strong>'+common.length+'</strong></div></div>'+status
 +'<div class="event-evidence-legend"><i></i> Promedio anterior · <i class="after"></i> Promedio posterior (cuando existe)</div>'
 +'<div class="event-evidence-head"><b>Partido</b><b>Media sobre escala común</b><b>Antes</b><b>Después</b><b>Cambio</b></div>'
 +'<div class="event-evidence-rows">'+bars+'</div>'
 +'<p class="muted">Cada valor es la media simple de una encuesta por instituto entre quienes publicaron ese partido. No se imputan candidaturas ausentes. «Sumar» agrupa etiquetas de coaliciones diferentes: orientativo, no plenamente homogéneo. Los promedios no forman una distribución electoral completa.</p>'
 +'<details class="event-evidence-details" open><summary>Por encuestadora: '+esc(party)+' antes y después</summary><div class="table-wrap"><table><thead><tr><th>Instituto / campo anterior</th><th>Antes</th><th>Después</th><th>Variación</th><th>Comparabilidad</th></tr></thead><tbody>'+detail+'</tbody></table></div><p class="muted">La comparación dentro de un instituto requiere igual ámbito, universo, modo y escenario. Aunque coincidan, pueden variar muestra y cuestionario.</p></details>'
 +'</section>';
 return {html:overview,summary:{housesBefore:prior.size,housesAfter:subsequent.size,housesBoth:common.length,parties:aggregate}};
}
export function renderEvents(events){
 return `<div class="hero"><div><div class="eyebrow">Contexto / trabajo de campo / evidencia</div><h1>Acontecimientos y encuestas.</h1><p>Compara estimaciones, casas demoscópicas y promedios en torno a acontecimientos documentados; distingue cambios observados de períodos sin datos.</p></div><div class="hero-aside"><span class="badge poll">Contexto documentado</span><p>${events.length} acontecimiento${events.length===1?'':'s'} registrado${events.length===1?'':'s'}</p></div></div><div class="notice">La fecha de publicación de una encuesta no indica cuándo se recogieron las respuestas. La coincidencia temporal permite ordenar los datos; por sí sola no demuestra que un suceso haya cambiado el voto.</div>${events.length?`<div class="toolbar"><label>Acontecimiento<select id="context-event">${[...events].sort((a,b)=>b.date.localeCompare(a.date)).map(e=>`<option value="${esc(e.id)}">${format(e.date)} · ${esc(e.title)}</option>`).join('')}</select></label><label>Ventana a cada lado<select id="context-window"><option value="14">14 días</option><option value="30" selected>30 días</option><option value="90">90 días</option></select></label><button id="export-context" class="secondary">Descargar análisis JSON ↓</button></div><div id="event-context" aria-live="polite"></div>`:'<p class="empty">No hay acontecimientos documentados.</p>'}<section class="panel event-method"><h2>Cómo se incorpora un acontecimiento</h2><p>Fecha, lugar, categoría, descripción neutral, fuentes originales y fecha de revisión. El mismo criterio se aplica a hechos favorables o desfavorables para cualquier formación. No se asignan ganadores, perdedores ni coeficientes de voto.</p><p>Las comparaciones automáticas exigen coincidencia exacta de instituto, método, ámbito, universo y escenario. Conservan las etiquetas originales de los partidos. Puede haber cambios de cuestionario, muestra o ponderación incluso si esos campos coinciden: hay que revisar ambas fichas.</p><p>Con fechas de campo expresadas por días, cualquier estudio que toque el día del suceso queda en «Coincide con el día». No conocemos qué entrevistas se realizaron antes o después de la hora concreta. No se calculan intervalos de confianza a partir de los errores generales de las fichas.</p><a href="docs/events.md">Registro y criterios de análisis →</a> · <a href="data/events.json" download>Acontecimientos JSON ↓</a> · <a href="#laboratorio">Explorar un supuesto en el laboratorio →</a></section>`;
}
export function bindEvents(events,polls){
 if(!events.length)return;
 const select=document.querySelector('#context-event'),windowSelect=document.querySelector('#context-window');
 let activeParty="PP";
 let analysis;
 function update(){
  const event=events.find(e=>e.id===select.value),windowDays=Number(windowSelect.value),records=contextPolls(polls,event.date,windowDays),pairs=descriptivePairs(polls,event.date,windowDays);
  const count=relation=>records.filter(p=>p.relation===relation).length;
  const evidence=eventEvidence(records,event,activeParty);
  analysis={schemaVersion:1,kind:'event-context-analysis',event,windowDays,datePrecision:'day',causalEffectEstimated:false,counts:{before:count('before'),overlap:count('overlap'),after:count('after')},polls:records,descriptivePairs:pairs,evidence:evidence.summary};
  document.querySelector('#event-context').innerHTML=`<section class="panel"><span class="badge">${esc(event.category)}</span><h2>${esc(event.title)}</h2><p class="muted">${format(event.date)} · ${esc(event.location)} · Seguimiento: ${esc(event.scope)} · Revisado: ${format(event.verified)}</p><p>${esc(event.summary)}</p><p>${event.sources.map(s=>`<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.publisher)} · ${format(s.published)} ↗</a>`).join(' · ')}</p><details><summary>Notas de verificación</summary><p>${esc(event.notes)}</p></details></section><div class="stats"><div class="stat"><span>Campo completamente anterior</span><strong>${count('before')}</strong></div><div class="stat"><span>Campo coincidente con ese día</span><strong>${count('overlap')}</strong></div><div class="stat"><span>Campo completamente posterior</span><strong>${count('after')}</strong></div><div class="stat"><span>Ventana seleccionada</span><strong>±${windowDays}</strong><small>días naturales</small></div></div>${!count('after')?'<div class="notice">No hay estudios con campo completamente posterior dentro de la ventana y el archivo cargado. Estos datos todavía no permiten observar una reacción posterior al acontecimiento.</div>':''}${evidence.html}${eventTrend(records,event,activeParty,windowDays)}<section class="panel"><h2>Cuándo se hicieron las entrevistas</h2><p class="muted">Cada barra representa el intervalo de campo, recortado a la ventana. La línea vertical marca el día del acontecimiento. No representa una evolución de intención de voto.</p>${records.length?timeline(records,event.date,windowDays):'<p class="empty">No hay estudios en esta ventana.</p>'}<div class="table-wrap"><table><caption>Estudios del archivo cuyo trabajo de campo solapa la ventana. La selección temporal incluye los ámbitos publicados; no equipara sus electorados.</caption><thead><tr><th>Instituto</th><th>Campo</th><th>Publicación</th><th>Relación temporal</th><th>Ámbito</th></tr></thead><tbody>${records.map(p=>`<tr><td><a href="${esc(p.source)}" target="_blank" rel="noopener">${esc(p.institute)} ↗</a><small>${esc(p.id)}</small></td><td>${format(p.fieldStart)}–${format(p.fieldEnd)}</td><td>${format(p.published)}</td><td>${labels[p.relation]}</td><td>${esc(p.scope)}</td></tr>`).join('')}</tbody></table></div></section><section class="panel event-method"><h2>Comparación descriptiva antes y después</h2><p class="muted">Último estudio anterior y primero posterior de cada grupo comparable. Los estudios que tocan el día del suceso no se usan en esta comparación.</p>${comparison(pairs)}</section>`;
 }
 select.onchange=update;windowSelect.onchange=update;
 document.querySelector('#event-context').addEventListener('change',e=>{if(e.target.id==='event-party'){activeParty=e.target.value;update()}});
 document.querySelector('#export-context').onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(analysis,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download=`oee-contexto-${analysis.event.id}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 update();
}

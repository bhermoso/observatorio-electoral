/* Lectura gráfica de datos originales antes de la interpretación causal. */
const h=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const f=n=>Number(n).toLocaleString('es-ES',{minimumFractionDigits:1,maximumFractionDigits:1});
const signed=n=>(n>0?'+':n<0?'−':'±')+f(Math.abs(n));
const normalDate=s=>s?new Date(s+'T12:00:00Z').toLocaleDateString('es-ES',{day:'numeric',month:'short',year:'numeric',timeZone:'Europe/Madrid'}):'—';
const priority=['PP','PSOE','VOX','Vox','Sumar','Sumar/FA','Frente Amplio','Podemos'];
export function renderEventVisual(a,event){
 const studies=a.fichasPosteriores||[];
 const sample=studies.flatMap(p=>{
  if(!p.anterior)return [];
  const common=Object.keys(p.anterior.values||{}).filter(k=>Number.isFinite(p.anterior.values[k])&&Number.isFinite(p.values?.[k]));
  const parties=common.sort((x,y)=>{
   const ax=priority.indexOf(x),ay=priority.indexOf(y);
   return (ax<0?999:ax)-(ay<0?999:ay);
  }).slice(0,6);
  return [{p,parties}];
 });
 const plots=sample.map(({p,parties})=>{
  const note=p.comparabilidad?.nivel!=='alta'?
   `<p class="event-visual-warning"><b>Comparabilidad ${h(p.comparabilidad?.nivel||'limitada')}:</b> ${h(p.comparabilidad?.motivos?.join('; ')||'diseños no idénticos')}.</p>`:
   '<p class="event-visual-warning">Mismo instituto y metadatos comparables; aún no prueba causalidad.</p>';
  return `<section class="event-visual-house"><header class="event-visual-house-head"><h3>${h(p.institute)} · dos oleadas</h3><span>Antes: ${h(normalDate(p.anterior.fieldEnd))} · Después: ${h(normalDate(p.fieldEnd))}</span></header>
    <div class="event-visual-column-head"><span>Candidatura</span><span>Antes</span><span>Después</span><span>Diferencia, en pp</span></div>
    ${parties.map(k=>{
     const before=p.anterior.values[k],after=p.values[k],delta=after-before,normalized=Math.min(100,Math.abs(delta)/6*100).toFixed(1)+'%';
     return `<div class="event-visual-row"><strong>${h(k)}</strong><span>${f(before)} %</span><span>${f(after)} %</span><div class="event-delta"><b class="${delta<0?'down':delta>0?'up':'flat'}">${signed(delta)} pp</b><span class="event-delta-track"><i class="${delta<0?'down':'up'}" style="width:${normalized}"></i></span></div></div>`;
    }).join('')}
    <div class="event-visual-sources"><a href="${h(p.anterior.source)}" target="_blank" rel="noopener">Encuesta anterior ↗</a><a href="${h(p.source)}" target="_blank" rel="noopener">Encuesta posterior ↗</a><small>Muestras independientes: ${p.anterior.sample||'—'} y ${p.sample||'—'} entrevistas</small></div>${note}
   </section>`;
 }).join('');
 const evidence=studies.length
 ? `<p>Existen <b>${studies.length} encuesta(s) con campo íntegramente posterior</b> dentro de la ventana, pero solo ${sample.length} instituto(s) con oleadas para contrastar. Las diferencias no son efectos atribuibles al acontecimiento.</p>`
 :'<p>No hay encuestas íntegramente posteriores identificadas: no se puede mostrar una evolución posterior.</p>';
 return `<section class="event-visual-summary" aria-labelledby="event-visual-title">
 <div class="event-visual-heading"><div><span class="eyebrow">Evidencia observada · antes de interpretar</span><h2 id="event-visual-title">${h(event.title)}</h2></div><p>${h(normalDate(event.date))} · ${h(event.location)}</p></div>
 <div class="event-visual-kpis"><div><strong>${a.counts?.before??0}</strong><span>Campos anteriores</span></div><div><strong>${a.counts?.overlap??0}</strong><span>Coinciden con el día</span></div><div><strong>${a.counts?.after??0}</strong><span>Campos posteriores</span></div></div>
 ${evidence}
 ${plots||'<p class="event-visual-warning">No hay una comparación por instituto con cifras de ambas oleadas. Se mantienen disponibles las fichas individuales.</p>'}
 <p class="event-visual-note">El gráfico usa exclusivamente porcentajes publicados con la <b>misma etiqueta de candidatura</b>. No agrega casas distintas, no reconstruye microdatos y no atribuye causalidad. Los colores representan subida o bajada numérica, no una valoración política.</p>
 </section>`;
}

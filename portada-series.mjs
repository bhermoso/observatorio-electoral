import {PARTIES,canonicalValues,capasExternas} from './capas.mjs';

const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const date=new Intl.DateTimeFormat('es-ES',{day:'numeric',month:'short',timeZone:'UTC'});
const fmt=n=>n.toLocaleString('es-ES',{minimumFractionDigits:1,maximumFractionDigits:1});
const day=86400000;
const colors=['#2563a6','#aa3564','#6950a8','#98601c','#157d87','#627622','#9b4537','#526085','#a04f23','#296a4d','#81517f','#476e85'];
const houseName=s=>s==='IMOP Insights'?'IMOP':s;
const url=s=>typeof s==='string'&&s.startsWith('https://')?s:null;

export function collectSeries(polls,forecast,history,cutoff){
 const houses=new Map();
 const add=(label,record)=>{
  if(!label||!record.date||record.date<'2026-01-01'||record.date>cutoff)return;
  label=houseName(label);
  if(!houses.has(label))houses.set(label,new Map());
  const items=houses.get(label);
  const key=record.end?record.start+'|'+record.end:record.date;
  if(!items.has(key))items.set(key,record);
 };
 for(const p of polls.filter(p=>p.kind==='poll-estimate')){
  add(p.institute,{date:p.published,start:p.fieldStart,end:p.fieldEnd,values:canonicalValues(p.values).values,
   source:p.source,technical:p.technical,method:p.mode,notes:p.notes});
 }
 for(const p of forecast?.entradas||[]){
  add(p.casa,{date:p.publicacion,start:p.campo_ini,end:p.campo_fin,values:canonicalValues(p.voto).values,
   source:p.contraste_url||p.url,method:p.modo,notes:p.contraste==='cifras_confirmadas_sin_ficha'?'Cifras contrastadas. Ficha técnica no disponible.':''});
 }
 const model=new Map((history||[]).filter(c=>c.fecha<=cutoff).map(c=>[c.fecha,{
  date:c.fecha,version:c.version,values:Object.fromEntries(Object.entries(c.voto||{}).map(([id,v])=>[id,v?.[0]]))
 }]));
 if(forecast?.principal?.partidos&&forecast.corte<=cutoff){
  model.set(forecast.corte,{date:forecast.corte,version:forecast.version_modelo,
   values:Object.fromEntries(Object.entries(forecast.principal.partidos).map(([id,v])=>[id,v?.voto?.[0]]))});
 }
 const order=(a,b)=>a.date.localeCompare(b.date);
 const series=[{id:'observatorio',label:'Observatorio · Motor 29N',type:'model',color:'#183e31',points:[...model.values()].sort(order)}];
 for(const [i,[label,points]] of [...houses].sort(([a],[b])=>a.localeCompare(b,'es')).entries()){
  series.push({id:'casa-'+label,label,type:'house',color:colors[i%colors.length],points:[...points.values()].sort(order)});
 }
 const external=new Map();
 for(const p of capasExternas(forecast)){
  if(p.verificado!==true||p.fecha<'2026-01-01'||p.fecha>cutoff)continue;
  const label=p.nombre;
  if(!external.has(label))external.set(label,[]);
  external.get(label).push({date:p.fecha,values:p.partidos,source:p.url,notes:p.metodo,approximate:p.aproximado});
 }
 for(const [label,points] of external)series.push({id:'externo-'+label,label,type:'external',color:'#835c15',points:points.sort(order)});
 return series;
}

export function eventComparison(points,eventDate,type){
 const time=type==='house'?'end':'date';
 const before=points.filter(p=>p[time]&&p[time]<eventDate).sort((a,b)=>b[time].localeCompare(a[time]))[0];
 const after=points.filter(p=>type==='house'?p.start&&p.start>eventDate:p.date>eventDate)
  .sort((a,b)=>(type==='house'?a.start.localeCompare(b.start):a.date.localeCompare(b.date)))[0];
 const comparable=before&&after&&(type!=='model'||before.version===after.version);
 return {before,after,change:comparable?after.value-before.value:null};
}

export function renderSeriesChart(series,events,start,end,party,selectedEvent,width=910,scaleSeries=series){
 const left=46,right=width-30,top=29,bottom=width<550?204:267;
 const first=Date.parse(start),last=Date.parse(end);
 const x=d=>left+(Date.parse(d)-first)/Math.max(day,last-first)*(right-left);
 const values=scaleSeries.flatMap(s=>s.points.map(p=>p.value));
 const low=values.length?Math.max(0,Math.floor(Math.min(...values)-1)):0;
 const high=values.length?Math.ceil(Math.max(...values)+1):5;
 const y=v=>bottom-(v-low)/(high-low)*(bottom-top);
 const ticks=Array.from({length:5},(_,i)=>low+i*(high-low)/4);
 const dates=Array.from({length:5},(_,i)=>new Date(first+Math.round((last-first)/day*i/4)*day).toISOString().slice(0,10));
 const axis=ticks.map(v=>`<line x1="${left}" x2="${right}" y1="${y(v)}" y2="${y(v)}"/><text x="${left-7}" y="${y(v)+4}" text-anchor="end">${fmt(v)} %</text>`).join('');
 const timeline=dates.map(d=>`<text x="${x(d)}" y="${bottom+23}" text-anchor="middle">${date.format(Date.parse(d))}</text>`).join('');
 const markers=events.map((e,i)=>`<g class="series-event${e.id===selectedEvent?' active':''}"><line x1="${x(e.date)}" x2="${x(e.date)}" y1="${top}" y2="${bottom}"/><circle cx="${x(e.date)}" cy="${i%2===0?12:23}" r="9"/><text x="${x(e.date)}" y="${i%2===0?16:27}" text-anchor="middle">${i+1}</text><title>${escape(e.title)}</title></g>`).join('');
 const marks=[...series].reverse().map(s=>{
  let previous=null;
  const path=s.points.map(p=>{
   const join=previous&&(s.type!=='model'||(p.version===previous.version&&Date.parse(p.date)-Date.parse(previous.date)<=day));
   previous=p;
   return `${join?'L':'M'}${x(p.date).toFixed(1)} ${y(p.value).toFixed(1)}`;
  }).join(' ');
  const dots=s.points.map(p=>`<circle cx="${x(p.date)}" cy="${y(p.value)}" r="${s.type==='model'?2:4}"><title>${escape(s.label)} · ${date.format(Date.parse(p.date))} · ${p.approximate?'≈ ':''}${fmt(p.value)} %${p.start&&p.end?' · campo '+date.format(Date.parse(p.start))+'–'+date.format(Date.parse(p.end)):''}</title></circle>`).join('');
  return `<g class="series-mark ${s.type}" style="--series-color:${s.color}"><path d="${path}"/>${dots}</g>`;
 }).join('');
 return `<svg viewBox="0 0 ${width} ${bottom+35}" role="img" aria-label="${escape(party)} · evolución del voto estimado y acontecimientos"><g class="series-axis">${axis}${timeline}</g>${markers}${marks}</svg>`;
}

const link=(href,label)=>url(href)?`<a href="${escape(href)}" target="_blank" rel="noopener">${label} ↗</a>`:'';
const pointText=p=>p?`${p.approximate?'≈ ':''}${fmt(p.value)} % <small>${date.format(Date.parse(p.date))}</small>`:'—';
const fieldText=p=>p?.start&&p?.end?`${date.format(Date.parse(p.start))}–${date.format(Date.parse(p.end))}`:'—';

export function bindPortadaSeries(root,{polls,forecast,history,events,cutoff}){
 const series=collectSeries(polls,forecast,history,cutoff);
 const end=cutoff;
 const recent=new Date(Date.parse(end)-59*day).toISOString().slice(0,10);
 root.innerHTML=`
  <div class="series-head"><div><span class="eyebrow">Observatorio electoral · series comparables por partido</span><h2 id="series-heading">Evolución de las estimaciones</h2></div>
  <div class="series-controls"><label>Partido <select data-party>${PARTIES.map(p=>`<option value="${p.id}">${escape(p.label)}</option>`).join('')}</select></label>
  <label>Periodo <select data-period><option value="${recent}">Últimos 60 días</option><option value="2026-01-01">Desde enero de 2026</option></select></label></div></div>
  <p class="series-note">Voto estimado (%) · fecha de publicación para las casas y de corte para el Observatorio. El detalle indica cuándo se hicieron las entrevistas.</p>
  <div class="series-events" data-events aria-label="Acontecimientos en el gráfico"></div>
  <div class="series-chart" data-chart></div>
  <div class="series-legend" data-legend aria-label="Series visibles"></div>
  <div data-event-reading></div>
  <details class="series-details"><summary>Cocina, fichas y cifras por fuente</summary><div data-detail></div></details>`;
 const find=s=>root.querySelector(s);
 const party=find('[data-party]'),period=find('[data-period]'),chart=find('[data-chart]');
 let chartWidth=0;
 let drawChart;
 const hidden=new Set();
 let selectedEvent=null;
 let legendIds='';
 function draw(){
  const start=period.value>end?end:period.value;
  const marked=events.filter(e=>e.date>=start&&e.date<=end).sort((a,b)=>a.date.localeCompare(b.date));
  const event=marked.find(e=>e.id===selectedEvent);
  const available=series.map(s=>({...s,points:s.points.filter(p=>p.date>=start&&Number.isFinite(p.values[party.value])).map(p=>({...p,value:p.values[party.value]}))})).filter(s=>s.points.length);
  const visible=available.filter(s=>!hidden.has(s.id));
  const partyLabel=party.selectedOptions[0].textContent;
  drawChart=()=>{
   chartWidth=chart.clientWidth;
   chart.innerHTML=renderSeriesChart(visible,marked,start,end,partyLabel,selectedEvent,Math.max(280,chartWidth),available)
   +(visible.length?'':'<p class="series-note">Sin series visibles con datos en este periodo.</p>');
  };
  drawChart();
  find('[data-events]').innerHTML=marked.map((e,i)=>`<button type="button" data-event="${escape(e.id)}" aria-pressed="${event?.id===e.id}"><b>${i+1}</b> ${date.format(Date.parse(e.date))} · ${escape(e.shortTitle||e.title)}</button>`).join('');
  const ids=JSON.stringify(available.map(s=>s.id));
  if(ids!==legendIds){
   legendIds=ids;
   find('[data-legend]').innerHTML=available.map(s=>`<button type="button" data-series="${escape(s.id)}" aria-pressed="${!hidden.has(s.id)}" style="--series-color:${s.color}"><i></i>${escape(s.label)} <small>${s.points.length===1?'· 1 dato':''}</small></button>`).join('');
  }else for(const [i,b] of [...find('[data-legend]').children].entries()){
   b.querySelector('small').textContent=available[i].points.length===1?'· 1 dato':'';
  }
  const missing=series.filter(s=>!available.some(a=>a.id===s.id));
  find('[data-detail]').innerHTML=`<p class="series-note">${missing.length?'Sin datos para este partido y periodo: '+escape(missing.map(s=>s.label).join(', '))+'. ':''}Las fichas describen el método que cada fuente ha publicado.</p>`
   +available.map(s=>`<details><summary>${escape(s.label)} · ${s.points.length} observaciones</summary>${s.type==='model'?'<p><a href="#cocina">Nuestra cocina</a> · <a href="#pronostico-evolucion">Cortes y versiones del modelo</a></p>':''}
   <div class="table-wrap"><table><thead><tr><th>Fecha</th><th>Voto</th><th>Campo</th><th>Ficha, fuente y método</th></tr></thead><tbody>${[...s.points].reverse().map(p=>`<tr><td>${date.format(Date.parse(p.date))}</td><td>${p.approximate?'≈ ':''}${fmt(p.value)} %</td><td>${fieldText(p)}</td><td>${[link(p.source,'Original'),link(p.technical,'Ficha técnica'),escape(p.method),escape(p.notes),p.version?'Versión '+escape(p.version):''].filter(Boolean).join(' · ')||'—'}</td></tr>`).join('')}</tbody></table></div></details>`).join('');
  const comparisons=event?visible.filter(s=>s.type!=='external').map(s=>({s,...eventComparison(s.points,event.date,s.type)})):[];
  const rows=comparisons.map(({s,before,after,change})=>`<tr><th scope="row">${escape(s.label)}</th><td>${pointText(before)}${before?.start?'<small>Campo: '+fieldText(before)+'</small>':''}</td><td>${pointText(after)}${after?.start?'<small>Campo: '+fieldText(after)+'</small>':''}</td><td>${change==null?'—':(change>0?'+':'')+fmt(change)+' pp'}</td></tr>`).join('');
  find('[data-event-reading]').innerHTML=event?`<section class="series-reading"><h3>${escape(event.title)}</h3><p>${escape(event.summary)} ${event.sources.map(s=>link(s.url,escape(s.publisher))).join(' · ')}</p>
   <p>${comparisons.some(c=>c.s.type==='house'&&c.after)?'La comparación muestra diferencias observadas. Para interpretarlas importan el método, el escenario y la muestra de cada encuesta.':'Ninguna de las casas visibles tiene aquí una encuesta con trabajo de campo íntegramente posterior.'} La coincidencia temporal por sí sola no establece causalidad.</p>
   <details><summary>Antes y después · ${escape(partyLabel)}</summary><p>Última y primera observación de cada serie a ambos lados del acontecimiento. Para las casas se usan las fechas de campo y se apartan los estudios que coinciden con ese día. Para el modelo se usan cortes de la misma versión para calcular la diferencia.</p>
   <div class="table-wrap"><table><thead><tr><th>Serie</th><th>Antes</th><th>Después</th><th>Cambio</th></tr></thead><tbody>${rows}</tbody></table></div></details></section>`:'';
 }
 const resize=new ResizeObserver(()=>{
  if(!root.isConnected)resize.disconnect();
  else if(chart.clientWidth&&chart.clientWidth!==chartWidth)drawChart();
 });
 resize.observe(chart);
 party.addEventListener('change',draw);
 period.addEventListener('change',draw);
 root.addEventListener('click',e=>{
  const toggle=e.target.closest('[data-series]');
  if(toggle){
   const id=toggle.dataset.series;
   if(hidden.has(id))hidden.delete(id);else hidden.add(id);
   toggle.setAttribute('aria-pressed',String(!hidden.has(id)));
   draw();
  }
  const marker=e.target.closest('[data-event]');
  if(marker){
   const id=marker.dataset.event;
   selectedEvent=selectedEvent===id?null:id;
   draw();
   [...find('[data-events]').children].find(b=>b.dataset.event===id)?.focus();
  }
 });
 draw();
}

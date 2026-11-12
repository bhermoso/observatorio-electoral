import {PARTIES,canonicalValues,capasExternas,productorExterno} from './capas.mjs';
import {vistaCuatroEstimaciones} from './ruta-estimaciones.mjs';

const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const date=new Intl.DateTimeFormat('es-ES',{day:'numeric',month:'short',timeZone:'UTC'});
const fmt=n=>n.toLocaleString('es-ES',{minimumFractionDigits:1,maximumFractionDigits:1});
const day=86400000;
const colors=['#2563a6','#aa3564','#6950a8','#98601c','#157d87','#627622','#9b4537','#526085','#a04f23','#296a4d','#81517f','#476e85'];
// Colores de partido para la portada (barra de escaños, tabla y series).
export const PARTY_COLORS={PP:'#1f5da6',PSOE:'#c9303d',VOX:'#4f9a2c',SUMAR:'#cc3f86',PODEMOS:'#6a3d9e',ERC:'#d99a0b',JUNTS:'#13a0a0',
 BILDU:'#87b23a',PNV:'#2d7a4c',BNG:'#5fb0dc',CC:'#e0bd15',UPN:'#24375c',SALF:'#7d8590'};
const MAIN=['PP','PSOE','VOX','SUMAR','PODEMOS'];
const ALL='principales';
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
 // Leyenda: la casa con el dato más reciente primero.
 const ultima=pts=>[...pts.values()].map(p=>p.date).sort().at(-1)||'';
 for(const [i,[label,points]] of [...houses].sort(([a,pa],[b,pb])=>ultima(pb).localeCompare(ultima(pa))||a.localeCompare(b,'es')).entries()){
  series.push({id:'casa-'+label,label,type:'house',color:colors[i%colors.length],points:[...points.values()].sort(order)});
 }
 const external=new Map();
 for(const p of capasExternas(forecast)){
  if(p.verificado!==true||p.fecha<'2026-01-01'||p.fecha>cutoff)continue;
  const label=productorExterno(p);
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

// Escala con marcas redondas (1, 2, 5 o 10 puntos) para que el eje se lea sin decimales.
export function niceScale(values){
 if(!values.length)return {low:0,high:5,ticks:[0,1,2,3,4,5]};
 const min=Math.min(...values),max=Math.max(...values);
 const step=[1,2,5,10,20].find(s=>(Math.ceil(max/s)-Math.floor(min/s))<=6)||20;
 let low=Math.max(0,Math.floor(min/step)*step),high=Math.ceil(max/step)*step;
 if(high===low)high=low+step;
 const ticks=[];for(let v=low;v<=high+1e-9;v+=step)ticks.push(v);
 return {low,high,ticks};
}

export function renderSeriesChart(series,events,start,end,party,selectedEvent,width=910,scaleSeries=series,{etiquetas=false,alto=null,numeros=true,titulo=''}={}){
 const left=46,right=width-(etiquetas?(width<550?92:110):30),top=numeros?29:12;
 const bottom=alto??(width<550?204:267);
 const first=Date.parse(start),last=Date.parse(end);
 const x=d=>left+(Date.parse(d)-first)/Math.max(day,last-first)*(right-left);
 const values=scaleSeries.flatMap(s=>s.points.map(p=>p.value)).filter(Number.isFinite);
 const {low,high,ticks}=niceScale(values);
 const y=v=>bottom-(v-low)/(high-low)*(bottom-top);
 const dates=Array.from({length:5},(_,i)=>new Date(first+Math.round((last-first)/day*i/4)*day).toISOString().slice(0,10));
 const axis=ticks.map(v=>`<line x1="${left}" x2="${right}" y1="${y(v)}" y2="${y(v)}"/><text x="${left-7}" y="${y(v)+4}" text-anchor="end">${v.toLocaleString('es-ES')} %</text>`).join('');
 const timeline=dates.map(d=>`<text x="${x(d)}" y="${bottom+23}" text-anchor="middle">${date.format(Date.parse(d))}</text>`).join('');
 const markers=events.map((e,i)=>`<g class="series-event${e.id===selectedEvent?' active':''}"><line x1="${x(e.date)}" x2="${x(e.date)}" y1="${top}" y2="${bottom}"/>${numeros?`<circle cx="${x(e.date)}" cy="${i%2===0?12:23}" r="9"/><text x="${x(e.date)}" y="${i%2===0?16:27}" text-anchor="middle">${i+1}</text>`:''}<title>${escape(e.title)}</title></g>`).join('');
 // Etiqueta al final de cada línea del modelo: partido y último valor, sin solaparse.
 let finales='';
 if(etiquetas){
  const ult=series.filter(s=>s.type==='model'&&s.points.length).map(s=>{const p=s.points.at(-1);return {s,p,y:y(p.value)};}).sort((a,b)=>a.y-b.y);
  for(let i=1;i<ult.length;i++)if(ult[i].y-ult[i-1].y<15)ult[i].y=ult[i-1].y+15;
  finales=ult.map(({s,p,y:yy})=>`<g class="series-final" style="--series-color:${s.color}"><line x1="${x(p.date)+3}" x2="${right+6}" y1="${y(p.value)}" y2="${yy}"/><text x="${right+9}" y="${yy+4}"><tspan class="n">${escape(s.label.replace('Sumar / Frente Amplio','FA').replace('Observatorio · Motor 29N','Motor 29N'))}</tspan> ${fmt(p.value)}</text></g>`).join('');
 }
 const marks=[...series].reverse().map(s=>{
  // Solo las series del modelo se unen con una línea: entre dos encuestas de una casa no hay medición.
  let previous=null;
  const path=s.type!=='model'?'':s.points.map(p=>{
   const join=previous&&(s.type!=='model'||(p.version===previous.version&&Date.parse(p.date)-Date.parse(previous.date)<=day));
   previous=p;
   return `${join?'L':'M'}${x(p.date).toFixed(1)} ${y(p.value).toFixed(1)}`;
  }).join(' ');
  const dots=s.points.map(p=>`<circle cx="${x(p.date)}" cy="${y(p.value)}" r="${s.type==='model'?2:s.type==='house-faint'?2.6:4}"><title>${escape(p.house?p.house+' · '+s.label.replace(' · encuestas',''):s.label)} · ${date.format(Date.parse(p.date))} · ${p.approximate?'≈ ':''}${fmt(p.value)} %${p.start&&p.end?' · campo '+date.format(Date.parse(p.start))+'–'+date.format(Date.parse(p.end)):''}</title></circle>`).join('');
  return `<g class="series-mark ${s.type}" style="--series-color:${s.color}">${path?`<path d="${path}"/>`:''}${dots}</g>`;
 }).join('');
 return `<svg viewBox="0 0 ${width} ${bottom+35}" role="img" aria-label="${escape(titulo||party)} · evolución del voto estimado y acontecimientos"><g class="series-axis">${axis}${timeline}</g>${markers}${marks}${finales}</svg>`;
}

const link=(href,label)=>url(href)?`<a href="${escape(href)}" target="_blank" rel="noopener">${label} ↗</a>`:'';
const pointText=p=>p?`${p.approximate?'≈ ':''}${fmt(p.value)} % <small>${date.format(Date.parse(p.date))}</small>`:'—';
const fieldText=p=>p?.start&&p?.end?`${date.format(Date.parse(p.start))}–${date.format(Date.parse(p.end))}`:'—';

export function bindPortadaSeries(root,{polls,forecast,history,events,cutoff,promedio=null}){
 const series=collectSeries(polls,forecast,history,cutoff);
 const end=cutoff;
 const recent=new Date(Date.parse(end)-59*day).toISOString().slice(0,10);
 root.innerHTML=`
  <div class="series-head"><div><span class="eyebrow">Voto estimado (%)</span><h2 id="series-heading">Evolución de las estimaciones</h2></div>
  <div class="series-controls"><label>Partido <select data-party><option value="${ALL}">Principales partidos (modelo)</option>${PARTIES.map(p=>`<option value="${p.id}">${escape(p.label)}</option>`).join('')}</select></label>
  <label>Periodo <select data-period><option value="${recent}">Últimos 60 días</option><option value="2026-01-01">Desde enero de 2026</option></select></label></div></div>
  <p class="series-note" data-note></p>
  <section class="series-comparacion" aria-label="Comparación numérica de estimaciones">
   <div class="series-comparacion-cab"><div><h3>Qué estima cada fuente para este partido</h3><p>Compara en una misma escala el último sondeo de cada casa, el promedio y nuestro pronóstico. El laboratorio de microdatos se muestra aparte.</p></div>
    <label>Ordenar institutos <select data-order><option value="desc">Mayor porcentaje</option><option value="asc">Menor porcentaje</option><option value="name">Alfabéticamente</option><option value="recent">Más reciente</option></select></label></div>
   <div data-comparison role="region" aria-live="polite"></div>
  </section>
  <details class="series-lectura-temporal"><summary>Explorar evolución temporal y acontecimientos</summary>
  <div class="series-events" data-events aria-label="Acontecimientos en el gráfico"></div>
  <div class="portada-grafico" data-chart></div>

  <div class="series-legend" data-legend aria-label="Series visibles"></div>
  <div data-event-reading></div>
  </details>
  <p class="series-note" data-detail></p>
  <p class="series-note">Cifras de cada serie con su ficha y su fuente: <a href="#encuestas">archivo de encuestas</a> · <a href="#pronostico-evolucion">cortes del modelo</a> · <a href="#pronostico-fuentes">estudios usados y excluidos</a>.</p>`;
 const find=s=>root.querySelector(s);
 const party=find('[data-party]'),period=find('[data-period]'),chart=find('[data-chart]'),order=find('[data-order]');
 const comparison=find('[data-comparison]');
 const comparisonCutoff=forecast?.corte||cutoff;
 const compareFrom=new Date(Date.parse(comparisonCutoff+'T12:00:00Z')-44*day).toISOString().slice(0,10);
 function renderComparison(){
  // En la visión general se muestra PP como ejemplo, sin esconder el comparador.
  // Al seleccionar un partido, esta misma figura se actualiza.
  const id=party.value===ALL?'PP':party.value;
  const f=n=>Number(n).toLocaleString('es-ES',{minimumFractionDigits:1,maximumFractionDigits:1});
  const lastPoint=points=>points.filter(p=>p.date<=comparisonCutoff && p.date>=compareFrom && Number.isFinite(p.values?.[id])).sort((a,b)=>b.date.localeCompare(a.date))[0];
  const houses=series.filter(x=>x.type==='house').map(x=>({name:x.label,type:'Encuesta',p:lastPoint(x.points)})).filter(x=>x.p).map(x=>({...x,value:x.p.values[id]}));
  const externals=series.filter(x=>x.type==='external').map(x=>({name:x.label,type:'Modelo o promedio externo',p:lastPoint(x.points)})).filter(x=>x.p).map(x=>({...x,value:x.p.values[id]}));
  const sorts={desc:(a,b)=>b.value-a.value,asc:(a,b)=>a.value-b.value,name:(a,b)=>a.name.localeCompare(b.name,'es'),recent:(a,b)=>b.p.date.localeCompare(a.p.date)};
  houses.sort(sorts[order.value]);externals.sort(sorts[order.value]);
  const average=promedio?.partidos?.[id];
  const own=forecast?.principal?.partidos?.[id]?.voto?.[0];
  const td=(str)=>escape(String(str));
  const fmtRow=(item)=>`<tr><th scope="row">${td(item.name)}</th><td>${td(item.type)}</td><td class="num">${f(item.value)} %</td><td>${td(date.format(Date.parse(item.p.date)))}</td></tr>`;
  const anchor=`${Number.isFinite(own)?`<tr class="comparacion-referencia"><th scope="row">Observatorio · pronóstico</th><td>Modelo propio</td><td class="num">${f(own)} %</td><td>${td(date.format(Date.parse(comparisonCutoff)))}</td></tr>`:''}${Number.isFinite(average?.valor)?`<tr class="comparacion-referencia"><th scope="row">Promedio de encuestas</th><td>${average.n} estudios con cifra</td><td class="num">${f(average.valor)} %</td><td>${td(date.format(Date.parse(promedio.corte)))}</td></tr>`:''}`;
  const found=[...houses,...externals];
  // Gráfico de dispersión horizontal sobre una escala común; no implica
  // intervalos de confianza ni que las fechas de campo sean idénticas.
  const values=[...found.map(x=>x.value),own,average?.valor].filter(Number.isFinite);
  const xmin=values.length?Math.max(0,Math.floor(Math.min(...values)-1)):0;
  const xmax=values.length?Math.min(100,Math.ceil(Math.max(...values)+1)):100;
  const range=Math.max(1,xmax-xmin);
  const at=v=>((v-xmin)/range*100).toFixed(2)+'%';
  const mark=(value,kind,title)=>Number.isFinite(value)?`<span class="cmp-marker ${kind}" style="left:${at(value)}" title="${td(title)}: ${f(value)} %" aria-hidden="true"></span>`:'';
  const graphRow=(item,kind)=>`<div class="cmp-row"><span class="cmp-label" title="${td(item.name)}">${td(item.name)}</span><div class="cmp-track">${mark(own,'modelo','Observatorio')}${mark(average?.valor,'media','Promedio')}${mark(item.value,kind,item.name)}</div><b class="cmp-value">${f(item.value)} %</b></div>`;
  const graph=`<div class="cmp-graphic" role="group" aria-label="Estimaciones de ${td(party.value===ALL?'PP':party.selectedOptions[0].textContent)} sobre escala común">
  <div class="cmp-head"><strong>Distribución de estimaciones</strong><span>${f(xmin)} % — ${f(xmax)} %</span></div>
  <div class="cmp-legend"><span><i class="cmp-key modelo"></i> Observatorio ${Number.isFinite(own)?f(own)+' %':'—'}</span><span><i class="cmp-key media"></i> Promedio ${Number.isFinite(average?.valor)?f(average.valor)+' %':'—'}</span><span><i class="cmp-key casa"></i> Encuestadoras</span></div>
  ${houses.length?houses.map(x=>graphRow(x,'casa')).join(''):'<p class="series-note">Sin encuestas verificadas para este partido y periodo.</p>'}
  ${externals.length?`<p class="cmp-group-title">Modelos y promedios externos · contraste</p>${externals.map(x=>graphRow(x,'externo')).join('')}`:''}
  <p class="series-note">Todas las marcas comparten escala. Cada casa se representa una sola vez, con su última cifra disponible en la ventana.</p></div>`;
  const ruta=vistaCuatroEstimaciones({partido:PARTIES.find(p=>p.id===id)?.label||id,casas:houses,promedio:average?.valor,modelo:own,corte:comparisonCutoff});
  comparison.innerHTML=`${party.value===ALL?'<p class="series-note"><strong>Ejemplo: PP.</strong> Selecciona otro partido arriba para cambiar esta comparación.</p>':''}${ruta}<p class="series-note">Ventana de 45 días hasta el corte del modelo (${td(date.format(Date.parse(comparisonCutoff)))}). Las referencias externas se muestran aparte y no entran en el pronóstico.</p>${graph}<details class="cmp-detail"><summary>Ver todas las cifras, fechas y naturaleza de cada fuente</summary><div class="table-wrap"><table class="series-comparacion-tabla"><thead><tr><th>Fuente</th><th>Clase</th><th class="num">Voto estimado</th><th>Publicado</th></tr></thead><tbody>${anchor}${houses.map(fmtRow).join('')}${externals.map(fmtRow).join('')}</tbody></table></div></details>`;

 }
 
 let chartWidth=0;
 let drawChart;
 const hidden=new Set();
 let selectedEvent=null;
 let legendIds='';
 function draw(){
  const pedido=period.value>end?end:period.value;
  // El eje empieza en el primer dato del periodo, no en un tramo vacío.
  const primeros=series.flatMap(s=>s.points.map(p=>p.date)).filter(d=>d>=pedido).sort();
  const start=primeros.length?new Date(Date.parse(primeros[0])-2*day).toISOString().slice(0,10):pedido;
  const marked=events.filter(e=>e.date>=start&&e.date<=end).sort((a,b)=>a.date.localeCompare(b.date));
  const event=marked.find(e=>e.id===selectedEvent);
  const all=party.value===ALL;
  const pick=(s,id)=>s.points.filter(p=>p.date>=start&&Number.isFinite(p.values[id])).map(p=>({...p,value:p.values[id]}));
  // Vista de conjunto: una línea del modelo por partido y, en su color, los puntos de las encuestas publicadas.
  const available=all
   ?MAIN.flatMap(id=>{
     const model=series.find(s=>s.type==='model');
     const label=PARTIES.find(p=>p.id===id)?.label||id;
     const line={id:'modelo-'+id,label,type:'model',color:PARTY_COLORS[id],points:model?pick(model,id):[]};
     const dots={id:'encuestas-'+id,label:label+' · encuestas',type:'house-faint',color:PARTY_COLORS[id],legend:false,owner:'modelo-'+id,
      points:series.filter(s=>s.type==='house').flatMap(s=>pick(s,id).map(p=>({...p,house:s.label}))).sort((a,b)=>a.date.localeCompare(b.date))};
     return [line,dots].filter(s=>s.points.length);
    })
   :series.map(s=>({...s,points:pick(s,party.value)})).filter(s=>s.points.length);
  find('[data-note]').textContent=all
   ?'Línea: estimación del Motor 29N en cada corte, con su último valor a la derecha. Puntos: cada encuesta publicada, en su fecha de publicación. Cada panel tiene su propia escala. Elige un partido para ver cada casa por separado.'
   :'Línea: Motor 29N en cada corte. Puntos: cada casa en su fecha de publicación; el detalle indica cuándo se hicieron las entrevistas.';
  const visible=available.filter(s=>!hidden.has(s.owner||s.id));
  const partyLabel=party.selectedOptions[0].textContent;
  drawChart=()=>{
   chartWidth=chart.clientWidth;
   const w=Math.max(280,chartWidth);
   if(all){
    // Dos paneles con escala propia: con un único eje de 0 a 35 % las líneas parecen planas.
    const grupo=ids=>s=>ids.includes((s.owner||s.id).replace('modelo-',''));
    const g1=grupo(['PP','PSOE','VOX']),g2=grupo(['SUMAR','PODEMOS']);
    chart.innerHTML='<p class="series-panel-title">PP, PSOE y Vox</p>'+renderSeriesChart(visible.filter(g1),marked,start,end,partyLabel,selectedEvent,w,available.filter(g1),{etiquetas:true,titulo:'PP, PSOE y Vox'})
     +'<p class="series-panel-title">Frente Amplio y Podemos</p>'+renderSeriesChart(visible.filter(g2),marked,start,end,partyLabel,selectedEvent,w,available.filter(g2),{etiquetas:true,alto:w<550?130:160,numeros:false,titulo:'Frente Amplio y Podemos'});
   }else chart.innerHTML=renderSeriesChart(visible,marked,start,end,partyLabel,selectedEvent,w,available,{etiquetas:true});
   if(!visible.length)chart.innerHTML+='<p class="series-note">Sin series visibles con datos en este periodo.</p>';
  };
  drawChart();
  find('[data-events]').innerHTML=marked.map((e,i)=>`<button type="button" data-event="${escape(e.id)}" aria-pressed="${event?.id===e.id}"><b>${i+1}</b> ${date.format(Date.parse(e.date))} · ${escape(e.shortTitle||e.title)}</button>`).join('');
  const legend=available.filter(s=>s.legend!==false);
  const ids=JSON.stringify(legend.map(s=>s.id));
  if(ids!==legendIds){
   legendIds=ids;
   find('[data-legend]').innerHTML=legend.map(s=>`<button type="button" data-series="${escape(s.id)}" aria-pressed="${!hidden.has(s.id)}" style="--series-color:${s.color}"><i></i>${escape(s.label)}</button>`).join('');
  }
  const missing=all?[]:series.filter(s=>!available.some(a=>a.id===s.id));
  find('[data-detail]').textContent=missing.length?'Sin datos para este partido y periodo: '+missing.map(x=>x.label).join(', ')+'.':'';
  const comparisons=event?visible.filter(s=>s.type==='model'||s.type==='house').map(s=>({s,...eventComparison(s.points,event.date,s.type)})):[];
  const rows=comparisons.map(({s,before,after,change})=>`<tr><th scope="row">${escape(s.label)}</th><td>${pointText(before)}${before?.start?'<small>Campo: '+fieldText(before)+'</small>':''}</td><td>${pointText(after)}${after?.start?'<small>Campo: '+fieldText(after)+'</small>':''}</td><td>${change==null?'—':(change>0?'+':'')+fmt(change)+' pp'}</td></tr>`).join('');
  find('[data-event-reading]').innerHTML=event?`<section class="series-reading"><h3>${escape(event.title)}</h3><p>${escape(event.summary)} ${event.sources.map(s=>link(s.url,escape(s.publisher))).join(' · ')}</p>
   <p>${all?'La tabla compara, para cada partido, el último corte del modelo anterior al acontecimiento con el primero posterior.':comparisons.some(c=>c.s.type==='house'&&c.after)?'La comparación muestra diferencias observadas. Para interpretarlas importan el método, el escenario y la muestra de cada encuesta.':'Ninguna de las casas visibles tiene aquí una encuesta con trabajo de campo íntegramente posterior.'} La coincidencia temporal por sí sola no establece causalidad.</p>
   <h4>Antes y después · ${escape(all?'principales partidos según el modelo':partyLabel)}</h4><p>Última y primera observación de cada serie a ambos lados del acontecimiento. Para las casas se usan las fechas de campo y se apartan los estudios que coinciden con ese día. Para el modelo se usan cortes de la misma versión para calcular la diferencia.</p>
   <div class="table-wrap"><table><thead><tr><th>Serie</th><th>Antes</th><th>Después</th><th>Cambio</th></tr></thead><tbody>${rows}</tbody></table></div></section>`:'';
 }
 const resize=new ResizeObserver(()=>{
  if(!root.isConnected)resize.disconnect();
  else if(chart.clientWidth&&chart.clientWidth!==chartWidth)drawChart();
 });
 resize.observe(chart);
 party.addEventListener('change',()=>{draw();renderComparison();});
 order.addEventListener('change',renderComparison);
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
 draw();renderComparison();
}

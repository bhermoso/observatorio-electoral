import {allocate} from './engine.mjs';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const nf=n=>n.toLocaleString('es-ES',{maximumFractionDigits:2});
const date=s=>new Date(s+'T12:00:00Z').toLocaleDateString('es-ES',{timeZone:'Europe/Madrid'});
const keys=['PP','PSOE','VOX'];
const columns=['PP','PSOE','VOX','Resto 2023'];
export function selectStudies(polls,asOf,days=45){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(asOf)||!Number.isInteger(days)||days<1)throw Error('Periodo inválido');
 const cutoff=Date.parse(asOf+'T00:00:00Z')-days*86400000,latest=new Map();
 for(const p of [...polls].filter(p=>p.kind==='poll-estimate'&&p.published<=asOf&&p.fieldEnd<=asOf&&Date.parse(p.fieldEnd+'T00:00:00Z')>=cutoff&&/^España(?:, excepto Ceuta y Melilla)?$/.test(p.scope)).sort((a,b)=>b.fieldEnd.localeCompare(a.fieldEnd)||b.published.localeCompare(a.published)||a.id.localeCompare(b.id)))if(!latest.has(p.institute))latest.set(p.institute,p);
 return [...latest.values()];
}
export function pollAverage(studies,{asOf,halfLife=0,weights={}}={}){
 if(!Number.isFinite(halfLife)||halfLife<0)throw Error('Semivida inválida');
 const rows=studies.map(p=>{
  const manual=weights[p.institute]??1;
  if(!Number.isFinite(manual)||manual<0||manual>5)throw Error('Peso de instituto inválido');
  const age=(Date.parse(asOf+'T00:00:00Z')-Date.parse(p.fieldEnd+'T00:00:00Z'))/86400000;
  return {poll:p,weight:manual*(halfLife?2**(-age/halfLife):1)};
 });
 const average={};
 for(const key of [...keys,'Sumar/FA','Podemos','SALF']){
  const contributions=rows.flatMap(r=>{const alias=key==='Sumar/FA'?['Sumar/FA','Frente Amplio','Sumar'].find(k=>Object.hasOwn(r.poll.values,k)):key;return r.weight>0&&Number.isFinite(r.poll.values[alias])?[{id:r.poll.id,value:r.poll.values[alias],weight:r.weight,original:alias}]:[];});
  const denominator=contributions.reduce((s,r)=>s+r.weight,0);
  average[key]={value:denominator?contributions.reduce((s,r)=>s+r.value*r.weight,0)/denominator:null,count:contributions.length,contributions};
 }
 return {rows,average};
}
function roundTo(values,total){
 const floor=values.map(Math.floor),left=total-floor.reduce((s,v)=>s+v,0);
 if(left<0||left>values.length)throw Error('Redondeo incoherente');
 const order=values.map((v,i)=>({i,f:v-floor[i]})).sort((a,b)=>b.f-a.f||a.i-b.i);
 for(let j=0;j<left;j++)floor[order[j].i]++;
 return floor;
}
export function projectCore(election,targets){
 const districts=election.districts,ids=Object.fromEntries(election.parties.map(p=>[p.label,p.id])),coreIds=[[ids.PP],[ids.PSOE,ids.PSC],[ids.VOX]];
 if(coreIds.flat().some(id=>!id))throw Error('Faltan candidaturas base');
 if(keys.some(k=>!Number.isFinite(targets[k])||targets[k]<0||targets[k]>100))throw Error('Faltan promedios comunes válidos');
 const valid=districts.reduce((s,d)=>s+d.valid,0),blank=districts.reduce((s,d)=>s+d.blank,0),colTargets=keys.map(k=>valid*targets[k]/100);
 colTargets.push(valid-blank-colTargets.reduce((s,v)=>s+v,0));
 if(colTargets[3]<0)throw Error('Los promedios no dejan espacio para resto y voto en blanco');
 const matrix=districts.map(d=>{const c=coreIds.map(list=>list.reduce((s,id)=>s+(d.votes[id]??0),0));return [...c,d.candidacy-c.reduce((s,v)=>s+v,0)];});
 let maxError=Infinity,iterations=0;
 for(;iterations<10000;iterations++){
  for(let k=0;k<4;k++){
   const sum=matrix.reduce((s,row)=>s+row[k],0);
   if(!sum&&colTargets[k]>0)throw Error('El objetivo carece de soporte territorial');
   for(const row of matrix)row[k]=sum?row[k]*colTargets[k]/sum:0;
  }
  matrix.forEach((row,i)=>{const sum=row.reduce((s,v)=>s+v,0);if(!sum)throw Error('Provincia sin votos modelizados');for(let k=0;k<4;k++)row[k]*=districts[i].candidacy/sum;});
  maxError=Math.max(...colTargets.map((target,k)=>Math.abs(matrix.reduce((s,row)=>s+row[k],0)-target)));
  if(maxError<.0001)break;
 }
 if(maxError>=.0001)throw Error('La calibración territorial no converge');
 const totals=Object.fromEntries(columns.map(k=>[k,0])),results=[];
 for(let i=0;i<districts.length;i++){
  const d=districts[i],buckets=roundTo(matrix[i],d.candidacy),votes={};
  for(let group=0;group<4;group++){
   const entries=Object.entries(d.votes).filter(([id])=>group===3?!coreIds.flat().includes(id):coreIds[group].includes(id));
   const base=entries.reduce((s,[,v])=>s+v,0);
   if(!base&&buckets[group])throw Error('No se pueden crear candidaturas ausentes');
   const rounded=base?roundTo(entries.map(([,v])=>v/base*buckets[group]),buckets[group]):entries.map(()=>0);
   entries.forEach(([id],j)=>votes[id]=rounded[j]);
  }
  const allocation=allocate(votes,d.seats,{blank:d.blank,threshold:3,singleMember:d.name==='Ceuta'||d.name==='Melilla',seed:1});
  const seats=Object.fromEntries(columns.map((key,k)=>[key,Object.entries(allocation.seats).filter(([id])=>k===3?!coreIds.flat().includes(id):coreIds[k].includes(id)).reduce((s,[,v])=>s+v,0)]));
  columns.forEach(k=>totals[k]+=seats[k]);results.push({id:d.id,name:d.name,seats,votes,valid:d.valid,blank:d.blank,totalSeats:d.seats,candidacySeats:allocation.seats});
 }
 const achieved=Object.fromEntries(keys.map((k,j)=>[k,results.reduce((s,r)=>s+coreIds[j].reduce((t,id)=>t+(r.votes[id]??0),0),0)/valid*100]));
 return {kind:'poll-conditioned-projection',baseElection:election.election,magnitudeElection:election.election,targets,achieved,iterations:iterations+1,calibrationErrorVotes:maxError,totals,results,assumptions:'Solo PP, PSOE/PSC y VOX se calibran al promedio. El resto conserva candidaturas y proporciones internas provinciales de 2023; no es un reparto de candidaturas actuales. Votos válidos, blancos y magnitudes provinciales de 2023 fijos. Sin probabilidades ni intervalos de confianza.'};
}
export function renderAnalysis(polls){
 const asOf= new Date().toLocaleDateString('en-CA',{timeZone:'Europe/Madrid'});
 return `<div class="hero"><div><div class="eyebrow">Encuestas / promedio / reparto territorial</div><h1>Del sondeo a los escaños.</h1><p>Selecciona los institutos, consulta el promedio y explora una proyección condicionada por los sondeos.</p></div><div class="hero-aside"><span class="badge sim">Modelo experimental</span></div></div><div class="toolbar"><label>Fecha de referencia<input id="analysis-date" type="date" value="${asOf}"></label><label>Antigüedad máxima de campo<select id="analysis-days"><option value="30">30 días</option><option value="45" selected>45 días</option><option value="90">90 días</option></select></label><label>Peso por recencia<select id="analysis-half"><option value="0">Igual peso, sin recencia</option><option value="14">Semivida de 14 días</option><option value="21">Semivida de 21 días</option></select></label></div><section class="panel"><h2>Encuestas analizadas y peso de cada instituto</h2><p class="prose">Una encuesta por instituto: la última por fin de campo dentro del periodo y publicada hasta la fecha elegida. Peso inicial 1 para todas, incluido CIS. Pon 0 para excluir una casa. Estos pesos son decisiones de análisis, no calificaciones de calidad.</p><div id="analysis-studies" class="table-wrap"></div></section><div id="analysis-output" aria-live="polite"></div><section class="panel event-method"><div class="panel-head"><div><h2>Entender el cálculo, sin fórmulas innecesarias</h2><p class="muted">Una guía visual separa los datos, los ajustes y el reparto territorial.</p></div><a class="button secondary" href="metodologia-analisis.html">Ver metodología explicada →</a></div><h3>Qué significa este modelo</h3><p>PP, PSOE/PSC y Vox son las únicas tres categorías comunes a todas las encuestas recientes cargadas. La proyección ajusta sus votos a los promedios nacionales y conserva el volumen de voto provincial de 2023. Después aplica D’Hondt provincia por provincia y suma los 350 escaños. Ceuta y Melilla usan mayoría simple.</p><p><b>«Resto 2023» no es un partido ni un pronóstico de la izquierda o de los nacionalistas actuales.</b> Su voto se reparte entre las candidaturas que existían en cada provincia en 2023. No asignamos a Podemos, SALF o coaliciones nuevas una geografía inventada. Las magnitudes provinciales son las de 2023. El promedio parcial de Sumar/FA agrupa etiquetas distintas con advertencia y no alimenta el reparto.</p><p>Los escaños son puntos condicionales a estos supuestos, sin probabilidades de victoria ni intervalos de confianza. No se corrigen sesgos de instituto ni se pondera por muestra automáticamente. El archivo es una selección y puede omitir sondeos publicados.</p><a href="metodologia-analisis.html">Ver metodología visual →</a> · <a href="#encuestas">Consultar todas las fichas →</a></section>`;
}
export function bindAnalysis(polls,election){
 const $=s=>document.querySelector(s),weights={};let exportData;
 const controls=['analysis-date','analysis-days','analysis-half'];
 function update(rebuild=false){
  try{
   const asOf=$('#analysis-date').value,days=Number($('#analysis-days').value),halfLife=Number($('#analysis-half').value),studies=selectStudies(polls,asOf,days);
   if(rebuild){$('#analysis-studies').innerHTML=`<table><thead><tr><th>Instituto / original</th><th>Campo y publicación</th><th>Muestra</th><th>Peso manual (0–5)</th></tr></thead><tbody>${studies.map(p=>`<tr><td><a href="${esc(p.source)}" target="_blank" rel="noopener">${esc(p.institute)} ↗</a><small>${esc(p.title)} · ${esc(p.scope)}</small></td><td>${date(p.fieldStart)}–${date(p.fieldEnd)}<small>Publicada ${date(p.published)}</small></td><td>${nf(p.sample)}</td><td><label><span class="sr-only">Peso de ${esc(p.institute)}</span><input class="analysis-weight" data-institute="${esc(p.institute)}" type="number" min="0" max="5" step="0.1" value="${weights[p.institute]??1}"></label></td></tr>`).join('')}</tbody></table>`;document.querySelectorAll('.analysis-weight').forEach(input=>input.oninput=()=>{weights[input.dataset.institute]=input.value===''?NaN:Number(input.value);update();});}
   const summary=pollAverage(studies,{asOf,halfLife,weights}),active=summary.rows.filter(r=>r.weight>0),avg=summary.average;
   const averageHTML=`<section class="panel event-method"><h2>Promedio de voto</h2><p>${active.length} institutos activos · fecha de referencia ${date(asOf)}. Cada partido usa solo las fuentes que publican su porcentaje; los ausentes no cuentan como cero.</p><div class="table-wrap"><table><thead><tr><th>Categoría</th><th>Promedio</th><th>Cobertura</th><th>Alcance</th></tr></thead><tbody>${Object.entries(avg).map(([k,v])=>`<tr><td>${esc(k)}</td><td>${v.value===null?'Sin datos':nf(v.value)+' %'}</td><td>${v.count}/${active.length}</td><td>${k==='Sumar/FA'?'Agregado de etiquetas y coaliciones distintas; descriptivo, fuera del reparto':v.count===active.length&&active.length?'Cobertura completa en la selección':'Cobertura parcial; fuera del reparto'}</td></tr>`).join('')}</tbody></table></div><p class="muted">La suma de estos promedios parciales no forma una papeleta completa ni tiene por qué sumar 100 %. El último campo incluido termina el ${active.length?date(active.map(r=>r.poll.fieldEnd).sort().at(-1)):'—'}.</p><details><summary>Auditar los pesos efectivos y las contribuciones</summary>${active.map(r=>`<p class="prose">${esc(r.poll.institute)} · ${esc(r.poll.id)} · peso efectivo ${nf(r.weight)}</p>`).join('')}<p class="prose">Cada media es la suma de porcentaje × peso dividida por la suma de pesos de sus fuentes disponibles. La recencia usa el fin del campo, no la publicación.</p></details></section>`;
   const eligible=active.length>=2&&keys.every(k=>avg[k].count===active.length);
   if(!eligible){exportData=null;$('#analysis-output').innerHTML=averageHTML+'<div class="notice">La proyección requiere al menos dos institutos activos y cobertura completa de PP, PSOE y VOX en todos ellos. Ajusta el periodo o la selección.</div>';return;}
   const projection=projectCore(election,Object.fromEntries(keys.map(k=>[k,avg[k].value])));
   exportData={schemaVersion:1,kind:'poll-average-and-conditional-projection',asOf,days,halfLife,weights:{...weights},studies:active.map(r=>({id:r.poll.id,institute:r.poll.institute,source:r.poll.source,fieldEnd:r.poll.fieldEnd,effectiveWeight:r.weight,values:r.poll.values})),average:avg,projection};
   $('#analysis-output').innerHTML=averageHTML+`<section class="panel event-method"><div class="panel-head"><div><h2>Proyección nacional · 350 escaños</h2><p class="muted">Suma de 52 repartos provinciales · supuesto territorial 2023</p></div><span class="badge sim">Condicional</span></div><div class="notice">El promedio alimenta PP, PSOE y Vox. El reparto de las demás candidaturas se mantiene condicionado a su estructura provincial de 2023 y aparece como «Resto 2023». No es una previsión completa de las candidaturas de 2026.</div><div class="table-wrap"><table><thead><tr><th>Categoría</th><th>Escaños modelizados</th></tr></thead><tbody>${columns.map(k=>`<tr><td>${k}</td><td><b>${projection.totals[k]}</b></td></tr>`).join('')}</tbody></table></div><p class="prose">Mayoría absoluta: 176. Diferencia máxima entre objetivo y voto nacional calibrado tras redondear: ${nf(Math.max(...keys.map(k=>Math.abs(projection.targets[k]-projection.achieved[k]))))} puntos porcentuales.</p><button id="export-analysis" class="secondary">Descargar promedio y proyección JSON ↓</button></section><section class="panel event-method"><h2>Estimación por circunscripción</h2><p class="prose">Los escaños de cada fila suman su magnitud; las filas suman la proyección nacional. «Resto 2023» conserva el supuesto descrito arriba.</p><div class="table-wrap"><table><thead><tr><th>Circunscripción</th>${columns.map(k=>`<th>${k}</th>`).join('')}<th>Total</th></tr></thead><tbody>${projection.results.map(d=>`<tr><td>${esc(d.name)}</td>${columns.map(k=>`<td>${d.seats[k]}</td>`).join('')}<td>${d.totalSeats}</td></tr>`).join('')}</tbody></table></div></section>`;
   $('#export-analysis').onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(exportData,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='oee-promedio-proyeccion.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
  }catch(error){exportData=null;$('#analysis-output').innerHTML=`<div class="error" role="alert">${esc(error.message)}</div>`;}
 }
 controls.forEach(id=>$('#'+id).onchange=()=>update(true));update(true);
}

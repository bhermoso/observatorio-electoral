/* Evolución descriptiva reproducible de encuestas, sin interpolar series inexistentes.
   La serie de publicaciones NO es una prueba de impacto causal del acontecimiento. */
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const format=n=>Number(n).toLocaleString('es-ES',{minimumFractionDigits:1,maximumFractionDigits:1});
const formatDate=s=>new Date(s+'T12:00:00Z').toLocaleDateString('es-ES',{timeZone:'Europe/Madrid'});
const dateNum=s=>Date.parse(s+'T00:00:00Z')/86400000;
const canonical=s=>{const k=String(s).trim().toUpperCase();return {'SUMAR/FA':'SUMAR','FRENTE AMPLIO':'SUMAR','EH BILDU':'BILDU','COALICIÓN CANARIA':'CC','CC':'CC'}[k]||k};
export const SERIES_GROUPS=[
 {id:'PP',label:'PP',parties:['PP']},
 {id:'PSOE',label:'PSOE',parties:['PSOE']},
 {id:'VOX',label:'Vox',parties:['VOX']},
 {id:'SUMAR',label:'Sumar / Frente Amplio',parties:['SUMAR']},
 {id:'PODEMOS',label:'Podemos',parties:['PODEMOS']},
 {id:'PP_VOX',label:'PP + Vox',parties:['PP','VOX']},
 {id:'PP_VOX_UPN',label:'PP + Vox + UPN',parties:['PP','VOX','UPN']},
 {id:'PSOE_SUMAR',label:'PSOE + Sumar / FA',parties:['PSOE','SUMAR']},
 {id:'PSOE_SUMAR_PODEMOS',label:'PSOE + Sumar / FA + Podemos',parties:['PSOE','SUMAR','PODEMOS']}
];
export function measurePoll(p,parts){
 const values=parts.map(part=>{
  const found=Object.entries(p.values||{}).filter(([label,value])=>canonical(label)===part&&typeof value==='number'&&Number.isFinite(value));
  return found.length===1?found[0][1]:null;
 });
 return values.every(Number.isFinite)?values.reduce((a,b)=>a+b,0):null;
}
export function publishedSeries(polls,eventDate,groupId,windowDays=90){
 const group=SERIES_GROUPS.find(x=>x.id===groupId);if(!group)throw Error('Agrupación no encontrada');
 const start=dateNum(eventDate)-windowDays,end=dateNum(eventDate)+windowDays;
 const rows=polls.filter(p=>p.kind==='poll-estimate'&&p.published&&p.fieldEnd&&p.fieldStart&&dateNum(p.published)>=start&&dateNum(p.published)<=end&&p.fieldEnd<=p.published&&p.fieldEnd>=eventDate.slice(0,4)+'-01-01')
 .map(p=>({...p,metric:measurePoll(p,group.parties)}))
 .filter(p=>p.metric!==null)
 .sort((a,b)=>a.published.localeCompare(b.published)||a.institute.localeCompare(b.institute));
 const dates=[...new Set(rows.map(p=>p.published))];
 const snapshots=dates.map(cut=>{
  const houses=new Map();
  for(const p of rows.filter(x=>x.published<=cut&&dateNum(x.fieldEnd)>=dateNum(cut)-90).sort((a,b)=>b.fieldEnd.localeCompare(a.fieldEnd)||b.published.localeCompare(a.published)))
   if(!houses.has(p.institute))houses.set(p.institute,p);
  const contributors=[...houses.values()];
  return {date:cut,mean:contributors.reduce((a,p)=>a+p.metric,0)/contributors.length,houses:contributors.length,contributors:contributors.map(p=>({institute:p.institute,id:p.id,metric:p.metric,fieldEnd:p.fieldEnd}))};
 });
 const byHouse=new Map();
 for(const p of rows){if(!byHouse.has(p.institute))byHouse.set(p.institute,[]);byHouse.get(p.institute).push(p);}
 return {group,rows,snapshots,houses:[...byHouse].map(([institute,observations])=>({institute,observations})),date:eventDate,windowDays};
}
function seriesGraphic(s){
 const width=940,height=335,axisLeft=56,axisRight=15,axisTop=35,axisBottom=65;
 const minimum=dateNum(s.date)-s.windowDays,maximum=dateNum(s.date)+s.windowDays;
 const all=s.rows.map(p=>p.metric),peak=Math.max(20,...all);
 const ymax=Math.ceil((peak+4)/10)*10;
 const x=date=>axisLeft+(dateNum(date)-minimum)/(maximum-minimum)*(width-axisLeft-axisRight);
 const y=v=>axisTop+(1-v/ymax)*(height-axisTop-axisBottom);
 const axis=[0,.25,.5,.75,1].map(f=>{
   const value=Math.round(ymax*f);
   return '<line x1="'+axisLeft+'" y1="'+y(value)+'" x2="'+(width-axisRight)+'" y2="'+y(value)+'" stroke="#dfe8db"/><text x="'+(axisLeft-10)+'" y="'+(y(value)+4)+'" text-anchor="end" fill="#5f7365" font-size="12">'+value+' %</text>';
 }).join('');
 const colors=['#17624e','#4b8663','#669c7e','#83ad90','#4c6959','#9a9366','#607e6e','#b5a76a'];
 const segments=s.houses.map((h,index)=>{
  const points=h.observations.map(p=>({x:x(p.published),y:y(p.metric),p}));
  const c=colors[index%colors.length];
  const line=points.length>1?'<polyline points="'+points.map(pt=>pt.x+','+pt.y).join(' ')+'" fill="none" stroke="'+c+'" stroke-width="2.5"/>':'';
  return line+points.map(pt=>'<circle cx="'+pt.x+'" cy="'+pt.y+'" r="5" stroke="white" stroke-width="1.5" fill="'+c+'"><title>'+escape(h.institute)+' · publicado '+escape(pt.p.published)+' · campo '+escape(pt.p.fieldStart)+'–'+escape(pt.p.fieldEnd)+' · '+format(pt.p.metric)+' %</title></circle>').join('');
 }).join('');
 const mean=s.snapshots.map((p,i)=>({x:x(p.date),y:y(p.mean),p}));
 const meanLine=mean.length>1?'<path d="'+mean.map((pt,i)=>(i===0?'M':'L')+pt.x+' '+pt.y).join(' ')+'" stroke="#183b2d" stroke-width="3" stroke-dasharray="8 5" fill="none"/>':'';
 const meanDots=mean.map(pt=>'<rect x="'+(pt.x-4)+'" y="'+(pt.y-4)+'" width="8" height="8" fill="#183b2d"><title>Promedio disponible '+escape(pt.p.date)+' · '+format(pt.p.mean)+' % · '+pt.p.houses+' casas</title></rect>').join('');
 return '<div class="series-scroll"><svg viewBox="0 0 '+width+' '+height+'" class="series-chart" role="img" aria-label="Estimaciones por instituto en cada publicación y promedio actualizado, con marca del acontecimiento">'
  +axis+'<line x1="'+x(s.date)+'" x2="'+x(s.date)+'" y1="'+axisTop+'" y2="'+(height-axisBottom)+'" stroke="#b77b3c" stroke-width="2" stroke-dasharray="4 5"/><text x="'+x(s.date)+'" y="20" fill="#9c672c" text-anchor="middle" font-size="12">Acontecimiento · '+formatDate(s.date)+'</text>'
  +segments+meanLine+meanDots+'<text x="'+axisLeft+'" y="'+(height-18)+'" font-size="12" fill="#5f7365">'+formatDate(new Date(minimum*86400000).toISOString().slice(0,10))+'</text>'
  +'<text x="'+(width-axisRight)+'" y="'+(height-18)+'" text-anchor="end" font-size="12" fill="#5f7365">'+formatDate(new Date(maximum*86400000).toISOString().slice(0,10))+'</text></svg></div>';
}
export function renderPublishedSeries(polls,eventDate,groupId='PP',windowDays=90){
 const s=publishedSeries(polls,eventDate,groupId,windowDays);
 const groupOptions=SERIES_GROUPS.map(g=>'<option value="'+g.id+'" '+(g.id===groupId?'selected':'')+'>'+escape(g.label)+'</option>').join('');
 const latest=s.snapshots.at(-1),coverage=s.houses.length;
 const graphic=s.rows.length?seriesGraphic(s):'<p class="empty">No existen encuestas completas para esta agrupación en la ventana seleccionada. No sustituimos datos ausentes por cero.</p>';
 const table=s.rows.map(p=>'<tr><td><b>'+escape(p.institute)+'</b></td><td>'+escape(p.published)+'</td><td>'+escape(p.fieldStart)+'–'+escape(p.fieldEnd)+'</td><td>'+format(p.metric)+' %</td><td><a href="'+escape(p.source)+'" target="_blank" rel="noopener">Original ↗</a></td></tr>').join('');
 const history=s.snapshots.map(p=>'<tr><td>'+escape(p.date)+'</td><td><b>'+format(p.mean)+' %</b></td><td>'+p.houses+'</td><td>'+p.contributors.map(x=>escape(x.institute)).join(', ')+'</td></tr>').join('');
 const result='<section class="panel series-panel"><div class="panel-head"><div><span class="eyebrow">Evolución demoscópica</span><h2>Trayectoria por casa y por bloques</h2><p class="muted">Puntos: encuestas realmente publicadas. Línea verde oscura discontinua: media de las últimas encuestas disponibles de cada instituto (ventana móvil de 90 días desde el fin del campo).</p></div></div>'
 +'<div class="toolbar"><label>Partido o bloque<select id="series-group">'+groupOptions+'</select></label></div>'
 +'<div class="series-stats"><div><span>Encuestas completas</span><b>'+s.rows.length+'</b></div><div><span>Institutos con dato</span><b>'+coverage+'</b></div><div><span>Último promedio disponible</span><b>'+(latest?format(latest.mean)+' %':'—')+'</b><small>'+(latest?latest.houses+' institutos · '+latest.date:'Sin datos')+'</small></div></div>'
 +'<div class="series-key"><span><i class="series-key-point"></i> Instituto (medición publicada)</span><span><i class="series-key-mean"></i> Promedio histórico actualizado</span><span><i class="series-key-event"></i> Fecha del acontecimiento</span></div>'
 +graphic
 +'<div class="notice"><b>Cómo interpretar esta evolución:</b> el eje temporal muestra <b>fechas de publicación</b> y el trabajo de campo consta en cada punto. Una variación del promedio puede deberse a la entrada o salida de una encuestadora, no a un cambio del electorado. Las medias no interpolan días sin encuestas. El impacto antes/después solo se evalúa con fechas de campo no solapadas.</div>'
 +'<div class="series-tables"><details><summary>Consultar todas las encuestas y las fuentes</summary><div class="table-wrap"><table><thead><tr><th>Instituto</th><th>Publicación</th><th>Entrevistas</th><th>Estimación</th><th>Fuente</th></tr></thead><tbody>'+table+'</tbody></table></div></details><details><summary>Auditar el promedio en cada fecha</summary><div class="table-wrap"><table><thead><tr><th>Fecha</th><th>Promedio</th><th>Institutos</th><th>Composición</th></tr></thead><tbody>'+history+'</tbody></table></div></details></div>'
 +'<p class="muted">Los bloques son sumas de porcentajes de voto para partidos que cada encuesta publica conjuntamente; no representan escaños ni pactos acreditados. Sumar / Frente Amplio agrupa etiquetas de escenarios diferentes y puede no ser comparable entre casas. El archivo todavía contiene pocas oleadas de un mismo instituto: los puntos aislados no constituyen tendencias de esa casa.</p></section>';
 return {html:result,series:s};
}
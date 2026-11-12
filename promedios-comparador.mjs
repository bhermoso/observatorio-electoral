/* Comparación descriptiva entre las cifras publicadas por cada casa.
   La tabla NO transforma respuestas individuales ni atribuye calidad a las casas. */
const h=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=x=>Number(x).toLocaleString('es-ES',{minimumFractionDigits:1,maximumFractionDigits:1});
export const VISIBLE_PARTIES=['PP','PSOE','VOX','Sumar/FA','Podemos'];
export function houseValue(p,key){
 if(key==='Sumar/FA'){
  const labels=['Sumar/FA','Frente Amplio','Sumar'].filter(k=>Number.isFinite(p.values?.[k]));
  return labels.length===1?p.values[labels[0]]:null;
 }
 return Number.isFinite(p.values?.[key])?p.values[key]:null;
}
export function renderHouseComparison(studies,summary,selected='todos'){
 if(selected==='todos'){
  const rows=summary.rows;
  const cards=VISIBLE_PARTIES.map(id=>{
   const v=summary.average?.[id];
   return {id,value:Number.isFinite(v?.value)?v.value:null,n:v?.count||0};
  }).sort((a,b)=>(b.value??-1)-(a.value??-1));
  const sourceTable=rows.map(({poll,weight})=>'<tr><th scope="row"><a href="'+h(poll.source)+'" target="_blank" rel="noopener">'+h(poll.institute)+'</a>'+(weight===0?' · excluida':'')+'</th>'+
   VISIBLE_PARTIES.map(k=>{const v=houseValue(poll,k);return '<td>'+(v===null?'—':fmt(v)+' %')+'</td>'}).join('')+'</tr>').join('');
  const options='<option value="todos" selected>Todos los partidos · panorama</option>'+VISIBLE_PARTIES.map(k=>'<option value="'+h(k)+'">'+h(k)+'</option>').join('');
  return '<div class="house-head"><div><h2>Qué publica cada encuestadora</h2><p>Todos los partidos en paralelo: ordenados por promedio disponible. Elige uno solo para explorar sus diferencias entre institutos.</p></div><label>Partido del gráfico<select id="analysis-party">'+options+'</select></label></div>'+
   '<div class="house-comparison-body"><div class="house-chart" role="group" aria-label="Panorama de todos los partidos"><div class="multi-parties-overview">'+cards.map(c=>'<div class="multi-party-choice"><strong>'+h(c.id)+'</strong><span>Promedio <b>'+(c.value===null?'Sin dato':fmt(c.value)+' %')+'</b></span><small>'+c.n+' estudios con cifra</small></div>').join('')+'</div><p class="house-chart-note">No se preselecciona ninguna candidatura. Cada promedio utiliza solo casas con dato de ese partido; la cobertura puede diferir.</p></div>'+
   '<details class="house-matrix-detail"><summary>Consultar tabla completa de institutos y fuentes</summary><div class="table-wrap house-matrix"><table><thead><tr><th>Instituto / fuente</th>'+VISIBLE_PARTIES.map(p=>'<th>'+h(p)+'</th>').join('')+'</tr></thead><tbody>'+sourceTable+'</tbody></table></div></details></div>';
 }
 if(!VISIBLE_PARTIES.includes(selected))throw Error('Partido de comparación desconocido');
 const rows=summary.rows,avg=summary.average[selected];
 const measured=rows.map(r=>({r,value:houseValue(r.poll,selected)})).filter(o=>o.value!==null);
 const mean=Number.isFinite(avg?.value)?avg.value:null;
 const values=[...measured.map(o=>o.value),...(mean===null?[]:[mean])];
 const floor=values.length?Math.max(0,Math.floor(Math.min(...values)-1)):0;
 const ceil=values.length?Math.min(100,Math.ceil(Math.max(...values)+1)):100;
 const span=Math.max(ceil-floor,1);
 const pos=v=>Math.max(0,Math.min(100,(v-floor)/span*100)).toFixed(2)+'%';
 const dots=rows.map(({poll,weight})=>{
  const value=houseValue(poll,selected);
  return `<div class="house-plot-row"><a class="house-plot-name" href="${h(poll.source)}" target="_blank" rel="noopener">${h(poll.institute)} ↗</a><span class="house-plot-track" style="--mean-x:${mean!==null?pos(mean):'50%'}">${value!==null?`<span class="house-plot-dot ${weight===0?'inactive':''}" style="left:${pos(value)}" title="${h(poll.institute)}: ${fmt(value)} %" aria-hidden="true"></span>`:''}</span><b>${value===null?'—':fmt(value)+' %'}</b></div>`;
 }).join('');
 const partyOptions=VISIBLE_PARTIES.map(p=>`<option value="${h(p)}" ${p===selected?'selected':''}>${h(p)}</option>`).join('');
 const cells=VISIBLE_PARTIES.map(k=>`<th scope="col">${h(k)}${k==='Sumar/FA'?' *':''}</th>`).join('');
 const table=rows.map(({poll,weight})=>`<tr class="${weight===0?'house-excluded':''}"><th scope="row"><a href="${h(poll.source)}" target="_blank" rel="noopener">${h(poll.institute)} ↗</a>${weight===0?'<small>Excluida del promedio</small>':''}</th>${VISIBLE_PARTIES.map(k=>{const v=houseValue(poll,k);return `<td>${v===null?'—':fmt(v)+' %'}</td>`;}).join('')}<td><small>${h(poll.fieldStart)}–${h(poll.fieldEnd)}</small><small>n=${Number.isFinite(poll.sample)?Number(poll.sample).toLocaleString('es-ES'):'—'}</small></td></tr>`).join('');
 return `<div class="house-head"><div><h2>Qué publica cada encuestadora</h2><p>Última encuesta de cada casa en la ventana seleccionada. Valores originales y sus fuentes; «—» no es cero.</p></div><label>Partido del gráfico<select id="analysis-party">${partyOptions}</select></label></div>
 <div class="house-comparison-body"><div class="house-chart" role="group" aria-label="Comparación de casas: ${h(selected)}">
 <div class="house-chart-top"><strong>${h(selected)}</strong><span>${mean===null?'Sin media comparable':'Promedio de casas activas: '+fmt(mean)+' %'} · ${avg?.count||0} con dato</span></div>
 ${measured.length?`<div class="house-plot" style="--mean-x:${mean!==null?pos(mean):'50%'}"><div class="house-plot-guide"><span>${fmt(floor)} %</span><span>${fmt(ceil)} %</span></div>${dots}</div>`:'<p>No hay encuestas con valores para este partido.</p>'}
 <p class="house-chart-note">Puntos = estimaciones publicadas, línea vertical = media ponderada de las casas activas. Una casa excluida permanece visible, pero no altera la media.</p></div>
 <details class="house-matrix-detail"><summary>Consultar tabla completa de institutos y fuentes</summary><div class="table-wrap house-matrix"><table><caption>Comparación por instituto, en porcentaje de voto estimado</caption><thead><tr><th scope="col">Instituto / fuente</th>${cells}<th scope="col">Campo / muestra</th></tr></thead><tbody>${table}</tbody></table></div></details></div>
 <p class="house-chart-note">* «Sumar/FA» reúne etiquetas publicadas diferentes solo para comparar; no implica que sean una candidatura idéntica. No se imputan partidos ausentes. Los pesos pueden editarse a continuación.</p>`;
}

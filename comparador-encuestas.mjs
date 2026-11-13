import {detailHtml} from './polls.mjs';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=v=>Number(v).toLocaleString('es-ES',{maximumFractionDigits:2});
const day=s=>Date.parse(s+'T12:00:00Z');
const palette=['#22664f','#a1402e','#344fa2','#786019','#963575','#15778a','#6c468c','#526b22','#1f65a0','#a25712','#983a49','#45715d','#615290','#3d6680','#77533b'];
export const housesOf=polls=>[...new Set(polls.map(p=>p.institute))].sort((a,b)=>a.localeCompare(b,'es'));
export function partiesOf(polls){
 const count=new Map();for(const p of polls)for(const key of Object.keys(p.values))count.set(key,(count.get(key)||0)+1);
 return [...count.keys()].sort((a,b)=>count.get(b)-count.get(a)||a.localeCompare(b,'es'));
}
export function selectStudies(polls,{houses,from='',until='',mode='all'}){
 if(from&&until&&from>until)return [];
 let rows=polls.filter(p=>houses.includes(p.institute)&&(!from||p.fieldEnd>=from)&&(!until||p.fieldEnd<=until)).sort((a,b)=>b.fieldEnd.localeCompare(a.fieldEnd)||b.published.localeCompare(a.published)||a.id.localeCompare(b.id));
 if(mode==='latest'){const seen=new Set();rows=rows.filter(p=>{if(seen.has(p.institute))return false;seen.add(p.institute);return true;});}
 return rows;
}
export function studyDifference(a,b,parties){
 return parties.map(party=>({party,a:Number.isFinite(a?.values?.[party])?a.values[party]:null,b:Number.isFinite(b?.values?.[party])?b.values[party]:null})).map(r=>({...r,delta:r.a===null||r.b===null?null:Number((r.b-r.a).toFixed(6))}));
}
export function selectionCSV(rows,parties){
 const quote=v=>'"'+String(v??'').replaceAll('"','""')+'"';
 return [['ID','Instituto','Inicio de campo','Fin de campo','Publicación','Muestra','Método','Denominador',...parties,'Fuente'],...rows.map(p=>[p.id,p.institute,p.fieldStart,p.fieldEnd,p.published,p.sample,p.mode,p.denominator,...parties.map(k=>Number.isFinite(p.values[k])?p.values[k]:''),p.source])].map(r=>r.map(quote).join(',')).join('\r\n')+'\r\n';
}
export function readSelection(polls,search=''){
 const q=new URLSearchParams(search),houses=housesOf(polls),parties=partiesOf(polls),year=polls.map(p=>p.published.slice(0,4)).sort().at(-1);
 const validDate=value=>/^\d{4}-\d{2}-\d{2}$/.test(value||'')&&Number.isFinite(day(value))&&new Date(day(value)).toISOString().slice(0,10)===value?value:'';
 return {houses:q.has('casas')?q.getAll('casa').filter((x,i,a)=>houses.includes(x)&&a.indexOf(x)===i):houses,parties:q.has('partidos')?q.getAll('partido').filter((x,i,a)=>parties.includes(x)&&a.indexOf(x)===i).slice(0,4):parties.slice(0,3),from:q.has('desde')?validDate(q.get('desde')):year+'-01-01',until:validDate(q.get('hasta')),mode:q.get('vista')==='latest'?'latest':'all',a:q.get('a'),b:q.get('b')};
}
export function selectionQuery(state){
 const q=new URLSearchParams({casas:'seleccion',partidos:'seleccion',desde:state.from,hasta:state.until,vista:state.mode});
 state.houses.forEach(x=>q.append('casa',x));state.parties.forEach(x=>q.append('partido',x));if(state.a)q.set('a',state.a);if(state.b)q.set('b',state.b);return q.toString();
}
export function renderComparisonChart(rows,party,{houses,top,start,end}){
 const points=rows.filter(p=>Number.isFinite(p.values[party])),values=points.map(p=>p.values[party]);
 const x=p=>48+(start===end ? .5 : (day(p.fieldEnd)-start)/(end-start))*424,y=v=>204-v/top*174;
 return `<figure class="compare-chart"><figcaption><h2>${esc(party)}</h2><p>${points.length} estimaciones${points.length?` · mínimo ${num(Math.min(...values))} % · máximo ${num(Math.max(...values))} %`:''}</p></figcaption>${points.length?`<svg viewBox="0 0 520 245" role="group" aria-label="${esc(party)}: estimaciones por fin de campo, pulsa un punto para ver la ficha"><title>${esc(party)} · misma escala en todos los gráficos</title>${Array.from({length:5},(_,i)=>{const v=top*i/4;return `<line x1="48" x2="472" y1="${y(v)}" y2="${y(v)}" stroke="#d8e0d8"/><text x="40" y="${y(v)+4}" text-anchor="end">${num(v)} %</text>`;}).join('')}${points.map(p=>`<circle cx="${x(p)}" cy="${y(p.values[party])}" r="7" fill="${palette[houses.indexOf(p.institute)%palette.length]}" stroke="#fff" stroke-width="1.5" data-study="${esc(p.id)}" role="button" tabindex="0" aria-label="Ficha ${esc(p.institute)}, campo hasta ${esc(p.fieldEnd)}, ${num(p.values[party])} por ciento"><title>${esc(p.institute)} · campo ${esc(p.fieldStart)}–${esc(p.fieldEnd)} · publicación ${esc(p.published)} · ${num(p.values[party])} %</title></circle>`).join('')}<text x="48" y="232">${new Date(start).toISOString().slice(0,10)}</text><text x="472" y="232" text-anchor="end">${new Date(end).toISOString().slice(0,10)}</text></svg>`:'<p class="compare-empty">Sin cifra publicada para esta etiqueta en la selección.</p>'}</figure>`;
}
export async function bindComparator(){
 const $=id=>document.getElementById(id),response=await fetch('data/polls.json');if(!response.ok)throw Error('No se pudo cargar el archivo de encuestas.');const polls=await response.json();
 const cis=polls.find(p=>p.id==='cis-3584'&&p.institute==='CIS');
 const houses=housesOf(polls),parties=partiesOf(polls);let state=readSelection(polls,location.search),selected=[];
 const message=text=>{$('compare-message').textContent=text;};
 $('compare-houses').innerHTML+=houses.map((h,i)=>`<label><input type="checkbox" value="${esc(h)}"><span style="color:${palette[i%palette.length]}">●</span> ${esc(h)}</label>`).join('');
 $('compare-parties').innerHTML+=parties.map(p=>`<label><input type="checkbox" value="${esc(p)}">${esc(p)}</label>`).join('');
 function sync(){
  for(const input of $('compare-houses').querySelectorAll('input'))input.checked=state.houses.includes(input.value);
  for(const input of $('compare-parties').querySelectorAll('input'))input.checked=state.parties.includes(input.value);
  $('compare-from').value=state.from;$('compare-until').value=state.until;$('compare-mode').value=state.mode;
 }
 function save(){history.replaceState(null,'','?'+selectionQuery(state));}
 function show(id){const p=polls.find(p=>p.id===id);if(!p)return;const dialog=$('compare-detail');dialog.innerHTML='<button class="secondary" type="button">Cerrar ficha ✕</button>'+detailHtml(p);dialog.querySelector('button').onclick=()=>dialog.close();dialog.showModal();}
 function bindPoints(root){root.querySelectorAll('[data-study]').forEach(point=>{point.onclick=()=>show(point.dataset.study);if(point.tagName.toLowerCase()==='circle')point.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();show(point.dataset.study);}};});}
 function pair(){
  state.a=$('compare-a').value;state.b=$('compare-b').value;const a=selected.find(p=>p.id===state.a),b=selected.find(p=>p.id===state.b);
  if(!a||!b){$('compare-difference').innerHTML='<p>Selecciona casas y fechas con estudios disponibles para contrastar dos fichas.</p>';return;}
  const differences=studyDifference(a,b,state.parties);
  $('compare-difference').innerHTML=`<p>Diferencia <b>B − A</b>, en puntos porcentuales. ${a.id===b.id?'Has seleccionado el mismo estudio en ambos lados.':'Un signo positivo indica una cifra mayor en B.'}</p><div class="compare-deltas">${differences.map(r=>`<article><span>${esc(r.party)}</span><strong>${r.delta===null?'—':(r.delta>0?'+':'')+num(r.delta)+' pp'}</strong><small>A: ${r.a===null?'sin cifra':num(r.a)+' %'} · B: ${r.b===null?'sin cifra':num(r.b)+' %'}</small></article>`).join('')}</div><p class="compare-note">A: campo ${esc(a.fieldStart)}–${esc(a.fieldEnd)} · ${esc(a.mode)} · ${esc(a.denominator)}.<br>B: campo ${esc(b.fieldStart)}–${esc(b.fieldEnd)} · ${esc(b.mode)} · ${esc(b.denominator)}.<br>Las diferencias describen estas publicaciones; pueden reflejar fechas, composición de muestra y método. No prueban un efecto de casa ni un cambio del electorado.</p><div class="compare-actions"><button class="secondary" data-study="${esc(a.id)}">Ficha A y escenario</button><button class="secondary" data-study="${esc(b.id)}">Ficha B y escenario</button></div>`;
  bindPoints($('compare-difference'));
 }
 function render(){
  selected=selectStudies(polls,state);const invalid=state.from&&state.until&&state.from>state.until;
  $('compare-count').textContent=invalid?'Periodo no válido: la fecha inicial debe ser anterior o igual a la final.':`${selected.length} estudios de ${new Set(selected.map(p=>p.institute)).size} institutos · ${state.parties.length} candidaturas seleccionadas`;
  $('compare-from').closest('details').querySelector('summary').textContent='Periodo · '+(state.from||'inicio del archivo')+' → '+(state.until||'último dato')+(state.mode==='latest'?' · última por casa':'');
  $('compare-parties').closest('details').querySelector('summary').textContent='Candidaturas · '+(state.parties.join(', ')||'elige hasta cuatro');
  $('compare-house-count').textContent=`· ${state.houses.length}/${houses.length}`;
  const values=selected.flatMap(p=>state.parties.map(k=>p.values[k]).filter(Number.isFinite));
  const options={houses,top:Math.max(10,Math.ceil(Math.max(0,...values)/10)*10),start:Math.min(...selected.map(p=>day(p.fieldEnd))),end:Math.max(...selected.map(p=>day(p.fieldEnd)))};
  $('compare-charts').innerHTML=!state.parties.length?'<p class="compare-empty">Elige entre una y cuatro candidaturas para empezar la comparación.</p>':!selected.length?'<p class="compare-empty">No hay estudios con estos filtros. Amplía las fechas o selecciona otros institutos.</p>':state.parties.map(p=>renderComparisonChart(selected,p,options)).join('');
  $('compare-legend').innerHTML=houses.filter(h=>selected.some(p=>p.institute===h)).map(h=>`<span><i style="background:${palette[houses.indexOf(h)%palette.length]}"></i>${esc(h)}</span>`).join('');
  const optionList=selected.map(p=>`<option value="${esc(p.id)}">${esc(p.institute)} · publicada ${esc(p.published)} · ${esc(p.title||p.id)}</option>`).join('');
  if(cis)$('compare-cis-state').textContent=selected.some(p=>p.id===cis.id)?'Incluido en la selección. En el gráfico está situado el '+cis.fieldEnd+', por fin de campo.':'Los filtros actuales lo excluyen. Usa «Mostrar en el gráfico» para abrirlo directamente.';
  const oldA=state.a,oldB=state.b;
  for(const id of ['compare-a','compare-b']){$(id).innerHTML=optionList;$(id).disabled=!selected.length;}
  $('compare-a').value=selected.some(p=>p.id===oldA)?oldA:selected[0]?.id||'';
  $('compare-b').value=selected.some(p=>p.id===oldB)?oldB:(selected.find(p=>p.institute!==selected[0]?.institute)||selected[1]||selected[0])?.id||'';
  pair();
  $('compare-table').innerHTML=`<table><caption>Estimaciones originales de voto. «—» significa cifra no publicada o no transcrita.</caption><thead><tr><th>Instituto y estudio</th><th>Fin de campo</th><th>Publicación</th>${state.parties.map(p=>`<th>${esc(p)}</th>`).join('')}<th>Ficha</th></tr></thead><tbody>${selected.map(p=>`<tr><td>${esc(p.institute)}<small>${esc(p.id)}</small></td><td>${esc(p.fieldEnd)}</td><td>${esc(p.published)}</td>${state.parties.map(k=>`<td>${Number.isFinite(p.values[k])?num(p.values[k])+' %':'—'}</td>`).join('')}<td><button class="secondary" data-study="${esc(p.id)}">Ver ficha</button></td></tr>`).join('')}</tbody></table>`;
  bindPoints($('compare-charts'));bindPoints($('compare-table'));$('compare-export').disabled=!selected.length;save();
 }
 $('compare-houses').onchange=()=>{state.houses=[...$('compare-houses').querySelectorAll('input:checked')].map(i=>i.value);message('');render();};
 $('compare-parties').onchange=e=>{const checked=[...$('compare-parties').querySelectorAll('input:checked')];if(checked.length>4){e.target.checked=false;message('Puedes comparar hasta cuatro candidaturas a la vez. Desmarca una para elegir otra.');return;}state.parties=checked.map(i=>i.value);message('');render();};
 for(const [id,key] of [['compare-from','from'],['compare-until','until'],['compare-mode','mode']])$(id).onchange=()=>{state[key]=$(id).value;message('');render();};
 for(const id of ['compare-a','compare-b'])$(id).onchange=()=>{pair();save();};
 $('compare-all').onclick=()=>{state.houses=[...houses];sync();render();};$('compare-none').onclick=()=>{state.houses=[];sync();render();};
 $('compare-history').onclick=()=>{state.from='';state.until='';sync();render();};$('compare-reset').onclick=()=>{state=readSelection(polls);sync();message('Selección inicial: las tres candidaturas con más estudios registrados y todas las casas del año más reciente.');render();};
 $('compare-export').onclick=()=>{const url=URL.createObjectURL(new Blob(['\ufeff'+selectionCSV(selected,state.parties)],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='comparacion-encuestas.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 $('compare-share').onclick=async()=>{try{await navigator.clipboard.writeText(location.href);message('Enlace copiado: conserva institutos, candidaturas, fechas y los dos estudios.');}catch{$('compare-link').hidden=false;$('compare-link').value=location.href;$('compare-link').focus();$('compare-link').select();message('Copia este enlace para compartir la selección.');}};
 window.addEventListener('popstate',()=>{state=readSelection(polls,location.search);sync();render();});
 if(cis){
  $('compare-cis').hidden=false;$('compare-cis').innerHTML=`<div><p class="eyebrow">Preelectoral · estudio 3584</p><h2>CIS · ${num(cis.sample)} entrevistas</h2><p><b>Publicado: ${esc(cis.published)}</b> · campo ${esc(cis.fieldStart)}–${esc(cis.fieldEnd)}.</p><p id="compare-cis-state"></p></div><div class="compare-actions"><button id="compare-cis-show" class="secondary">Mostrar en el gráfico</button><button id="compare-cis-detail" class="secondary">Abrir ficha y desglose</button><a href="misma-muestra.html?estudio=3584">Mismos datos, distintas recetas →</a></div>`;
  $('compare-cis-detail').onclick=()=>show(cis.id);$('compare-cis-show').onclick=()=>{state={...state,houses:['CIS'],parties:['PP','PSOE','VOX'],from:cis.fieldEnd,until:cis.fieldEnd,mode:'all',a:cis.id,b:cis.id};sync();render();message('CIS 3584 seleccionado: las tres candidaturas mostradas tienen cifras comparables. El eje usa fin de campo, no publicación.');$('compare-count').scrollIntoView({block:'center',behavior:'smooth'});};
 }
 if(matchMedia('(max-width:540px)').matches)document.querySelectorAll('.compare-filter').forEach(d=>d.open=false);
 sync();render();$('compare-loading').hidden=true;$('comparison').hidden=false;
}
if(typeof document!=='undefined')bindComparator().catch(e=>{document.getElementById('compare-loading').textContent=e.message;});

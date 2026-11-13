import {renderPollScatter} from './encuestas-visual.mjs';
import {recientesPrimero} from './orden.mjs';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const date=s=>s?new Date(s+'T12:00:00').toLocaleDateString('es-ES'):'No publicado';
const num=n=>Number(n).toLocaleString('es-ES',{maximumFractionDigits:2});
const lastVerification=polls=>polls.map(p=>p.verified).sort().at(-1);
export const POLL_COLUMNS=['PP','PSOE','VOX','Sumar/FA','Podemos','SALF'];
export function latestByInstitute(polls){
 const latest=new Map();
 for(const p of [...polls].sort((a,b)=>b.published.localeCompare(a.published)||b.fieldEnd.localeCompare(a.fieldEnd)))if(!latest.has(p.institute))latest.set(p.institute,p);
 return [...latest.values()];
}
export function partyKey(p,key){return key==='Sumar/FA'?['Sumar/FA','Frente Amplio','Sumar'].find(k=>Object.hasOwn(p.values,k)||p.seats&&Object.hasOwn(p.seats,k)):key;}
export function seatLabel(s){
 if(!s)return 'No publicado / no transcrito';
 const point=s.point===undefined?'':String(s.point);
 const range=s.min===undefined?'':s.min===s.max?String(s.min):`${s.min}–${s.max}`;
 return point&&range&&point!==range?`${point} (${range})`:point||range||'No publicado';
}
export function filterPollRecords(polls,{query='',institute='',year='',from='',until='',seatsOnly=false}={}){
 const q=query.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 return polls.filter(p=>(!year||p.published.startsWith(year))&&(!institute||p.institute===institute)&&(!from||p.fieldEnd>=from)&&(!until||p.fieldStart<=until)&&(!seatsOnly||p.seats!==null)&&`${p.id} ${p.title} ${p.institute} ${p.publisher}`.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().includes(q)).sort((a,b)=>b.published.localeCompare(a.published)||b.fieldEnd.localeCompare(a.fieldEnd));
}
function cell(p,key){const k=partyKey(p,key),value=p.values[k],seat=p.seats?.[k];return `<td>${value===undefined?'<span class="muted">—</span>':`<b>${num(value)} %</b>`}${seat?`<small class="published-seat">${esc(seatLabel(seat))} esc.</small>`:'<small class="muted">Escaños: —</small>'}${key==='Sumar/FA'&&k?`<small>${esc(k)}</small>`:''}</td>`;}
function table(polls,{details=false}={}){
 polls=[...polls].sort(recientesPrimero({fin:p=>p.fieldEnd,pub:p=>p.published,casa:p=>p.institute}));
 return `<div class="table-wrap"><table class="poll-comparison"><caption>Del fin de campo más reciente al más antiguo. Porcentajes y escaños publicados en las fuentes. «—» indica dato no publicado o no transcrito; nunca equivale a cero. Sumar/FA conserva la denominación de cada estudio.</caption><thead><tr><th>Instituto / comitente</th><th>Campo y publicación</th>${POLL_COLUMNS.map(k=>`<th>${esc(k)}</th>`).join('')}<th>${details?'Ficha':'Fuente'}</th></tr></thead><tbody>${polls.map(p=>`<tr><td><b>${esc(p.institute)}</b><small>${esc(p.publisher)}</small><small>${esc(p.title)}</small></td><td>${date(p.fieldStart)}–${date(p.fieldEnd)}<small>Publicada: ${date(p.published)}</small></td>${POLL_COLUMNS.map(k=>cell(p,k)).join('')}<td>${details?`<button class="secondary poll-detail-button" data-poll="${esc(p.id)}">Ficha y desglose</button>`:`<a href="${esc(p.source)}" target="_blank" rel="noopener">Original ↗</a>`}</td></tr>`).join('')||'<tr><td colspan="9" class="empty">No hay encuestas que coincidan con los filtros.</td></tr>'}</tbody></table></div>`;
}
export function renderPollOverview(polls){
 const latest=latestByInstitute(polls),year=polls.map(p=>p.published.slice(0,4)).sort().at(-1),current=latest.filter(p=>p.published.startsWith(year));
 return `<section class="panel current-polls"><div class="panel-head"><div><div class="eyebrow">Encuestas publicadas · última ficha revisada: ${date(lastVerification(polls))}</div><h2>Una fuente, una estimación</h2><p class="muted">Última encuesta incorporada de cada instituto · ${current.length} casas. No es una media ni un pronóstico propio.</p></div><span class="badge poll">Estimaciones</span></div>${table(current)}<a href="#encuestas" class="panel-link">Consultar las ${polls.length} encuestas, fichas y escaños publicados →</a></section>`;
}
export function renderReferenceDirectory(references){
 const entries=references.filter(r=>['aggregate-model','editorial-analysis'].includes(r.kind)&&r.source&&r.published).sort((a,b)=>b.published.localeCompare(a.published));
 if(!entries.length)return '';
 return `<section class="reference-directory" id="analisis-externos"><div class="section-title"><div><div class="eyebrow">Comparación y validación · Fuentes independientes</div><h2>Otros modelos y análisis: Kiko Llaneras / EL PAÍS</h2></div></div><p class="prose">Comparar pronósticos, escenarios de coalición y validaciones retrospectivas permite examinar nuestros supuestos. <b>No son encuestas adicionales</b>: no se suman a la base de institutos ni alteran automáticamente el Motor 29N.</p><div class="grid">${entries.map(r=>`<article class="panel"><span class="badge sim">${r.kind==='aggregate-model'?'Modelo externo · no sumar como encuesta':'Análisis externo · no es encuesta'}</span><h3>${esc(r.name)}</h3><p class="muted">Publicado: ${date(r.published)} · Fuente: ${esc(r.publisher||'Original')}</p><p class="prose">${esc(r.notes)}</p><p class="prose"><b>Método:</b> ${esc(r.methodology||'Consultar la fuente original')}</p>${r.approximateValues?`<p class="prose"><b>Referencia histórica de ${date(r.published)}:</b> ${Object.entries(r.approximateValues).map(([k,v])=>esc(k)+' ≈ '+num(v)+' %').join(' · ')}. No representa una actualización al día de hoy.</p>`:''}<a href="${esc(r.source)}" target="_blank" rel="noopener">Leer análisis original ↗</a></article>`).join('')}</div></section>`;
}

export function renderPollArchive(polls,references=[]){
 const institutes=[...new Set(polls.map(p=>p.institute))].sort((a,b)=>a.localeCompare(b,'es'));
 const years=[...new Set(polls.map(p=>p.published.slice(0,4)))].sort().reverse();
 return `<div class="hero"><div><div class="eyebrow">Archivo documental / ${polls.length} estudios / ${institutes.length} institutos</div><h1>Las encuestas, con su fuente.</h1><p>Estimaciones publicadas, fechas de campo y escaños de cada instituto. Un registro abierto para comparar sin mezclar métodos ni escenarios.</p></div><div class="hero-aside"><span class="badge poll">Encuestas publicadas</span><br><br><strong>Última ficha revisada: ${date(lastVerification(polls))}</strong>Archivo histórico y selección de publicaciones</div></div><div class="notice">COBERTURA EN AMPLIACIÓN · Se han incorporado ${polls.length} estudios: ${years.map(y=>`${polls.filter(p=>p.published.startsWith(y)).length} de ${y}`).join(" y ")}. La revisión está programada diariamente; el archivo no es exhaustivo ni se actualiza en tiempo real. Los escaños de esta sección pertenecen a las fuentes: el simulador sigue separado.</div><div class="toolbar"><label>Buscar estudio<input id="poll-search" type="search" placeholder="Instituto, comitente o título…"></label><label>Instituto<select id="poll-institute"><option value="">Todos los institutos</option>${institutes.map(i=>`<option>${esc(i)}</option>`).join('')}</select></label><label>Periodo<select id="poll-year"><option value="">Todo el archivo</option>${years.map(y=>`<option value="${y}" ${y===years[0]?'selected':''}>${y}</option>`).join('')}</select></label></div><div class="toolbar"><label>Campo desde<input id="poll-from" type="date"></label><label>Campo hasta<input id="poll-until" type="date"></label><label class="poll-checkbox"><input id="poll-seats-only" type="checkbox">Solo estudios con escaños transcritos</label><button id="poll-reset" class="secondary">Limpiar filtros</button><a class="button secondary" href="data/polls.csv" download>Encuestas CSV ↓</a><a class="button secondary" href="data/poll-results.csv" download>Voto y escaños CSV ↓</a></div><section id="encuestas-visual" class="panel"><h2>Dispersión de estimaciones publicadas</h2><label>Candidatura · etiqueta original<select id="poll-chart-party"><option value="">Selecciona candidatura</option>${[...new Set(polls.flatMap(p=>Object.keys(p.values)))].sort().map(k=>`<option>${esc(k)}</option>`).join('')}</select></label><div id="poll-chart"></div></section><details class="panel" open><summary>Tabla del archivo · fichas y cifras originales</summary><div id="poll-count" role="status" class="muted"></div><div id="poll-table"></div></details><dialog id="poll-detail" class="poll-detail poll-detail-dialog" aria-label="Ficha de la encuesta"></dialog><div class="notice">Las horquillas por partido no se suman como si fueran un único Congreso. El margen general de la ficha tampoco es un intervalo de confianza de cada estimación de voto. Las diferencias de cobertura territorial y de candidaturas están documentadas en cada ficha.</div>`;
}
function detailHtml(p){
 const keys=[...new Set([...Object.keys(p.values),...Object.keys(p.seats||{})])];
 const total=Object.values(p.seats||{}).every(s=>s.point!==undefined)?Object.values(p.seats||{}).reduce((s,x)=>s+x.point,0):null;
 return `<div class="panel-head"><div><span class="badge poll">Estimación publicada · ${esc(p.institute)}</span><h2>${esc(p.title)}</h2><p class="muted">Encargada / publicada por ${esc(p.publisher)} · ${esc(p.id)}</p></div><a class="button secondary" href="${esc(p.source)}" target="_blank" rel="noopener">Publicación original ↗</a></div><div class="detail-metrics"><span><b>${num(p.sample)}</b>entrevistas</span><span><b>${esc(p.mode||'No consta')}</b>método de entrevista</span></div><p class="prose"><b>Campo:</b> ${date(p.fieldStart)}–${date(p.fieldEnd)}. <b>Publicación:</b> ${date(p.published)}. <b>Ámbito:</b> ${esc(p.scope)}. <b>Universo:</b> ${esc(p.universe)}.</p><p class="prose"><b>Escenario de candidaturas:</b> ${esc(p.scenario)}.</p><p class="prose">${esc(p.notes)} ${esc(p.publicationNote||'')}</p><div class="table-wrap"><table><caption>Desglose de voto sobre ${esc(p.denominator)} y escaños publicados. No se calcula ningún escaño a partir de estos porcentajes.</caption><thead><tr><th>Formación / categoría de la fuente</th><th>Voto estimado</th><th>Escaños publicados</th></tr></thead><tbody>${keys.map(k=>`<tr><td>${esc(p.sourceLabels?.[k]||k)}${p.sourceLabels?.[k]&&k.includes('(')?'<small class="muted">Candidatura desglosada; no homologada automáticamente a otras etiquetas.</small>':''}</td><td>${p.values[k]===undefined?'No publicado / no transcrito':num(p.values[k])+' %'}</td><td>${esc(seatLabel(p.seats?.[k]))}</td></tr>`).join('')}</tbody></table></div><p class="prose"><b>Reparto de escaños:</b> ${esc(p.seatNotes)}${total?` Total de puntos publicados transcritos: ${total}.`:''}</p><div class="sources"><b>Verificación:</b> ${esc(p.verification)}<br><b>Localización:</b> ${esc(p.sourcePages)}<br>Revisado: ${date(p.verified)} · <a href="${esc(p.technical)}" target="_blank" rel="noopener">Ficha / informe original ↗</a>${/^data\/sources\/[a-z0-9-]+\.json$/.test(p.dataFile||'')?` · <a href="${esc(p.dataFile)}" download>Voto directo, provincias y trazabilidad (JSON) ↓</a>`:''}${p.microdata?` · <a href="${esc(p.microdata)}" target="_blank" rel="noopener">Acceso a microdatos en origen ↗</a>`:''}</div>`;
}
export function bindPollArchive(polls){
 const $=s=>document.querySelector(s);
 const show=id=>{const p=polls.find(p=>p.id===id);if(!p)return;const dialog=$('#poll-detail');dialog.innerHTML='<button type="button" class="secondary poll-dialog-close">Cerrar ficha ✕</button>'+detailHtml(p);dialog.querySelector('button').onclick=()=>dialog.close();dialog.showModal();};
 const filter=()=>{
  const list=filterPollRecords(polls,{query:$('#poll-search').value,institute:$('#poll-institute').value,year:$('#poll-year').value,from:$('#poll-from').value,until:$('#poll-until').value,seatsOnly:$('#poll-seats-only').checked});
  const invalid=$('#poll-from').value&&$('#poll-until').value&&$('#poll-from').value>$('#poll-until').value;
  $('#poll-count').textContent=invalid?'Intervalo no válido: la fecha inicial debe ser anterior a la final.':`${list.length} estudios · ${new Set(list.map(p=>p.institute)).size} institutos. El intervalo de campo se filtra por solapamiento.`;
  $('#poll-chart').innerHTML=renderPollScatter(invalid?[]:list,$('#poll-chart-party').value);
  $('#poll-table').innerHTML=table(invalid?[]:list,{details:true});
  document.querySelectorAll('#poll-table [data-poll],#poll-chart [data-poll]').forEach(b=>{
   const open=()=>{show(b.dataset.poll);};
   b.onclick=open;if(b.tagName.toLowerCase()==='circle')b.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open();}};
  });
  if($('#poll-detail').open)$('#poll-detail').close();
 };
 for(const id of ['poll-search','poll-institute','poll-year','poll-from','poll-until','poll-seats-only','poll-chart-party'])$('#'+id).addEventListener('input',filter);
 $('#poll-reset').onclick=()=>{for(const id of ['poll-search','poll-institute','poll-year','poll-from','poll-until'])$('#'+id).value='';$('#poll-seats-only').checked=false;filter();};
 filter();
}

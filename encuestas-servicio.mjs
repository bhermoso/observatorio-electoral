import {renderMicrodataResults} from './buscador-microdatos.mjs';
import {fetchEstadoCircuito,renderEstadoCircuito,fetchPublishedPolls} from './actualizar-encuestas.mjs';
export {fetchPublishedPolls};
export const SERVICE_URL='data/vigilancia/candidatos.json';
export const REVIEW_URL='https://github.com/bhermoso/observatorio-electoral/actions/workflows/vigilancia-encuestas.yml';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const when=v=>v?new Date(v).toLocaleString('es-ES',{timeZone:'Europe/Madrid'}):'sin registro';
const fresh=url=>url+(url.includes('?')?'&':'?')+'consulta='+Date.now();
const safe=v=>{try{const u=new URL(v);return u.protocol==='https:'&&!u.username&&!u.password?u.href:null;}catch{return null}};
export async function serviceRequest(action,{signal,fetcher=fetch}={}){
 if(!['scan','status','approved'].includes(action))throw Error('La edición se realiza mediante revisión en GitHub.');
 const local=action==='approved'?'data/ingesta/validadas.json':SERVICE_URL;
 const raw='https://raw.githubusercontent.com/bhermoso/observatorio-electoral/main/'+local;
 let last;
 for(const url of [raw,local]){
  try{const r=await fetcher(fresh(url),{method:'GET',cache:'no-store',signal:signal?AbortSignal.any([signal,AbortSignal.timeout(12000)]):AbortSignal.timeout(12000)});
   if(!r.ok)throw Error('HTTP '+r.status);const d=await r.json();
   if(action==='approved'){if(!Array.isArray(d))throw Error('Bandeja inválida');return d;}
   if(!d||!Array.isArray(d.results)||!Array.isArray(d.sources))throw Error('Informe de vigilancia inválido');
   return {...d,report_origin:url===local?'copia del sitio':'archivo versionado de GitHub'};
  }catch(e){last=e;if(signal?.aborted)throw e;}
 }
 throw Error('No se pudo consultar la vigilancia: '+last.message);
}
export function parsePercentages(text) {
 const values={};
 for(const line of text.split(/\r?\n/).filter(l=>l.trim())) {
  const parts=line.match(/^\s*([^:]+):\s*(\d+(?:[.,]\d+)?)\s*%?\s*$/);
  if(!parts)throw Error('Escribe una formación y su porcentaje por línea, por ejemplo PP: 30,2.');
  const k=parts[1].trim(),v=Number(parts[2].replace(',','.'));
  if(Object.hasOwn(values,k)||['__proto__','constructor','prototype'].includes(k)||v>100)throw Error('Formación duplicada o porcentaje inválido: '+k);
  values[k]=v;
 }
 if(!Object.keys(values).length)throw Error('Faltan los porcentajes contrastados.');
 return values;
}

export function renderSeguimientos(items=[]){
 return items.length?`<section aria-label="Publicaciones en seguimiento"><h3>Publicaciones en seguimiento</h3>${items.map(x=>{const url=safe(x.url);return `<article><strong>${esc(x.titulo)}</strong><p>${esc(x.estado)}${x.fecha_prevista?' · '+esc(x.fecha_prevista):''}</p><p>${esc(x.detalle)}</p>${url?`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">Consultar fuente ↗</a>`:''}</article>`;}).join('')}</section>`:'';
}
export function diverseCandidates(items,limit=45){
 const groups=new Map();
 for(const x of items){const key=x.source_id||x.topic||'sin-fuente';if(!groups.has(key))groups.set(key,[]);groups.get(key).push(x);}
 const selected=[];
 for(let round=0;selected.length<limit;round++){
  let found=false;for(const group of groups.values()){if(group[round]&&selected.length<limit){selected.push(group[round]);found=true;}}if(!found)break;
 }
 return selected;
}
export function renderCandidates(data){
 const d=data||{},items=d.results||[],sources=d.sources||[];
 return `${renderSeguimientos(d.seguimientos)}<div class="news-status"><span class="news-status-label">${d.status==='failed'?'Búsqueda fallida':d.status==='partial'?'Cobertura parcial':d.checked_at?'Fuentes consultadas':'Sin búsqueda registrada'}</span><p>Última búsqueda útil: <b>${esc(when(d.checked_at))}</b><br>Último intento: ${esc(when(d.last_attempt_at))}</p></div>
 <p class="muted">${sources.filter(s=>s.ok).length} de ${sources.length} fuentes accesibles · ${items.length} publicaciones candidatas. Consultar este informe no inicia otra búsqueda ni incorpora encuestas al modelo.</p>
 <details class="news-source-audit"><summary>Comprobar las fuentes y sus incidencias</summary><ul>${sources.map(s=>`<li><b>${esc(s.name)}</b> · ${s.ok?`${s.count} candidatos`:esc(s.error)} · ${s.attempts} intento(s) · ${safe(s.url)?`<a href="${esc(safe(s.url))}" target="_blank" rel="noopener noreferrer">Fuente</a>`:''}</li>`).join('')}</ul></details>
 ${d.status==='failed'?'<p role="alert">Las fuentes fallaron. Se conserva la búsqueda anterior y su fecha; no equivale a una búsqueda sin novedades.</p>':''}
 <div class="news-candidates">${diverseCandidates(items).map(x=>{const url=safe(x.url);return `<article><div class="eyebrow">${esc(x.topic)}</div><h3>${esc(x.title)}</h3><p class="muted">${x.published?esc(when(x.published)):'Fecha no indicada en el índice · revisar original'}</p>${url?`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">Leer la publicación original ↗</a>`:''}<small>Candidato documental · sin verificar</small></article>`;}).join('')||'<p>No hay candidatos en este informe. Revisa la cobertura de fuentes antes de concluir que no existen novedades.</p>'}</div>`;
}
export const NOVEDADES_TYPES=['Todos','Encuestas','Estimaciones','Promedios','Microdatos','Documentación','Noticias'];
export function candidateType(x){
 const t=(x.title||'')+' '+(x.url||'');
 if(/microdato|respuestas.individuales|\.(zip|sav|dta|csv|xlsx)(?:$|\?)/i.test(t))return 'Microdatos';
 if(/cuestionario|ficha.t[eé]cnica|metodolog|ponderaci[oó]n|\.pdf(?:$|\?)/i.test(t))return 'Documentación';
 if(/promedio|media.de.encuestas|agregador/i.test(t))return 'Promedios';
 if(/estimaci[oó]n|proyecci[oó]n|reestimaci[oó]n/i.test(t))return 'Estimaciones';
 if(/encuesta|sondeo|bar[oó]metro|tracking/i.test(t))return 'Encuestas';
 return 'Noticias';
}
export async function readUpdateData(path,{fetcher=fetch,signal,versioned=true}={}){
 const urls=versioned?['https://raw.githubusercontent.com/bhermoso/observatorio-electoral/main/'+path,path]:[path];
 for(const url of urls){try{const r=await fetcher(fresh(url),{cache:'no-store',signal:signal?AbortSignal.any([signal,AbortSignal.timeout(12000)]):AbortSignal.timeout(12000)});if(r.ok)return {data:await r.json(),origin:url===path?'copia publicada':'archivo versionado'};}catch(e){if(signal?.aborted)throw e;}}
 throw Error('No disponible: '+path);
}
export function renderUpdateSummary({polls,micro,machine,forecast,references}={}){
 const count=v=>Array.isArray(v)?v.length:'sin confirmar';
 return `<dl class="pipeline-status"><div><dt>Archivo incorporado</dt><dd>${count(polls)} encuestas · ${count(references)} promedios y otras referencias</dd></div><div><dt>Microdatos preparados para experimentar</dt><dd>${count(machine?.studies)} estudios en el laboratorio · no alimentan el pronóstico principal</dd></div><div><dt>Datos utilizados por el motor</dt><dd>${Array.isArray(forecast?.entradas)?forecast.entradas.length:'sin confirmar'} registros de entrada · corte ${esc(forecast?.corte||'sin confirmar')}. Son estimaciones publicadas, no entrevistas individuales. <a href="#pronostico-cap5">Ver selección y exclusiones</a></dd></div><div><dt>Hallazgos de microdatos</dt><dd>${Array.isArray(micro?.candidates)?micro.candidates.filter(x=>x.estado==='nuevo_enlace_sin_auditar').length:'sin confirmar'} enlaces pendientes de auditar. Un enlace no acredita una matriz descargada ni homologada.</dd></div></dl>`;
}
export function renderPollUpdate(){return `<section class="panel poll-update" aria-labelledby="poll-update-title"><span class="eyebrow">Fuentes para mejorar la estimación</span><h2 id="poll-update-title">Buscar novedades</h2><p>Encuestas, estimaciones, promedios, noticias, microdatos, cuestionarios y fichas técnicas. La vigilancia consulta productores y medios cuatro veces al día.</p><div class="toolbar"><a class="button" id="launch-discovery" href="${REVIEW_URL}" target="_blank" rel="noopener noreferrer">Buscar novedades en GitHub ↗</a><button id="dispatch-polls" type="button">Consultar novedades</button><button id="reload-polls" class="secondary" type="button">Recargar archivo verificado</button></div><p class="muted">Para iniciar una búsqueda nueva, abre GitHub y pulsa «Run workflow» con tu sesión autorizada. Al volver se consulta el último informe; abrir GitHub no confirma que hayas ejecutado la búsqueda. No se solicitan claves en esta web.</p><p id="poll-dispatch-status" role="status"></p><p id="poll-reload-status" role="status"></p><div id="update-summary" aria-live="polite">Consultando datos incorporados y utilizados…</div><label>Filtrar hallazgos<select id="discovery-type">${NOVEDADES_TYPES.map(t=>`<option>${t}</option>`).join('')}</select></label><label>Medio o productor<select id="discovery-source"><option value="">Todas las fuentes</option></select></label><p class="muted">Hallazgos por turnos entre fuentes; la recencia se conserva dentro de cada fuente. La presencia no implica respaldo a su línea editorial ni verificación del contenido. Abre «Comprobar las fuentes» para ver cobertura e incidencias.</p><div id="poll-candidates-list">Consultando la vigilancia…</div><details id="discovery-microdata"><summary>Microdatos y archivos originales · hallazgos de productores</summary><p>La búsqueda localiza archivos. Descargar, comprobar variables y homologar respuestas son pasos distintos. Las nuevas recetas se contrastarán y discutirán antes de cambiar el motor.</p><div id="discovery-microdata-results">Consultando el informe de microdatos…</div><a href="#archivo-microdatos">Catálogo y estado de los originales →</a></details><details><summary>Cómo incorporar y publicar</summary><p>Contrasta fuente original, fechas, ámbito, muestra, porcentajes y denominador. Propón una encuesta en <a href="https://github.com/bhermoso/observatorio-electoral/edit/main/data/ingesta/validadas.json">la bandeja versionada de fichas</a>. La tarea incorpora únicamente fichas verificadas y solicita el recálculo y la publicación cuando cambia el archivo. Las estimaciones contrastadas entran por el proceso editorial. Los promedios y reestimaciones se documentan como referencias, sin añadir muestras. Las noticias aportan contexto, sin ajustes automáticos.</p><p>Para microdatos: comprobar licencia, integridad, cuestionario, códigos, pesos y compatibilidad temporal; conservar originales en la custodia correspondiente y publicar resultados agregados. Encontrar o descargar no equivale a utilizar en el pronóstico.</p></details><details><summary>Auditar el circuito de incorporación y publicación</summary><div id="pipeline-status">Consultando…</div></details></section>`;}
export function consultationFeedback(previous,current,now=new Date()){
 const stamp=now.toLocaleTimeString('es-ES',{timeZone:'Europe/Madrid',hour:'2-digit',minute:'2-digit',second:'2-digit'});
 const rows=current.results||[],before=new Set((previous?.results||[]).map(x=>x.url));
 const same=previous&&previous.checked_at===current.checked_at&&previous.last_attempt_at===current.last_attempt_at&&JSON.stringify(previous.results)===JSON.stringify(current.results);
 const added=rows.filter(x=>!before.has(x.url)).length;
 const result=same?'Mismo informe que ya veías; no hay un informe posterior.':previous?`Informe actualizado: ${added} ${added===1?'publicación nueva':'publicaciones nuevas'} desde tu consulta anterior.`:`Informe cargado: ${rows.length} publicaciones candidatas.`;
 return `Consultado a las ${stamp}. ${result} Última búsqueda: ${when(current.checked_at)}. Origen: ${current.report_origin||'sin confirmar'}. Consultar no inicia otra búsqueda ni incorpora datos al motor.`;
}
export function bindPollUpdate(onReload){
 const $=s=>document.querySelector(s),button=$('#dispatch-polls'),reload=$('#reload-polls');if(!button||!reload)return ()=>{};
 const controller=new AbortController(),signal=controller.signal,root=$('#poll-candidates-list'),note=$('#poll-dispatch-status');
 let report=null,busy=false;
 function draw(){if(!report)return;const type=$('#discovery-type').value;const source=$('#discovery-source').value;const items=report.results.filter(x=>(type==='Todos'||candidateType(x)===type)&&(!source||x.source_id===source));root.innerHTML=`<p role="status">${items.length} de ${report.results.length} hallazgos · ${esc(type)}. Se muestran hasta 45 por filtro.</p>`+renderCandidates({...report,results:items});}
 $('#discovery-type').onchange=draw;$('#discovery-source').onchange=draw;
 function refreshPipeline(){
  const boundedFetch=(url,options={})=>fetch(fresh(url),{...options,signal:AbortSignal.any([signal,AbortSignal.timeout(12000)])});
  void fetchEstadoCircuito(boundedFetch).then(({estado,publicacion})=>{if(!signal.aborted)$('#pipeline-status').innerHTML=renderEstadoCircuito(estado,publicacion);}).catch(()=>{if(!signal.aborted)$('#pipeline-status').textContent='Estado de publicación no disponible; consulta GitHub.';});
 }
 async function refresh(){if(busy||signal.aborted)return;busy=true;button.disabled=true;button.textContent='Consultando…';note.textContent='Consultando informes de publicaciones y microdatos…';root.setAttribute('aria-busy','true');
  const paths=['data/vigilancia/microdatos.json','data/polls.json','data/microdatos/maquina/index.json','data/modelo/pronostico.json','data/references.json'];
  let feedback='';
  try{
   const publications=serviceRequest('status',{signal}).then(data=>{
    if(signal.aborted||!root.isConnected)return data;
    feedback=consultationFeedback(report,data);report=data;
    const picker=$('#discovery-source'),selected=picker.value;picker.innerHTML='<option value="">Todas las fuentes</option>'+data.sources.map(x=>`<option value="${esc(x.id)}">${esc(x.name)}${x.ok?'':' · no accesible'}</option>`).join('');if([...picker.options].some(x=>x.value===selected))picker.value=selected;draw();root.setAttribute('aria-busy','false');note.textContent=feedback+' Completando la consulta de microdatos y del motor…';return data;
   });
   const results=await Promise.allSettled([publications,...paths.map(path=>readUpdateData(path,{signal,versioned:!path.includes('/modelo/')}))]);
   if(signal.aborted||!root.isConnected)return;
   if(results[0].status!=='fulfilled'){
    feedback=report?'No se pudo obtener un informe nuevo. Se conserva el último que estabas viendo, con su fecha.':'No se pudo consultar la vigilancia. Reintenta la consulta o revisa GitHub.';
    if(!report)root.textContent=feedback;
   }
   const values=results.slice(1).map(x=>x.status==='fulfilled'?x.value.data:null),[micro,polls,machine,forecast,references]=values;
   $('#update-summary').innerHTML=renderUpdateSummary({micro,polls,machine,forecast,references});
   $('#discovery-microdata-results').innerHTML=micro&&Array.isArray(micro.candidates)?`<p>Último intento: ${esc(when(micro.last_attempt_at))} · ${esc(micro.status)}. ${esc(results[1].value.origin)}.</p>`+renderMicrodataResults(micro):'<p>Informe de microdatos no disponible. No equivale a ausencia de novedades.</p>';
   note.textContent=feedback+(results.some(x=>x.status==='rejected')?' Consulta parcial: algún informe no está disponible.':' Microdatos y estado del motor consultados.');
   refreshPipeline();
  }catch(e){if(!signal.aborted)note.textContent='Consulta interrumpida: '+e.message;}
  finally{busy=false;if(!signal.aborted){button.disabled=false;button.textContent='Consultar novedades';root.setAttribute('aria-busy','false');}}
 }
 button.onclick=()=>refresh();
 $('#launch-discovery').onclick=()=>{note.textContent='Confirma «Run workflow» en GitHub. Al volver se consultarán los informes; todavía no se acredita una búsqueda nueva.';};
 window.addEventListener('focus',refresh,{signal});
 reload.onclick=async()=>{reload.disabled=true;const status=$('#poll-reload-status');try{status.textContent=await onReload(signal);}catch(e){if(!signal.aborted)status.textContent='Error al recargar: '+e.message;}finally{reload.disabled=false;}};
 void refresh();return ()=>controller.abort();
}

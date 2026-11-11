import {fetchEstadoCircuito,renderEstadoCircuito,fetchPublishedPolls} from './actualizar-encuestas.mjs';
export {fetchPublishedPolls};
export const SERVICE_URL='data/vigilancia/candidatos.json';
export const REVIEW_URL='https://github.com/bhermoso/observatorio-electoral/actions/workflows/vigilancia-encuestas.yml';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const when=v=>v?new Date(v).toLocaleString('es-ES',{timeZone:'Europe/Madrid'}):'sin registro';
const safe=v=>{try{const u=new URL(v);return u.protocol==='https:'&&!u.username&&!u.password?u.href:null;}catch{return null}};
export async function serviceRequest(action,{signal,fetcher=fetch}={}){
 if(!['scan','status','approved'].includes(action))throw Error('La edición se realiza mediante revisión en GitHub.');
 const local=action==='approved'?'data/ingesta/validadas.json':SERVICE_URL;
 const raw='https://raw.githubusercontent.com/bhermoso/observatorio-electoral/main/'+local;
 let last;
 for(const url of [raw,local]){
  try{const r=await fetcher(url,{method:'GET',cache:'no-store',signal:signal?AbortSignal.any([signal,AbortSignal.timeout(12000)]):AbortSignal.timeout(12000)});
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
export function renderCandidates(data){
 const d=data||{},items=d.results||[],sources=d.sources||[];
 return `${renderSeguimientos(d.seguimientos)}<div class="news-status"><span class="news-status-label">${d.status==='failed'?'Búsqueda fallida':d.status==='partial'?'Cobertura parcial':d.checked_at?'Fuentes consultadas':'Sin búsqueda registrada'}</span><p>Última búsqueda útil: <b>${esc(when(d.checked_at))}</b><br>Último intento: ${esc(when(d.last_attempt_at))}</p></div>
 <p class="muted">${sources.filter(s=>s.ok).length} de ${sources.length} fuentes accesibles · ${items.length} publicaciones candidatas. Consultar este informe no inicia otra búsqueda ni incorpora encuestas al modelo.</p>
 <details class="news-source-audit"><summary>Comprobar las fuentes y sus incidencias</summary><ul>${sources.map(s=>`<li><b>${esc(s.name)}</b> · ${s.ok?`${s.count} candidatos`:esc(s.error)} · ${s.attempts} intento(s)</li>`).join('')}</ul></details>
 ${d.status==='failed'?'<p role="alert">Las fuentes fallaron. Se conserva la búsqueda anterior y su fecha; no equivale a una búsqueda sin novedades.</p>':''}
 <div class="news-candidates">${items.slice(0,45).map(x=>{const url=safe(x.url);return `<article><div class="eyebrow">${esc(x.topic)}</div><h3>${esc(x.title)}</h3><p class="muted">${x.published?esc(when(x.published)):'Fecha no indicada en el índice · revisar original'}</p>${url?`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">Leer la publicación original ↗</a>`:''}<small>Candidato documental · sin verificar</small></article>`;}).join('')||'<p>No hay candidatos en este informe. Revisa la cobertura de fuentes antes de concluir que no existen novedades.</p>'}</div>`;
}
export function renderPollUpdate(){return `<section class="panel poll-update" aria-labelledby="poll-update-title"><span class="eyebrow">La redacción del Observatorio</span><h2 id="poll-update-title">De la publicación a la evidencia.</h2><p>La vigilancia consulta medios y productores directamente cuatro veces al día. Cada hallazgo entra en una bandeja documental; solo una ficha contrastada puede llegar al archivo y al modelo.</p><div class="toolbar"><button id="dispatch-polls" type="button">Consultar novedades</button><button id="reload-polls" class="secondary" type="button">Recargar archivo verificado</button><a href="${REVIEW_URL}" target="_blank" rel="noopener noreferrer">Ejecutar una búsqueda en GitHub ↗</a></div><p class="muted">El enlace abre la tarea en GitHub: una persona con permisos puede pulsar «Run workflow». Aquí se consulta el último informe publicado; no se solicitan claves.</p><p id="poll-dispatch-status" role="status"></p><p id="poll-reload-status" role="status"></p><div id="poll-candidates-list">Consultando la vigilancia…</div><details><summary>Cómo incorporar una encuesta verificada</summary><p>Contrasta el original, fechas, ámbito, muestra, porcentajes y denominador. Propón la ficha en <a href="https://github.com/bhermoso/observatorio-electoral/edit/main/data/ingesta/validadas.json">la bandeja versionada de fichas</a>; la revisión y las pruebas quedan en GitHub. Las estimaciones contrastadas entran por el proceso editorial. Una publicación candidata no se convierte automáticamente en encuesta.</p></details><details><summary>Auditar el circuito de incorporación y publicación</summary><div id="pipeline-status">Consultando…</div></details></section>`;}
export function bindPollUpdate(onReload){
 const $=s=>document.querySelector(s),button=$('#dispatch-polls'),reload=$('#reload-polls');if(!button||!reload)return ()=>{};
 const controller=new AbortController(),signal=controller.signal,root=$('#poll-candidates-list'),note=$('#poll-dispatch-status');
 async function refresh(){button.disabled=true;note.textContent='Consultando el último informe publicado…';
  try{const data=await serviceRequest('status',{signal});if(!signal.aborted&&root.isConnected){root.innerHTML=renderCandidates(data);note.textContent=`Informe consultado · ${data.report_origin}. Ninguna encuesta se incorpora por consultar titulares.`;}}
  catch(e){if(!signal.aborted)note.textContent=e.message;}
  finally{if(!signal.aborted)button.disabled=false;}
 }
 button.onclick=refresh;
 reload.onclick=async()=>{reload.disabled=true;const status=$('#poll-reload-status');try{status.textContent=await onReload(signal);}catch(e){if(!signal.aborted)status.textContent='Error al recargar: '+e.message;}finally{reload.disabled=false;}};
 fetchEstadoCircuito().then(({estado,publicacion})=>{const p=$('#pipeline-status');if(!signal.aborted&&p)p.innerHTML=renderEstadoCircuito(estado,publicacion);}).catch(()=>{const p=$('#pipeline-status');if(!signal.aborted&&p)p.textContent='Estado del circuito no disponible; consulta la ejecución en GitHub.';});
 void refresh();return ()=>controller.abort();
}

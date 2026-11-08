import {fetchEstadoCircuito,renderEstadoCircuito,fetchPublishedPolls} from './actualizar-encuestas.mjs';
export {fetchPublishedPolls};
export const SERVICE_URL='https://gjzihgfzxorpvevrrfkh.supabase.co/functions/v1/encuestas';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const when=v=>v?new Date(v).toLocaleString('es-ES',{timeZone:'Europe/Madrid'}):'todavía no realizada';
export async function serviceRequest(action,{key,record,signal,fetcher=fetch}={}) {
 const method=['scan','submit'].includes(action)?'POST':'GET';
 const headers=record?{'Content-Type':'application/json'}:{};
 if(action==='submit'){if(!key?.trim())throw Error('Introduce tu clave de edición.');headers['X-Editor-Key']=key.trim();}
 const response=await fetcher(SERVICE_URL+'?action='+encodeURIComponent(action),{method,headers,body:record?JSON.stringify(record):undefined,cache:'no-store',signal:signal?AbortSignal.any([signal,AbortSignal.timeout(45000)]):AbortSignal.timeout(45000)});
 let data;try{data=await response.json();}catch{throw Error('El servicio no devolvió una respuesta válida.');}
 if(!response.ok)throw Error(data.error||'No se pudo completar la actualización.');
 return data;
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
export function renderCandidates(data) {
 const errors=Array.isArray(data.errors)?data.errors:[];
 const list=Array.isArray(data.candidates)?data.candidates:[];
 return `<p><b>Última búsqueda con resultados:</b> ${esc(when(data.checked_at))}. ${data.cached?'Se muestra la búsqueda reciente; se permite una nueva cada cinco minutos.':''}</p>${errors.length?`<p role="alert"><b>Incidencias de un intento posterior:</b> ${errors.map(esc).join(' · ')}</p>`:''}
 <p>${list.length} titulares encontrados. Son pistas para revisar; pueden incluir noticias repetidas, análisis y encuestas ya registradas.</p>
 ${list.length?`<details open><summary>Ver publicaciones encontradas</summary>${list.map(c=>{
  let url='';try{const u=new URL(c.url);if(u.protocol==='https:'&&u.hostname==='news.google.com')url=u.href;}catch{}
  return `<article class="poll-queue-item"><p><b>${esc(c.title)}</b></p><p class="muted">${esc(c.published)}</p>${url?`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">Consultar publicación ↗</a>`:''}</article>`;
 }).join('')}</details>`:'<p>No hay titulares en la última búsqueda disponible. Esto no acredita una cobertura exhaustiva.</p>'}`;
}
const field=(name,label,type='text',value='')=>`<label>${label}<input name="${name}" type="${type}" value="${esc(value)}" required maxlength="2000" ${type==='number'?'min="1" max="1000000" step="1"':''}></label>`;
export function renderPollUpdate(){return `<section class="panel poll-update" aria-labelledby="poll-update-title">
 <h2 id="poll-update-title">Actualizar encuestas</h2>
 <p><strong>Actualizar encuestas carga el archivo verificado y busca titulares recientes. Las novedades del archivo aparecen en la tabla y los titulares quedan visibles para revisión.</strong> Las estimaciones contrastadas entran por el proceso editorial de validación y publicación.</p>
 <p class="muted"><b>Dos procesos distintos:</b> el botón consulta titulares mediante Supabase (búsqueda manual); la vigilancia diaria de GitHub Actions ejecuta otra búsqueda y revisa el archivo para publicarlo. Las horas y cantidades de titulares no tienen por qué coincidir.</p>
 <div class="toolbar"><button type="button" id="dispatch-polls">Actualizar encuestas</button><button type="button" class="secondary" id="reload-polls">Recargar encuestas verificadas</button></div>
 <p id="poll-dispatch-status" role="status"></p><p id="poll-reload-status" role="status"></p>
 <div id="poll-candidates-list" aria-live="polite">Consultando la última búsqueda…</div>
 <details><summary>Incorporar una encuesta verificada · solo editor</summary>
 <p>Comprueba primero el informe original y su ficha técnica. Guardar aquí deja la encuesta preparada para la revisión automática diaria de las 07:40 UTC (08:40 en Madrid en invierno). El archivo y el pronóstico cambiarán cuando termine esa publicación.</p>
 <form id="poll-editor" autocomplete="off"><div class="toolbar">${field('editorKey','Clave de edición','password')}</div>
 <p class="muted">La clave solo se envía al servicio del Observatorio y se borra al enviar o salir de esta sección.</p>
 <div class="toolbar">${field('institute','Instituto')}${field('publisher','Medio o comitente')}${field('title','Título de la encuesta')}</div>
 <div class="toolbar">${field('fieldStart','Inicio del campo','date')}${field('fieldEnd','Fin del campo','date')}${field('published','Fecha de publicación','date')}${field('sample','Entrevistas','number')}</div>
 <div class="toolbar"><label>Ámbito<select name="scope"><option>España</option><option>España, excepto Ceuta y Melilla</option></select></label>${field('universe','Población estudiada')}${field('mode','Método de entrevista')}${field('scenario','Candidaturas (por ejemplo, Sumar y Podemos separados)')}</div>
 <div class="toolbar">${field('source','Enlace a la publicación original','url')}${field('technical','Enlace a la ficha técnica','url')}${field('sourcePages','Página o apartado donde están las cifras')}${field('denominator','Base del porcentaje (según la fuente)')}</div>
 <label>Porcentajes: una formación por línea, sin completar datos ausentes<textarea name="percentages" required rows="7" placeholder="PP: 30,2&#10;PSOE: 28,4" style="width:100%"></textarea></label>
 <label>Cómo has contrastado las cifras y la ficha<textarea name="verification" required maxlength="2000" rows="3" style="width:100%"></textarea></label>
 <p><label><input type="checkbox" name="confirmed" required> He revisado la fuente original, las fechas, la muestra y cada cifra.</label></p>
 <button type="submit">Guardar encuesta verificada</button><p id="poll-save-status" role="status"></p></form></details>
 <div id="poll-approved" aria-live="polite"></div>
 <details><summary>Vigilancia automática de GitHub Actions y estado de publicación (independiente de Supabase)</summary><div id="pipeline-status">Consultando…</div></details>
 </section>`;}
export function bindPollUpdate(onReload){
 const $=s=>document.querySelector(s),button=$('#dispatch-polls'),reload=$('#reload-polls'),pending=$('#poll-candidates-list'),note=$('#poll-dispatch-status'),form=$('#poll-editor');
 if(!button||!form)return ()=>{};
 const controller=new AbortController(),signal=controller.signal;
 let searchStarted=false;
 const show=(el,fn)=>{if(!signal.aborted&&el?.isConnected)fn(el);};
 async function refresh() {
  try{const data=await serviceRequest('status',{signal});if(!searchStarted)show(pending,e=>e.innerHTML=renderCandidates(data));}
  catch(e){if(!searchStarted)show(pending,x=>x.textContent='No se pudo consultar la búsqueda: '+e.message);}
 }
 async function approved(){
  const el=$('#poll-approved');
  try{const [records,published]=await Promise.all([serviceRequest('approved',{signal}),fetchPublishedPolls()]);const ids=new Set(published.map(p=>p.id));const queue=records.filter(p=>!ids.has(p.id));show(el,e=>e.innerHTML=queue.length?`<p><b>${queue.length} fichas guardadas, pendientes de publicación:</b> ${queue.map(p=>esc(p.institute+' · '+p.published)).join('; ')}. Todavía no cambian el pronóstico.</p>`:'<p class="muted">No hay fichas guardadas pendientes de incorporar al archivo publicado.</p>');}
  catch(e){show(el,x=>x.textContent='No se pudo consultar la bandeja de fichas guardadas.');}
 }
 const pipe=$('#pipeline-status');fetchEstadoCircuito().then(({estado,publicacion})=>show(pipe,e=>e.innerHTML=renderEstadoCircuito({...estado,ejecucion:null},publicacion)));
 const reloadNote=$('#poll-reload-status');
 async function loadArchive(){
  show(reloadNote,el=>el.textContent='Consultando el archivo publicado…');
  try {
   const message=await onReload(signal);
   show(reloadNote,el=>el.textContent=message);
  }catch(error){
   show(reloadNote,el=>el.textContent='Error al cargar el archivo: '+error.message);
  }
 }
 async function scan(){
  searchStarted=true;
  show(note,el=>el.textContent='Buscando publicaciones recientes…');
  try {
   const data=await serviceRequest('scan',{signal});
   show(pending,el=>el.innerHTML=renderCandidates(data));
   show(note,el=>el.textContent=(data.cached?'Búsqueda en caché: ':'Búsqueda completada: ')+
    (data.candidates?.length||0)+' titulares candidatos a verificar.');
  }catch(error){
   show(note,el=>el.textContent='Error en la búsqueda: '+error.message);
  }
 }
 async function update(includeSearch){
  button.disabled=true;
  reload.disabled=true;
  try {
   await Promise.all([loadArchive(),...(includeSearch?[scan()]:[])]);
   void approved();
  }finally{
   button.disabled=false;
   reload.disabled=false;
  }
 }
 button.onclick=()=>update(true);
 reload.onclick=()=>update(false);
 form.onsubmit=async(event)=>{
  event.preventDefault();const status=$('#poll-save-status'),submit=form.querySelector('button[type=submit]');
  const fields=new FormData(form),key=String(fields.get('editorKey')||'');form.elements.editorKey.value='';submit.disabled=true;
  try {
   if(fields.get('confirmed')!=='on')throw Error('Confirma la revisión de la fuente original.');
   const names=['institute','publisher','title','fieldStart','fieldEnd','published','scope','universe','mode','scenario','source','technical','sourcePages','denominator','verification'];
   const record=Object.fromEntries(names.map(k=>[k,String(fields.get(k)||'').trim()]));
   Object.assign(record,{id:'web-'+crypto.randomUUID(),sample:Number(fields.get('sample')),kind:'poll-estimate',verified:new Date().toISOString().slice(0,10),seats:null,values:parsePercentages(String(fields.get('percentages')||''))});
   status.textContent='Guardando la ficha…';const result=await serviceRequest('submit',{key,record,signal});
   show(status,e=>e.textContent=result.message);form.reset();void approved();
  }catch(e){show(status,x=>x.textContent=e.message);}
  finally{submit.disabled=false;}
 };
 void refresh();void approved();
 return ()=>{form.elements.editorKey.value='';controller.abort();};
}

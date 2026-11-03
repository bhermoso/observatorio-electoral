export const REVIEW_URL='https://github.com/bhermoso/observatorio-electoral/actions/workflows/vigilancia-encuestas.yml';
const STATUS_URL='https://api.github.com/repos/bhermoso/observatorio-electoral/actions/workflows/vigilancia-encuestas.yml/runs?branch=main&per_page=1';
const DISPATCH_URL='https://api.github.com/repos/bhermoso/observatorio-electoral/actions/workflows/vigilancia-encuestas.yml/dispatches';

export function reviewStatus(run){
 if(!run)return 'Todavía no consta una revisión ejecutada.';
 if(run.status!=='completed')return 'Revisión en curso. Las encuestas publicadas todavía no han cambiado.';
 if(run.conclusion!=='success')return 'La última revisión no terminó correctamente. Consulta el detalle en GitHub.';
 const when=new Date(run.updated_at);
 return `Última búsqueda completada${Number.isNaN(when.getTime())?'':' · '+when.toLocaleString('es-ES')}. Los candidatos requieren verificación antes de publicarse.`;
}
export function renderPollUpdate(){return `<section class="panel poll-update" aria-labelledby="poll-update-title"><div><h2 id="poll-update-title">Actualizar encuestas</h2><p>Lanza la búsqueda cuando quieras. Comprueba qué publicaciones requieren revisión y recupera los últimos datos validados.</p></div>
 <div class="toolbar"><button type="button" id="dispatch-polls">Buscar nuevas encuestas ahora</button><button type="button" class="secondary" id="reload-polls">Cargar últimas encuestas publicadas</button></div>
 <details id="poll-auth"><summary>Autorización de GitHub para ejecutar desde aquí</summary><p class="muted">El sitio es estático. Para ejecutar la búsqueda desde este botón necesitas una credencial personal de GitHub de permisos mínimos: token de acceso detallado limitado a <strong>bhermoso/observatorio-electoral</strong> y permiso <strong>Actions: Read and write</strong>. El token solo se envía a api.github.com; no se guarda en archivos, cookies ni almacenamiento del navegador. Se pierde al cerrar esta pestaña. No introduzcas el token en el chat.</p><label for="poll-token">Token de GitHub (solo esta pestaña)</label><div class="toolbar"><input id="poll-token" type="password" autocomplete="off" spellcheck="false" placeholder="github_pat_…" aria-label="Token de GitHub"><button type="button" class="secondary" id="poll-clear-token">Olvidar autorización</button></div><a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener noreferrer">Crear token de permisos limitados ↗</a></details>
 <p id="poll-dispatch-status" role="status" aria-live="polite"></p>
 <p class="muted">La búsqueda no publica sondeos por sí sola: abre candidatos para comprobar fuente primaria, fechas, muestra y cifras. Después de verificar y publicar nuevos registros, pulsa «Cargar últimas encuestas publicadas» para actualizar las vistas. También puedes <a href="${REVIEW_URL}" target="_blank" rel="noopener noreferrer">ejecutar la tarea desde GitHub ↗</a>, sin proporcionar ningún token en esta página.</p>
 <p id="poll-review-status" role="status">Consultando la última revisión…</p><p id="poll-reload-status" role="status"></p><a href="https://github.com/bhermoso/observatorio-electoral/issues?q=is%3Aissue+%5BVigilancia%5D" target="_blank" rel="noopener noreferrer">Consultar publicaciones pendientes de revisión ↗</a></section>`;}
export async function triggerPollReview(token,fetcher=fetch){
 if(typeof token!=='string'||!token.trim())throw Error('Introduce una autorización de GitHub para ejecutar la revisión.');
 const response=await fetcher(DISPATCH_URL,{method:'POST',headers:{Accept:'application/vnd.github+json',Authorization:`Bearer ${token.trim()}`,'Content-Type':'application/json'},body:JSON.stringify({ref:'main'}),cache:'no-store'});
 if(response.status===204)return true;
 if(response.status===401||response.status===403)throw Error('GitHub ha rechazado la autorización. Revisa el token y el permiso Actions: Read and write.');
 if(response.status===404)throw Error('No se encuentra la tarea o la cuenta no tiene acceso a este repositorio.');
 if(response.status===422)throw Error('GitHub no ha aceptado la ejecución. Comprueba que la tarea existe en la rama main.');
 throw Error(`No se pudo iniciar la revisión (GitHub HTTP ${response.status}).`);
}
export async function fetchPublishedPolls(fetcher=fetch){
 const response=await fetcher('data/polls.json',{cache:'no-store',signal:AbortSignal.timeout(15000)});
 if(!response.ok)throw Error('No se pudieron cargar las encuestas publicadas.');
 const value=await response.json();
 if(!Array.isArray(value))throw Error('El archivo de encuestas no es válido.');
 return value;
}
export function bindPollUpdate(onReload){
 const status=document.querySelector('#poll-review-status'),button=document.querySelector('#reload-polls');
 const dispatch=document.querySelector('#dispatch-polls'),tokenInput=document.querySelector('#poll-token');
 const note=document.querySelector('#poll-dispatch-status'),auth=document.querySelector('#poll-auth');
 if(!status||!button||!dispatch||!tokenInput||!note)return ()=>{};
 const controller=new AbortController();
 let checking=false;
 // No localStorage, sessionStorage, cookies or server-side credential storage.
 let credential='';
 async function check(){
  if(checking)return;checking=true;
  try{
   const response=await fetch(STATUS_URL,{cache:'no-store',signal:AbortSignal.any([controller.signal,AbortSignal.timeout(15000)])});
   if(!response.ok)throw Error('Estado no disponible');
   const result=await response.json();
   if(!Array.isArray(result.workflow_runs))throw Error('Respuesta no válida');
   status.textContent=reviewStatus(result.workflow_runs[0]);
  }catch(error){if(!controller.signal.aborted)status.textContent='No se pudo consultar el estado. Puedes comprobarlo en GitHub.';}
  finally{checking=false;}
 }
 document.querySelector('#poll-clear-token').onclick=()=>{credential='';tokenInput.value='';note.textContent='Autorización olvidada en esta pestaña.';};
 dispatch.onclick=async()=>{
  credential=tokenInput.value.trim()||credential;
  tokenInput.value='';
  if(!credential){auth.open=true;note.textContent='Primero introduce un token personal de GitHub con permiso Actions: Read and write.';tokenInput.focus();return;}
  dispatch.disabled=true;note.textContent='Enviando orden de búsqueda a GitHub…';
  try{
   await triggerPollReview(credential);
   note.textContent='Búsqueda solicitada correctamente. GitHub ejecutará la revisión documental; los nuevos candidatos no se incorporan hasta validarse.';
   void check();
  }catch(error){note.textContent=error.message;credential='';auth.open=true;}
  finally{dispatch.disabled=false;}
 };
 button.onclick=async()=>{
  button.disabled=true;
  const reloadNote=document.querySelector('#poll-reload-status');
  reloadNote.textContent='Cargando la versión publicada…';
  try{await onReload();}catch(error){reloadNote.textContent='No se pudo actualizar el archivo. Se conservan los datos anteriores. Inténtalo de nuevo.';}
  finally{button.disabled=false;}
 };
 window.addEventListener('focus',check,{signal:controller.signal});
 check();
 return ()=>{credential='';controller.abort();};
}

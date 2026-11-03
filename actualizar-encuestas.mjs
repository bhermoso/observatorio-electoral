export const REVIEW_URL='https://github.com/bhermoso/observatorio-electoral/actions/workflows/vigilancia-encuestas.yml';
const STATUS_URL='https://api.github.com/repos/bhermoso/observatorio-electoral/actions/workflows/vigilancia-encuestas.yml/runs?branch=main&per_page=1';
export function reviewStatus(run){
 if(!run)return 'Todavía no consta una revisión ejecutada.';
 if(run.status!=='completed')return 'Revisión en curso. Las encuestas publicadas todavía no han cambiado.';
 if(run.conclusion!=='success')return 'La última revisión no terminó correctamente. Consulta el detalle en GitHub.';
 const when=new Date(run.updated_at);
 return `Última búsqueda completada${Number.isNaN(when.getTime())?'':' · '+when.toLocaleString('es-ES')}. Los candidatos requieren verificación antes de publicarse.`;
}
export function renderPollUpdate(){return `<section class="panel poll-update" aria-labelledby="poll-update-title"><div><h2 id="poll-update-title">Actualizar encuestas</h2><p>Busca nuevas publicaciones y consulta el progreso de la revisión.</p></div><div class="toolbar"><a class="button" href="${REVIEW_URL}" target="_blank" rel="noopener">Actualizar encuestas ↗</a><button type="button" class="secondary" id="reload-polls">Cargar últimas encuestas publicadas</button></div><p class="muted">Para iniciar la búsqueda, entra con tu cuenta en GitHub y pulsa <strong>Run workflow → Run workflow</strong>. Abrir el enlace no inicia la revisión. Las novedades se verifican antes de incorporarlas al archivo.</p><p id="poll-review-status" role="status">Consultando la última revisión…</p><p id="poll-reload-status" role="status"></p><a href="https://github.com/bhermoso/observatorio-electoral/issues?q=is%3Aissue+%5BVigilancia%5D" target="_blank" rel="noopener">Consultar publicaciones pendientes de revisión ↗</a></section>`;}
export async function fetchPublishedPolls(fetcher=fetch){
 const response=await fetcher('data/polls.json',{cache:'no-store',signal:AbortSignal.timeout(15000)});
 if(!response.ok)throw Error('No se pudieron cargar las encuestas publicadas.');
 const value=await response.json();
 if(!Array.isArray(value))throw Error('El archivo de encuestas no es válido.');
 return value;
}
export function bindPollUpdate(onReload){
 const status=document.querySelector('#poll-review-status'),button=document.querySelector('#reload-polls');
 if(!status||!button)return ()=>{};
 const controller=new AbortController();
 let checking=false;
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
 button.onclick=async()=>{
  button.disabled=true;
  const note=document.querySelector('#poll-reload-status');
  note.textContent='Cargando la versión publicada…';
  try{await onReload();}catch(error){note.textContent='No se pudo actualizar el archivo. Se conservan los datos anteriores. Inténtalo de nuevo.';}
  finally{button.disabled=false;}
 };
 window.addEventListener('focus',check,{signal:controller.signal});
 check();
 return ()=>controller.abort();
}

/** Búsqueda documental real de microdatos. No equivale a descargar entrevistas. */
export const MICRODATA_ENDPOINT='https://gjzihgfzxorpvevrrfkh.supabase.co/functions/v1/microdatos';
const h=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const urlOK=v=>{try{const u=new URL(v);return u.protocol==='https:'&&!u.username&&!u.password?u.href:null}catch{return null}};
const when=s=>{if(!s)return 'nunca';const d=new Date(s);return Number.isNaN(+d)?String(s):d.toLocaleString('es-ES',{timeZone:'Europe/Madrid'})};
export async function consultMicrodata(action,{fetcher=fetch,signal}={}){
 if(!['scan','status'].includes(action))throw Error('Acción no permitida');
 const response=await fetcher(MICRODATA_ENDPOINT+'?action='+action,{
  method:action==='scan'?'POST':'GET',cache:'no-store',
  signal:signal?AbortSignal.any([signal,AbortSignal.timeout(45000)]):AbortSignal.timeout(45000)});
 let json;try{json=await response.json()}catch{throw Error('Respuesta del servidor ilegible');}
 if(!response.ok)throw Error(json.error||'Fallo al consultar microdatos');
 return json;
}
export function renderMicrodataResults(data){
 if(!data?.checked_at)return '<p class="muted">Aún no se ha ejecutado una búsqueda de microdatos.</p>';
 const rows=Array.isArray(data.candidates)?data.candidates:[],sum=data.summary||{},errs=Array.isArray(data.errors)?data.errors:[];
 const n=x=>Number.isFinite(x)?Number(x):0;
 const links=rows.filter(x=>x.tipo==='enlace_a_archivo');
 const newLinks=links.filter(x=>x.estado==='nuevo_enlace_sin_auditar');
 let html='<p><b>Última búsqueda:</b> '+h(when(data.checked_at))+
  (data.cached?' · Se reutiliza la búsqueda reciente; no se ha ejecutado otra.':'')+'</p>';
 html+='<p><b>'+n(sum.paginas_accesibles)+' de '+n(sum.paginas_consultadas)+' páginas accesibles</b> · '+
  links.length+' archivos enlazados ('+newLinks.length+' nuevos por revisar) · '+rows.filter(x=>x.tipo==='noticia_sobre_microdatos').length+' noticias candidatas.</p>';
 html+='<p class="muted"><b>Resultado operativo:</b> 0 matrices descargadas y 0 microdatos incorporados al modelo por esta búsqueda. Un enlace encontrado no acredita su contenido.</p>';
 if(errs.length)html+='<details><summary>'+errs.length+' fuentes con incidencias</summary><p>'+errs.map(h).join(' · ')+'</p></details>';
 if(!rows.length)return html+'<p>No se encontraron candidatos en las fuentes consultadas. No supone que no existan nuevas encuestas.</p>';
 html+='<details open><summary>Mostrar '+rows.length+' resultados y enlaces</summary>';
 html+=rows.slice(0,75).map(x=>{
  const uri=urlOK(x.url),page=urlOK(x.pagina);
  const status=x.estado==='ya_catalogado'?'Ya catalogado':x.estado==='nuevo_enlace_sin_auditar'?'Nuevo enlace · sin auditar':'Noticia · sin verificar';
  return '<article class="poll-queue-item"><p><b>'+h(x.titulo||x.fuente||'Fuente')+'</b> · '+h(status)+'</p><p class="muted">'+h(x.fuente||'')+'</p>'+
    (uri?'<a href="'+h(uri)+'" target="_blank" rel="noopener noreferrer">Consultar enlace ↗</a>':'')+
    (page&&page!==uri?' · <a href="'+h(page)+'" target="_blank" rel="noopener noreferrer">Página original ↗</a>':'')+'</article>';
 }).join('')+'</details>';
 return html;
}
export function renderBuscadorMicrodatos(){
 return '<section class="panel poll-microdata-search" aria-labelledby="micro-search-title">'+
  '<h2 id="micro-search-title">Buscar microdatos originales</h2>'+
  '<p>Consulta páginas de los productores y búsquedas especializadas para localizar nuevos archivos ZIP, SAV y hojas de datos. <b>Guarda candidatos en Supabase, no entrevistas.</b> La lectura y homologación de las matrices sigue siendo un procedimiento separado.</p>'+
  '<div class="toolbar"><button type="button" id="micro-scan">Buscar enlaces de microdatos ahora</button><a href="#archivo-microdatos">Consultar catálogo de microdatos</a></div>'+
  '<p id="micro-scan-feedback" role="status" aria-live="polite"></p>'+
  '<div id="micro-scan-results" aria-live="polite">Consultando la última búsqueda…</div></section>';
}
export function bindBuscadorMicrodatos(){
 const button=document.getElementById('micro-scan'),feedback=document.getElementById('micro-scan-feedback'),result=document.getElementById('micro-scan-results');
 if(!button||!result)return ()=>{};
 const controller=new AbortController(),signal=controller.signal;
 const display=(fn)=>{if(!signal.aborted&&result.isConnected)fn()};
 consultMicrodata('status',{signal}).then(data=>display(()=>{result.innerHTML=renderMicrodataResults(data)}))
  .catch(e=>display(()=>{result.textContent='No se pudo consultar el estado de la búsqueda: '+e.message}));
 button.onclick=async()=>{
  button.disabled=true;feedback.textContent='Consultando páginas originales y fuentes RSS de microdatos…';
  try{
   const data=await consultMicrodata('scan',{signal});
   display(()=>{
    result.innerHTML=renderMicrodataResults(data);
    feedback.textContent=data.cached?'No se ha ejecutado otra búsqueda: resultados recientes reutilizados.':
     'Búsqueda terminada: '+(data.summary?.enlaces_nuevos_sin_auditar||0)+
     ' enlaces nuevos sin auditar, '+(data.summary?.noticias_sobre_microdatos||0)+
     ' noticias candidatas; ningún microdato incorporado al Motor 29N.';
   });
  }catch(e){display(()=>{feedback.textContent='Búsqueda fallida: '+e.message+' Los datos anteriores se conservan.'});}
  finally{button.disabled=false;}
 };
 return ()=>controller.abort();
}

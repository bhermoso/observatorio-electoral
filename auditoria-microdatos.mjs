/* Estado de descargas REALES; no se publican entrevistas individuales. */
const AUDIT_URL='data/microdatos/estado-descargas.json';
const GITHUB='https://github.com/bhermoso/observatorio-electoral/actions/workflows/auditar-catalogo-microdatos.yml';
const h=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safe=s=>{try{const u=new URL(s);return u.protocol==='https:'&&!u.username&&!u.password?u.href:null}catch{return null}};
const status={
 matriz_detectada_pendiente_homologacion:'Matriz detectada · falta homologar',
 hoja_descargada_sin_matriz_individual_confirmada:'Excel descargado · entrevistas sin confirmar',
 archivo_descargado_sin_matriz_confirmada:'Archivo descargado · matriz sin confirmar',
 descarga_fallida:'Descarga no disponible'
};
const downloaded=r=>Boolean(r.sha256)&&r.estado!=='descarga_fallida';
export function renderEstadoDescargas(){
 return '<section class="panel md-audit" aria-labelledby="md-audit-title" id="md-audit">'+
 '<div class="md-audit-head"><div><h2 id="md-audit-title">Almacén de microdatos · auditoría de originales</h2>'+
 '<p>Segunda etapa tras encontrar enlaces: descarga controlada, huella digital y lectura de estructura en un ejecutor seguro. <b>No se publican entrevistas individuales</b>.</p></div>'+
 '<a href="'+GITHUB+'" target="_blank" rel="noopener noreferrer">Ver o ejecutar auditoría en GitHub ↗</a></div>'+
 '<div id="md-audit-result" aria-live="polite">Consultando el manifiesto de archivos comprobados…</div></section>';
}
export function renderAuditData(data){
 if(!data||data.esquema!==1||!Array.isArray(data.archivos))throw Error('Formato de auditoría inválido');
 const entries=data.archivos;
 if(!entries.length)return '<p class="muted">No hay todavía descargas verificadas en este almacén. El proceso automático guardará resultados aquí tras su primera ejecución.</p>';
 const success=entries.filter(downloaded),matrices=entries.filter(r=>r.estado==='matriz_detectada_pendiente_homologacion'),failed=entries.filter(r=>r.estado==='descarga_fallida');
 const latest=entries.map(r=>r.verificado_en).filter(Boolean).sort().at(-1);
 let out='<p class="md-audit-metrics"><strong>'+entries.length+' archivos intentados</strong> · <strong>'+success.length+' descargas comprobadas</strong> · <strong>'+matrices.length+' matrices detectadas</strong> · <strong>'+failed.length+' descarga'+(failed.length===1?' fallida':'s fallidas')+'</strong>. <small>Último cambio: '+h(latest?new Date(latest).toLocaleString('es-ES',{timeZone:'Europe/Madrid'}):'sin registro')+'</small></p>';
 out+='<div class="table-wrap"><table class="md-audit-table"><caption>La estructura no significa homologación ni entrada al Motor 29N.</caption>'+
 '<thead><tr><th>Estudio / fuente</th><th>Descarga y estado</th><th>Entrevistas / variables</th><th>Original</th></tr></thead><tbody>';
 out+=entries.slice(0,35).map(r=>{
  const url=safe(r.url),m=r.estructura||{},matrix=(m.tipo==='zip'?m.matrices||[]:[m]).find(x=>x.filas>0);
  const sizes=matrix?Number(matrix.filas).toLocaleString('es-ES')+' filas · '+Number(matrix.columnas||0).toLocaleString('es-ES')+' columnas':m.tipo==='xlsx'?'Excel: comprobar tipo de registro':m.tipo==='zip'?(m.ficheros_tabulares||0)+' ficheros tabulares':'No determinado';
  return '<tr><td><b>'+h(r.id)+'</b><small>'+h(r.productor||'')+' · '+h(r.fecha||'')+'</small></td>'+
   '<td>'+h(status[r.estado]||r.estado)+(r.error?'<small>Incidencia: '+h(r.error)+'</small>':'')+
   (r.sha256?'<small>SHA-256: <code>'+h(r.sha256.slice(0,20))+'…</code></small>':'')+'</td>'+
   '<td>'+h(sizes)+'</td><td>'+(url?'<a href="'+h(url)+'" target="_blank" rel="noopener noreferrer">Archivo origen ↗</a>':'Sin enlace')+'</td></tr>';
 }).join('')+'</tbody></table></div>';
 return out+'<p class="muted">Una matriz detectada sigue pendiente de homologación de preguntas, universo, pesos y permisos de uso. Esta auditoría no modifica el pronóstico. Las descargas fallidas no cuentan como éxito.</p>';
}
export async function bindEstadoDescargas(){
 const root=document.getElementById('md-audit-result');if(!root)return;
 try{const r=await fetch(AUDIT_URL,{cache:'no-store'});if(!r.ok)throw Error('HTTP '+r.status);
  const data=await r.json();if(root.isConnected)root.innerHTML=renderAuditData(data);
 }catch(e){if(root.isConnected)root.textContent='No se pudo cargar el estado de descargas: '+e.message;}
}

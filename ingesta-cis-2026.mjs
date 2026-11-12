// Ingesta CIS: registro de procedencia, NO serie propia inventada ni entradas al motor.
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const EXPECTED=['3567','3571','3577','3582'];
export function validarIngestaCis(data){
 if(data?.esquema!==1||!Array.isArray(data.estudios)||data.estudios.length!==4)throw Error('Inventario CIS incompleto');
 if(data.estudios.map(x=>x.id).join(',')!==EXPECTED.join(','))throw Error('Orden o identidad de estudios CIS incorrectos');
 for(const x of data.estudios){
  if(!/^20\d\d-\d\d-\d\d \/ 20\d\d-\d\d-\d\d$/.test(x.campo)||!Number.isInteger(x.n)||x.n<1000)throw Error('Ficha CIS inválida');
  if(x.microdatos_procesados){
   if(!/^[0-9a-f]{64}$/.test(x.sha256_original??'')||!x.estimacion_propia||x.estado!=='original_procesado_experimental')throw Error('Estudio marcado procesado sin trazabilidad');
  }else{
   if(x.sha256_original!==null||x.estimacion_propia!==null)throw Error('No atribuir agregado ni hash a original pendiente');
  }
 }
 return data.estudios;
}
export function renderIngestaCis(){
 return '<section class="panel" id="cocina-ingesta-cis"><span class="eyebrow">Serie CIS 2026 · control de originales</span><h2>Cuatro originales CIS procesados</h2><p>El 12 de noviembre se verificaron los cuatro ZIP originales aportados y se calcularon agregados con una receta constante. Los originales individuales no se publican.</p><div id="cocina-ingesta-cis-tabla" aria-live="polite">Cargando trazabilidad…</div></section>';
}
export function tablaIngestaCis(data){
 const rows=validarIngestaCis(data);
 return '<div class="table-wrap"><table><caption>Barómetros CIS 2026: cada estudio se registra una vez. No añadir las estimaciones experimentales como encuestas independientes.</caption><thead><tr><th>Estudio</th><th>Campo / n</th><th>Estado de los microdatos</th><th>Procedencia</th></tr></thead><tbody>'+
 rows.map(x=>'<tr><th scope="row">CIS '+escape(x.id)+'<small>'+escape(x.mes)+'</small></th><td>'+escape(x.campo)+'<small>n = '+x.n.toLocaleString('es-ES')+'</small></td><td>'+(x.microdatos_procesados?'<b>Original analizado</b><small>Receta experimental no validada</small>':'Pendiente de verificar original<small>Sin estimación propia</small>')+'</td><td><a href="'+escape(x.referencia)+'" target="_blank" rel="noopener noreferrer">Ficha / acceso a datos</a></td></tr>').join('')+'</tbody></table></div><p class="muted"><b>Regla de incorporación:</b> verificar el original y SHA-256, identificar INTENCIONGR, VOTOSIMG, PESO, recuerdo y participación, cotejar códigos por oleada y mantener fija la receta. Los cuatro estudios contienen agregados experimentales. <b>No equivalen a cuatro pruebas predictivas ni entran en el Motor 29N.</b></p>';
}
export async function bindIngestaCis(){
 const root=document.getElementById('cocina-ingesta-cis-tabla');if(!root)return;
 try{
  const r=await fetch('data/microdatos/ingesta-cis-2026.json',{cache:'no-store'});
  if(!r.ok)throw Error('HTTP '+r.status);
  const data=await r.json();
  if(root.isConnected)root.innerHTML=tablaIngestaCis(data);
 }catch(e){if(root.isConnected)root.textContent='Inventario CIS no disponible: '+e.message}
}

// Puerta histórica: resultados 23J comprobados y límites de homologación 2019.
// No confundir dos estudios del mismo 23J con elecciones independientes.
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;':'&quot;'}[c]));
const fmt=n=>Number(n).toLocaleString('es-ES',{minimumFractionDigits:2,maximumFractionDigits:2});
const PARTIDOS=['PP','PSOE','VOX','SUMAR'];
const PASOS=['directa','peso','simpatia','recuerdo','indecisos','participacion','cis_publicado'];
export function evaluarRecuerdoHistorico(validacion,puerta){
 if(validacion?.esquema!==1||puerta?.esquema!==1||validacion.eleccion!=='2023-07-23'||puerta.condicion_entrada_motor!=='NO_ADMITIR')throw Error('Auditoría sin control histórico');
 const estudios=['3411','3415'];
 const calc=estudios.map(id=>{
  const filas=validacion.estudios?.[id];
  if(!Array.isArray(filas)||filas.map(x=>x.paso).join(',')!==PASOS.join(','))throw Error('Etapas históricas incompletas');
  const medidas=Object.fromEntries(filas.map(f=>{
   if(!PARTIDOS.every(p=>Number.isFinite(f.error[p])))throw Error('Errores por partido incompletos');
   const mae=PARTIDOS.reduce((s,p)=>s+Math.abs(f.error[p]),0)/PARTIDOS.length;
   if(Math.abs(mae-f.mae)>0.015)throw Error('MAE publicado incongruente');
   return [f.paso,Number(mae.toFixed(4))];
  }));
  return {id,medidas,impacto_recuerdo_pp:Number((medidas.recuerdo-medidas.simpatia).toFixed(4)),impacto_final_pp:Number((medidas.participacion-medidas.directa).toFixed(4))};
 });
 const media=Object.fromEntries(PASOS.map(p=>[p,Number((calc.reduce((a,x)=>a+x.medidas[p],0)/calc.length).toFixed(4))]));
 if(puerta.ensayos_2019?.length!==2||puerta.ensayos_2019.some(x=>x.estado!=='origenes_cotejados_sin_validacion_homologada'))throw Error('2019 no habilitado');
 return {estudios:calc,media,puerta,elecciones_independientes_ensayadas:1};
}
export function renderPuertaRecuerdoHistorico(){
 return '<section class="panel" id="cocina-puerta-recuerdo"><span class="eyebrow">Validación · control de entrada al motor</span><h2>¿Mejora realmente la calibración por recuerdo?</h2><p>Comprobación histórica del 23J de 2023 y estado independiente de las dos elecciones de 2019. <b>MAE respecto al escrutinio</b>, no diferencia con la estimación publicada de una casa.</p><div id="cocina-puerta-recuerdo-contenido" aria-live="polite">Comprobando validación histórica…</div></section>';
}
export function tablaPuertaRecuerdoHistorico(d){
 const etiquetas={directa:'Intención directa',peso:'Intención ponderada',simpatia:'Voto + simpatía',recuerdo:'Calibración por recuerdo',indecisos:'Imputación de indecisos',participacion:'Receta completa',cis_publicado:'CIS publicado (referencia)'};
 const rows=PASOS.map(p=>'<tr><th scope="row">'+esc(etiquetas[p])+'</th><td class="num">'+fmt(d.estudios[0].medidas[p])+'</td><td class="num">'+fmt(d.estudios[1].medidas[p])+'</td><td class="num"><b>'+fmt(d.media[p])+'</b></td></tr>').join('');
 const refs=d.puerta.ensayos_2019.map(x=>'<tr><th>CIS '+esc(x.estudio)+'</th><td>'+esc(x.eleccion)+'</td><td>'+x.n.toLocaleString('es-ES')+'</td><td>Original cotejado; homologación electoral pendiente</td></tr>').join('');
 const deterioro=d.media.recuerdo-d.media.simpatia;
 const final=d.media.participacion-d.media.directa;
 return '<h3>23J de 2023 · dos estudios de una sola elección</h3><div class="table-wrap"><table><caption>Error absoluto medio (MAE) en puntos porcentuales para PP, PSOE, Vox y Sumar. El promedio es entre estudios, no entre elecciones independientes.</caption><thead><tr><th>Tratamiento</th><th>3411</th><th>3415</th><th>Media</th></tr></thead><tbody>'+rows+'</tbody></table></div>'+
 '<p><b>Diagnóstico:</b> pasar de simpatía a recuerdo modifica el MAE medio en <b>+'+fmt(deterioro)+' pp</b> (empeora). La receta completa tiene '+fmt(d.media.participacion)+' pp de MAE, '+(final>=0?'+':'')+fmt(final)+' pp frente a intención directa.</p>'+
 '<h3>2019 · originales auditados, validación de recuerdo bloqueada</h3><div class="table-wrap"><table><thead><tr><th>Estudio</th><th>Elección</th><th>Entrevistas</th><th>Estado</th></tr></thead><tbody>'+refs+'</tbody></table></div>'+
 '<p>Las categorías territoriales, los universos y el recuerdo de la elección anterior todavía requieren homologación específica. No existe aquí un MAE de recuerdo comparable al del 23J; asignárselo sería inventar una validación.</p>'+
 '<p><b>Puerta de admisión: NO ADMITIR.</b> Hay una sola elección contrastada (dos sondeos), sin comprobación independiente con parámetros previamente congelados. No modificar el Motor 29N.</p>';
}
export async function bindPuertaRecuerdoHistorico(){
 const root=document.getElementById('cocina-puerta-recuerdo-contenido');if(!root)return;
 try{
  const load=async path=>{const r=await fetch('data/microdatos/'+path,{cache:'no-store'});if(!r.ok)throw Error('HTTP '+r.status);return r.json()};
  const [v,p]=await Promise.all([load('validacion_cocina_cis.json'),load('puerta-historica-recuerdo-2019-2023.json')]);
  if(root.isConnected)root.innerHTML=tablaPuertaRecuerdoHistorico(evaluarRecuerdoHistorico(v,p));
 }catch(e){if(root.isConnected)root.textContent='Auditoría histórica no disponible: '+e.message}
}

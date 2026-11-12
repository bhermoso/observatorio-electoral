// Contraste descriptivo; la diferencia con la estimación oficial NO es error electoral.
const h=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fmt=x=>Number(x).toLocaleString('es-ES',{minimumFractionDigits:1,maximumFractionDigits:1});
const signed=x=>(x>0?'+':'')+fmt(x);
export const PARTIDOS_CIS=['PP','PSOE','VOX','SUMAR','PODEMOS'];
export const PASOS_CIS=['directa','peso','simpatia','recuerdo','indecisos','participacion'];
export function contrastarSerieCis2026(serie,ref){
 if(serie?.esquema!==1||ref?.esquema!==1||serie?.estudios?.length!==4||ref?.estudios?.length!==4)throw Error('Serie o referencias incompletas');
 const seen=new Set();
 return serie.estudios.map((s,i)=>{
  const o=ref.estudios[i];
  if(!o||s.id!==o.id||seen.has(s.id)||!Array.isArray(serie.pasos)||serie.pasos.join(',')!==PASOS_CIS.join(','))throw Error('Estudios o recetas desalineados');
  seen.add(s.id);
  const steps={};
  for(const paso of PASOS_CIS){
   steps[paso]={};
   for(const partido of PARTIDOS_CIS){
    const ours=s.pasos?.[paso]?.[partido],official=o.partidos?.[partido];
    if(!Number.isFinite(ours)||!Number.isFinite(official)||ours<0||ours>100||official<0||official>100)throw Error('Dato inválido: '+s.id+'/'+paso+'/'+partido);
    steps[paso][partido]={propio:ours,cis:official,diferencia_pp:Number((ours-official).toFixed(3))};
   }
  }
  return {id:s.id,mes:s.periodo,estado:o.verificacion,fuente:o.fuente,documento:o.documento_primario,pasos:steps};
 });
}
// Descomposición telescópica: cada variación es respecto a la etapa inmediatamente
// anterior. No es una atribución causal ni una validación de la receta.
export function auditarEfectosCis2026(rows){
 if(!Array.isArray(rows)||rows.length!==4)throw Error('Requiere cuatro oleadas emparejadas');
 return rows.map(r=>{
  const partidos={};
  for(const partido of PARTIDOS_CIS){
   const c=r.pasos.directa[partido].cis;
   const previa=r.pasos.directa[partido].propio;
   const cambios={directa_menos_cis_pp:Number((previa-c).toFixed(3))};
   let antes=previa;
   for(const etapa of PASOS_CIS.slice(1)){
    const ahora=r.pasos[etapa][partido].propio;
    cambios[etapa]=Number((ahora-antes).toFixed(3));
    antes=ahora;
   }
   const suma=Object.values(cambios).reduce((a,b)=>a+b,0);
   const total=r.pasos.participacion[partido].diferencia_pp;
   if(Math.abs(suma-total)>0.006)throw Error('La descomposición no cierra: '+r.id+'/'+partido);
   const dominantes=Object.entries(cambios).sort((a,b)=>Math.abs(b[1])-Math.abs(a[1]));
   partidos[partido]={cambios,diferencia_final_pp:total,mayor_cambio:dominantes[0][0],mayor_cambio_pp:dominantes[0][1]};
  }
  return {id:r.id,mes:r.mes,partidos};
 });
}
export function tablaEfectosCis2026(rows){
 const audit=auditarEfectosCis2026(rows);
 const labels={directa_menos_cis_pp:'Directa frente a CIS',peso:'Ponderación del CIS',simpatia:'Voto + simpatía',recuerdo:'Calibración de recuerdo',indecisos:'Imputación de indecisos',participacion:'Participación declarada'};
 const cols=['directa_menos_cis_pp',...PASOS_CIS.slice(1)];
 const body=audit.flatMap(r=>['PP','PSOE'].map(p=>{
  const d=r.partidos[p];
  return '<tr><th scope="row">'+h(r.mes)+'<small>CIS '+h(r.id)+'</small></th><td>'+h(p)+'</td>'+
   cols.map(k=>'<td class="num">'+signed(d.cambios[k])+'</td>').join('')+
   '<td class="num"><b>'+signed(d.diferencia_final_pp)+'</b></td></tr>';
 })).join('');
 return '<h3>¿Qué tratamiento desplaza las cifras?</h3><p>Descomposición aritmética de la diferencia final de PP y PSOE. Cada columna muestra un cambio acumulativo entre dos etapas adyacentes; las columnas suman la diferencia respecto a la estimación oficial. <b>No son efectos causales independientes</b>.</p>'+
 '<div class="table-wrap"><table><caption>Diferencias y variaciones en puntos porcentuales (pp). La columna inicial compara directa y CIS; las demás son variaciones entre etapas consecutivas.</caption><thead><tr><th>Oleada</th><th>Partido</th>'+
 cols.map(k=>'<th>'+h(labels[k])+'</th>').join('')+'<th>Total frente CIS</th></tr></thead><tbody>'+body+'</tbody></table></div>'+
 '<p class="muted">El recuerdo calibrado explica la mayor variación entre etapas de PP y PSOE en estas cuatro oleadas. Esta identificación aritmética no prueba que deba corregirse el resultado mediante los factores empleados. Además, la referencia oficial de junio, julio y septiembre permanece pendiente de cotejo con el documento primario.</p>';
}
export function renderContrasteSerieCis2026(){
 return '<section class="panel" id="cocina-cis-serie-contraste"><span class="eyebrow">Comparación metodológica · 2026</span><h2>Estimación oficial del CIS frente a nuestra receta, oleada por oleada</h2><p>Ambas columnas se refieren a entrevistas de una misma oleada. La diferencia mide <b>divergencia entre tratamientos</b>, no error de predicción.</p><div id="cocina-cis-serie-contraste-tabla" aria-live="polite">Preparando contraste…</div></section>';
}
export function tablaContrasteSerieCis2026(rows){
 if(!Array.isArray(rows)||rows.length!==4)throw Error('Contraste CIS incompleto');
 const trs=rows.flatMap(r=>PARTIDOS_CIS.map(p=>{
  const v=r.pasos.participacion[p];
  return '<tr><th scope="row">'+h(r.mes)+'<small>CIS '+h(r.id)+'</small></th><td>'+h(p)+'</td><td>'+fmt(v.cis)+' %</td><td>'+fmt(v.propio)+' %</td><td>'+signed(v.diferencia_pp)+' pp</td></tr>';
 })).join('');
 const detail=rows.map(r=>'<h3>'+h(r.mes)+' · CIS '+h(r.id)+'</h3><div class="table-wrap"><table><thead><tr><th>Tratamiento</th>'+PARTIDOS_CIS.map(p=>'<th>'+p+'</th>').join('')+'</tr></thead><tbody>'+PASOS_CIS.map(paso=>'<tr><th scope="row">'+h(paso)+'</th>'+PARTIDOS_CIS.map(p=>'<td>'+signed(r.pasos[paso][p].diferencia_pp)+' pp</td>').join('')+'</tr>').join('')+'</tbody></table></div>').join('');
 return '<div class="table-wrap"><table><caption>Diferencia = Observatorio experimental − estimación oficial del CIS; expresada en puntos porcentuales, sin interpretación predictiva.</caption><thead><tr><th>Oleada</th><th>Partido</th><th>CIS oficial</th><th>Observatorio</th><th>Diferencia</th></tr></thead><tbody>'+trs+'</tbody></table></div><details><summary>Descomponer diferencias por los seis tratamientos</summary>'+detail+'</details>'+tablaEfectosCis2026(rows)+'<p class="muted"><b>Fuentes:</b> octubre cotejado con documento original en archivo; junio, julio y septiembre transcritos de catálogos secundarios que enlazan los PDF oficiales, pendientes de cotejo visual directo. Las diferencias son metodológicas y <b>no autorizan incluir la receta en el Motor 29N</b>.</p>';
}
export async function bindContrasteSerieCis2026(){
 const root=document.getElementById('cocina-cis-serie-contraste-tabla');if(!root)return;
 try{
  const load=async p=>{const r=await fetch('data/microdatos/'+p,{cache:'no-store'});if(!r.ok)throw Error('HTTP '+r.status);return r.json()};
  const [serie,official]=await Promise.all([load('serie-cis-2026-experimental.json'),load('cis-oficiales-2026-referencia.json')]);
  if(root.isConnected)root.innerHTML=tablaContrasteSerieCis2026(contrastarSerieCis2026(serie,official));
 }catch(e){if(root.isConnected)root.textContent='Contraste CIS no disponible: '+e.message}
}

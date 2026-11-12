// Validación retrospectiva sobre los dos originales CIS de 2019.
// Los seis tratamientos son exploratorios; las alianzas territoriales no están homologadas.
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const fmt=x=>Number(x).toLocaleString('es-ES',{minimumFractionDigits:2,maximumFractionDigits:2});
const PASOS=['directa','peso','simpatia','recuerdo','indecisos','participacion'];
const NOMBRES={directa:'Intención directa',peso:'Ponderación CIS',simpatia:'Voto + simpatía',recuerdo:'Calibración por recuerdo',indecisos:'Imputación indecisos',participacion:'Receta completa'};
export function validarOriginalesCis2019(d){
 if(d?.esquema!==1||d.estado!=='EXPLORATORIO_NO_ADMITIR'||d.estudios?.length!==2)throw Error('Puerta histórica no válida');
 if(d.estudios.map(s=>s.id).join(',')!=='3242,3263')throw Error('Estudios históricos desalineados');
 for(const s of d.estudios){
  if(!/^[0-9a-f]{64}$/.test(s.sha256_zip)||s.n<16000||PASOS.some(p=>!Number.isFinite(s.pasos?.[p]?.mae_pp)))throw Error('Retrospectiva sin trazabilidad o MAE');
  if(s.pasos.recuerdo.mae_pp>=s.pasos.simpatia.mae_pp)throw Error('Conjunto de prueba no reproduce mejora observada');
 }
 return d.estudios;
}
export function renderOriginalesCis2019(){
 return '<section class="panel" id="cocina-originales-2019"><span class="eyebrow">2019 · originales reexaminados</span><h2>Seis tratamientos aplicados a los microdatos de abril y noviembre</h2><p>Comparación retrospectiva de PP, PSOE, Vox y Ciudadanos. Los códigos territoriales no homologados se conservan en Otros; la mejora observada <b>no constituye validación prospectiva</b>.</p><div id="cocina-originales-2019-tabla" aria-live="polite">Cargando auditoría…</div></section>';
}
export function tablaOriginalesCis2019(data){
 const [a,n]=validarOriginalesCis2019(data);
 const table=PASOS.map(p=>'<tr><th scope="row">'+escape(NOMBRES[p])+'</th><td>'+fmt(a.pasos[p].mae_pp)+' pp</td><td>'+fmt(n.pasos[p].mae_pp)+' pp</td></tr>').join('');
 const changeA=a.pasos.recuerdo.mae_pp-a.pasos.simpatia.mae_pp;
 const changeN=n.pasos.recuerdo.mae_pp-n.pasos.simpatia.mae_pp;
 return '<div class="table-wrap"><table><caption>MAE frente al escrutinio (cuatro partidos idénticos en ambas columnas), puntos porcentuales.</caption><thead><tr><th>Tratamiento</th><th>CIS 3242 · 28A</th><th>CIS 3263 · 10N</th></tr></thead><tbody>'+table+'</tbody></table></div>'+
 '<p>El paso de simpatía a recuerdo cambia el MAE en <b>'+fmt(changeA)+' pp</b> en abril y <b>'+fmt(changeN)+' pp</b> en noviembre: en estas dos muestras mejora. En cambio, en los dos estudios de 2023 el mismo tipo de intervención empeoró el resultado. <b>No seleccionar una receta mirando exclusivamente el desenlace histórico.</b></p>'+
 '<details><summary>Procedencia, agrupaciones y factores de calibración</summary>'+
 [a,n].map(s=>'<h3>CIS '+escape(s.id)+'</h3><p>n = '+Number(s.n).toLocaleString('es-ES')+'; SHA-256: <code>'+escape(s.sha256_zip)+'</code></p><div class="table-wrap"><table><thead><tr><th>Grupo de recuerdo</th><th>Factor</th></tr></thead><tbody>'+
 Object.entries(s.factores_recuerdo).map(([k,v])=>'<tr><th>'+escape(k)+'</th><td>'+fmt(v)+'</td></tr>').join('')+'</tbody></table></div>').join('')+'</details>'+
 '<p class="muted">Calibración con resultados electorales anteriores (2016 para abril de 2019; abril de 2019 para noviembre). Los códigos territoriales sin equivalencia comprobada permanecen como Otros. No es una réplica literal de la receta de 2023 ni prueba fuera de muestra. <b>Estado de admisión al Motor 29N: NO ADMITIR.</b></p>';
}
export async function bindOriginalesCis2019(){
 const root=document.getElementById('cocina-originales-2019-tabla');if(!root)return;
 try{
  const r=await fetch('data/microdatos/validacion_2019_seis_etapas_experimental.json',{cache:'no-store'});
  if(!r.ok)throw Error('HTTP '+r.status);
  if(root.isConnected)root.innerHTML=tablaOriginalesCis2019(await r.json());
 }catch(e){if(root.isConnected)root.textContent='Auditoría de originales 2019 no disponible: '+e.message}
}

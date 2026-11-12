// Contraste de UN MISMO estudio CIS: cifra oficial frente a receta experimental.
// No computa promedios ni genera una nueva encuesta a partir del mismo trabajo de campo.
const h=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const f=x=>Number(x).toLocaleString('es-ES',{minimumFractionDigits:1,maximumFractionDigits:1});
const signed=x=>(x>0?'+':'')+f(x);
const GROUPS=[['PSOE','PSOE'],['PP','PP'],['VOX','VOX'],['SUMAR','Sumar/FA'],['PODEMOS','Podemos'],['ERC','ERC'],['SALF','SALF'],['JUNTS','Junts'],['BILDU','EH Bildu'],['PNV','PNV'],['BNG','BNG'],['CC','CC'],['UPN','UPN']];
export function contrastarCis3582(receta,polls){
 const published=Array.isArray(polls)?polls.filter(x=>x.id==='cis-3582'):[];
 if(published.length!==1||published[0].institute!=='CIS'||published[0].kind!=='poll-estimate')throw Error('La estimación oficial del CIS 3582 no está identificada de forma única');
 if(receta?.estudio!=='3582'||receta?.pasos?.at(-1)?.id!=='participacion'||!receta?.resultado?.estimacion)throw Error('La receta experimental CIS 3582 no es válida');
 const original=published[0],actual=receta.resultado.estimacion;
 const rows=GROUPS.map(([key,label])=>{
  const sourceKey=key==='SUMAR'?'Sumar/FA':key==='PODEMOS'?'Podemos':key==='BILDU'?'EH Bildu':key==='JUNTS'?'Junts':key;
  const oficial=original.values[sourceKey],experimental=actual[key];
  if(!Number.isFinite(oficial)||!Number.isFinite(experimental)||oficial<0||oficial>100||experimental<0||experimental>100)throw Error('Porcentaje inválido: '+label);
  return {key,label,oficial,experimental,diferencia_pp:Number((experimental-oficial).toFixed(3))};
 });
 return {estudio:'3582',campo:original.fieldStart+' / '+original.fieldEnd,
  oficial_id:original.id,receta_id:'cocina_cis_3582',filas:rows,
  nota:'Dos tratamientos del mismo estudio de octubre: diferencias metodológicas, no errores de predicción ni encuestas independientes.'};
}
export function renderContrasteCis3582(){
 return `<section class="panel" id="cocina-cis-3582-contraste"><span class="eyebrow">CIS octubre · estudio 3582</span><h2>Lo que publica el CIS frente a lo que calcula el Observatorio</h2><p>Comparamos dos estimaciones de <b>las mismas entrevistas</b>, sin duplicar la encuesta ni introducir ambas en el pronóstico.</p><div id="cocina-cis-3582-tabla" aria-live="polite">Preparando contraste…</div></section>`;
}
export function tablaContrasteCis3582(data){
 if(data?.estudio!=='3582'||!Array.isArray(data.filas)||data.filas.length!==GROUPS.length)throw Error('Contraste CIS incompleto');
 return `<div class="table-wrap"><table><caption>CIS 3582 · estimación oficial frente a receta experimental sobre microdatos · diferencia = Observatorio menos CIS (puntos porcentuales). No implica error predictivo.</caption>
 <thead><tr><th>Partido</th><th>CIS publicado</th><th>Observatorio (microdatos)</th><th>Diferencia</th></tr></thead><tbody>
 ${data.filas.map(x=>`<tr><th scope="row">${h(x.label)}</th><td>${f(x.oficial)} %</td><td>${f(x.experimental)} %</td><td>${signed(x.diferencia_pp)} pp</td></tr>`).join('')}
 </tbody></table></div><p class="muted"><b>Interpretación:</b> las diferencias reflejan tratamientos estadísticos, no aciertos. La receta propia todavía no supera su validación histórica y <b>no entra en el Motor 29N</b>. La estimación oficial del CIS consta una sola vez en el archivo de encuestas. <a href="#cocina-propia">Examinar pasos y validación</a>.</p>`;
}
export async function bindContrasteCis3582(){
 const root=document.querySelector('#cocina-cis-3582-tabla');if(!root)return;
 try{
  const load=async url=>{const response=await fetch(url,{cache:'no-store'});if(!response.ok)throw Error('HTTP '+response.status);return response.json()};
  const [receta,polls]=await Promise.all([load('data/microdatos/cocina_cis_3582.json'),load('data/polls.json')]);
  if(root.isConnected)root.innerHTML=tablaContrasteCis3582(contrastarCis3582(receta,polls));
 }catch(e){if(root.isConnected)root.textContent='Contraste CIS no disponible: '+e.message}
}

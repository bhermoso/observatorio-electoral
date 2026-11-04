// Puente de evidencia documental CIS 2019. Nunca autoriza extrapolación automática.
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeLink=u=>typeof u==='string'&&/^https:\/\/www\.cis\.es\//.test(u)?u:null;

export function validarEvidencia2019(registry,config){
 if(registry?.schema_version!==1||!registry.studies?.['3242']||!registry.studies?.['3263'])throw Error('Registro documental incompleto');
 if(!config?.studies?.['3242']||!config?.studies?.['3263'])throw Error('Falta contrato de homologación');
 const elections=['3242','3263'].map(id=>{
  const proof=registry.studies[id],item=config.studies[id];
  if(proof.verified.some(x=>!safeLink(x.source)))throw Error('La evidencia no tiene fuente oficial');
  if(Object.values(proof.direct_vote_questionnaire_codes||{}).some(x=>!x))throw Error('Código de cuestionario vacío');
  const missing=['weight','intention','combined_vote_sympathy','recall','participation','universe_filter','result_vote_denominator','reviewed_by','review_date']
   .filter(k=>item[k]===null||item[k]===undefined||item[k]==='');
  const unresolved=(proof.unresolved||[]);
  return {id,election:proof.election,proof,missing,unresolved,homologated:missing.length===0&&unresolved.length===0};
 });
 if(elections.some(x=>x.homologated))throw Error('Se ha declarado homologación completa sin revisar el registro de evidencias');
 return {status:'PARCIAL',elections,verified:ElectionsProofCount(elections),ready:false};
}
const ElectionsProofCount=items=>items.reduce((n,item)=>n+item.proof.verified.length,0);

export function renderHomologacion2019(){
 return '<section class="historical-codes" id="pronostico-homologacion" aria-labelledby="historical-codes-title">'+
  '<div class="historical-codes-heading"><div><span class="eyebrow">Trazabilidad de variables y candidaturas</span>'+
  '<h3 id="historical-codes-title">Qué está homologado en los estudios de 2019</h3>'+
  '<p>La tabla de errores retrospectivos no sustituye la verificación de cuestionarios, libros de códigos, pesos y denominadores.</p></div>'+
  '<a href="data/microdatos/evidencia_homologacion_2019.json" download>Evidencias documentales ↓</a></div>'+
  '<div id="historical-codes-data" aria-live="polite">Cargando estado documental…</div></section>';
}
export function renderEstadoHomologacion2019(checked){
 if(!checked?.elections?.length)throw Error('Cobertura de homologación desconocida');
 const studies=checked.elections.map(x=>{
  const src=x.proof.official_study;
  return '<article class="historical-codes-study"><div class="historical-codes-line"><h4>CIS '+esc(x.id)+' · '+esc(x.election)+'</h4>'+
   '<span class="historical-codes-status">Pendiente de homologación completa</span></div>'+
   '<p>'+x.proof.verified.length+' hechos documentales contrastados · '+x.unresolved.length+' verificaciones técnicas pendientes.</p>'+
   '<details><summary>Documentación consultada, códigos y decisiones pendientes</summary>'+
   '<ul>'+x.proof.verified.map(v=>'<li><b>'+esc(v.field)+':</b> '+esc(v.value)+
    ' <a href="'+esc(v.source)+'" target="_blank" rel="noopener">Fuente CIS ↗</a></li>').join('')+'</ul>'+
   (x.proof.direct_vote_questionnaire_codes?'<p><b>Códigos de la pregunta de voto del cuestionario (no nombres de variables del ZIP):</b> '+
    Object.entries(x.proof.direct_vote_questionnaire_codes).map(([code,label])=>esc(code)+' = '+esc(label)).join(' · ')+'</p>':'')+
   '<p><b>Nombres de variables presentes en los agregados, todavía sin confirmar con el libro de códigos:</b> '+
    Object.entries(x.proof.variables_from_aggregates_not_confirmed).map(([k,v])=>esc(k)+' = '+esc(v)).join(' · ')+'</p>'+
   '<ul>'+x.unresolved.map(v=>'<li>'+esc(v)+'</li>').join('')+'</ul>'+
   '</details><p><a href="'+esc(src)+'" target="_blank" rel="noopener">Ficha del estudio CIS ↗</a></p></article>';
 }).join('');
 return '<p class="historical-codes-top"><strong>Verificación documental parcial.</strong> '+checked.verified+
  ' referencias concretas de preguntas, fichas y candidaturas comprobadas. <b>0 de 2 estudios habilitados para reestimar voto.</b></p>'+
  '<div class="historical-codes-grid">'+studies+'</div>'+
  '<p class="historical-codes-limit"><b>Bloqueo deliberado:</b> sin correspondencia certificada entre cuestionario y variables recodificadas, universo y voto válido, no se altera la receta ni se proclama una validación predictiva. El CIS 3263 distingue 94 (indeciso), 98 (no sabe) y 99 (no contesta).</p>';
}
export async function bindHomologacion2019(){
 const root=document.querySelector('#historical-codes-data');if(!root)return;
 try{
  const urls=['data/microdatos/evidencia_homologacion_2019.json','data/microdatos/homologacion_2019_pendiente.json'];
  const docs=await Promise.all(urls.map(async u=>{const r=await fetch(u,{cache:'no-store'});if(!r.ok)throw Error('HTTP '+r.status+' · '+u);return r.json()}));
  const checked=validarEvidencia2019(...docs);
  if(root.isConnected)root.innerHTML=renderEstadoHomologacion2019(checked);
 }catch(e){if(root.isConnected)root.textContent='No se ha podido verificar la homologación de 2019: '+e.message;}
}

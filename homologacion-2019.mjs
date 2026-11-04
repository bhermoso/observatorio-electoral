// Puente de evidencia documental CIS 2019. Nunca autoriza extrapolación automática.
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeLink=u=>typeof u==='string'&&/^https:\/\/www\.cis\.es\//.test(u)?u:null;

export function validarEvidencia2019(registry,config,originals=null){
 if(registry?.schema_version!==1||!registry.studies?.['3242']||!registry.studies?.['3263'])throw Error('Registro documental incompleto');
 if(!config?.studies?.['3242']||!config?.studies?.['3263'])throw Error('Falta contrato de homologación');
 const elections=['3242','3263'].map(id=>{
  const proof=registry.studies[id],item=config.studies[id];
  if(proof.verified.some(x=>!safeLink(x.source)))throw Error('La evidencia no tiene fuente oficial');
  if(Object.values(proof.direct_vote_questionnaire_codes||{}).some(x=>!x))throw Error('Código de cuestionario vacío');
  const original=originals?.studies?.[id]||null;
  if(original){
   if(original.archive_sha256!==proof.original_zip_sha256||
      original.archive_sha256!==item.source_archive_sha256||
      original.matched_existing_aggregates!==true||
      !Number.isInteger(original.n)||original.n<1||
      !Number.isFinite(original.weighted_n)||!Number.isFinite(original.kish_n))
      throw Error('No se confirma el ZIP original y su agregado: CIS '+id);
   for(const [key,name] of Object.entries(proof.variables_verified_in_original_ES||{})){
    if(item[key]!==name||!Array.isArray(original.variables?.[name]))
      throw Error('Variable original sin correspondencia verificada: '+key+' / '+id);
   }
  }
  const missing=['weight','intention','combined_vote_sympathy','recall','participation','universe_filter','result_vote_denominator','reviewed_by','review_date']
   .filter(k=>item[k]===null||item[k]===undefined||item[k]==='');
  const unresolved=(proof.unresolved||[]);
  return {id,election:proof.election,proof,original,missing,unresolved,homologated:missing.length===0&&unresolved.length===0};
 });
 const ready=elections.every(x=>x.homologated);
 return {status:ready?'VERIFICADA':'PARCIAL',elections,verified:ElectionsProofCount(elections),ready};
}
const ElectionsProofCount=items=>items.reduce((n,item)=>n+item.proof.verified.length,0);

export function renderHomologacion2019(){
 return '<section class="historical-codes" id="pronostico-homologacion" aria-labelledby="historical-codes-title">'+
  '<div class="historical-codes-heading"><div><span class="eyebrow">Trazabilidad de variables y candidaturas</span>'+
  '<h3 id="historical-codes-title">Qué está homologado en los estudios de 2019</h3>'+
  '<p>Ahora cotejamos ZIP, ficheros DA, diccionarios y ponderaciones originales. La correspondencia entre variables está comprobada; la homologación electoral completa continúa siendo parcial.</p></div>'+
  '<a href="data/microdatos/evidencia_homologacion_2019.json" download>Evidencias documentales ↓</a></div>'+
  '<div id="historical-codes-data" aria-live="polite">Cargando estado documental…</div></section>';
}
export function renderEstadoHomologacion2019(checked){
 if(!checked?.elections?.length)throw Error('Cobertura de homologación desconocida');
 const studies=checked.elections.map(x=>{
  const src=x.proof.official_study;
  return '<article class="historical-codes-study"><div class="historical-codes-line"><h4>CIS '+esc(x.id)+' · '+esc(x.election)+'</h4>'+
   '<span class="historical-codes-status">Pendiente de homologación completa</span></div>'+
   '<p>'+x.proof.verified.length+' referencias documentales · '+x.unresolved.length+' decisiones metodológicas pendientes.</p>'+
   (x.original?'<p class="historical-codes-original"><b>ZIP original cotejado</b> · '+Number(x.original.n).toLocaleString('es-ES')+
    ' entrevistas · peso nacional PESO · n efectivo Kish '+Math.round(x.original.kish_n).toLocaleString('es-ES')+
    ' · SHA-256 comprobado</p>':'<p>Sin cotejo directo de original en esta versión.</p>')+
   '<details><summary>Documentación consultada, códigos y decisiones pendientes</summary>'+
   '<ul>'+x.proof.verified.map(v=>'<li><b>'+esc(v.field)+':</b> '+esc(v.value)+
    ' <a href="'+esc(v.source)+'" target="_blank" rel="noopener">Fuente CIS ↗</a></li>').join('')+'</ul>'+
   (x.proof.direct_vote_questionnaire_codes?'<p><b>Códigos de la pregunta de voto del cuestionario (no nombres de variables del ZIP):</b> '+
    Object.entries(x.proof.direct_vote_questionnaire_codes).map(([code,label])=>esc(code)+' = '+esc(label)).join(' · ')+'</p>':'')+
   '<p><b>Variables verificadas en sintaxis y diccionario originales:</b> '+
    Object.entries(x.proof.variables_verified_in_original_ES||{}).map(([k,v])=>esc(k)+' = '+esc(v)).join(' · ')+'</p>'+
   (x.original?'<p><b>Posiciones en DA (columnas originales):</b> '+
    Object.entries(x.original.variables).map(([k,v])=>esc(k)+' ['+v[0]+'–'+v[1]+']').join(' · ')+
    '. <b>Participación:</b> '+esc(x.original.turnout_question)+' es intención de acudir; '+esc(x.original.turnout_probability)+
    ' es escala de probabilidad 0–10. <b>Recuerdo:</b> voto declarado de '+esc(x.original.prior_election_recall)+'.</p>':'')+
   '<ul>'+x.unresolved.map(v=>'<li>'+esc(v)+'</li>').join('')+'</ul>'+
   '</details><p><a href="'+esc(src)+'" target="_blank" rel="noopener">Ficha del estudio CIS ↗</a></p></article>';
 }).join('');
 return '<p class="historical-codes-top"><strong>'+checked.elections.filter(x=>x.original).length+
  ' de 2 ZIP originales cotejados.</strong> '+checked.verified+
  ' referencias documentales adicionales verificadas. <b>'+checked.elections.filter(x=>x.homologated).length+
  ' de 2 estudios habilitados para reestimar voto.</b></p>'+
  '<div class="historical-codes-grid">'+studies+'</div>'+
  '<p class="historical-codes-limit"><b>Bloqueo deliberado:</b> las variables y recuentos originales están verificados, pero las transformaciones de voto, coaliciones territoriales y condiciones para validar una receta todavía no están resueltas; no se altera el Motor ni se proclama una validación predictiva. El CIS 3263 distingue 94 (indeciso), 98 (no sabe) y 99 (no contesta).</p>';
}
export async function bindHomologacion2019(){
 const root=document.querySelector('#historical-codes-data');if(!root)return;
 try{
  const urls=['data/microdatos/evidencia_homologacion_2019.json','data/microdatos/homologacion_2019_pendiente.json','data/microdatos/cotejo_originales_2019.json'];
  const docs=await Promise.all(urls.map(async u=>{const r=await fetch(u,{cache:'no-store'});if(!r.ok)throw Error('HTTP '+r.status+' · '+u);return r.json()}));
  const checked=validarEvidencia2019(...docs);
  if(root.isConnected)root.innerHTML=renderEstadoHomologacion2019(checked);
 }catch(e){if(root.isConnected)root.textContent='No se ha podido verificar la homologación de 2019: '+e.message;}
}

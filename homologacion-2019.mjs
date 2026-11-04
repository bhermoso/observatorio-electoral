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

const transicionesLabels={
 "3242":{"3":"Unidas Podemos","6":"En Comú Podem","1":"PP","4":"Ciudadanos","95":"Otro partido"},
 "3263":{"21":"Unidas Podemos","6":"En Comú Podem","67":"En Común–Unidas Podemos","3":"Podemos","50":"Más País","95":"Otro partido","7":"Més Compromís","30":"Más País–Chunta Aragonesista"}
};
const rawLabels={"3242":{"3":"Podemos","5":"IU","1":"PP","4":"Ciudadanos"},
 "3263":{"21":"Unidas Podemos","3":"Podemos","5":"IU","50":"Más País","1":"PP","4":"Ciudadanos"}};

export function renderTransiciones2019(report,originals){
 if(report?.schema_version!==1||!report.studies?.['3242']||!report.studies?.['3263'])
  throw Error('Falta el cotejo de recodificaciones');
 const ids=['3242','3263'];
 const studies=ids.map(id=>{
  const a=report.studies[id],o=originals?.studies?.[id];
  if(!o||o.archive_sha256!==a.source_zip_sha256||o.n!==a.n||
     a.fully_explained_observed_records!==a.n||
     a.direct_vote_retained_in_votosimg.n+a.requires_sympathy_or_special_recode.n!==a.n||
     ['raw_vote_to_recoded_by_province','raw_sympathy_to_recoded_by_province',
      'non_candidate_raw_sympathy_to_combined_by_province'].some(k=>a[k]?.ambiguous_keys!==0||a[k]?.minimum_disagreements!==0))
   throw Error('El cotejo de transiciones no coincide con el original CIS '+id);
  return {id,...a};
 });
 const trs=studies.map(v=>'<tr><th scope="row">CIS '+esc(v.id)+'</th>'+
  '<td>'+v.n.toLocaleString('es-ES')+'</td>'+
  '<td>'+v.raw_vote_to_recoded_by_province.observed_keys+'</td>'+
  '<td>'+v.raw_sympathy_to_recoded_by_province.observed_keys+'</td>'+
  '<td>'+v.non_candidate_raw_sympathy_to_combined_by_province.observed_keys+'</td>'+
  '<td>'+v.direct_vote_retained_in_votosimg.n.toLocaleString('es-ES')+'</td>'+
  '<td>0</td></tr>').join('');
 const ex=studies.flatMap(v=>v.examples_vote_recode_min_cell_20
  .filter(x=>v.id==='3242'?x.code_from==='3':x.code_from==='21'||x.code_from==='50')
  .flatMap(x=>Object.entries(x.destinations).map(([dest,n])=>
    '<tr><th scope="row">'+esc(v.id)+'</th>'+
    '<td>'+esc(x.code_from)+' · '+esc(rawLabels[v.id]?.[x.code_from]||'Otra opción')+'</td>'+
    '<td>'+esc(dest==='OTRAS_TRANSFORMACIONES_AGRUPADAS'?'Otras transformaciones agrupadas':
      dest+' · '+(transicionesLabels[v.id]?.[dest]||'Candidatura territorial'))+'</td>'+
    '<td>'+Number(n).toLocaleString('es-ES')+'</td></tr>'))).join('');
 return '<section class="historical-transitions" aria-label="Recodificaciones empíricas CIS 2019">'+
  '<div class="historical-transitions-heading"><h4>Reconstrucción de recodificaciones · 2019</h4>'+
  '<a href="data/microdatos/transiciones_2019.json" download>Datos agregados ↓</a></div>'+
  '<p>Las combinaciones observadas de código original y provincia conducen a una sola codificación de destino en ambos estudios. Las respuestas definidas incluyen candidaturas, voto en blanco y voto nulo. No equivale a recuperar el programa interno del CIS.</p>'+
  '<div class="table-wrap"><table><thead><tr><th>Estudio</th><th>Entrevistas</th><th>Claves voto + provincia</th><th>Claves simpatía + provincia</th><th>Claves simpatía → VOTOSIMG</th><th>Respuesta definida conservada</th><th>Claves ambiguas</th></tr></thead><tbody>'+trs+'</tbody></table></div>'+
  '<details class="historical-transitions-detail"><summary>Ver los cambios de candidaturas al recodificar por territorio</summary>'+
  '<p>Ejemplos con al menos 20 casos por celda; los menores se presentan agrupados. Código 67: En Común–Unidas Podemos; código 50: Más País. Estos nombres pertenecen a 2019, no a Sumar actual.</p>'+
  '<div class="table-wrap"><table><thead><tr><th>Estudio</th><th>Respuesta original</th><th>Destino en el archivo recodificado</th><th>Entrevistas</th></tr></thead><tbody>'+ex+'</tbody></table></div>'+
  '</details>'+
  '<p class="historical-transitions-caveat"><b>Interpretación:</b> en las '+studies.reduce((n,s)=>n+s.n,0).toLocaleString('es-ES')+
  ' entrevistas hay coincidencia completa de las claves observadas. No se ha demostrado equivalencia para claves ausentes, ni la fórmula interna, ni eficacia predictiva fuera de muestra. No se ha modificado el Motor 29N.</p>'+
  '</section>';
}

export async function bindHomologacion2019(){
 const root=document.querySelector('#historical-codes-data');if(!root)return;
 try{
  const urls=['data/microdatos/evidencia_homologacion_2019.json','data/microdatos/homologacion_2019_pendiente.json','data/microdatos/cotejo_originales_2019.json','data/microdatos/transiciones_2019.json'];
  const docs=await Promise.all(urls.map(async u=>{const r=await fetch(u,{cache:'no-store'});if(!r.ok)throw Error('HTTP '+r.status+' · '+u);return r.json()}));
  const checked=validarEvidencia2019(...docs.slice(0,3));
  if(root.isConnected)root.innerHTML=renderEstadoHomologacion2019(checked)+renderTransiciones2019(docs[3],docs[2]);
 }catch(e){if(root.isConnected)root.textContent='No se ha podido verificar la homologación de 2019: '+e.message;}
}

// Contraste retrospectivo 2019; una regla sobre código 94, NO es prueba prospectiva.
// Candidaturas homólogas inequívocas: PSOE, PP, VOX y Ciudadanos.
// No se imputa el código 98 (N.S.) ni el 99 (N.C.) en esta primera comparación.
export const PARTIES_2019=['PSOE','PP','VOX','CIUDADANOS'];
export const CANDIDATE_GROUPS_2019=[...PARTIES_2019,'UNIDAS_PODEMOS','OTRAS_CANDIDATURAS'];
export const OFFICIAL_2019={
 '3242':{election:'2019-04-28',valid_votes:26201371,votes:{PSOE:7513142,PP:4373653,VOX:2688092,CIUDADANOS:4155665},source:'https://www.boe.es/diario_boe/txt.php?id=BOE-A-2019-8070'},
 '3263':{election:'2019-11-10',valid_votes:24258228,votes:{PSOE:6792199,PP:5047040,VOX:3656979,CIUDADANOS:1650318},source:'https://boe.es/diario_boe/txt.php?id=BOE-A-2019-17344&lang=es'}};
export const METHODS_2019={exclude:'Sin imputar (base de declarantes)',proportional:'Indecisión 94 proporcional',sympathy:'Indecisión 94: VOTOSIMG identificable',hybrid:'Indecisión 94: VOTOSIMG + residuo proporcional'};
const total=values=>values.reduce((a,b)=>a+b,0);
export function historicalStudy2019(data,id,method){
 if(!METHODS_2019[method])throw Error('Receta desconocida');
 const sample=data.studies[id],official=OFFICIAL_2019[id];
 if(!sample||!official)throw Error('Estudio sin correspondencia electoral');
 const original=Object.fromEntries(CANDIDATE_GROUPS_2019.map(p=>[p,sample.intention[p]?.w??0]));
 const base=total(Object.values(original)),final={...original},g=sample.groups.INDECISION;
 const observed=Object.fromEntries(CANDIDATE_GROUPS_2019.map(p=>[p,g.votosimg[p]?.w??0]));
 const identified=total(Object.values(observed)),residual=g.w-identified;
 if(residual < -0.01)throw Error('La asignación excede el grupo');
 let added=0;
 if(method==='sympathy'||method==='hybrid'){
  for(const p of CANDIDATE_GROUPS_2019)final[p]+=observed[p];
  added+=identified;
 }
 if(method==='proportional'||method==='hybrid'){
  const pool=method==='hybrid'?residual:g.w;
  for(const p of CANDIDATE_GROUPS_2019)final[p]+=pool*original[p]/base;
  added+=pool;
 }
 const denominator=total(Object.values(final));
 const metrics=PARTIES_2019.map(p=>{
  const estimated=100*final[p]/denominator;
  const observed=100*official.votes[p]/official.valid_votes;
  return {party:p,estimated,observed,error_pp:estimated-observed,absolute_error_pp:Math.abs(estimated-observed)};
 });
 return {id,election:official.election,method,rule:METHODS_2019[method],
  initial_denominator:base,final_denominator:denominator,group_n:g.n,group_weight:g.w,
  identified_weight:identified,residual_weight:residual,assigned_weight:added,metrics,
  mae:total(metrics.map(m=>m.absolute_error_pp))/metrics.length,official_source:official.source};
}
export function retrospective2019(data){
 const ids=['3242','3263'];const methods=Object.keys(METHODS_2019);
 const rows=methods.map(method=>{
  const studies=ids.map(id=>historicalStudy2019(data,id,method));
  return {method,label:METHODS_2019[method],studies,mae_mean:total(studies.map(x=>x.mae))/2};
 });
 return {rows,independentProspectiveTests:0,distinctElectionsRetrospective:2,
  result:'RETROSPECTIVA_EXPLORATORIA_NO_VALIDADA',
  limitations:['Solo se imputa la indecisión explícita 94; se excluyen los grupos 98 y 99.',
   'Las coaliciones territoriales y el significado preciso de otras candidaturas necesitan homologación adicional.',
   'El estudio de octubre y la elección de noviembre son contextos diferentes al estudio de marzo y elección de abril.',
   'La selección de recetas se ha realizado después de conocer los resultados históricos; estas dos elecciones NO son pruebas prospectivas independientes.',
   'Sin errores provinciales, escaños o intervalos de incertidumbre de diseño.']};
}

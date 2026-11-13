/** Contrastes del mismo estudio. No combina encuestas ni calcula recetas no ejecutadas. */
export const RECIPE_IDS=['directa','peso','simpatia','recuerdo','indecisos','participacion'];
const aliases={SUMAR:['Sumar/FA','Sumar'],PODEMOS:['Podemos'],BILDU:['EH Bildu'],JUNTS:['Junts'],PNV:['PNV'],OTROS:['Otros'],BLANCO:['Blanco']};
export function sameSample3584(source){
 if(source?.estudio!=='3584'||source.ficha?.n!==45074)throw Error('El agregado no identifica el CIS 3584 de 45.074 entrevistas');
 const official={...source.estimacion_nacional_original},direct={...source.voto_directo_original},keys=Object.keys(official);
 if(!keys.length||keys.some(k=>!Number.isFinite(official[k])||!Number.isFinite(direct[k])||official[k]<0||direct[k]<0))throw Error('Faltan categorías originales comparables');
 const denominator=keys.reduce((sum,k)=>sum+direct[k],0);if(!(denominator>0))throw Error('No hay masa de voto válido');
 const proportional=Object.fromEntries(keys.map(k=>[k,100*direct[k]/denominator]));
 return {study:'3584',n:source.ficha.n,level:'agregados',field:[source.ficha.campo_inicio,source.ficha.campo_fin],official,
  labels:Object.fromEntries(keys.map(k=>[k,k])),keys,denominator,
  stages:[{id:'censo',name:'Directa publicada · base «censo»',base:'censo',values:Object.fromEntries(keys.map(k=>[k,direct[k]])),rule:'Porcentajes publicados por el CIS sobre su base «censo». No están sobre voto válido.',method:'Lectura de la tabla original; sin redistribuir respuestas.'},
   {id:'proporcional',name:'R0 · normalizar la directa a voto válido',base:'valido',values:proportional,rule:'Se conservan candidaturas, otros y blanco. Se excluyen nulo, abstención y NS/NC del denominador, sin adjudicarles una candidatura.',method:'100 × porcentaje directo / '+denominator.toLocaleString('es-ES',{maximumFractionDigits:2})+'. Base aproximada por redondeo de las tablas; no reproduce PESO ni la receta completa del CIS.'},
   {id:'oficial',name:'Estimación publicada por el CIS',base:'valido',values:official,rule:'Estimación electoral oficial del mismo CIS 3584. Su fórmula completa no está reconstruida.',method:'Referencia externa, no una receta reconstruida del Observatorio.'}],
  unallocated:Object.fromEntries(Object.entries(direct).filter(([k])=>!keys.includes(k))),
  limitation:'No hemos incorporado una matriz individual del 3584. Recuerdo, simpatía y participación no se recalculan a partir de estas tablas marginales.',
  source:source.fuentes[0].url,trace:'data/sources/cis-3584.json'};
}
export function sameSampleMicro(recipe,polls){
 const study=recipe?.estudio;if(!['3411','3415','3582'].includes(study))throw Error('Estudio sin receta individual contrastable');
 const matches=polls.filter(p=>p.id===(study==='3582'?'cis-3582':study)&&p.institute==='CIS');if(matches.length!==1)throw Error('Referencia CIS ambigua o ausente');const poll=matches[0];
 const originalN={3411:29201,3415:8798,3582:5024}[study],knownDifference=study==='3582'&&poll.sample===5025;
 if(recipe.pasos?.[0]?.entrevistas!==originalN||(!knownDifference&&poll.sample!==originalN)||recipe.pasos.length!==RECIPE_IDS.length||recipe.pasos.some((s,i)=>s.id!==RECIPE_IDS[i]))throw Error('La receta y la referencia no identifican la misma muestra o secuencia');
 const keys=Object.keys(recipe.pasos[0].estimacion).filter(k=>!(['3411','3415'].includes(study)&&['PODEMOS','SALF'].includes(k))),official={};
 for(const k of keys){const key=(aliases[k]||[k]).find(x=>Object.hasOwn(poll.values,x));if(key!==undefined)official[k]=poll.values[key];}
 if(recipe.pasos.some(s=>keys.some(k=>!Number.isFinite(s.estimacion[k]))))throw Error('Receta incompleta: no se permiten ceros para rellenar ausencias');
 const stages=recipe.pasos.map(s=>({id:s.id,name:s.titulo,base:'valido',values:s.estimacion,rule:s.regla,method:s.parametro,details:s}));
 stages.push({id:'oficial',name:'Estimación publicada por el CIS',base:'valido',values:official,rule:'Estimación oficial sobre las mismas entrevistas. Las categorías no transcritas quedan sin cifra.',method:'No se infiere la fórmula oficial a partir de la nuestra.'});
 return {study,n:originalN,registeredN:poll.sample,sampleDifference:poll.sample!==originalN,level:'microdatos',field:[poll.fieldStart,poll.fieldEnd],official,keys,
  labels:{...Object.fromEntries(keys.map(k=>[k,k])),SUMAR:study==='3582'?'Sumar/FA':'Sumar',BILDU:'EH Bildu',OTROS:'Otros',BLANCO:'En blanco'},stages,
  limitation:'Receta heredada y experimental: sus criterios y coeficientes están pendientes de discusión. Las etapas son acumulativas; sus diferencias no son efectos causales aislados. No entra en el pronóstico.',
  source:poll.source,trace:'data/microdatos/cocina_cis_'+study+'.json',hash:recipe.sha256_zip,limits:recipe.limitaciones};
}
export function compareStages(data,aId,bId){
 const a=data.stages.find(s=>s.id===aId),b=data.stages.find(s=>s.id===bId);if(!a||!b)throw Error('Etapa no disponible para este estudio');
 const compatible=a.base===b.base;
 const rows=data.keys.map(key=>{const aValue=Number.isFinite(a.values[key])?a.values[key]:null,bValue=Number.isFinite(b.values[key])?b.values[key]:null,official=Number.isFinite(data.official[key])?data.official[key]:null;
  return {key,label:data.labels[key]||key,a:aValue,b:bValue,official,delta:compatible&&aValue!==null&&bValue!==null?bValue-aValue:null,versusOfficial:b.base==='valido'&&bValue!==null&&official!==null?bValue-official:null};});
 return {a,b,compatible,rows};
}

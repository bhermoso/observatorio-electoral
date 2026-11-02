// Evaluación retrospectiva: 16 reglas × 2 estudios, una sola elección (23J).
// No se permite interpretar retención de otro estudio 2023 como validación independiente.
import {estimate,PARTIES} from './motor-imputacion.mjs';
export const EVALUATED_PARTIES=['PP','PSOE','VOX','SUMAR'];
export const POLICIES=['exclude','proportional','sympathy','hybrid'];
export const POLICY_LABELS={exclude:'No imputar',proportional:'Proporcional',sympathy:'VOTOSIMG identificable',hybrid:'VOTOSIMG + residuo proporcional'};
const mean=xs=>xs.reduce((a,b)=>a+b,0)/xs.length;
export function score(votes,actual){
 const errors=Object.fromEntries(EVALUATED_PARTIES.map(p=>[p,votes[p]-actual[p]]));
 const absolute=Object.fromEntries(EVALUATED_PARTIES.map(p=>[p,Math.abs(errors[p])]));
 return {errors,absolute,mae:mean(Object.values(absolute)),max:Math.max(...Object.values(absolute)),bias:mean(Object.values(errors))};
}
export function auditImputations(ledger,validation){
 const official=validation?.official_vote_valid_percent;
 if(!official||EVALUATED_PARTIES.some(p=>!Number.isFinite(official[p])))throw Error('Resultado oficial insuficiente');
 const election='2023-07-23';
 const rows=[];
 for(const indecision of POLICIES)for(const nonresponse of POLICIES){
  const studies=['3411','3415'].map(study=>{
   const result=estimate(ledger,{study,indecision,nonresponse});
   const metrics=score(result.final.votes,official);
   return {study,n:result.sample_n,vote:result.final.votes,denominator:result.final.denominator,
    contributions:result.entries.map(e=>({group:e.group,assigned_weight:e.assigned_weight,not_assigned_weight:e.not_assigned_weight})),...metrics};
  });
  rows.push({id:indecision+'__'+nonresponse,indecision,nonresponse,studies,
   mae23j:mean(studies.map(s=>s.mae)),
   withinElectionShift:mean(EVALUATED_PARTIES.map(p=>Math.abs(studies[0].vote[p]-studies[1].vote[p]))),
   maxObservedError:Math.max(...studies.map(s=>s.max))});
 }
 const published=['3411','3415'].map(study=>{
  const votes=validation.studies?.[study]?.scenarios?.published_cis;
  return votes?{study,...score(votes,official),vote:votes}:null;
 }).filter(Boolean);
 return {election,parties:EVALUATED_PARTIES,official,rows,published,
  coverage:{elections:1,studies:2,independentElectionTests:0,modelFamilies:16,validatedForDeployment:false},
  decision:{status:'NO_VALIDADO',selectedRecipe:null,reason:'Los dos estudios se refieren a la misma elección de 2023. Estas 16 recetas fueron exploradas con el resultado conocido; no hay selección prospectiva ni evaluación fuera de muestra por elección.'},
  limitations:['MAE y máximo son errores descriptivos frente al resultado conocido del 23J, no error esperado de elecciones futuras.',
  'La diferencia entre estudios de una misma convocatoria combina tiempo de campo, diseño de muestras y medición; no sustituye la validación entre elecciones.',
  'Solo se evalúan cuatro partidos y el voto nacional, no reparto provincial ni acierto de escaños.',
  'VOTOSIMG es una variable combinada; algunos códigos de no respuesta de escasa frecuencia se agrupan para preservar celdas.',
  'No se realizan intervalos de diseño, bootstrap de entrevistas ni corrección por sesgos no observados con estos agregados.']};
}

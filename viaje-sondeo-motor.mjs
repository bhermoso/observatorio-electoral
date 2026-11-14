import {projection} from './cocina-escanos.mjs';
export const INGREDIENTS=['peso','simpatia','recuerdo','indecisos','participacion'];
export function scenarioKey(flags){return INGREDIENTS.map(k=>flags[k]?'1':'0').join('')}
export function journey(data,flags){
 if(!data.study||!data.scenarios)throw Error('Fuente del recorrido no disponible');
 const partial=Object.fromEntries(INGREDIENTS.map(k=>[k,false]));
 const raw=data.scenarios['00000'];
 const stages=[{id:'muestra',outcome:raw,applied:false},{id:'directa',outcome:raw,applied:true}];
 for(const id of INGREDIENTS){partial[id]=!!flags[id];const key=scenarioKey(partial);if(!data.scenarios[key])throw Error('Falta la combinación '+key);stages.push({id,outcome:data.scenarios[key],applied:!!flags[id]});}
 stages.push({id:'territorio',outcome:stages.at(-1).outcome,applied:true},{id:'escanos',outcome:stages.at(-1).outcome,applied:true});
 return stages;
}
export function seatScenario(election,outcome,{fourth='SUMAR'}={}){
 const candidacy=Object.entries(outcome.shares).reduce((s,[p,v])=>s+(p==='BLANCO'?0:v),0);
 if(!(candidacy>0))throw Error('No hay cuota de candidaturas');
 const shares=Object.fromEntries(['PP','PSOE','VOX','SUMAR'].map(p=>[p,100*(outcome.shares[p==='SUMAR'?fourth:p]||0)/candidacy]));
 return {...projection(election,shares,{detail:true}),candidacy,blankShare:outcome.shares.BLANCO};
}

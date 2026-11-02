// Libro mayor de recetas sobre grupos observados, sin alterar registros originales.
// Cada contribución identifica grupo, regla, numerador, denominador y destino.
export const PARTIES=['PSOE','PP','VOX','SUMAR','OTROS'];
export const POLICIES={exclude:'No imputar',proportional:'Distribuir como los decididos',sympathy:'Solo VOTOSIMG con candidatura',hybrid:'VOTOSIMG identificable y residuo proporcional'};
const add=(a,b)=>a+b;
const total=(values)=>values.reduce(add,0);
export function estimate(ledger,{study='3411',indecision='exclude',nonresponse='exclude'}={}){
 const sample=ledger.studies[study];if(!sample)throw Error('Estudio desconocido');
 if(!POLICIES[indecision]||!POLICIES[nonresponse])throw Error('Tratamiento desconocido');
 const base=Object.fromEntries(PARTIES.map(p=>[p,sample.direct[p][1]]));
 const starting=total(Object.values(base));
 if(starting<=0)throw Error('Sin intención de candidatura');
 const entries=[];
 const originalShares=Object.fromEntries(PARTIES.map(p=>[p,base[p]/starting]));
 const final={...base};
 for(const [group,policy] of [['INDECISION',indecision],['NO_CONTESTA',nonresponse]]){
  const g=sample.groups[group],allocated=Object.fromEntries(PARTIES.map(p=>[p,0]));
  let assigned=0;
  const candidate=total(PARTIES.map(p=>g.sympathy[p]?.[1]||0));
  const unresolved=g.w-candidate;
  const classified=total(Object.values(g.sympathy).map(v=>v[1]));
  if(Math.abs(classified-g.w)>0.03)throw Error('Los pesos del grupo no cierran');
  if(['sympathy','hybrid'].includes(policy)){
   for(const p of PARTIES)allocated[p]+=(g.sympathy[p]?.[1]||0);
   assigned+=candidate;
  }
  if(['proportional','hybrid'].includes(policy)){
   const pool=policy==='proportional'?g.w:unresolved;
   for(const p of PARTIES)allocated[p]+=pool*originalShares[p];
   assigned+=pool;
  }
  for(const p of PARTIES)final[p]+=allocated[p];
  const skipped=g.w-assigned;
  entries.push({group,policy,label:POLICIES[policy],interviews:g.n,total_weight:g.w,observable_candidates_weight:candidate,
    unresolved_weight:unresolved,assigned_weight:assigned,not_assigned_weight:skipped,
    contributions:allocated, denominator_before:starting+total(entries.slice(0,-1).map(x=>x.assigned_weight)),
    denominator_after:starting+total(entries.map(x=>x.assigned_weight)),
    assumption:policy==='exclude'?'Sin imputación: se mantiene fuera del denominador de voto estimado.':
    policy==='proportional'?'La distribución entre declarantes se traslada a este grupo. Hipótesis de ausencia de sesgo partidista.':
    policy==='sympathy'?'Se incorporan solo candidaturas observables en VOTOSIMG. Sin asignar el residuo.':
    'Se incorporan candidaturas identificables en VOTOSIMG y se distribuye el residuo según la intención entre declarantes.'});
 }
 const denominator=total(Object.values(final));
 const votes=Object.fromEntries(PARTIES.map(p=>[p,100*final[p]/denominator]));
 return {study,config:{indecision,nonresponse},sample_n:sample.n,baseline:{numerators:base,denominator:starting,
  shares:Object.fromEntries(PARTIES.map(p=>[p,100*base[p]/starting]))},
 entries,final:{numerators:final,denominator,votes},
 check:{numerators_sum:total(Object.values(final)),allocated_total:total(entries.map(e=>e.assigned_weight)),
  closes:Math.abs(denominator-starting-total(entries.map(e=>e.assigned_weight)))<0.05},
 limitations:['No se han reestimado los pesos de diseño ni calculado incertidumbre muestral por receta.','Las reglas son escenarios experimentales, no correcciones históricamente validadas.','VOTOSIMG es una variable combinada, no una medición independiente de simpatía.']};
}
export function compare(ledger,optionsA,optionsB){
 const a=estimate(ledger,optionsA),b=estimate(ledger,optionsB);
 return {a,b,changes:Object.fromEntries(PARTIES.map(p=>[p,b.final.votes[p]-a.final.votes[p]]))};
}

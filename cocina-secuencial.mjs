// Motor de operaciones COMBINABLES sobre cubos anonimizados, no imputación de individuos.
// Cada celda es (n, suma PESO, suma PESO con PROBVOTO valido, suma PESO*PROBVOTO/10).
export const PARTIES=['PSOE','PP','VOX','SUMAR','OTROS','NO_CANDIDATURA'];
export const DEFAULTS=Object.freeze({study:'3411',weighted:false,decided:false,sympathy:false,recallOnly:false,participation:0});
const sum=(xs)=>xs.reduce((a,b)=>a+b,0);
export function calculate(cube,config){
 const c={...DEFAULTS,...config};
 const study=cube.studies?.[c.study];
 if(!study)throw Error('Estudio no disponible');
 const alpha=Number(c.participation);
 if(!Number.isFinite(alpha)||alpha<0||alpha>1)throw Error('Participación fuera del rango 0–1');
 if(alpha>0&&!c.weighted)throw Error('El ajuste PROBVOTO solo se aplica tras activar los pesos PESO');
 const table=study.cube[c.sympathy?1:0];
 const totals=PARTIES.map((party,p)=>{
  let count=0,w=0;
  for(const recallIndex of (c.recallOnly?[1]:[0,1])){
   const [n,weighted,valid,byProbability]=table[p][recallIndex];
   // Al activar participación se restringe a personas con puntuación válida.
   const base=alpha>0?valid:weighted;
   count+=n;w+=c.weighted?(alpha>0?(1-alpha)*base+alpha*byProbability:weighted):n;
  }
  return {party,count,weight:w};
 });
 const included=totals.filter((r,i)=>!c.decided||i<5);
 const denom=sum(included.map(x=>x.weight));
 if(!(denom>0))throw Error('El universo seleccionado no contiene respuestas suficientes');
 const shares=Object.fromEntries(totals.map((r,i)=>[r.party,c.decided&&i===5?null:100*r.weight/denom]));
 return {study:c.study,config:c,denominator:denom,shares,counts:Object.fromEntries(totals.map(r=>[r.party,r.count])),
  total_interviews:sum(included.map(x=>x.count)), sum_all_shares:sum(included.map(x=>shares[x.party]??0)),
  caveats:alpha>0?['Se excluyen respuestas con PROBVOTO ausente o fuera de 0–10; la muestra efectiva cambia y la cifra de entrevistas no refleja esa exclusión.']:[]};
}
export function pipeline(cube,config){
 const target={...DEFAULTS,...config};
 const stages=[
  {id:'respuestas',name:'1. Respuestas sin ponderar',config:{...DEFAULTS,study:target.study}},
  {id:'peso',name:'2. Aplicar pesos PESO',config:{...DEFAULTS,study:target.study,weighted:target.weighted}},
  {id:'universo',name:'3. Definir universo de voto',config:{...DEFAULTS,study:target.study,weighted:target.weighted,decided:target.decided}},
  {id:'simpatia',name:'4. Sustituir la pregunta por VOTOSIMG',config:{...DEFAULTS,study:target.study,weighted:target.weighted,decided:target.decided,sympathy:target.sympathy}},
  {id:'participacion',name:'5. Ajustar por PROBVOTO',config:{...DEFAULTS,study:target.study,weighted:target.weighted,decided:target.decided,sympathy:target.sympathy,participation:target.weighted?target.participation:0}},
  {id:'recuerdo',name:'6. Filtrar recuerdo (diagnóstico)',config:{...target,participation:target.weighted?target.participation:0}}
 ];
 let last=null;
 return stages.map(stage=>{
  const outcome=calculate(cube,stage.config);
  const changes=Object.fromEntries(PARTIES.slice(0,5).map(p=>[p,last&&last.shares[p]!==null&&outcome.shares[p]!==null?outcome.shares[p]-last.shares[p]:null]));
  last=outcome;return {...stage,outcome,delta_pp:changes};
 });
}

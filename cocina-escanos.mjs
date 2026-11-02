// Proyección DIDÁCTICA de escenarios de cocina sobre geografía oficial 23J.
// Escala las cuotas nacionales por IPF, conserva la distribución interna de
// cada candidatura regional, después aplica D'Hondt real por circunscripción.
// NO es el Motor 29N: no incorpora incertidumbre ni estimación de casas.
import {allocate} from './engine.mjs';
export const GROUPS=['PP','PSOE','VOX','SUMAR','OTROS'];
const GROUP_BY_ID={p0:'PP',p1:'PSOE',p4:'PSOE',p2:'VOX',p3:'SUMAR'};
const group=id=>GROUP_BY_ID[id]||'OTROS';
export function projection(election,shares,{iterations=120}={}){
 const expected=['PP','PSOE','VOX','SUMAR'];
 if(!election?.districts?.length||election.districts.length!==52)throw Error('Geografía oficial incompleta');
 const values=expected.map(k=>Number(shares[k]));
 if(values.some(v=>!Number.isFinite(v)||v<0||v>100))throw Error('Porcentajes inválidos');
 const total=values.reduce((a,b)=>a+b,0);
 if(total>=100)throw Error('Los cuatro partidos superan o igualan el 100 %; falta una cuota para otros');
 const goals=[...values,100-total].map(x=>x/100);
 const dists=election.districts;
 const voterTotals=dists.map(d=>Object.values(d.votes).reduce((a,b)=>a+b,0));
 const grand=voterTotals.reduce((a,b)=>a+b,0);
 const rows=dists.map(d=>GROUPS.map(g=>Object.entries(d.votes).reduce((a,[id,v])=>a+(group(id)===g?v:0),0)));
 const scaled=rows.map(row=>row.map(v=>v>0?v:0));
 // Ajuste iterativo por fila (total de cada circunscripción) y columna (cuota nacional).
 for(let iter=0;iter<iterations;iter++){
  const sums=GROUPS.map((_,j)=>scaled.reduce((a,row)=>a+row[j],0));
  for(let j=0;j<GROUPS.length;j++){
   if(goals[j]>0&&sums[j]===0)throw Error('Una candidatura no tiene base territorial histórica');
   const factor=sums[j]>0?goals[j]*grand/sums[j]:0;
   for(const row of scaled)row[j]*=factor;
  }
  for(let i=0;i<scaled.length;i++){
   const sum=scaled[i].reduce((a,b)=>a+b,0);
   if(sum<=0)throw Error('Circunscripción sin votos');
   for(let j=0;j<GROUPS.length;j++)scaled[i][j]*=voterTotals[i]/sum;
  }
 }
 const national=Object.fromEntries(GROUPS.map(g=>[g,0]));
 const districtResults=[];
 for(let i=0;i<dists.length;i++){
  const district=dists[i], projected={};
  for(const [id,v] of Object.entries(district.votes)){
   const category=group(id),j=GROUPS.indexOf(category),old=rows[i][j];
   projected[id]=old>0?Math.round(v*scaled[i][j]/old):0;
   national[category]+=projected[id];
  }
  const special=district.name==='Ceuta'||district.name==='Melilla';
  const current=allocate(projected,district.seats,{blank:district.blank,threshold:3,singleMember:special});
  const original=allocate(district.votes,district.seats,{blank:district.blank,threshold:3,singleMember:special});
  const tally=(seats)=>Object.entries(seats).reduce((out,[id,n])=>{out[group(id)]=(out[group(id)]||0)+n;return out},{});
  const a=tally(current.seats),b=tally(original.seats);
  districtResults.push({province:district.name,id:district.id,seats:district.seats,result:a,baseline:b,changes:GROUPS.filter(g=>(a[g]||0)!==(b[g]||0)).map(g=>({party:g,delta:(a[g]||0)-(b[g]||0)}))});
 }
 const totalSeats=Object.fromEntries(GROUPS.map(g=>[g,0]));
 const referenceSeats=Object.fromEntries(GROUPS.map(g=>[g,0]));
 for(const d of districtResults)for(const g of GROUPS){totalSeats[g]+=d.result[g]||0;referenceSeats[g]+=d.baseline[g]||0}
 const projectedShares=Object.fromEntries(GROUPS.map(g=>[g,100*national[g]/Object.values(national).reduce((a,b)=>a+b,0)]));
 return {seats:totalSeats,referenceSeats,projectedShares,targets:Object.fromEntries(GROUPS.map((g,j)=>[g,goals[j]*100])),districts:districtResults,diagnostics:{districts:dists.length,totalSeats:Object.values(totalSeats).reduce((a,b)=>a+b,0),maxTargetErrorPP:Math.max(...GROUPS.map(g=>Math.abs(projectedShares[g]-goals[GROUPS.indexOf(g)]*100))),method:'IPF sobre 52 circunscripciones, voto 23J y reparto D’Hondt determinista',limitations:['Proyección ilustrativa, NO pronóstico Motor 29N','Sin nueva distribución provincial observada, mantiene la geografía de 2023','PODEMOS y otras candidaturas sin base independiente quedan en OTROS','No modeliza incertidumbre, pactos ni migración territorial','Las candidaturas menores conservan su reparto relativo dentro de OTROS']}}
}

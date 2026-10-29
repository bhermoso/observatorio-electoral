// All allocations use integer votes and exact rational comparison.
export function allocate(votes, seats, {blank=0, threshold=3, singleMember=false, seed=1}={}) {
 if(!Number.isInteger(seats)||seats<1||seats>350) throw Error('Escaños inválidos');
 if(!Number.isSafeInteger(blank)||blank<0||!Number.isFinite(threshold)||threshold<0||threshold>100||!Number.isSafeInteger(seed)) throw Error('Parámetros inválidos');
 const entries=Object.entries(votes);
 if(entries.some(([,v])=>!Number.isSafeInteger(v)||v<0)) throw Error('Votos inválidos');
 const total=entries.reduce((s,[,v])=>s+v,blank);
 if(!Number.isSafeInteger(total)) throw Error('Total de votos fuera de rango');
 const eligible=entries.filter(([,v])=>v>0&&(singleMember||v*100>=total*threshold));
 if(!eligible.length) throw Error('Ninguna candidatura supera el umbral');
 const result=Object.fromEntries(entries.map(([k])=>[k,0])); const trace=[]; const ties=[];
 // Seed defines a reproducible educational draw. Subsequent exact vote ties alternate.
 const hash=id=>[...id].reduce((s,c)=>(Math.imul(s,31)+c.charCodeAt(0))>>>0,seed>>>0);
 for(let n=0;n<seats;n++) {
  const sorted=eligible.slice().sort(([a,av],[b,bv])=>{
   const diff=BigInt(bv)*BigInt(result[a]+1)-BigInt(av)*BigInt(result[b]+1);
   if(diff!==0n) return diff>0n?1:-1;
   return bv-av || result[a]-result[b] || hash(a)-hash(b) || a.localeCompare(b);
  });
  const [id,v]=sorted[0], divisor=result[id]+1;
  const tied=sorted.filter(([k,w])=>BigInt(v)*BigInt(result[k]+1)===BigInt(w)*BigInt(divisor)&&w===v);
  if(tied.length>1) ties.push({seat:n+1,parties:tied.map(([k])=>k),winner:id});
  trace.push({seat:n+1,party:id,votes:v,divisor,quotient:v/divisor}); result[id]++;
 }
 return {seats:result,trace,ties,valid:total,eligible:eligible.map(([k])=>k)};
}
export function weightedVotes(votes,weights={}) {
 return Object.fromEntries(Object.entries(votes).map(([id,v])=>{
  const w=weights[id]??1;
  if(!Number.isFinite(w)||w<0||w>5) throw Error('Ponderación fuera de 0–5');
  return [id,Math.round(v*w)];
 }));
}
export function simulate(districts,weights={},options={}) {
 const totals={},results=[];
 for(const d of districts){
  const r=allocate(weightedVotes(d.votes,weights),d.seats,{...options,blank:Math.round(d.blank*(options.blankWeight??1)),singleMember:d.name==='Ceuta'||d.name==='Melilla'});
  Object.entries(r.seats).forEach(([k,v])=>totals[k]=(totals[k]||0)+v); results.push({district:d.id,...r});
 }
 return {kind:'simulation',totals,results};
}

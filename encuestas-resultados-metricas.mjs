const day=s=>Date.parse(s+'T12:00:00Z');
export function historicalCut(election,horizon){return new Date(day(election)-horizon*86400000).toISOString().slice(0,10);}
export function historicalSelection(data,{election,horizon=7,parties=['PP','PSOE'],house=''}){
 const cut=historicalCut(election,horizon),old=day(cut)-180*86400000;
 const eligible=data.encuestas.filter(p=>p.eleccion===election&&(!house||p.casa===house)&&p.campo_ini&&p.campo_fin&&p.publicacion&&p.campo_ini<=p.campo_fin&&p.campo_fin<=p.publicacion&&p.publicacion<=cut&&day(p.campo_fin)>=old&&parties.every(k=>Number.isFinite(p.voto[k]))).sort((a,b)=>a.publicacion.localeCompare(b.publicacion)||a.estudio.localeCompare(b.estudio));
 const unique=new Map();for(const p of eligible){const key=JSON.stringify([p.casa,p.campo_ini,p.campo_fin,parties.map(k=>p.voto[k])]);if(!unique.has(key))unique.set(key,p);}
 const latest=new Map();for(const p of unique.values()){const previous=latest.get(p.casa),key=x=>[x.publicacion,x.campo_fin,x.estudio].join(':');if(!previous||key(p)>key(previous))latest.set(p.casa,p);}
 return [...latest.values()].sort((a,b)=>a.casa.localeCompare(b.casa,'es'));
}
export function historicalScore(study,result,parties){
 if(!parties.length||!parties.every(p=>Number.isFinite(study.voto[p])&&Number.isFinite(result[p])))return null;
 const errors=parties.map(p=>({party:p,estimate:study.voto[p],official:result[p],error:study.voto[p]-result[p]}));
 return {errors,mae:errors.reduce((s,r)=>s+Math.abs(r.error),0)/errors.length};
}
export function historicalTrack(data,{horizon,parties,house}){
 return data.elecciones.map(e=>{if(!parties.every(p=>Number.isFinite(e.resultado[p])))return {election:e.fecha,study:null,score:null};const study=historicalSelection(data,{election:e.fecha,horizon,parties,house})[0];return {election:e.fecha,study:study||null,score:study?historicalScore(study,e.resultado,parties):null};});
}

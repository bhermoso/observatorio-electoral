// Instantáneas homologadas expresamente: no se infieren equivalencias de etiquetas.
export const CATALOG = Object.freeze([
  {id:'elpais-promedio-2026-11-14',group:'EL PAÍS',approx:true},
  {id:'eldiario-promedio-2026-11-13',group:'elDiario.es',approx:false},
  {id:'democrata-media-2026-11-14',group:'Demócrata',approx:false}
]);
export const PARTIES = Object.freeze(['PP','PSOE','VOX']);
const DAY = 86400000;
function dateValue(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) throw Error('Fecha inválida');
  const n=Date.parse(s+'T00:00:00Z');
  if (!Number.isFinite(n) || new Date(n).toISOString().slice(0,10)!==s) throw Error('Fecha inválida');
  return n;
}
export function calculateMeta(references,{cutoff,windowDays=30,halfLife=0,weights={}}={}) {
  const now=dateValue(cutoff);
  if (!Number.isInteger(windowDays)||windowDays<1||windowDays>365) throw Error('Ventana inválida');
  if (!Number.isFinite(halfLife)||halfLife<0||halfLife>365) throw Error('Semivida inválida');
  const rows=CATALOG.map(entry=>{
    const ref=references.find(r=>r.id===entry.id);
    if (!ref||ref.kind!=='aggregate-model'||!ref.published||!ref.verified||!ref.source) throw Error('Falta una fuente homologada: '+entry.id);
    const age=(now-dateValue(ref.published))/DAY;
    const manual=weights[entry.group]??1;
    if (!Number.isFinite(manual)||manual<0||manual>5) throw Error('Peso inválido para '+entry.group);
    const reason=age<0?'Posterior al corte':age>windowDays?'Fuera de la ventana':manual===0?'Excluida por el usuario':null;
    const weight=reason?0:manual*(halfLife?2**(-age/halfLife):1);
    return {id:entry.id,group:entry.group,name:ref.name,published:ref.published,verified:ref.verified,source:ref.source,notes:ref.notes,methodology:ref.methodology,approximate:entry.approx,age,manualWeight:manual,weight,reason,values:entry.approx?ref.approximateValues:ref.values};
  });
  const results=Object.fromEntries(PARTIES.map(p=>{
    const contributors=rows.filter(r=>r.weight>0&&Number.isFinite(r.values?.[p])&&r.values[p]>=0&&r.values[p]<=100);
    const total=contributors.reduce((s,r)=>s+r.weight,0);
    return [p,{value:total?contributors.reduce((s,r)=>s+r.weight*r.values[p],0)/total:null,contributors:contributors.map(r=>({id:r.id,value:r.values[p],weight:r.weight,share:r.weight/total,approximate:r.approximate}))}];
  }));
  return {cutoff,windowDays,halfLife,rows,results,limitations:['Los promedios comparten encuestas: dependencia desconocida, sin cálculo de error ni intervalo.','Solo PP, PSOE y VOX tienen equivalencias revisadas para estas instantáneas.','No suma entrevistas ni convierte a escaños.','Son instantáneas fechadas, no datos en tiempo real.']};
}

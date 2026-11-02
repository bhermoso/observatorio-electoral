// Identidad contable exacta entre voto de declarantes y voto tras imputaciones.
// Es una descomposición, NO una atribución causal ni una estimación calibrada.
import {estimate,PARTIES} from './motor-imputacion.mjs';
export function explainRecipe(ledger,options){
 const result=estimate(ledger,options);
 const D0=result.baseline.denominator,D1=result.final.denominator;
 const parties=PARTIES.map(p=>{
  const initial=result.baseline.numerators[p];
  const contributions=result.entries.map(e=>({group:e.group,weight:e.contributions[p],
    delta_pp:100*e.contributions[p]/D1}));
  const numeratorChange=contributions.reduce((a,e)=>a+e.delta_pp,0);
  const denominatorEffect=100*initial*(1/D1-1/D0);
  const start=100*initial/D0,end=100*result.final.numerators[p]/D1;
  return {party:p,start,end,delta_pp:end-start,numerator:initial,finalNumerator:result.final.numerators[p],
   numeratorChange,denominatorEffect,contributions,
   closes:Math.abs((end-start)-(numeratorChange+denominatorEffect))<1e-9};
 });
 return {result,parties,baseDenominator:D0,finalDenominator:D1,
  note:'Identidad exacta de una fracción. Se fija el denominador final para atribuir aportaciones al numerador. Esta convención no identifica efectos causales ni el efecto aislado de cada regla.'};
}
export function evidenceStatus(study, audits){
 return {
  design:'pendiente',
  independentBacktests:0,
  observedElection:study==='3582'?null:'2023-07-23',
  descriptiveHistorical:study!=='3582'&&!!audits?.resultados_por_estudio?.[study],
  supportedRecommendation:false,
  reason:study==='3582'?'La elección objetivo de 2026 aún no se ha celebrado; no existe resultado oficial con el que medir el error.':
  'Existe contraste retrospectivo con el 23J para otras recetas descriptivas, pero no una prueba independiente de este motor de imputaciones. No se selecciona aquí una receta ganadora.'
 };
}

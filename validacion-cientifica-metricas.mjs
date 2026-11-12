/** Recalcular la selección visible; no promedia MAE agregados de bases distintas. */
export function metricasCientificas(rows){
 if(!rows.length)return {n:0,mae:null,rmse:null,sesgo:null,cobertura90:null,anchura90:null,interval_score90:null};
 const mean=f=>rows.reduce((a,x)=>a+f(x),0)/rows.length;
 return {n:rows.length,mae:mean(x=>Math.abs(x.error)),rmse:Math.sqrt(mean(x=>x.error*x.error)),sesgo:mean(x=>x.error),cobertura90:mean(x=>Number(x.p5<=x.oficial&&x.oficial<=x.p95)),anchura90:mean(x=>x.p95-x.p5),interval_score90:mean(x=>x.p95-x.p5+20*Math.max(x.p5-x.oficial,0)+20*Math.max(x.oficial-x.p95,0))};
}

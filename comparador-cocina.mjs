import {calculate,PARTIES} from './cocina-secuencial.mjs';
import {projection} from './cocina-escanos.mjs';
const el=id=>document.getElementById(id);
const f=(n,d=2)=>Number(n).toLocaleString('es-ES',{minimumFractionDigits:d,maximumFractionDigits:d});
const configurations={
 decided:{weighted:true,decided:true},
 sympathy:{weighted:true,decided:true,sympathy:true},
 turnout:{weighted:true,decided:true,participation:1},
 direct:{weighted:true,decided:false}
};
let cube,election,truth,history=[],latest=null;
const roots=['compare-study','compare-a','compare-b'];
const parties=['PSOE','PP','VOX','SUMAR'];
function counts(d,c){
 const total=c.studies[d.study].n;
 const included=d.total_interviews;
 const valid=d.config.participation>0?c.studies[d.study].cube[d.config.sympathy?1:0].slice(0,d.config.decided?5:6).reduce((a,group)=>a+group[0][0]+group[1][0],0):included;
 return {total,included,excluded:total-included,probability_valid_count_unavailable:d.config.participation>0};
}
function evaluate(study,kind){
 const result=calculate(cube,{study,...configurations[kind]});
 const canSeat=result.config.decided;
 const seats=canSeat?projection(election,Object.fromEntries(parties.map(p=>[p,result.shares[p]]))):null;
 const errors=canSeat&&study!=='3582'?parties.map(p=>Math.abs(result.shares[p]-truth.official_vote_valid_percent[p])):null;
 const mae=errors?errors.reduce((a,b)=>a+b,0)/errors.length:null;
 return {kind,config:result.config,result,seats,mae,count:counts(result,cube)};
}
function paint(){
 if(!cube||!election)return;
 try{
  const study=el('compare-study').value;
  const a=evaluate(study,el('compare-a').value),b=evaluate(study,el('compare-b').value);
  latest={study,a,b,source:'CIS: cubo_decisiones_cis.json',notes:['Cifras procedentes de sumas de microdatos','D’Hondt determinista sobre geografía 23J','No se evalúa capacidad predictiva en elecciones independientes']};
  const heading='<div class="craft-figures"><div><small>Muestra del estudio</small><strong>'+a.count.total.toLocaleString('es-ES')+'</strong><em>Entrevistas originales</em></div><div><small>Receta A · respuestas incluidas</small><strong>'+a.count.included.toLocaleString('es-ES')+'</strong><em>Excluidas '+a.count.excluded.toLocaleString('es-ES')+' por universo; PROBVOTO no deducible con exactitud desde este cubo</em></div><div><small>Receta B · respuestas incluidas</small><strong>'+b.count.included.toLocaleString('es-ES')+'</strong><em>Excluidas '+b.count.excluded.toLocaleString('es-ES')+' por universo; PROBVOTO no deducible con exactitud desde este cubo</em></div></div>';
  const rows=parties.map(p=>'<tr><td><b>'+p+'</b></td><td>'+f(a.result.shares[p])+' %</td><td>'+f(b.result.shares[p])+' %</td><td>'+(b.result.shares[p]>=a.result.shares[p]?'+':'')+f(b.result.shares[p]-a.result.shares[p])+' pp</td><td>'+(a.seats?a.seats.seats[p]:'—')+'</td><td>'+(b.seats?b.seats.seats[p]:'—')+'</td><td>'+(a.seats&&b.seats?((b.seats.seats[p]-a.seats.seats[p])>0?'+':'')+(b.seats.seats[p]-a.seats.seats[p]):'—')+'</td></tr>').join('');
  const threshold='<div class="craft-figures"><div><small>PP + Vox · A</small><strong>'+(a.seats?a.seats.seats.PP+a.seats.seats.VOX:'—')+'</strong><em>Diputados, no probabilidad de mayoría</em></div><div><small>PP + Vox · B</small><strong>'+(b.seats?b.seats.seats.PP+b.seats.seats.VOX:'—')+'</strong><em>Umbral 176</em></div><div><small>MAE cuatro partidos · A / B</small><strong>'+(a.mae===null||b.mae===null?'No comparable':f(a.mae)+' / '+f(b.mae))+'</strong><em>'+(study==='3582'?'2026 sin resultado electoral':'Puntos, comparación retrospectiva 2023')+'</em></div></div>';
  el('compare-output').innerHTML=heading+'<div class="craft-tbl"><table><thead><tr><th>Partido</th><th>Voto A</th><th>Voto B</th><th>Cambio</th><th>Escaños A</th><th>Escaños B</th><th>Diferencia</th></tr></thead><tbody>'+rows+'</tbody></table></div>'+threshold+'<p class="craft-mini">Si se ha usado PROBVOTO, las entrevistas con puntuación inválida quedan fuera del cálculo ponderado, pero el cubo actual no separa sus recuentos. Por ello los números de entrevistas indicados arriba son previos a esa exclusión y no se presentan como efectivos.</p>';
 }catch(err){el('compare-output').textContent='No se pudo calcular la comparación: '+err.message;latest=null}
}
function exportFile(){
 if(!history.length)return;
 const json=new Blob([JSON.stringify({schema_version:1,experiments:history},null,2)],{type:'application/json'});
 const uri=URL.createObjectURL(json),link=document.createElement('a');link.href=uri;link.download='experimentos-cocina-oee.json';link.click();URL.revokeObjectURL(uri);
}
el('compare-save').addEventListener('click',()=>{if(!latest)return;history.push(JSON.parse(JSON.stringify(latest)));el('compare-history').textContent=history.length+' comparación(es) registradas en esta sesión, sin datos de entrevistados.'});
el('compare-export').addEventListener('click',exportFile);
roots.forEach(id=>el(id).addEventListener('change',paint));
Promise.all(['data/microdatos/cubo_decisiones_cis.json','data/election.json','data/microdatos/validacion_23j.json'].map(async url=>{const r=await fetch(url);if(!r.ok)throw Error(url);return r.json()}))
.then(([c,e,t])=>{cube=c;election=e;truth=t;paint()})
.catch(e=>el('compare-output').textContent='No se pudieron cargar las fuentes: '+e.message);

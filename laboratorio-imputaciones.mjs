import {estimate,PARTIES,POLICIES} from './motor-imputacion.mjs';
const $=id=>document.getElementById(id);
const fmt=(v,d=2)=>Number(v).toLocaleString('es-ES',{minimumFractionDigits:d,maximumFractionDigits:d});
const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let ledger,latest;
const types={INDECISION:'No sabe todavía',NO_CONTESTA:'No contesta'};
const label=p=>p==='OTROS'?'Otras candidaturas':p;
function card(title,big,detail){return '<div><small>'+safe(title)+'</small><strong>'+safe(big)+'</strong><small>'+safe(detail)+'</small></div>'}
function selected(){return {study:$('led-study').value,indecision:$('led-indecision').value,nonresponse:$('led-nonresponse').value}}
function render(){
 if(!ledger)return;
 try{
  const state=selected(),s=ledger.studies[state.study],result=estimate(ledger,state);
  latest={source:'data/microdatos/ledger_imputacion_cis.json',generated_at:new Date().toISOString(),...result};
  if(!result.check.closes)throw Error('Error de cierre de pesos');
  $('led-universe').innerHTML=card('Entrevistas originales',fmt(s.n,0),'N sin ponderar')+
   card('Candidaturas declaradas',fmt(result.baseline.denominator,1),'Denominador base: Σ PESO')+
   card('No sabe todavía',fmt(s.groups.INDECISION.n,0),'Σ PESO = '+fmt(s.groups.INDECISION.w,1))+
   card('No contesta',fmt(s.groups.NO_CONTESTA.n,0),'Σ PESO = '+fmt(s.groups.NO_CONTESTA.w,1));
  $('led-overview').innerHTML=result.entries.map(entry=>'<div class="led-card"><h3>'+types[entry.group]+'</h3><div class="led-number">'+fmt(entry.interviews,0)+' personas</div><p>De este grupo, VOTOSIMG identifica candidatura para <b>'+fmt(entry.observable_candidates_weight,1)+'</b> unidades ponderadas y deja <b>'+fmt(entry.unresolved_weight,1)+'</b> sin candidatura. Son pesos, no personas.</p><p>Tratamiento elegido: <span class="led-pill">'+safe(entry.label)+'</span></p></div>').join('');
  $('led-steps').innerHTML=result.entries.map((e,i)=>{
   const contrib=PARTIES.map(p=>'<tr><td>'+label(p)+'</td><td>'+fmt(e.contributions[p],2)+'</td></tr>').join('');
   return '<article class="led-step"><h3>'+String(i+1).padStart(2,'0')+' · '+types[e.group]+' · '+safe(e.label)+'</h3><p>'+safe(e.assumption)+'</p><div class="led-parts">'+card('Entrevistas en grupo',fmt(e.interviews,0),'Numerador descriptivo')+
    card('Peso total del grupo',fmt(e.total_weight,2),'Σ PESO')+card('Peso imputado',fmt(e.assigned_weight,2),'Se incorpora a votos y denominador')+
    card('Sin imputar',fmt(e.not_assigned_weight,2),'Fuera del denominador estimado')+'</div><details style="margin-top:12px"><summary>Ver contribución por partido y denominadores exactos</summary><div class="led-table"><table><thead><tr><th>Candidatura</th><th>Peso incorporado</th></tr></thead><tbody>'+contrib+'</tbody></table></div><p><b>Denominador anterior:</b> '+fmt(e.denominator_before,4)+' · <b>Posterior:</b> '+fmt(e.denominator_after,4)+'</p></details></article>';
  }).join('');
  $('led-results').innerHTML='<table><thead><tr><th>Partido</th><th>Numerador original</th><th>Aportación indecisos</th><th>Aportación no respuesta</th><th>Numerador final</th><th>Voto inicial</th><th>Voto estimado</th><th>Cambio</th></tr></thead><tbody>'+
    PARTIES.map(p=>{const base=result.baseline.numerators[p],a=result.entries[0].contributions[p],b=result.entries[1].contributions[p],end=result.final.numerators[p],start=result.baseline.shares[p],v=result.final.votes[p];return '<tr><th>'+label(p)+'</th><td>'+fmt(base)+'</td><td>'+fmt(a)+'</td><td>'+fmt(b)+'</td><td>'+fmt(end)+'</td><td>'+fmt(start)+' %</td><td><b>'+fmt(v)+' %</b></td><td>'+(v>=start?'+':'')+fmt(v-start)+' pp</td></tr>'}).join('')+
    '</tbody></table><p><b>Denominador inicial:</b> '+fmt(result.baseline.denominator,4)+' · <b>denominador final:</b> '+fmt(result.final.denominator,4)+' · <b>imputado:</b> '+fmt(result.check.allocated_total,4)+'. Cada porcentaje final = 100 × numerador final / denominador final.</p>';
  $('led-limits').textContent='Las diferencias son sensibilidad a hipótesis de cocina, no efecto causal ni precisión predictiva demostrada. '+result.limitations.join(' ');
 }catch(e){$('led-results').textContent='No se pudo obtener la receta: '+e.message}
}
['led-study','led-indecision','led-nonresponse'].forEach(id=>$(id).addEventListener('change',render));
$('led-export').addEventListener('click',()=>{if(!latest)return;const file=new Blob([JSON.stringify(latest,null,2)],{type:'application/json'});const uri=URL.createObjectURL(file),a=document.createElement('a');a.href=uri;a.download='imputacion-cis-'+latest.study+'.json';a.click();URL.revokeObjectURL(uri)});
fetch('data/microdatos/ledger_imputacion_cis.json').then(r=>{if(!r.ok)throw Error('HTTP '+r.status);return r.json()}).then(d=>{ledger=d;render()}).catch(e=>{$('led-universe').textContent='No pueden recuperarse los grupos del CIS: '+e.message});

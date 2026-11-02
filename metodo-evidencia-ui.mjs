import {explainRecipe,evidenceStatus} from './trazabilidad-recetas.mjs';
const $=id=>document.getElementById(id);
const fmt=(v,d=2)=>Number(v).toLocaleString('es-ES',{minimumFractionDigits:d,maximumFractionDigits:d});
const sign=(v)=>v>0?'+':'';
const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let ledger,audits,latest;
const name={INDECISION:'No sabe',NO_CONTESTA:'No contesta',PP:'PP',PSOE:'PSOE',VOX:'Vox',SUMAR:'Sumar',OTROS:'Otras candidaturas'};
function box(label,value,detail=''){return '<div><small>'+safe(label)+'</small><strong>'+safe(value)+'</strong><small>'+safe(detail)+'</small></div>'}
function paint(){
 if(!ledger)return;
 const config={study:$('ev-study').value,indecision:$('ev-indecision').value,nonresponse:$('ev-nonresponse').value};
 try{
  const record=explainRecipe(ledger,config);
  const status=evidenceStatus(config.study,audits),p=record.parties.find(x=>x.party===$('ev-party').value),r=record.result;
  latest={source:'data/microdatos/ledger_imputacion_cis.json',model:'trazabilidad-recetas.mjs',...record,evidence:status};
  $('ev-status').textContent='CIS '+config.study+' · '+r.sample_n.toLocaleString('es-ES')+' entrevistas · PESO original · receta experimental, no pronóstico del Motor 29N';
  $('ev-group-info').innerHTML=box('Denominador inicial · Σ PESO',fmt(record.baseDenominator,3),'Solo candidaturas declaradas')+
   box('Incorporado desde indecisión',fmt(r.entries[0].assigned_weight,3),'Grupo: '+r.entries[0].interviews+' entrevistas')+
   box('Incorporado desde no respuesta',fmt(r.entries[1].assigned_weight,3),'Grupo: '+r.entries[1].interviews+' entrevistas')+
   box('Denominador final',fmt(record.finalDenominator,3),'Suma cerrada del libro mayor');
  $('ev-indicators').innerHTML=box('Voto original',fmt(p.start)+' %','Antes de imputar')+
   box('Voto con esta receta',fmt(p.end)+' %','Numerador final / denominador final')+
   box('Cambio en puntos',sign(p.delta_pp)+fmt(p.delta_pp)+' pp','Identidad exacta')+
   box('Numerador final',fmt(p.finalNumerator,3),'Unidades ponderadas');
  const effects=[{label:'Indecisos: aportación al numerador',value:p.contributions[0].delta_pp},
   {label:'No respuesta: aportación al numerador',value:p.contributions[1].delta_pp},
   {label:'Cambio de denominador',value:p.denominatorEffect}];
  $('ev-contributions').innerHTML=effects.map(x=>'<div class="ev-line"><span>'+safe(x.label)+'</span><div class="ev-track"><i style="width:'+Math.min(100,Math.abs(x.value)/5*100)+'%;background:'+(x.value<0?'#c38b64':'#548e72')+'"></i></div><b>'+sign(x.value)+fmt(x.value)+' pp</b></div>').join('');
  const a=r.entries[0],b=r.entries[1];
  $('ev-story').innerHTML='Partimos de <b>'+fmt(p.numerator,3)+'</b> unidades ponderadas para '+safe(name[p.party])+', entre <b>'+fmt(record.baseDenominator,3)+'</b> de candidaturas declaradas. '
  +'Aplicando la primera regla se incorporan <b>'+fmt(a.contributions[p.party],3)+'</b> unidades de personas que responden «No sabe»; la segunda aporta <b>'+fmt(b.contributions[p.party],3)+'</b> unidades de «No contesta». '
  +'El numerador queda en <b>'+fmt(p.finalNumerator,3)+'</b>, y el denominador en <b>'+fmt(record.finalDenominator,3)+'</b>. '
  +'La subida atribuible algebraicamente a los dos numeradores es <b>'+sign(p.numeratorChange)+fmt(p.numeratorChange)+' puntos</b>, mientras que ampliar el denominador cambia el porcentaje en <b>'+sign(p.denominatorEffect)+fmt(p.denominatorEffect)+' puntos</b>. '
  +'Por eso el efecto total es <b>'+sign(p.delta_pp)+fmt(p.delta_pp)+' puntos</b>. Este cálculo no demuestra que nadie vaya a votar así.';
  $('ev-table').innerHTML='<table><thead><tr><th>Partido</th><th>Antes</th><th>+ Indecisos</th><th>+ No respuesta</th><th>Efecto denominador</th><th>Final</th><th>Δ total</th></tr></thead><tbody>'+
   record.parties.map(x=>'<tr><td>'+safe(name[x.party])+'</td><td>'+fmt(x.start)+' %</td><td>'+sign(x.contributions[0].delta_pp)+fmt(x.contributions[0].delta_pp)+'</td><td>'+sign(x.contributions[1].delta_pp)+fmt(x.contributions[1].delta_pp)+'</td><td>'+sign(x.denominatorEffect)+fmt(x.denominatorEffect)+'</td><td><b>'+fmt(x.end)+' %</b></td><td>'+sign(x.delta_pp)+fmt(x.delta_pp)+'</td></tr>').join('')+'</tbody></table>'+
   '<p>El signo de los componentes depende de una identidad contable explícita: Δ% = aportación numérica de cada grupo sobre D final + efecto de cambiar D inicial por D final. La suma de los componentes coincide con el cambio total para cada partido.</p>';
  $('ev-validation').innerHTML='<div><h3>Qué se ha medido</h3><p>El Observatorio dispone de una auditoría retrospectiva de otras recetas para '+(status.observedElection||'ninguna elección posterior')+'. No constituye validación independiente de la receta interactiva actual.</p></div><div><h3>Decisión editorial</h3><span class="ev-tag">Método en evaluación</span><p>'+safe(status.reason)+'</p><p>Pruebas electorales independientes registradas para esta receta: <b>'+status.independentBacktests+'</b>. No se incorpora al pronóstico operativo.</p></div>';
 }catch(error){$('ev-status').textContent='No se puede calcular este ensayo: '+error.message}
}
for(const id of ['ev-study','ev-indecision','ev-nonresponse','ev-party'])$(id).addEventListener('change',paint);
$('ev-export').addEventListener('click',()=>{if(!latest)return;const blob=new Blob([JSON.stringify(latest,null,2)],{type:'application/json'}),u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download='trazabilidad-cis-'+latest.result.study+'.json';a.click();URL.revokeObjectURL(u)});
Promise.all(['data/microdatos/ledger_imputacion_cis.json','data/microdatos/auditoria_cocina_23j.json'].map(async u=>{const r=await fetch(u);if(!r.ok)throw Error('HTTP '+r.status);return r.json()}))
.then(([l,a])=>{ledger=l;audits=a;paint()}).catch(e=>{$('ev-status').textContent='Datos no disponibles: '+e.message});

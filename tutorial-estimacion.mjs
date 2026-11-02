import {calculate} from './cocina-secuencial.mjs';
const $=id=>document.getElementById(id);
const fmt=(v,d=2)=>Number(v).toLocaleString('es-ES',{minimumFractionDigits:d,maximumFractionDigits:d});
const labels={direct:'PESO · todas las respuestas',decided:'PESO · candidaturas declaradas',sympathy:'PESO · voto más simpatía',turnout:'PESO · ajuste de participación'};
const alternatives={
 direct:{weighted:true,decided:false},
 decided:{weighted:true,decided:true},
 sympathy:{weighted:true,decided:true,sympathy:true},
 turnout:{weighted:true,decided:true,participation:1}
};
const parties=['PSOE','PP','VOX','SUMAR'];
function guide(s){return s==='direct'?'Incluye todas las entrevistas, también las respuestas sin candidatura. Es intención directa ponderada, NO porcentaje de voto válido.':s==='decided'?'El denominador solo incluye respuestas con candidatura, incluido «Otro partido». El aumento frente a la intención directa no supone ganar votantes.':s==='sympathy'?'Se usa VOTOSIMG en lugar de INTENCIONGR. Es una comparación de variables alternativas, no una adición causal de simpatía.':'Se aplica PROBVOTO entre 0 y 10 con PESO × PROBVOTO/10. Se excluyen respuestas sin PROBVOTO válido; por eso el universo también cambia.'}
async function init(){
 try{
  const response=await fetch('data/microdatos/cubo_decisiones_cis.json');
  if(!response.ok)throw Error('HTTP '+response.status);
  const cube=await response.json();
  function render(){
   const study=$('tut-study').value,scenario=$('tut-scenario').value;
   const data=calculate(cube,{study,...alternatives[scenario]});
   const baseline=calculate(cube,{study,weighted:true,decided:true});
   $('tut-metrics').innerHTML='<div><small>Estudio CIS</small><strong>'+study+'</strong></div><div><small>Entrevistas originales</small><strong>'+cube.studies[study].n.toLocaleString('es-ES')+'</strong></div><div><small>Denominador estadístico</small><strong>'+fmt(data.denominator,0)+'</strong></div>';
   $('tut-values').innerHTML='<table><thead><tr><th>Partido</th><th>'+labels[scenario]+'</th><th>Frente a decididos</th></tr></thead><tbody>'+parties.map(p=>{const v=data.shares[p],delta=v-baseline.shares[p];return '<tr><th scope="row">'+p+'</th><td>'+fmt(v)+' %</td><td>'+(delta>0?'+':'')+fmt(delta)+' pp</td></tr>'}).join('')+'</tbody></table>';
   $('tut-interpretation').textContent=guide(scenario);
  }
  $('tut-study').addEventListener('change',render);
  $('tut-scenario').addEventListener('change',render);
  render();
 }catch(error){
  $('tut-metrics').textContent='No se pudieron recuperar los agregados: '+error.message;
  $('tut-values').textContent='El tutorial textual sigue disponible.';
 }
}
init();

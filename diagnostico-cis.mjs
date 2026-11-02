const $=id=>document.getElementById(id);
const fmt=(n,d=0)=>Number(n).toLocaleString('es-ES',{minimumFractionDigits:d,maximumFractionDigits:d});
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const labels={PP:'PP',PSOE:'PSOE',VOX:'Vox',SUMAR:'Sumar',INDECISION:'Todavía no sabe',NO_CONTESTA:'No contesta',NO_VOTARIA:'Declara que no votaría',OTRAS_CANDIDATURAS:'Otras candidaturas',OTRO_PARTIDO:'Otro partido',BLANCO:'Voto en blanco',NULO:'Voto nulo',OTRAS_SITUACIONES:'Código 0, otras situaciones',OTROS_CODIGOS:'Otros códigos',RECUERDA_CANDIDATURA:'Recuerda alguna candidatura',SIN_RECUERDO_DECLARADO:'Sin recuerdo declarado',SIN_CANDIDATURA_RECORDADA:'No recuerda una candidatura',NO_VALIDO:'Sin PROBVOTO válido','10':'Probabilidad 10/10','7_9':'Probabilidad 7–9','0_6':'Probabilidad 0–6'};
function rows(items,total,weighted=false){
 return Object.entries(items).map(([key,v])=>{const n=typeof v==='number'?v:v?.n,percent=n==null?null:100*n/total;
  return '<div class="dx-row"><span>'+escape(labels[key]||key)+'</span><div class="dx-bar"><i style="width:'+(percent??0)+'%"></i></div><b>'+(n==null?'Suprimido':fmt(n)+' · '+fmt(percent,1)+' %')+'</b></div>'
 }).join('');
}
function render(study){
 const n=study.n,und=study.direct.INDECISION?.n||0,nc=study.direct.NO_CONTESTA?.n||0;
 $('dx-kpi').innerHTML=[
  ['Entrevistas originales',fmt(n),'Total de respuestas analizadas'],
  ['Indecisión declarada',fmt(und)+' · '+fmt(100*und/n,1)+' %','Código 9998; sobre todas las entrevistas'],
  ['No contesta',fmt(nc)+' · '+fmt(100*nc/n,1)+' %','Código 9999; distinto de indecisión'],
  ['n efectivo de Kish',fmt(study.effective_n,1),'Aproximación por dispersión de PESO']
 ].map(([head,value,foot])=>'<article class="dx-card"><small>'+head+'</small><strong>'+value+'</strong><span>'+foot+'</span></article>').join('');
 $('dx-responses').innerHTML=rows(study.direct,n);
 const decided=['PSOE','PP','VOX','SUMAR','OTRAS_CANDIDATURAS','OTRO_PARTIDO'].reduce((s,key)=>s+(study.direct[key]?.n||0),0);
 $('dx-direct-story').textContent='De '+fmt(n)+' entrevistas, '+fmt(decided)+' declaran alguna candidatura y '+fmt(und)+' no saben todavía. Otras '+fmt(nc)+' no contestan. No es correcto tratar automáticamente esos dos últimos grupos como si tuvieran el mismo comportamiento electoral.';
 const recall=study.indecision_recall;
 $('dx-recall').innerHTML=rows(recall,und);
 const know=recall.RECUERDA_CANDIDATURA||0,without=recall.SIN_CANDIDATURA_RECORDADA||0,unknown=recall.SIN_RECUERDO_DECLARADO||0;
 $('dx-recall-story').textContent='Entre los '+fmt(und)+' indecisos, '+fmt(know)+' recuerdan alguna candidatura ('+fmt(100*know/und,1)+' %), '+fmt(without)+' no recuerdan una candidatura y '+fmt(unknown)+' no aportan recuerdo declarado. Estos grupos son observables, pero todavía no hemos decidido imputarles partido alguno.';
 const election=study.recall_election||'No documentada';
 $('dx-recall-parties').innerHTML='<table><thead><tr><th>Recuerdo electoral ('+escape(election)+')</th><th>Personas</th><th>% de indecisos</th></tr></thead><tbody>'+(study.indecision_recall_party||[]).map(x=>'<tr><td>'+escape(x.label)+'</td><td>'+fmt(x.n)+'</td><td>'+fmt(100*x.n/und,1)+' %</td></tr>').join('')+'</tbody></table>';

 $('dx-turnout').innerHTML=rows(study.turnout,n);
 $('dx-indecision-turnout').innerHTML=rows(study.indecision_turnout,und);
 const neff=study.effective_n,phat=und/n,naive=1.96*Math.sqrt(phat*(1-phat)/neff)*100;
 $('dx-uncertainty').innerHTML='<div class="dx-cards"><div class="dx-card"><small>Muestra nominal</small><strong>'+fmt(n)+'</strong></div><div class="dx-card"><small>n efectivo Kish</small><strong>'+fmt(neff,1)+'</strong></div><div class="dx-card"><small>Proporción descriptiva de indecisos</small><strong>'+fmt(phat*100,2)+' %</strong></div><div class="dx-card"><small>± intervalo orientativo (95 %)</small><strong>'+fmt(naive,2)+' pp</strong><span>No es IC de diseño válido</span></div></div><div class="dx-narrative">Ejemplo puramente orientativo: 1,96 × √(p(1−p)/n efectivo de Kish). Se muestra para ilustrar cómo la precisión estadística se relaciona con la base de cálculo; no es un intervalo oficial ni una incertidumbre de pronóstico.</div>';
}
fetch('data/microdatos/diagnostico_muestra_cis.json').then(r=>{if(!r.ok)throw Error('HTTP '+r.status);return r.json()}).then(data=>{
 const selector=$('dx-study');const paint=()=>{const study=data.studies?.[selector.value];if(!study)throw Error('Estudio no disponible');render(study);$('dx-status').textContent='Desglose descriptivo desde CSV CIS · ninguna imputación aplicada'};
 selector.addEventListener('change',paint);paint();
}).catch(e=>{$('dx-status').textContent='No puede cargarse el diagnóstico: '+e.message});

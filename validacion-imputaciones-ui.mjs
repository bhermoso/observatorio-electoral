import {retrospective2019} from './validacion-2019-retrospectiva.mjs';
import {auditCoverage} from './validacion-cobertura.mjs';
import {auditImputations,POLICY_LABELS,EVALUATED_PARTIES} from './validacion-imputaciones.mjs';
const $=id=>document.getElementById(id);
const fmt=(n,d=2)=>Number(n).toLocaleString('es-ES',{minimumFractionDigits:d,maximumFractionDigits:d});
const sg=n=>n>0?'+':'';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let report,selected='exclude__exclude';
const method=x=>POLICY_LABELS[x.indecision]+' / '+POLICY_LABELS[x.nonresponse];
const metric=(heading,value,note)=>'<div class="vh-metric"><small>'+heading+'</small><strong>'+value+'</strong><span>'+note+'</span></div>';
function draw(){
 const order=$('vh-order').value,study=$('vh-study').value,party=$('vh-party').value;
 const rows=[...report.rows].sort((a,b)=>order==='mae'?a.mae23j-b.mae23j:order==='shift'?a.withinElectionShift-b.withinElectionShift:a.id.localeCompare(b.id));
 $('vh-table').innerHTML='<table><thead><tr><th>Tratamiento indecisos / no respuesta</th><th>MAE 3411</th><th>MAE 3415</th><th>Media 23J</th><th>Diferencia entre estudios</th><th>Máximo error</th></tr></thead><tbody>'+rows.map(r=>'<tr aria-selected="'+(r.id===selected)+'"><td><button type="button" data-recipe="'+r.id+'">'+esc(method(r))+'</button></td><td>'+fmt(r.studies[0].mae)+' pp</td><td>'+fmt(r.studies[1].mae)+' pp</td><td>'+fmt(r.mae23j)+' pp</td><td>'+fmt(r.withinElectionShift)+' pp</td><td>'+fmt(r.maxObservedError)+' pp</td></tr>').join('')+'</tbody></table>';
 $('vh-table').querySelectorAll('button[data-recipe]').forEach(b=>b.onclick=()=>{selected=b.dataset.recipe;draw()});
 const recipe=report.rows.find(x=>x.id===selected),a=recipe.studies.find(x=>x.study===study);
 const partySigned=a.errors[party],p=a.vote[party],observed=report.official[party];
 const explain=partySigned>0?'por encima':partySigned<0?'por debajo':'igual al';
 $('vh-detail').innerHTML='<div class="vh-detail"><small>REGLAS ACTUALES · '+study+'</small><h3>'+esc(method(recipe))+'</h3><p>Se conservan las candidaturas declaradas y se aplican estas reglas a los grupos de indecisos y de no respuesta del estudio. <a class="vh-link" href="metodo-evidencia.html">Inspeccionar numeradores y denominadores</a>.</p><p>MAE en los cuatro partidos: <b>'+fmt(a.mae)+' pp</b>.</p><p>Error máximo entre los cuatro: <b>'+fmt(a.max)+' pp</b>. No representa un intervalo de confianza.</p></div>'+
 '<div class="vh-detail"><small>ERROR OBSERVADO · '+party+'</small><h3>'+fmt(p)+' % estimado / '+fmt(observed)+' % oficial</h3><p>La receta produce '+fmt(p)+' % para '+party+', '+fmt(Math.abs(partySigned))+' puntos '+explain+' resultado oficial del 23J.</p>'+
 EVALUATED_PARTIES.map(k=>'<div class="vh-line"><span>'+esc(k)+'</span><div class="vh-track"><i style="width:'+Math.min(100,a.absolute[k]/9*100)+'%"></i></div><b>'+sg(a.errors[k])+fmt(a.errors[k])+' pp</b></div>').join('')+
 '<p>Los errores llevan signo (estimado − oficial). La barra representa su valor absoluto.</p></div>';
}
async function render2019(){
 const root=$('vh-2019-diagnostics');if(!root)return;
 try{
  const response=await fetch('data/microdatos/diagnostico_2019_original.json');
  if(!response.ok)throw Error('HTTP '+response.status);
  const data=await response.json();
  root.innerHTML=Object.entries(data.studies).map(([sid,s])=>{
   const statuses=[['INDECISION','Indecisión explícita (94)'],['NO_SABE','No sabe (98)'],['NO_CONTESTA','No contesta (99)']];
   const cells=statuses.map(([key,label])=>{
    const c=s.intention[key];
    return '<tr><td>'+label+'</td><td>'+fmt(c.n,0)+'</td><td>'+fmt(100*c.n/s.n)+' %</td><td>'+fmt(c.w,2)+'</td></tr>'
   }).join('');
   return '<article class="vh-detail"><small>CIS '+sid+' · '+(sid==='3242'?'28-A':'10-N')+' de 2019</small>'+
    '<h3>'+fmt(s.n,0)+' entrevistas</h3><p>Tamaño efectivo Kish: <b>'+fmt(s.kish_n,1)+'</b> · Σ PESO: <b>'+fmt(s.weighted_n,2)+'</b></p>'+
    '<div class="vh-table"><table><thead><tr><th>Respuesta</th><th>Casos</th><th>% N</th><th>Σ PESO</th></tr></thead><tbody>'+cells+'</tbody></table></div>'+
    '<p>Los tres grupos son mutuamente excluyentes y su codificación está tomada del libro oficial del estudio. Las reglas de imputación aún no han sido comparadas con esta elección.</p></article>';
  }).join('');
  const retro=retrospective2019(data);
  const table=$('vh-2019-retro');
  if(table)table.innerHTML='<h3>Primer contraste histórico de recetas: errores por elección</h3>'+
   '<table><thead><tr><th>Tratamiento de indecisión 94</th><th>MAE abril 2019</th><th>MAE noviembre 2019</th><th>Media descriptiva</th></tr></thead><tbody>'+
   retro.rows.map(row=>'<tr><td>'+esc(row.label)+'</td><td>'+fmt(row.studies[0].mae)+' pp</td><td>'+fmt(row.studies[1].mae)+' pp</td><td>'+fmt(row.mae_mean)+' pp</td></tr>').join('')+
   '</tbody></table><p>El MAE se calcula sobre PSOE, PP, Vox y Ciudadanos, contra el porcentaje de voto válido (candidaturas más blanco) de cada elección. Se mantienen fuera los casos de 98 y 99. Las coaliciones territoriales se agrupan en el denominador residual. <b>Son ensayos retrospectivos, no resultados de validación prospectiva.</b></p>';
 }catch(e){root.textContent='No pudo cargarse el diagnóstico 2019: '+e.message}
}
async function renderCoverage(){
 const root=$('vh-coverage'),list=$('vh-election-registry');
 if(!root||!list)return;
 try{
  const res=await fetch('data/microdatos/registro_validacion_elecciones.json',{cache:'no-store'});
  if(!res.ok)throw Error('HTTP '+res.status);
  const coverage=auditCoverage(await res.json());
  root.innerHTML=metric('Elecciones independientes verificadas',coverage.independent,'Necesarias al menos dos')+
   metric('Candidatas de 2019',coverage.elections.filter(e=>e.status==='candidate').length,'Datos y codificaciones pendientes')+
   metric('Reconstrucciones exploratorias',coverage.exploratory,'23J de 2023')+
   metric('Receta seleccionable',coverage.eligibleForMethodSelection?'Sí':'No','No se simula rendimiento futuro');
  list.innerHTML=coverage.elections.map(e=>{
   const when=e.date||'Sin fecha electoral';
   const status=e.status==='candidate'?'Candidata · no procesada':e.status==='exploratory_retrofit'?'Retrospectiva · no independiente':'Sin resultado electoral';
   const studies=e.studies.map(s=>'CIS '+esc(s.id)+' ('+esc(s.status||'pendiente')+')').join(' · ');
   return '<article class="vh-detail"><small>'+esc(e.id)+' · '+esc(when)+'</small><h3>'+esc(status)+'</h3><p>'+studies+'</p><p>Prueba independiente aceptada: <b>'+(e.independent?'sí':'no')+'</b></p>'+(e.missing.length?'<details><summary>Condiciones pendientes</summary><ul>'+e.missing.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul></details>':'')+'</article>'
  }).join('');
 }catch(e){root.innerHTML='<div class="vh-warning">No pudo verificarse la cobertura histórica: '+esc(e.message)+'</div>';list.innerHTML=''}
}
async function start(){
 void renderCoverage();
 void render2019();
 try{
  const [ledger,validation]=await Promise.all(['data/microdatos/ledger_imputacion_cis.json','data/microdatos/validacion_23j.json'].map(async p=>{const r=await fetch(p);if(!r.ok)throw Error(p+' '+r.status);return r.json()}));
  report=auditImputations(ledger,validation);
  $('vh-metrics').innerHTML=metric('Elecciones contrastadas',report.coverage.elections,'Solo 23J de 2023')+
  metric('Estudios CIS utilizados',report.coverage.studies,'3411 y 3415')+
  metric('Combinaciones de recetas',report.coverage.modelFamilies,'4 tratamientos × 4')+
  metric('Elecciones independientes',report.coverage.independentElectionTests,'Sin validación externa');
  $('vh-published').innerHTML=report.published.map(p=>'<div class="vh-detail"><small>CIS '+p.study+' · ESTIMACIÓN PUBLICADA</small><h3>MAE descriptivo: '+fmt(p.mae)+' pp</h3><p>Media de errores absolutos en PP, PSOE, Vox y Sumar. Es una referencia publicada, no una receta replicada.</p></div>').join('');
  for(const name of ['vh-order','vh-study','vh-party'])$(name).addEventListener('change',draw);
  draw();
 }catch(err){$('vh-metrics').innerHTML='<div class="vh-warning">No se pudo cargar la evaluación: '+esc(err.message)+'</div>'}
}
start();

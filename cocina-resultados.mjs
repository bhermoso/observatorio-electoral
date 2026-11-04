// Resultados existentes de microdatos CIS; presentación verificable y no receta del Motor 29N.
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const f=(n,d=1)=>Number.isFinite(n)?n.toLocaleString('es-ES',{minimumFractionDigits:d,maximumFractionDigits:d}):'—';
const source='https://www.cis.es/es/estudios/barometro-de-octubre-2026';
const METRICS=Object.freeze([
 ['direct','Intención directa','Todas las entrevistas, con indecisión y abstención en el denominador'],
 ['decided','Entre decididos','Solo respuestas con candidatura'],
 ['sympathy','Voto + simpatía','Otra pregunta, no un ajuste consecutivo'],
 ['turnout','Con participación','Hipótesis experimental con probabilidad declarada'],
 ['official','Estimación CIS','Cifra publicada por el instituto, fórmula final no reconstruida']
]);
const PARTIES=['PSOE','PP','VOX','SUMAR','PODEMOS','ERC'];

export function extraerResultadosCocina(micro,audit){
 if(micro?.study!=='3582'||!Number.isInteger(micro?.n)||micro.n<1
   ||!Array.isArray(micro?.comparison)||!Array.isArray(audit?.pruebas_seleccion_y_traslado))
   throw Error('Faltan datos originales o no coincide el estudio');
 const rows=PARTIES.map(p=>{
   const matches=micro.comparison.filter(x=>x.party===p);
   if(matches.length!==1)throw Error('Partido ausente o duplicado: '+p);
   const x=matches[0];
   for(const [metric] of METRICS){
     if(x[metric]!=null&&(!Number.isFinite(x[metric])||x[metric]<0||x[metric]>100))
       throw Error('Porcentaje no válido para '+p+' / '+metric);
   }
   return x;
 });
 const trials=audit.pruebas_seleccion_y_traslado.map(t=>{
  const x=t.error_prueba_mae_pp,y=t.referencia_cis_mae_pp;
  if(!Number.isFinite(x)||!Number.isFinite(y)||x<0||y<0)
   throw Error('Error histórico no verificable');
  return {seleccion:t.seleccion_estudio,evaluacion:t.evaluacion_estudio,
   metodo:audit.metodos?.[t.metodo_seleccionado]||t.metodo_seleccionado,
   error:x,referencia:y,diferencia:x-y,mejora:x<y-1e-8};
 });
 if(trials.length!==2)throw Error('Número inesperado de pruebas históricas');
 const nMejoras=trials.filter(t=>t.mejora).length;
 return {estudio:micro.study,n:micro.n,efectiva:micro.effective_n,
  pesos:micro.weighted,rows,trials,nMejoras,partidos:PARTIES,metrics:METRICS};
}
export function renderResultadosCocina(){
 return `<section class="panel kitchen-results" id="cocina-resultados" aria-labelledby="kitchen-results-title">
  <div class="kitchen-results-heading"><div><span class="eyebrow">Resultados comprobables · microdatos públicos</span>
  <h2 id="kitchen-results-title">Así cambian las cifras según la operación</h2></div>
  <a href="data/microdatos/analisis_3582.json" download>Datos agregados CIS 3582 ↓</a></div>
  <p class="kitchen-results-intro">Comparamos las medidas reconstruidas sobre el mismo estudio. <b>No equivalen entre sí, no son etapas acumulativas y ninguna se aplica automáticamente al Motor 29N.</b></p>
  <div id="kitchen-results-data" aria-live="polite"><p class="muted">Cargando cifras y evaluación histórica…</p></div>
 </section>`;
}
export function renderTablaCocina(d){
 const labels=d.metrics.map(([,name,def])=>`<th scope="col"><span title="${esc(def)}">${esc(name)}</span></th>`).join('');
 const rows=d.rows.map(r=>`<tr><th scope="row">${esc(r.party)}</th>${d.metrics.map(([k])=>`<td>${r[k]==null?'—':f(r[k])+' %'}</td>`).join('')}</tr>`).join('');
 const trials=d.trials.map(t=>`<tr><td>${esc(t.seleccion)} → ${esc(t.evaluacion)}</td><td>${esc(t.metodo)}</td><td>${f(t.error,2)} pp</td><td>${f(t.referencia,2)} pp</td><td>${t.mejora?'Mejora':t.diferencia>0?'Empeora':'Empata'}</td></tr>`).join('');
 return `<div class="kitchen-observed-meta">
  <p><b>${Number(d.n).toLocaleString('es-ES')}</b> entrevistas · estudio ${esc(d.estudio)} · peso ${esc(d.pesos)}${Number.isFinite(d.efectiva)?' · n efectivo aproximado '+f(d.efectiva,0):''}</p>
  <p><a href="${source}" target="_blank" rel="noopener">Documento original del CIS ↗</a> · <a href="data/microdatos/analisis_3582.json" download>Comprobar los cálculos ↓</a></p>
 </div>
 <div class="table-wrap kitchen-observed-table"><table><caption>Porcentajes publicados o reconstruidos con denominadores distintos; los guiones indican ausencia, nunca cero</caption>
 <thead><tr><th scope="col">Partido</th>${labels}</tr></thead><tbody>${rows}</tbody></table></div>
 <details class="kitchen-measures"><summary>Qué representa cada columna</summary>
  <dl>${d.metrics.map(([,name,def])=>`<div><dt>${esc(name)}</dt><dd>${esc(def)}</dd></div>`).join('')}</dl>
 </details>
 <div class="kitchen-validation-head"><div><h3>¿Mejoró la receta al probarla en otro estudio?</h3>
  <p>Dos pruebas con los estudios CIS 3411 y 3415 anteriores al 23J. Se elige la medida con un estudio y se evalúa en el otro.</p></div>
  <p><strong>${d.nMejoras} de ${d.trials.length}</strong> mejoran la referencia publicada por el CIS</p></div>
 <div class="table-wrap kitchen-validation-table"><table><thead><tr>
 <th scope="col">Selección → prueba</th><th scope="col">Método seleccionado</th><th scope="col">Error al probarlo (MAE)</th><th scope="col">Error CIS publicado</th><th scope="col">Resultado</th>
 </tr></thead><tbody>${trials}</tbody></table></div>
 <p class="kitchen-limit"><b>Límite decisivo:</b> son dos oleadas de un único instituto y de una misma elección. No prueban calibración electoral independiente ni justifican trasladar la receta al pronóstico. <a href="data/microdatos/auditoria_cocina_23j.json" download>Descargar la auditoría completa ↓</a></p>`;
}
export async function bindResultadosCocina(){
 const box=document.querySelector('#kitchen-results-data');if(!box)return;
 try{
  const urls=['data/microdatos/analisis_3582.json','data/microdatos/auditoria_cocina_23j.json'];
  const docs=await Promise.all(urls.map(async url=>{
   const r=await fetch(url,{cache:'no-store'});
   if(!r.ok)throw Error(url+': HTTP '+r.status);
   return r.json();
  }));
  if(box.isConnected)box.innerHTML=renderTablaCocina(extraerResultadosCocina(...docs));
 }catch(e){if(box.isConnected)box.innerHTML='<p role="alert">No se han podido cargar los resultados: '+esc(e.message)+'</p>';}
}

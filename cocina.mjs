// Cocina electoral: resultados agregados de estudio CIS 3582, sin entrevistas individuales.
// Los métodos alternativos NO son etapas acumulables ni reconstrucciones de la receta del CIS.
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const fmt=n=>Number(n).toLocaleString('es-ES',{minimumFractionDigits:1,maximumFractionDigits:1});
const METHODS=[
 {key:'direct',title:'Intención directa (2026)',type:'Dato de encuesta',text:'Porcentaje de todos los entrevistados que declara que votaría a este partido. Incluye indecisos y personas que no votarían en el denominador.'},
 {key:'decided',title:'Entre quienes eligen partido',type:'Cambio de denominador',text:'Es el voto declarado entre quienes mencionan una candidatura. Al excluir respuestas sin partido cambia el porcentaje, pero no aparecen nuevos votantes.'},
 {key:'sympathy',title:'Voto + simpatía',type:'Otra pregunta',text:'Se incorpora la simpatía de parte de quienes no expresan intención partidista. Es una medida distinta, no un paso posterior obligatorio.'},
 {key:'official',title:'Estimación publicada por CIS',type:'Referencia oficial',text:'El porcentaje de voto válido estimado por el instituto. La diferencia con las otras medidas no identifica por sí sola qué correcciones aplicó.'}
];
const EXPERIMENTS=[
 {key:'turnout',title:'Supuesto de participación',text:'Se repondera con la probabilidad autodeclarada de votar (PROBVOTO/10). Es una hipótesis; no predice con precisión quién acudirá a las urnas.'},
 {key:'recall',title:'Corrección parcial por recuerdo',text:'Ajuste exploratorio de cuatro partidos tomando como referencia el resultado oficial de 2023. No está validado como fórmula de estimación.'}
];
export function renderCocina(){
 return `<div class="hero"><div><div class="eyebrow">Microdatos / transparencia metodológica</div><h1>Entender la cocina electoral.</h1><p>De las respuestas originales a una estimación: qué sabemos, qué se modifica y qué sigue siendo una hipótesis.</p></div><div class="hero-aside"><span class="badge poll">Estudio CIS 3582</span><br><br><strong>Octubre de 2026</strong>Comparación de procedimientos</div></div>
 <div class="notice"><strong>Tres cosas distintas:</strong> el <b>voto real de 2023</b> son los votos contados en las urnas; el <b>recuerdo de voto</b> es lo que las personas dicen en 2026 que votaron en 2023; la <b>intención directa</b> es lo que dicen que votarían ahora. No son equivalentes.</div>
 <section class="panel cocina-main"><div class="panel-head"><div><h2>¿Cómo cambia la cifra que vemos?</h2><p class="muted">Comparamos distintas medidas para el mismo partido, no etapas sucesivas de un algoritmo.</p></div><label>Partido<select id="kitchen-party"><option value="PSOE">PSOE</option><option value="PP">PP</option><option value="VOX">Vox</option><option value="SUMAR">Sumar</option><option value="PODEMOS">Podemos</option><option value="ERC">ERC</option></select></label></div><div id="kitchen-study" role="status">Cargando estudio y resultados agregados…</div></section>
 <section class="panel cocina-main"><h2>¿Qué revela el recuerdo de voto?</h2><p>Entre quienes <b>dicen</b> que votaron a un partido en 2023, ¿qué declaran que harían ahora? Las transferencias reflejan respuestas de la muestra, no cambios de voto efectivamente ocurridos.</p><div id="kitchen-transfers"></div></section>
 <section class="panel cocina-main" id="kitchen-history"><div class="panel-head"><div><h2>¿Funcionó mejor algún método en las elecciones de 2023?</h2><p class="muted">Dos estudios anteriores al 23J comparados con los votos que finalmente se contaron.</p></div><label>Encuesta<select id="kitchen-historic-study"><option value="3411">CIS 3411 · junio de 2023</option><option value="3415">CIS 3415 · julio de 2023</option></select></label></div><div id="kitchen-historic-results" role="status">Cargando validación de 2023…</div></section>
 <section class="panel cocina-main"><h2>¿De dónde salen los datos?</h2><p>El análisis utiliza resultados <b>agregados</b> reconstruidos del CIS 3582 y los contrasta con su estimación oficial. No publicamos aquí entrevistas individuales. Se utiliza el peso nacional <code>PESO</code>; el fichero agregado incluye hipótesis parciales que no sustituyen una validación externa.</p><p><a href="data/microdatos/analisis_3582.json" download>Descargar las cifras y los supuestos (JSON) ↓</a> · <a href="https://www.cis.es/es/estudios/barometro-de-octubre-2026" target="_blank" rel="noopener">Estudio original del CIS ↗</a></p><details><summary>¿Qué se puede y qué no se puede concluir?</summary><p>Se pueden reproducir medidas descriptivas y probar el efecto de algunas decisiones de cálculo. No se puede afirmar que una coincidencia numérica descubra el algoritmo interno del CIS, ni atribuir a una sola corrección toda la diferencia con la estimación publicada.</p></details><p><a href="sala-mandos.html#microdatos">Abrir laboratorio técnico opcional →</a></p></section>`;
}
export async function bindCocina(){
 const box=document.querySelector('#kitchen-study'),trans=document.querySelector('#kitchen-transfers'),selector=document.querySelector('#kitchen-party');
 bindHistoricCis();
 if(!box||!trans||!selector)return;
 try{
  const response=await fetch('data/microdatos/analisis_3582.json',{cache:'no-store'});
  if(!response.ok)throw Error('No disponible (HTTP '+response.status+')');
  const data=await response.json();
  if(!box.isConnected)return;
  const bar=(v,official=false)=>`<div class="kitchen-bar"><i style="width:${Math.min(100,Math.max(0,v/40*100))}%;${official?'background:#aa7034;':''}"></i></div>`;
  function render(){
   const party=selector.value,record=data.comparison.find(x=>x.party===party);if(!record)return;
   box.innerHTML=`<p class="muted">CIS 3582 · ${data.n.toLocaleString('es-ES')} entrevistas · peso ${esc(data.weighted)} · las barras tienen la misma escala (0–40 %).</p><div class="kitchen-stage-grid">`
    +METHODS.map(m=>`<article class="kitchen-stage"><span class="badge">${esc(m.type)}</span><h3>${esc(m.title)}</h3><div class="kitchen-value">${fmt(record[m.key])} %</div>${bar(record[m.key],m.key==='official')}<p>${esc(m.text)}</p></article>`).join('')
    +`</div><div class="notice kitchen-explain"><b>Ejemplo con ${esc(party)}:</b> al comparar el ${fmt(record.direct)} % de intención directa con el ${fmt(record.decided)} % entre decididos, la diferencia de ${fmt(record.decided-record.direct)} puntos se debe principalmente al denominador. No significa un aumento observado del voto.</div>
     <details class="kitchen-experiments"><summary>Ver dos hipótesis estadísticas adicionales (no forman parte de una receta demostrada)</summary><div class="kitchen-stage-grid">`
    +EXPERIMENTS.map(m=>`<article class="kitchen-stage"><span class="badge sim">Experimento</span><h3>${esc(m.title)}</h3><div class="kitchen-value">${fmt(record[m.key])} %</div>${bar(record[m.key])}<p>${esc(m.text)}</p><small>Diferencia con «entre decididos»: ${record[m.key]-record.decided>0?'+':''}${fmt(record[m.key]-record.decided)} pp.</small></article>`).join('')
    +`</div><p class="muted">Son cálculos independientes con supuestos y bases distintos. No deben sumarse sus efectos ni interpretarse como el procedimiento aplicado por el CIS.</p></details>`;
   const names={PSOE:'PSOE',PP:'PP',VOX:'Vox',SUMAR:'Sumar'};
   trans.innerHTML=`<div class="table-wrap"><table><caption>Porcentajes ponderados dentro de cada grupo de recuerdo; se muestran solo algunos destinos, por lo que las filas no suman 100 %.</caption><thead><tr><th>Recuerda votar</th><th>Repetiría</th><th>Al PP</th><th>A Vox</th><th>Al PSOE</th><th>Indeciso</th><th>No votaría</th></tr></thead><tbody>`
    +Object.entries(data.transfers||{}).map(([key,r])=>`<tr><td><b>${esc(names[key]||key)}</b><small>n=${r.n}</small></td><td>${fmt(r[key])} %</td><td>${fmt(r.PP)} %</td><td>${fmt(r.VOX)} %</td><td>${fmt(r.PSOE)} %</td><td>${fmt(r.indecision)} %</td><td>${fmt(r.abstention)} %</td></tr>`).join('')
    +`</tbody></table></div>`;
  }
  selector.addEventListener('change',render);render();
 }catch(err){if(box.isConnected)box.textContent='No se ha podido cargar el análisis agregado: '+err.message}
}

const HISTORIC_METHODS=[
 ['direct_all','Intención directa'],
 ['decided','Solo quienes eligen partido'],
 ['sympathy_decided','Voto + simpatía'],
 ['turnout_decided','Ajuste exploratorio de participación'],
 ['published_cis','Estimación publicada CIS']
];
async function bindHistoricCis(){
 const target=document.querySelector('#kitchen-historic-results'),picker=document.querySelector('#kitchen-historic-study');if(!target||!picker)return;
 try{
  const response=await fetch('data/microdatos/validacion_23j.json',{cache:'no-store'});
  if(!response.ok)throw Error('HTTP '+response.status);
  const data=await response.json();
  if(!target.isConnected)return;
  function update(){
   const study=data.studies[picker.value];
   const num=n=>Number(n).toLocaleString('es-ES',{minimumFractionDigits:2,maximumFractionDigits:2});
   const worst=Math.max(...Object.values(study.mae_four_parties));
   target.innerHTML=`<p class="muted">Estudio ${esc(picker.value)} · ${study.sample_size.toLocaleString('es-ES')} entrevistas · error absoluto medio sobre cuatro partidos (puntos porcentuales). Cuanto menor, más cerca quedó del resultado.</p>
    <div class="kitchen-error-bars">`
    +HISTORIC_METHODS.map(([id,label])=>`<div class="kitchen-error-row"><span>${esc(label)}</span><div class="kitchen-error-track"><i style="width:${study.mae_four_parties[id]/worst*100}%;${id==='published_cis'?'background:#ac7234;':''}"></i></div><strong>${num(study.mae_four_parties[id])} pp</strong></div>`).join('')
    +`</div><div class="table-wrap"><table class="kitchen-history-table"><caption>Comparación por partido. Se muestran estimaciones de voto sobre candidaturas y resultado oficial final; la intención directa usa un denominador distinto.</caption><thead><tr><th>Partido</th><th>Resultado real 23J</th><th>Entre decididos</th><th>Con participación</th><th>Estimación CIS</th></tr></thead><tbody>`
    +data.party_order.map(p=>`<tr><td><b>${esc(p==='SUMAR'?'Sumar':p)}</b></td><td>${num(data.official_vote_valid_percent[p])} %</td><td>${num(study.scenarios.decided[p])} %</td><td>${num(study.scenarios.turnout_decided[p])} %</td><td>${num(study.scenarios.published_cis[p])} %</td></tr>`).join('')
    +`</tbody></table></div><div class="notice"><b>El recuerdo es de las elecciones de noviembre de 2019.</b> No sería correcto recalibrarlo contra el 23J de 2023. La validación del recuerdo exige los resultados de 2019 y un mapa de candidaturas comparable.</div>
    <p class="muted">Son dos estudios y cuatro partidos. El error es descriptivo y no demuestra que un método prediga mejor otras elecciones; el voto puede cambiar entre la entrevista y el día de votación. El CIS 3415 incluye votos emitidos por correo en parte de sus variables, pero la comparación de simpatía mostrada utiliza VOTOSIMG sin ese componente.</p>
    <a href="data/microdatos/validacion_23j.json" download>Descargar resultados y metodología (JSON) ↓</a>`;
  }
  picker.addEventListener('change',update);update();
 }catch(e){if(target.isConnected)target.textContent='No se ha podido cargar la validación histórica: '+e.message}
}

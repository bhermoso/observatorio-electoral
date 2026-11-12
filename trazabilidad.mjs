// Trazabilidad del Motor 29N. No atribuye cuotas porcentuales a ingredientes desconocidos.
const e=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pct=n=>Number(n).toLocaleString('es-ES',{minimumFractionDigits:1,maximumFractionDigits:2});
const INGREDIENTES=[
 ["estimacion_publicada","Estimación publicada"],
 ["intencion_directa","Intención directa"],
 ["intencion_directa_ponderada","Intención directa ponderada"],
 ["recuerdo_de_voto","Recuerdo de voto"],
 ["simpatia","Simpatía"],
 ["transferencias","Transferencias de voto"],
 ["probabilidad_de_votar","Probabilidad de votar"],
 ["acontecimientos","Acontecimientos"],
 ["efecto_de_encuestadora","Efecto de encuestadora"],
 ["tendencia_temporal","Tendencia temporal"],
 ["geografia_2023","Geografía electoral"]
];
const ESTADOS={
 entrada_observada:"Entrada del motor",modelizado:"Operación modelizada",
 no_ingresa_directamente:"No entra directamente",no_desagregable:"No cuantificable desde el dato publicado",
 sin_salto_automatico:"No modifica automáticamente el pronóstico"
};
export function renderTrazabilidad(){
 return `<section class="panel trace-cocina" aria-labelledby="trace-title"><div class="panel-head"><div><span class="eyebrow">Transparencia del algoritmo · Motor 29N</span><h2 id="trace-title">¿De qué está hecho nuestro pronóstico?</h2><p class="muted">Consulta, para cada partido, qué datos recibe el modelo y qué procedimientos aplica. La proporción atribuible a recuerdo, simpatía o participación dentro de la estimación de cada encuestadora no es observable sin su receta.</p></div><a href="como-estimamos.html">Método completo →</a></div>
 <div class="toolbar"><label>Partido<select id="trace-party"><option value="">Panorama · todas las candidaturas</option></select></label></div>
 <div id="trace-cocina-data" role="status">Cargando trazabilidad del corte publicado…</div><div class="trace-ablation"><h3>Laboratorio de sensibilidad del pronóstico</h3><p class="muted">Comparación con los mismos parámetros restantes. No son impactos causales ni pesos de ingredientes de encuestadoras.</p><label>Desactivar o cambiar un componente<select id="trace-ablation-choice"></select></label><div id="trace-ablation-result" role="status">Cargando comparaciones…</div></div>
</section>`;
}
export async function bindTrazabilidad(){
 const root=document.querySelector('#trace-cocina-data'),selector=document.querySelector('#trace-party');
 if(!root||!selector)return;
 try{
  const r=await fetch('data/modelo/pronostico.json',{cache:'no-store'});if(!r.ok)throw Error('No hay pronóstico publicado');
  const data=await r.json();if(!root.isConnected)return;
  const trace=data.trazabilidad;
  bindAblaciones(data);
  if(!trace){
   root.innerHTML='<div class="notice">Este corte todavía no contiene una descomposición auditada de entradas. La estimación publicada de cada encuestadora es el dato de entrada; no se puede imputar cuánto corresponde a simpatía, recuerdo o participación sin una receta demostrada.</div>';
   return;
  }
  selector.innerHTML='<option value="">Panorama · todas las candidaturas</option>'+Object.keys(trace.partidos||{}).sort().map(p=>'<option value="'+e(p)+'">'+e(p)+'</option>').join('');
  function update(){
   if(!selector.value){root.innerHTML='<div class="table-wrap"><table><caption>Pronóstico y entradas por candidatura. Selecciona cualquiera para auditar sus componentes.</caption><thead><tr><th>Candidatura</th><th>Mediana de voto</th><th>Encuestas</th><th>Institutos</th></tr></thead><tbody>'+Object.entries(trace.partidos||{}).sort(([a],[b])=>a.localeCompare(b)).map(([p,x])=>'<tr><td>'+e(p)+'</td><td>'+(x.pronostico_principal_voto_mediana==null?'—':pct(x.pronostico_principal_voto_mediana)+' %')+'</td><td>'+x.encuestas_con_estimacion+'</td><td>'+x.encuestadoras_distintas+'</td></tr>').join('')+'</tbody></table></div>';return}

   const p=trace.partidos?.[selector.value];if(!p){root.textContent='No hay trazabilidad disponible';return}
   const forecast=p.pronostico_principal_voto_mediana;
   const variants=Object.entries(p.variantes_tendencia||{}).map(([key,v])=>'<tr><td>'+e(({consenso_privadas:'Consenso privado',consenso_todas:'Consenso incluyendo CIS',calibrada_23j:'Corrección por error histórico 23J'}[key]||key))+'</td><td>'+pct(v.estimacion_latente_en_corte)+' %</td><td>'+pct(v.sd_estimacion_latente)+' pp</td></tr>').join('');
   root.innerHTML='<div class="trace-kpis"><div><span>Voto del pronóstico principal · mediana</span><strong>'+(forecast===null?'—':pct(forecast)+' %')+'</strong><small>'+(p.pronostico_principal_voto_p5_p95?'Percentiles 5–95: '+p.pronostico_principal_voto_p5_p95.map(pct).join('–')+' %':'Sin intervalo publicado')+'</small></div><div><span>Encuestas con estimación para el partido</span><strong>'+p.encuestas_con_estimacion+'</strong><small>'+p.encuestadoras_distintas+' encuestadoras</small></div><div><span>Escala del error industrial estimado</span><strong>'+(p.escala_industria_pp===null?'—':pct(p.escala_industria_pp)+' pp')+'</strong><small>Parámetro de incertidumbre, no ingrediente de voto</small></div></div>'
    +'<div class="trace-columns"><div><h3>Qué entra y qué no es identificable</h3><div class="trace-grupos">'+[['entra','Entra en el motor',['entrada_observada']],['modela','Lo calcula el motor',['modelizado']],['fuera','No entra o no se puede separar',['no_ingresa_directamente','no_desagregable','sin_salto_automatico']]].map(([cls,tit,ests])=>{const items=INGREDIENTES.filter(([key])=>ests.includes(trace.variables[key]?.estado));return items.length?'<div class="trace-grupo trace-'+cls+'"><h4>'+tit+'</h4><ul>'+items.map(([key,name])=>{const v=trace.variables[key];return '<li title="'+e(v.detalle)+'" tabindex="0"><b>'+e(name)+'</b><small>'+e(v.detalle)+'</small></li>'}).join('')+'</ul></div>':''}).join('')+'</div><p class="muted">El motor recibe estimaciones ya publicadas: lo que cada casa hizo con el recuerdo, la simpatía o la participación queda dentro de su cifra y no se puede separar. Los conceptos se explican en <a href="#cocina-cap1">Cocina, capítulo 1</a>.</p></div><div><h3>Las tres hipótesis del motor</h3><div class="table-wrap" tabindex="0" role="region" aria-label="Tabla de trazabilidad"><table><thead><tr><th>Anclaje</th><th>Tendencia al corte</th><th>Desviación</th></tr></thead><tbody>'+variants+'</tbody></table></div><p class="muted">Las tendencias de esta tabla son estimaciones latentes antes de la simulación de voto hasta la elección. No son contribuciones aditivas ni deben sumarse.</p><p><b>Casas con estimación:</b> '+e((p.casas||[]).join(', ')||'Sin datos')+'</p><p><b>Origen de los estudios:</b> '+e(Object.entries(p.origenes||{}).map(([k,v])=>k+': '+v).join(' · '))+'</p></div></div>'
    +'';
  }
  selector.addEventListener('change',update);update();
 }catch(err){if(root.isConnected)root.textContent='No se pudo cargar la trazabilidad: '+err.message}
}

function bindAblaciones(data){
 const choice=document.querySelector('#trace-ablation-choice'),target=document.querySelector('#trace-ablation-result');
 if(!choice||!target)return;
 const report=data.sensibilidad_cocina;
 if(!report?.experimentos?.length){target.innerHTML='<p class="muted">La publicación todavía no incluye resultados de sensibilidad del modelo. No se imputan cambios de escaños.</p>';choice.disabled=true;return}
 choice.innerHTML=report.experimentos.map(x=>'<option value="'+e(x.id)+'">'+e(x.nombre)+'</option>').join('');
 function update(){
  const x=report.experimentos.find(q=>q.id===choice.value);if(!x)return;
  const cmp=x.comparacion,fmt=v=>(v>0?'+':'')+pct(v);
  const parties=Object.keys(cmp.cambio_voto_pp).map(k=>'<tr><td>'+e(k)+'</td><td>'+fmt(cmp.cambio_voto_pp[k])+' pp</td><td>'+fmt(cmp.cambio_mediana_escanos[k])+'</td></tr>').join('');
  const blocs=Object.entries(cmp.bloques).map(([k,v])=>'<tr><td>'+e(k.replaceAll('+',' + '))+'</td><td>'+fmt(v.cambio_mediana_escanos)+'</td><td>'+fmt(v.cambio_frecuencia_umbral_puntos)+' pp</td></tr>').join('');
  target.innerHTML='<p><b>'+e(x.nombre)+'</b> · '+report.n_por_variante+' simulaciones por anclaje; comparaciones aproximadas, con variabilidad de Monte Carlo.</p><div class="table-wrap" tabindex="0" role="region" aria-label="Tabla de trazabilidad"><table><thead><tr><th>Partido</th><th>Cambio voto</th><th>Cambio mediana de escaños</th></tr></thead><tbody>'+parties+'</tbody></table></div><div class="table-wrap" tabindex="0" role="region" aria-label="Tabla de trazabilidad"><table><thead><tr><th>Bloque aritmético</th><th>Cambio escaños</th><th>Cambio frecuencia de ≥176</th></tr></thead><tbody>'+blocs+'</tbody></table></div><p class="muted">Signos relativos al modelo de referencia con igual número de simulaciones. No es estimación de acuerdos parlamentarios.</p>';
 }
 choice.addEventListener('change',update);update();
}

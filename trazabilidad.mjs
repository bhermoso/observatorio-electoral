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
 <div class="toolbar"><label>Partido<select id="trace-party"><option value="PP">PP</option><option value="PSOE">PSOE</option><option value="VOX">Vox</option><option value="SUMAR">Sumar / Frente Amplio</option><option value="PODEMOS">Podemos</option><option value="SALF">SALF</option></select></label></div>
 <div id="trace-cocina-data" role="status">Cargando trazabilidad del corte publicado…</div>
 <p class="muted">La tabla de ingredientes es una <b>auditoría de presencia y ausencia de información</b>, no un gráfico de pesos que sumen 100 %. Si una encuesta ya publica una estimación cocinada, los ingredientes utilizados por esa casa no pueden deducirse de su cifra final.</p></section>`;
}
export async function bindTrazabilidad(){
 const root=document.querySelector('#trace-cocina-data'),selector=document.querySelector('#trace-party');
 if(!root||!selector)return;
 try{
  const r=await fetch('data/modelo/pronostico.json',{cache:'no-store'});if(!r.ok)throw Error('No hay pronóstico publicado');
  const data=await r.json();if(!root.isConnected)return;
  const trace=data.trazabilidad;
  if(!trace){
   root.innerHTML='<div class="notice">Este corte todavía no contiene una descomposición auditada de entradas. La estimación publicada de cada encuestadora es el dato de entrada; no se puede imputar cuánto corresponde a simpatía, recuerdo o participación sin una receta demostrada.</div>';
   return;
  }
  function update(){
   const p=trace.partidos?.[selector.value];if(!p){root.textContent='No hay trazabilidad disponible';return}
   const forecast=p.pronostico_principal_voto_mediana;
   const variants=Object.entries(p.variantes_tendencia||{}).map(([key,v])=>'<tr><td>'+e(({consenso_privadas:'Consenso privado',consenso_todas:'Consenso incluyendo CIS',calibrada_23j:'Corrección por error histórico 23J'}[key]||key))+'</td><td>'+pct(v.estimacion_latente_en_corte)+' %</td><td>'+pct(v.sd_estimacion_latente)+' pp</td></tr>').join('');
   root.innerHTML='<div class="trace-kpis"><div><span>Voto del pronóstico principal · mediana</span><strong>'+(forecast===null?'—':pct(forecast)+' %')+'</strong><small>'+(p.pronostico_principal_voto_p5_p95?'Percentiles 5–95: '+p.pronostico_principal_voto_p5_p95.map(pct).join('–')+' %':'Sin intervalo publicado')+'</small></div><div><span>Encuestas con estimación para el partido</span><strong>'+p.encuestas_con_estimacion+'</strong><small>'+p.encuestadoras_distintas+' encuestadoras</small></div><div><span>Escala del error industrial estimado</span><strong>'+(p.escala_industria_pp===null?'—':pct(p.escala_industria_pp)+' pp')+'</strong><small>Parámetro de incertidumbre, no ingrediente de voto</small></div></div>'
    +'<div class="trace-columns"><div><h3>Qué entra y qué no es identificable</h3><div class="trace-ingredients">'+INGREDIENTES.map(([key,name])=>{const v=trace.variables[key];return '<details><summary><b>'+e(name)+'</b><small>'+e(ESTADOS[v.estado]||v.estado)+'</small></summary><p>'+e(v.detalle)+'</p></details>'}).join('')+'</div></div><div><h3>Las tres hipótesis del motor</h3><div class="table-wrap"><table><thead><tr><th>Anclaje</th><th>Tendencia al corte</th><th>Desviación</th></tr></thead><tbody>'+variants+'</tbody></table></div><p class="muted">Las tendencias de esta tabla son estimaciones latentes antes de la simulación de voto hasta la elección. No son contribuciones aditivas ni deben sumarse.</p><p><b>Casas con estimación:</b> '+e((p.casas||[]).join(', ')||'Sin datos')+'</p><p><b>Origen de los estudios:</b> '+e(Object.entries(p.origenes||{}).map(([k,v])=>k+': '+v).join(' · '))+'</p></div></div>'
    +'<div class="trace-audit"><b>Fuentes utilizadas en el corte:</b> '+trace.fuentes.estudios_actuales_incluidos+' estudios de '+trace.fuentes.casas_actuales+' casas. <b>Excluidos:</b> '+trace.fuentes.registros_prensa_sin_verificar_excluidos+' registros de prensa sin verificar. <br><b>Composición del modelo:</b> '+e(trace.parametros_de_modelo.combinacion_principal)+'.</div>';
  }
  selector.addEventListener('change',update);update();
 }catch(err){if(root.isConnected)root.textContent='No se pudo cargar la trazabilidad: '+err.message}
}

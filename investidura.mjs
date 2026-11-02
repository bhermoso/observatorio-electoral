// Investidura: ejercicios condicionales sobre las MISMAS simulaciones conjuntas del Motor 29N.
// No se estima la probabilidad de acuerdos o comportamientos políticos.
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=n=>Number(n).toLocaleString('es-ES',{maximumFractionDigits:1});
export function renderInvestidura(){
 return `<section class="panel investidura" aria-labelledby="invest-heading"><div class="panel-head"><div><span class="eyebrow">Congreso · Escenarios de votación</span><h2 id="invest-heading">¿Cómo cuentan los síes, los noes y las abstenciones?</h2><p class="muted">Herramienta de aritmética parlamentaria sobre el Motor 29N, no predicción de un pacto.</p></div><a href="como-estimamos.html#alianzas">Entender el método →</a></div>
 <div class="invest-rules"><div><b>Primera votación</b><span>176 escaños afirmativos</span></div><div><b>Segunda votación</b><span>Más síes que noes. Las abstenciones no son votos afirmativos.</span></div></div>
 <div class="toolbar"><label>Hipótesis de voto<select id="invest-scenario"><option value="pp_vox_primera">PP + Vox: todos los demás votan no</option><option value="pp_vox_upn_primera">PP + Vox + UPN: todos los demás votan no</option><option value="pp_vox_segunda_abst_otros">PP + Vox: UPN y CC se abstienen</option><option value="psoe_sumar_podemos_primera">PSOE + Sumar + Podemos: todos los demás votan no</option><option value="psoe_sumar_segunda_abst_territoriales">PSOE + Sumar + Podemos: abstención de seis formaciones territoriales</option><option value="psoe_apoyos_territoriales_primera">PSOE + Sumar + Podemos + seis formaciones territoriales: todas votan sí</option></select></label></div>
 <div id="invest-data" role="status">Cargando escenarios conjuntos…</div>
 <p class="muted invest-foot">Los supuestos de comportamiento parlamentario son configuraciones hipotéticas predefinidas, <b>no previsiones de acuerdos</b>. «Frecuencia en simulaciones» mide únicamente cuántos repartos electorales del modelo satisfacen la regla, suponiendo que los partidos votasen exactamente como se indica. El modelo no asigna probabilidades a esos comportamientos.</p></section>`;
}
export async function bindInvestidura(){
 const root=document.querySelector('#invest-data'),select=document.querySelector('#invest-scenario');if(!root||!select)return;
 try{
  const res=await fetch('data/modelo/pronostico.json',{cache:'no-store'});if(!res.ok)throw Error('El modelo no está publicado');
  const data=await res.json();if(!root.isConnected)return;
  const scenarios=data.principal?.investidura;
  if(!scenarios){root.innerHTML='<div class="notice">La publicación actual no incluye aún el módulo de investidura. No se pueden reconstruir estos resultados sumando medianas de escaños.</div>';return}
  function update(){
   const p=scenarios[select.value];
   if(!p){root.textContent='Escenario no disponible';return}
   if(!p.disponible){root.textContent='Sin cálculo: '+(p.motivo||'faltan datos');return}
   const textList=a=>a.length?a.map(esc).join(' + '):'Ninguno';
   root.innerHTML=`<div class="invest-kpis"><div><span>Mediana de votos afirmativos</span><strong>${num(p.mediana_si)}</strong><small>Intervalo entre percentiles 5–95: ${num(p.p5_si)}–${num(p.p95_si)}</small></div><div><span>Mediana de abstenciones</span><strong>${num(p.mediana_abstenciones)}</strong></div><div><span>Mediana de votos contrarios</span><strong>${num(p.mediana_no)}</strong></div></div>
   <div class="invest-trace"><p><b>Votarían sí (supuesto):</b> ${textList(p.si)}</p><p><b>Se abstendrían (supuesto):</b> ${textList(p.abstienen)}</p><p><b>Votarían no (supuesto):</b> las demás formaciones, incluidos escaños no asignados nominalmente.</p></div>
   <div class="invest-frequencies"><div><span>Repartos simulados que cumplirían el umbral de primera votación</span><strong>${num(p.frecuencia_primera*100)} %</strong><small>Sí ≥ 176</small></div><div><span>Repartos simulados que cumplirían la regla de segunda votación</span><strong>${num(p.frecuencia_segunda*100)} %</strong><small>Sí &gt; no</small></div></div>
   <p class="muted">Evaluación conjunta de ${Number(p.n).toLocaleString('es-ES')} repartos del pronóstico principal · corte ${esc(data.corte)}. Son frecuencias condicionadas al supuesto político indicado y a los parámetros del motor, no probabilidades de formación de gobierno.</p>`;
  }
  select.addEventListener('change',update);update();
 }catch(e){if(root.isConnected)root.textContent='No se han podido cargar los escenarios: '+e.message}
}

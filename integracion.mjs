// Síntesis de los pronósticos del motor existente, integrada en el diseño principal.
// Nunca presenta escaños como si fuesen una inferencia a partir del porcentaje nacional.
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const num=(n,d=0)=>Number(n).toLocaleString('es-ES',{minimumFractionDigits:d,maximumFractionDigits:d});
const blocks=[
 ['PP+VOX','PP + Vox',['PP','VOX']],
 ['PP+VOX+UPN','PP + Vox + UPN',['PP','VOX','UPN']],
 ['PSOE+SUMAR+PODEMOS','PSOE + Sumar + Podemos',['PSOE','SUMAR','PODEMOS']],
 ['PSOE+SUMAR+PODEMOS+ERC+JUNTS+BILDU+PNV+BNG+CC','PSOE + Sumar + Podemos + apoyos territoriales',['PSOE','SUMAR','PODEMOS','ERC','JUNTS','BILDU','PNV','BNG','CC']]
];
export function renderIntegratedForecast(){
 return `<section class="integrated" aria-labelledby="integrated-heading"><div class="section-title"><div><div class="eyebrow">Estimaciones actuales / Congreso de los Diputados</div><h2 id="integrated-heading">Escenarios de bloques parlamentarios</h2></div><span class="badge sim">Motor 29N · Simulación</span></div><p class="integrated-intro">Escenarios numéricos construidos por el <b>Motor 29N</b>. Se suman partidos a efectos de análisis; no se predicen acuerdos políticos. El umbral para la mayoría absoluta son <b>176 de 350</b>. No se presupone que exista un acuerdo.</p>
 <div class="toolbar"><label>Hipótesis del modelo<select id="integrated-model"><option value="principal" selected>Estimación de referencia (principal)</option><option value="consenso_privadas">Variante: consenso de institutos privados</option><option value="consenso_todas">Variante: consenso incluyendo CIS (sin cocina)</option><option value="calibrada_23j">Variante: calibración con el error del 23J</option></select></label></div>
 <p class="muted" id="integrated-meta" role="status">Cargando pronóstico territorial…</p><div class="integrated-blocks" id="integrated-blocks"></div>
 <div class="integrated-actions"><a href="como-estimamos.html">Cómo se elabora la estimación →</a><a href="pronostico.html">Informe detallado del motor →</a><a href="#cocina">Entender la cocina electoral →</a><a href="#contexto">Comparar encuestas alrededor de acontecimientos →</a></div>
 <p class="muted integrated-foot">Voto conjunto = suma de estimaciones nacionales. Escaños = mediana de simulaciones conjuntas por provincias; el intervalo 5–95 % y la frecuencia de mayoría reflejan los supuestos del modelo. No predicen pactos políticos. Las frecuencias de simulación dependen de los supuestos estadísticos; no son certezas sobre resultados.</p></section>`;
}
export async function bindIntegratedForecast(){
 const root=document.querySelector('#integrated-blocks'),modelSelect=document.querySelector('#integrated-model'),meta=document.querySelector('#integrated-meta');
 if(!root||!modelSelect)return;
 try{
  const res=await fetch('data/modelo/pronostico.json',{cache:'no-store'});if(!res.ok)throw Error('Pronóstico aún no publicado');
  const forecast=await res.json();
  if(!root.isConnected)return;
  function update(){
   const model=modelSelect.value==='principal'?forecast.principal:forecast.variantes?.[modelSelect.value];if(!model){meta.textContent='Esta variante no está disponible';return}
   meta.textContent=(modelSelect.value==='principal'?'Estimación de referencia':'Variante del modelo, no es la estimación de referencia')+' · Corte: '+forecast.corte+' · Escenario electoral: '+forecast.eleccion+' · 176 escaños para mayoría'+(forecast.auditoria_fuentes?' · Fuentes en el modelo: '+forecast.auditoria_fuentes.incluidas_2023_26+' · Excluidas por la puerta de calidad: '+(forecast.auditoria_fuentes.excluidas_total??forecast.auditoria_fuentes.excluidas_prensa_sin_verificar):'');
   root.innerHTML=blocks.map(([key,label,parties])=>{
    const b=model.bloques?.[key];if(!b)return '';
    const votes=parties.map(p=>model.partidos?.[p]?.voto?.[0]);const vote=votes.every(Number.isFinite)?num(votes.reduce((a,v)=>a+v,0),1)+' %':'No disponible';
    const delta=b.mediana-176;
    return `<article class="integrated-block"><h3>${esc(label)}</h3><div class="integrated-block-main"><strong>${num(b.mediana)} <small>escaños</small></strong><span>${esc(vote)} de voto</span></div><div class="integrated-track" role="img" aria-label="${num(b.mediana)} de 350 escaños, mayoría en 176"><div style="width:${Math.min(100,Math.max(0,b.mediana/350*100))}%"></div><i></i></div><p class="integrated-distance">${delta>=0?'+'+num(delta)+' por encima de 176':num(-delta)+' para llegar a 176'}</p><div class="integrated-interval">Intervalo de escaños: ${num(b.p5)}–${num(b.p95)} · Mayoría en simulaciones: ${num(b.p_mayoria*100,1)} %</div></article>`;
   }).join('');
  }
  modelSelect.addEventListener('change',update);update();
 }catch(error){if(root.isConnected)meta.textContent='No se han podido cargar los datos: '+error.message}
}

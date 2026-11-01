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
 return `<section class="integrated" aria-labelledby="integrated-heading"><div class="section-title"><div><div class="eyebrow">Estimaciones actuales / Congreso de los Diputados</div><h2 id="integrated-heading">¿Qué bloques podrían gobernar?</h2></div><span class="badge sim">Proyección, no resultado</span></div><p class="integrated-intro">Escaños que sumarían los partidos <b>si actuasen juntos después de las elecciones</b>. El umbral para la mayoría absoluta son <b>176 de 350</b>. No se presupone que exista un acuerdo.</p>
 <div class="toolbar"><label>Hipótesis del modelo<select id="integrated-model"><option value="consenso_privadas">Promedio de institutos privados</option><option value="consenso_todas">Incluyendo CIS</option><option value="calibrada_23j">Calibración retrospectiva 23J</option></select></label></div>
 <p class="muted" id="integrated-meta" role="status">Cargando pronóstico territorial…</p><div class="integrated-blocks" id="integrated-blocks"></div>
 <div class="integrated-actions"><a href="pronostico.html">Ver pronóstico y metodología →</a><a href="sala-mandos.html#microdatos">Investigar microdatos y cocina →</a><a href="#contexto">Comparar encuestas alrededor de acontecimientos →</a></div>
 <p class="muted integrated-foot">Voto conjunto = suma de estimaciones nacionales. Escaños = mediana de simulaciones conjuntas por provincias; el intervalo 5–95 % y la frecuencia de mayoría reflejan los supuestos del modelo. No son pactos previstos ni un cálculo exacto de probabilidades políticas.</p></section>`;
}
export async function bindIntegratedForecast(){
 const root=document.querySelector('#integrated-blocks'),modelSelect=document.querySelector('#integrated-model'),meta=document.querySelector('#integrated-meta');
 if(!root||!modelSelect)return;
 try{
  const res=await fetch('data/modelo/pronostico.json',{cache:'no-store'});if(!res.ok)throw Error('Pronóstico aún no publicado');
  const forecast=await res.json();
  if(!root.isConnected)return;
  function update(){
   const model=forecast.variantes?.[modelSelect.value];if(!model){meta.textContent='Esta variante no está disponible';return}
   meta.textContent='Corte del modelo: '+forecast.corte+' · Escenario electoral: '+forecast.eleccion+' · 176 escaños para mayoría';
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

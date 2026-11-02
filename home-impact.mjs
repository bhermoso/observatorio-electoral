import {renderValidationDashboard,bindValidationDashboard} from './dashboard-validacion.mjs';
import {calculate} from './cocina-secuencial.mjs';
import {projection} from './cocina-escanos.mjs';
const PARTIES=['PP','PSOE','VOX','SUMAR'];
const COLORS={PP:'#2789c8',PSOE:'#d84f5e',VOX:'#459965',SUMAR:'#a479bc'};
const h=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=(v,d=1)=>Number(v).toLocaleString('es-ES',{minimumFractionDigits:d,maximumFractionDigits:d});
const num=(v,d=1)=>Number.isFinite(Number(v))?fmt(v,d):'—';
let raf;
function animate(root){
 if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 root.querySelectorAll('[data-count]').forEach(el=>{
  const to=Number(el.dataset.count);if(!Number.isFinite(to))return;
  const start=performance.now(),duration=650;
  function tick(t){if(!el.isConnected)return;const p=Math.min(1,(t-start)/duration),ease=1-(1-p)**3;el.textContent=fmt(to*ease,Number(el.dataset.decimals||0));if(p<1)requestAnimationFrame(tick)}
  requestAnimationFrame(tick);
 });
}
export function renderHomeImpact(){
 return `<section class="impact" id="impact" aria-labelledby="impact-heading">
 <div class="impact-top"><div><span class="impact-kicker"><i></i> OBSERVATORIO · CORTE PUBLICADO</span><h1 id="impact-heading">El voto cambia.<br><em>Los escaños también.</em></h1><p>Encuestas contrastadas. Estimación propia. Cocina visible. Todas las cifras tienen una fuente y un método.</p><div class="impact-links"><a class="impact-primary" href="#analisis">Ver pronóstico completo ↗</a><a href="construye-estimacion.html#cocina-secuencia">Construir otra estimación ↗</a></div></div><div class="impact-live"><div class="impact-live-head"><span>Motor 29N · Estimaciones modelizadas</span><strong id="impact-cut">Cargando corte…</strong></div><div class="impact-metrics" id="impact-kpis" aria-live="polite"><div class="impact-blank">Consultando pronóstico publicado…</div></div><div class="impact-meta" id="impact-source">Sin cifras simuladas hasta confirmar las fuentes.</div></div></div>
 <div class="impact-lower">
 <div class="impact-chart"><div class="impact-section-title"><div><small>01 / OBSERVACIÓN</small><h2>De las encuestas al consenso</h2></div><a href="#encuestas">Fuentes ↗</a></div><p>Media aritmética de los estudios que publican cada partido, sin confundirla con la estimación modelizada.</p><div id="impact-average" class="impact-visual"><span>Cargando encuestas…</span></div><p class="impact-footnote" id="impact-average-note"></p></div>
 <div class="impact-chart"><div class="impact-section-title"><div><small>02 / COCINA PROPIA</small><h2>Una decisión cambia la estimación</h2></div><a href="construye-estimacion.html">Laboratorio ↗</a></div><p>Prueba dos recetas nacionales calculadas de microdatos del CIS. La proyección de escaños es ilustrativa, no el Motor 29N.</p><div class="impact-toggle"><label>Estudio <select id="impact-cis"><option value="3411">CIS 3411 · 2023</option><option value="3415">CIS 3415 · 2023</option><option value="3582" selected>CIS 3582 · 2026</option></select></label><label>Procedimiento <select id="impact-recipe"><option value="decided">PESO + decididos</option><option value="sympathy">PESO + voto/simpatía</option><option value="turnout">PESO + decididos + participación</option></select></label></div><div id="impact-recipe-output" class="impact-visual" aria-live="polite">Recalculando receta…</div></div>
 </div><div class="impact-bottom"><span>03 / VERIFICACIÓN</span><div><b>¿De dónde sale cada número?</b><p>Explora las operaciones, los denominadores y los escaños por provincia. La cocina experimental no modifica automáticamente el pronóstico oficial del Motor 29N.</p></div><a href="flujograma.html">Abrir algoritmo ↗</a></div>
 ${renderValidationDashboard()}</section>`;
}
export async function bindHomeImpact(polls){
 const root=document.querySelector('#impact');if(!root)return;
 void bindValidationDashboard();
 const published=[...polls].filter(p=>p.kind==='poll-estimate'&&p.published?.startsWith('2026'));
 const stat=PARTIES.map(p=>{
  const key=p==='SUMAR'?'Sumar':p;
  const items=published.filter(q=>Number.isFinite(q.values?.[key])).map(q=>({value:q.values[key],institute:q.institute}));
  return {party:p,n:items.length,avg:items.length?items.reduce((a,z)=>a+z.value,0)/items.length:null};
 });
 const latest=published.map(p=>p.published).sort().at(-1)||'sin fecha';
 const chart=document.querySelector('#impact-average');
 chart.innerHTML=stat.map(x=>`<div class="impact-line"><span><i style="background:${COLORS[x.party]}"></i>${x.party}</span><div class="impact-track"><div style="background:${COLORS[x.party]};width:${x.avg===null?0:Math.min(100,x.avg/42*100)}%"></div></div><b>${x.avg===null?'—':fmt(x.avg)+' %'}</b><small>n=${x.n}</small></div>`).join('');
 document.querySelector('#impact-average-note').textContent='Última publicación registrada: '+latest+'. '+'Promedio aritmético de encuestas publicadas en 2026 según los estudios que publican cada cifra. «Sumar» y «Frente Amplio» permanecen separados; n indica cuántos estudios hay en cada barra.';
 try{
  const r=await fetch('data/modelo/pronostico.json',{cache:'no-store'});if(!r.ok)throw Error('Pronóstico no disponible');const forecast=await r.json();if(!root.isConnected)return;
  document.querySelector('#impact-cut').textContent='Corte '+(forecast.corte||'no indicado');
  const variants=forecast.variantes||{};
  const model=variants.consenso_privadas;const bs=model?.bloques?.['PP+VOX'];
  document.querySelector('#impact-kpis').innerHTML=PARTIES.slice(0,3).map(p=>{const x=model?.partidos?.[p];return `<div class="impact-kpi"><small>${p} · VOTO</small><strong><span data-count="${Number(x?.voto?.[0])}" data-decimals="1">—</span><i>%</i></strong><span>${x?.escanos?.[0]??'—'} diputados · intervalo ${x?.escanos?Math.round(x.escanos[1])+'–'+Math.round(x.escanos[2]):'—'}</span></div>`}).join('')+
   `<div class="impact-kpi impact-majority"><small>PP + VOX · ESCAÑOS</small><strong><span data-count="${Number(bs?.mediana)}">—</span><i>/350</i></strong><span>176 para mayoría · ${bs?.p_mayoria!=null?fmt(bs.p_mayoria*100,1)+' % de simulaciones':'—'}</span></div>`;
  document.querySelector('#impact-source').textContent='Escenario: consenso de institutos privados · mediana del modelo, no media de encuestas · escenarios de mayoría condicionados a supuestos.';
  animate(root);
 }catch(err){document.querySelector('#impact-kpis').textContent='Pronóstico no disponible: '+err.message;document.querySelector('#impact-cut').textContent='Sin corte verificable'}
 try{
  const [c,e]=await Promise.all(['data/microdatos/cubo_decisiones_cis.json','data/election.json'].map(async uri=>{const r=await fetch(uri);if(!r.ok)throw Error(uri+': '+r.status);return r.json()}));
  if(!root.isConnected)return;
  const study=document.querySelector('#impact-cis'),recipe=document.querySelector('#impact-recipe'),el=document.querySelector('#impact-recipe-output');
  const draw=()=>{
   const kind=recipe.value,params={study:study.value,weighted:true,decided:true,sympathy:kind==='sympathy',participation:kind==='turnout'?1:0};
   try{
    const calc=calculate(c,params);
    const out=projection(e,Object.fromEntries(PARTIES.map(p=>[p,calc.shares[p]])));
    const votes=PARTIES.map(p=>`<div class="impact-line"><span><i style="background:${COLORS[p]}"></i>${p}</span><div class="impact-track"><div style="width:${Math.min(100,calc.shares[p]/42*100)}%;background:${COLORS[p]}"></div></div><b>${fmt(calc.shares[p])}%</b><small>${out.seats[p]} esc.</small></div>`).join('');
    el.innerHTML=votes+`<div class="impact-recipe-footer"><span>PP + Vox: <b>${out.seats.PP+out.seats.VOX} diputados</b></span><span>Proyección IPF + D’Hondt sobre 23J</span></div>`;
   }catch(err){el.textContent='No puede calcularse este escenario: '+err.message}
  };
  study.addEventListener('change',draw);recipe.addEventListener('change',draw);draw();
 }catch(err){const el=document.querySelector('#impact-recipe-output');if(el)el.textContent='Microdatos agregados no disponibles: '+err.message}
}

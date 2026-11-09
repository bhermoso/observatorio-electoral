// Cocina: un caso completo de encuesta a escaños (40dB → Madrid y Jaén) y el experimento con
// microdatos del CIS. Antes estaban plegados en Panorama.
import {calculate} from './cocina-secuencial.mjs';
import {projection} from './cocina-escanos.mjs';
import {bindCaso} from './caso-escanos.mjs';
import {PARTIES} from './capas.mjs';

const h=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=(v,d=1)=>Number(v).toLocaleString('es-ES',{minimumFractionDigits:d,maximumFractionDigits:d});
const fdate=s=>s?new Date(String(s).slice(0,10)+'T12:00:00Z').toLocaleDateString('es-ES',{day:'numeric',month:'short',year:'numeric',timeZone:'Europe/Madrid'}):'—';
const signed=(v,d=1)=>(v>0?'+':v<0?'−':'±')+fmt(Math.abs(v),d);
const name=id=>PARTIES.find(x=>x.id===id)?.label||id;
const todayMadrid=()=>new Date().toLocaleDateString('sv-SE',{timeZone:'Europe/Madrid'});
const CIS_PARTIES=['PP','PSOE','VOX','SUMAR'];

export function renderCasosCocina(){
 return `<section class="panel portada-caso" id="cocina-caso" aria-labelledby="caso-heading"><h2 id="caso-heading">Un caso completo: de una encuesta de 40dB a los escaños de Madrid y Jaén</h2>
  <div id="caso-contenido" aria-live="polite"><p class="muted">Cargando el caso…</p></div></section>
 <section class="panel experiment" id="cocina-experimento-cis" aria-labelledby="exp-heading"><h2 id="exp-heading">Experimento separado: cocina sobre respuestas del CIS</h2>
  <p class="muted"><span class="badge sim">Microdatos · fuera del pronóstico</span> Cocina aplicada a <b>microdatos individuales</b> de un solo instituto (CIS). No alimenta el Motor 29N ni el contraste de capas. La proyección de escaños es ilustrativa: ajuste proporcional sobre el mapa de 2023 y D’Hondt.</p>
  <div class="toolbar"><label>Estudio <select id="impact-cis"><option value="3411">CIS 3411 · 2023</option><option value="3415">CIS 3415 · 2023</option><option value="3582" selected>CIS 3582 · 2026</option></select></label><label>Procedimiento <select id="impact-recipe"><option value="decided">Ponderación + solo decididos</option><option value="sympathy">Ponderación + voto o simpatía</option><option value="turnout">Ponderación + decididos + participación</option></select></label></div>
  <div id="impact-recipe-output" class="impact-visual" aria-live="polite">Recalculando…</div>
  <p class="muted"><a href="construye-estimacion.html">Construye una estimación, decisión a decisión →</a> · <a href="tutorial-estimacion.html">Tutorial</a> · <a href="metodo-evidencia.html">Por qué cambia la estimación</a> · <a href="#laboratorio">Laboratorio D’Hondt →</a></p>
 </section>`;
}

export async function bindCasosCocina(polls){
 const root=document.querySelector('#cocina-caso');if(!root)return;
 bindCaso(root,polls);
 try{
  const [c,e]=await Promise.all(['data/microdatos/cubo_decisiones_cis.json','data/election.json'].map(async uri=>{const r=await fetch(uri);if(!r.ok)throw Error(uri+': '+r.status);return r.json()}));
  if(!root.isConnected)return;
  const study=document.querySelector('#impact-cis'),recipe=document.querySelector('#impact-recipe'),el=document.querySelector('#impact-recipe-output');
  const draw=()=>{
   const kind=recipe.value,params={study:study.value,weighted:true,decided:true,sympathy:kind==='sympathy',participation:kind==='turnout'?1:0};
   try{
    const calc=calculate(c,params);
    const out=projection(e,Object.fromEntries(CIS_PARTIES.map(p=>[p,calc.shares[p]])));
    el.innerHTML=CIS_PARTIES.map(p=>`<div class="impact-line"><span>${h(name(p))}</span><div class="impact-track"><div style="width:${Math.min(100,calc.shares[p]/42*100)}%"></div></div><b>${fmt(calc.shares[p])} %</b><small>${out.seats[p]} esc. ilustrativos</small></div>`).join('')+`<p class="muted">PP + Vox: ${out.seats.PP+out.seats.VOX} escaños ilustrativos. Experimento sobre un único estudio.</p>`;
   }catch(err){el.textContent='No puede calcularse este escenario: '+err.message}
  };
  study.addEventListener('change',draw);recipe.addEventListener('change',draw);draw();
 }catch(err){const el=document.querySelector('#impact-recipe-output');if(el)el.textContent='Microdatos agregados no disponibles: '+err.message}
}

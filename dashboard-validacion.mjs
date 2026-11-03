// Cuadro de síntesis de errores comprobables. Todos los datos son históricos (23J),
// NO son una validación independiente entre convocatorias electorales.
const q=s=>document.querySelector(s);
const h=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const f=(n,d=2)=>Number(n).toLocaleString('es-ES',{maximumFractionDigits:d,minimumFractionDigits:d});
const parties=['PP','PSOE','VOX','SUMAR'];
export function renderValidationDashboard(){
 return `<section class="audit-home" id="auditoria" aria-labelledby="audit-heading">
 <div class="audit-home-heading"><div><span class="impact-kicker">04 / AUDITORÍA · ERROR OBSERVADO</span><h2 id="audit-heading">¿Cuánto se equivocaron las estimaciones?</h2><p>Comparaciones con el resultado oficial del <strong>23J de 2023</strong>. No confundimos errores históricos con incertidumbre futura.</p></div><a href="validacion-recetas.html">Evaluar 16 recetas ↗</a></div>
 <div class="audit-home-grid">
 <article class="audit-home-panel"><div class="audit-home-panel-head"><div><small>ENCUESTADORAS</small><h3>Errores publicados frente a las urnas</h3></div><label>Partido <select id="audit-party"><option value="PP">PP</option><option value="PSOE">PSOE</option><option value="VOX">Vox</option><option value="SUMAR">Sumar</option></select></label></div>
 <p>Diferencia firmada en puntos: estimación publicada menos voto obtenido. Solo casas con datos comparables disponibles.</p><div id="audit-houses" class="audit-house-list" aria-live="polite">Cargando errores históricos…</div><p class="audit-small">Cada cifra procede de una encuesta anterior al 23J; no mide la precisión media de la casa en todas las elecciones. Las casas sin cifra para el partido se omiten, no se imputan ceros.</p></article>
 <article class="audit-home-panel"><div class="audit-home-panel-head"><div><small>COCINA DE MICRODATOS</small><h3>¿Qué procedimiento se acercó más al resultado?</h3></div><label>Estudio <select id="audit-study"><option value="3411">CIS 3411</option><option value="3415">CIS 3415</option></select></label></div>
 <p>MAE: media de los errores absolutos de PP, PSOE, Vox y Sumar. Se comparan métodos del mismo estudio, no elecciones distintas.</p><div id="audit-recipes" class="audit-recipe-list" aria-live="polite">Cargando auditoría CIS…</div><p class="audit-small">Solo dos encuestas de una misma elección. La diferencia puede incluir cambios de denominador y reglas; no demuestra ventaja predictiva fuera de muestra.</p></article>
 </div>
 <div class="audit-home-bridge"><div><small>CONTRASTE CON OTROS MODELOS</small><h3>Investigaciones externas y pruebas del Motor 29N</h3><p><a href="https://elpais.com/espana/elecciones-generales/2026-10-18/que-encuestas-aciertan-mas-compara-los-errores-y-los-sesgos-de-cada-encuestadora.html" target="_blank" rel="noopener">Llaneras y Andrino · precisión y sesgos ↗</a> · <a href="https://elpais.com/espana/elecciones-generales/2026-10-11/juntos-o-separados-calcula-como-se-moverian-los-escanos-con-distintas-coaliciones.html" target="_blank" rel="noopener">Simulador de coaliciones ↗</a> · <a href="#encuestas">Todas las referencias ↗</a></p></div><div id="audit-retro" class="audit-retro" aria-live="polite">Buscando retropruebas…</div></div>
 <div class="audit-bottom"><span>La regla para la portada</span><p>Enseñar <b>qué sabemos</b>, <b>qué estamos suponiendo</b> y <b>qué todavía no hemos validado</b>. Para medir capacidad predictiva necesitamos elecciones distintas y pruebas sin consultar previamente su resultado.</p><a href="construye-estimacion.html#comparador-recetas">Comparar dos cocinas ↗</a></div>
 </section>`;
}
export async function bindValidationDashboard(){
 const root=q('#auditoria');if(!root)return;
 try{
  const [forecast,audit]=await Promise.all(['data/modelo/pronostico.json','data/microdatos/auditoria_cocina_23j.json'].map(async uri=>{const r=await fetch(uri,{cache:'no-store'});if(!r.ok)throw Error(uri+': '+r.status);return r.json()}));
  if(!root.isConnected)return;
  const renderHouse=()=>{
   const party=q('#audit-party').value,entries=Object.entries(forecast.error_23j||{}).filter(([_,v])=>Number.isFinite(v[party])).sort(([a],[b])=>a.localeCompare(b,'es'));
   q('#audit-houses').innerHTML=entries.length?entries.map(([name,values])=>{
    const value=values[party],abs=Math.abs(value),bar=Math.min(100,abs/6*100);
    return `<div class="audit-row"><span>${h(name)}</span><div class="audit-track" role="img" aria-label="Desviación de ${h(name)}: ${f(value)} puntos"><i style="width:${bar}%;background:${value>=0?'#c69153':'#60a7ae'}"></i></div><b>${value>0?'+':''}${f(value)} pp</b></div>`;
   }).join(''):'<p>Sin datos históricos para este partido.</p>';
  };
  const methods=[['decided','Solo decididos'],['sympathy_decided','Voto + simpatía'],['turnout_decided','Participación declarada'],['published_cis','CIS publicado']];
  const renderRecipes=()=>{
   const id=q('#audit-study').value,results=audit.resultados_por_estudio?.[id]||{};
   q('#audit-recipes').innerHTML=methods.map(([key,label])=>{
    const v=results[key]?.mae_pp;
    return `<div class="audit-row"><span>${h(label)}</span><div class="audit-track" aria-hidden="true"><i style="width:${Number.isFinite(v)?Math.min(100,v/5*100):0}%;background:#528a6f"></i></div><b>${Number.isFinite(v)?f(v)+' pp':'—'}</b></div>`;
   }).join('');
  };
  q('#audit-party').addEventListener('change',renderHouse);
  q('#audit-study').addEventListener('change',renderRecipes);
  renderHouse();renderRecipes();
  const retro=forecast.retroprueba_23j||{},variants=[['consenso_privadas','Privadas'],['consenso_todas','Todas las casas']];
  q('#audit-retro').innerHTML='<small>RETROPRUEBA EXPLORATORIA DEL MOTOR 29N · 23J</small>'+variants.map(([key,label])=>{
   const errors=retro[key],nums=parties.map(p=>errors?.[p]).filter(Number.isFinite),mean=nums.length===parties.length?nums.reduce((a,v)=>a+Math.abs(v),0)/nums.length:null;
   return `<div class="audit-retro-row"><span>${label}</span><b>${mean===null?'—':f(mean)+' pp'}</b></div>`;
  }).join('')+'<p>MAE en cuatro partidos. Reconstrucción histórica, <b>no prueba independiente del modelo vigente</b>.</p>';
 }catch(error){
  for(const id of ['#audit-houses','#audit-recipes','#audit-retro']){const x=q(id);if(x)x.textContent='Datos de evaluación no disponibles: '+error.message}
 }
}

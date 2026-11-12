// Cocina propia del Observatorio sobre microdatos del CIS y su validación frente al 23J.
// Lee agregados publicados por scripts/cocina_cis.py; no contiene ni recibe entrevistas individuales.
const h=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const f=(v,d=1)=>Number.isFinite(v)?v.toLocaleString('es-ES',{minimumFractionDigits:d,maximumFractionDigits:d}):'—';
const sg=(v,d=1)=>Number.isFinite(v)?(v>0?'+':v<0?'−':'±')+f(Math.abs(v),d):'—';
const P=[['PP','PP'],['PSOE','PSOE'],['VOX','Vox'],['SUMAR','Sumar'],['PODEMOS','Podemos']];
export function renderCocinaPropia(){
 return `<section class="panel cocina-propia" id="cocina-propia" aria-labelledby="cp-h"><span class="eyebrow">Cocina propia · microdatos individuales</span><h2 id="cp-h">Cocinamos el CIS y comprobamos si acierta</h2>
 <p>Aplicamos a las entrevistas originales del CIS una receta explícita, paso a paso, y la sometemos a examen: la misma receta, sin tocar ni un parámetro, sobre los dos estudios del CIS previos al 23J, comparada con el resultado oficial.</p>
 <div id="cp-pasos">Cargando…</div><div id="cp-validacion">Cargando…</div></section>`;
}
export function tablaPasos(d){
 const rows=d.pasos.map(p=>`<tr><th scope="row">${h(p.titulo)}<small>${h(p.regla)}</small></th>${P.map(([k])=>`<td>${f(p.estimacion[k])}${p.variacion_pp?`<small>${sg(p.variacion_pp[k])}</small>`:''}</td>`).join('')}</tr>`).join('');
 const rec=d.pasos.find(p=>p.id==='recuerdo');
 const recTxt=rec?`<p class="muted">Recuerdo de voto entre quienes dicen haber votado: PSOE ${f(rec.recuerdo_muestra_pct.PSOE)} % y PP ${f(rec.recuerdo_muestra_pct.PP)} % en la muestra, frente a ${f(rec.resultado_oficial_pct.PSOE)} % y ${f(rec.resultado_oficial_pct.PP)} % en el resultado oficial. Factores de calibración: PSOE ${f(rec.factores.PSOE,2)}, PP ${f(rec.factores.PP,2)}, Vox ${f(rec.factores.VOX,2)}.</p>`:'';
 return `<div class="table-wrap"><table><caption>CIS ${h(d.estudio)} · % sobre voto válido · bajo cada cifra, cambio respecto al paso anterior</caption><thead><tr><th>Paso (acumulativo)</th>${P.map(([,l])=>`<th>${l}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div>${recTxt}<p class="muted">n efectivo final: ${f(d.resultado.n_efectivo,0)}. ${h(d.naturaleza)}</p>`;
}
// Comparación retrospectiva calculada de las DOS oleadas de una misma elección.
// No son dos elecciones independientes ni una prueba fuera de muestra del Motor 29N.
export function graficoValidacionMicrodatos(v){
 const studies=['3411','3415'];
 const keys=['directa','peso','simpatia','recuerdo','indecisos','participacion','cis_publicado'];
 const names={directa:'Intención directa',peso:'Ponderación CIS',simpatia:'Voto + simpatía',recuerdo:'Calibración recuerdo',indecisos:'Reparto de indecisos',participacion:'Receta completa',cis_publicado:'Estimación CIS publicada'};
 if(v?.eleccion!=='2023-07-23'||!v?.estudios)throw Error('Validación electoral de microdatos no disponible');
 const get=(key,study)=>{
  const row=v.estudios[study]?.find(x=>x.paso===key);
  if(!row||!Number.isFinite(row.mae)||row.mae<0)throw Error('MAE inválido en '+study+'/'+key);
  return row.mae;
 };
 const max=Math.max(4,...studies.flatMap(st=>keys.map(k=>get(k,st))));
 const values=keys.map(key=>({key,mean:studies.reduce((z,st)=>z+get(key,st),0)/studies.length}));
 const mean=key=>values.find(x=>x.key===key).mean;
 const result=mean('participacion')-mean('directa');
 return `<figure class="cp-validacion-visual" aria-label="Errores históricos de los siete tratamientos sobre dos estudios CIS del 23J">
  <figcaption><b>¿Qué añade realmente cada paso?</b><span>MAE sobre PP, PSOE, Vox y Sumar · menor es mejor</span></figcaption>
  <div class="cp-v-legend"><span><i class="cp-v-one"></i>CIS 3411 (junio)</span><span><i class="cp-v-two"></i>CIS 3415 (julio)</span></div>
  <ol class="cp-v-rows">${values.map(({key,mean:m})=>`<li class="cp-v-row${key==='participacion'?' cp-v-full':''}">
   <span class="cp-v-label">${h(names[key])}</span>
   <div class="cp-v-bars">${studies.map((st,i)=>`<div class="cp-v-bar" title="CIS ${st}: ${f(get(key,st),2)} puntos de error"><span class="cp-v-fill cp-v-fill-${i+1}" style="width:${(get(key,st)/max*100).toFixed(2)}%"></span></div>`).join('')}</div>
   <strong>${f(m,2)} pp</strong>
  </li>`).join('')}</ol>
  <p class="cp-v-result"><b>Receta completa: +${f(result,2)} pp de error</b> respecto a la intención directa sin ponderar. El signo positivo representa un empeoramiento.</p>
  <p class="muted">Dos oleadas del CIS y <b>una sola elección</b>: no permiten seleccionar una receta para 2026 por su aparente acierto en 2023. Las filas representan pasos acumulativos, no efectos causales aislados. Los porcentajes individuales de error y sus signos están en la tabla completa.</p>
 </figure>`;
}
export function tablaValidacion(v){
 const etiquetas={directa:'Intención directa sin ponderar',peso:'+ peso del CIS',simpatia:'+ voto y simpatía',recuerdo:'+ calibración por recuerdo',indecisos:'+ indecisos por recuerdo',participacion:'Receta completa (+ probabilidad de votar)',cis_publicado:'Estimación publicada por el CIS'};
 const pasos=v.estudios['3411'].map(x=>x.paso);
 const rows=pasos.map(p=>`<tr${p==='participacion'?' class="ref"':''}><th scope="row">${h(etiquetas[p]||p)}</th>${['3411','3415'].map(e=>{const x=v.estudios[e].find(y=>y.paso===p);return `<td><b>${f(x.mae,2)}</b><small>PSOE ${sg(x.error.PSOE)} · PP ${sg(x.error.PP)} · Vox ${sg(x.error.VOX)}</small></td>`;}).join('')}</tr>`).join('');
 return `<h3>Examen frente al 23J</h3>${graficoValidacionMicrodatos(v)}<div class="table-wrap"><table><caption>Error absoluto medio (MAE, puntos) de PP, PSOE, Vox y Sumar frente al resultado oficial. Debajo, error firmado: estimación − resultado.</caption><thead><tr><th>Procedimiento</th><th>CIS 3411 (junio 2023)</th><th>CIS 3415 (julio 2023)</th></tr></thead><tbody>${rows}</tbody></table></div>
 <div class="notice"><b>Veredicto.</b> ${h(v.veredicto)}</div><p class="muted">${h(v.limites.join(' '))}</p>`;
}
export async function bindCocinaPropia(){
 const a=document.querySelector('#cp-pasos'),b=document.querySelector('#cp-validacion');if(!a)return;
 try{const r=await fetch('data/microdatos/cocina_cis_3582.json',{cache:'no-store'});if(!r.ok)throw Error('HTTP '+r.status);a.innerHTML=tablaPasos(await r.json());}catch(e){a.textContent='Receta no disponible: '+e.message;}
 try{const r=await fetch('data/microdatos/validacion_cocina_cis.json',{cache:'no-store'});if(!r.ok)throw Error('HTTP '+r.status);b.innerHTML=tablaValidacion(await r.json());}catch(e){b.textContent='Validación no disponible: '+e.message;}
}

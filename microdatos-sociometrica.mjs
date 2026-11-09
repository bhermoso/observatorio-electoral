/* 4 SAV reales de SocioMétrica 2025. Únicamente agregados no ponderados (n>=20). */
const SRC='data/microdatos/sociometrica-2025-agregados.json';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>Number(n).toLocaleString('es-ES',{minimumFractionDigits:2,maximumFractionDigits:2});
const orden=['PP','PSOE','VOX','Sumar','Podemos'];
export function renderSocioMetrica(){
 return `<section class="sm-research" id="sociometrica-microdatos" aria-labelledby="sociometrica-title">
 <header class="sm-head"><div>
 <span class="eyebrow">Comparación entre casas · SocioMétrica / EL ESPAÑOL · 2025</span>
 <h2 id="sociometrica-title">SocioMétrica: cuatro bases originales, sin confundir respuesta y estimación</h2>
 <p>Se han leído los registros SAV de mayo, junio, julio y septiembre. Se presentan respuestas directas sin ponderar; no son una predicción de voto válido.</p>
 </div><a href="${SRC}" download>Metadatos y agregados verificables ↓</a></header>
 <div id="sm-research-result" aria-live="polite">Cargando agregados auditados…</div>
 </section>`;
}
export async function bindSocioMetrica(){
 const root=document.querySelector('#sm-research-result');if(!root)return;
 try{
  const resp=await fetch(SRC,{cache:'no-store'});if(!resp.ok)throw Error('HTTP '+resp.status);
  const d=await resp.json();if(!root.isConnected)return;
  if(d.esquema!==1||d.estudios?.length!==4||d.estudios.reduce((n,x)=>n+x.n_filas_sav,0)!==4383)throw Error('Agregados incompletos');
  const studies=[...d.estudios].sort((a,b)=>b.id.localeCompare(a.id));
  const get=(s,k)=>s.partidos_y_categorias_n_20.find(x=>x.etiqueta.toLocaleLowerCase('es')===k.toLocaleLowerCase('es'))?.pct_muestra;
  const cols=studies.map(s=>({s,name:s.id.includes('05-27')?'Mayo':s.id.includes('06-23')?'Junio':s.id.includes('07-28')?'Julio':'Septiembre'}));
  const body=orden.map(p=>`<tr><th scope="row">${esc(p)}</th>${cols.map(({s})=>`<td>${get(s,p)===undefined?'—':fmt(get(s,p))+' %'}</td>`).join('')}</tr>`).join('');
  root.innerHTML=`<p class="sm-summary"><strong>4.383 registros originales</strong> entre cuatro estudios; los publicados suman 4.350 entrevistas. Hay diferencias de tamaño en mayo (+34) y septiembre (−1), cuya causa no se ha establecido. En los cuatro SAV no se identificó un ponderador en nombres o etiquetas.</p>
  <div class="table-wrap"><table class="sm-table"><caption>Intención directa por partido, <strong>sin ponderar</strong>, sobre todas las entrevistas de cada SAV. No es una estimación electoral; n de algunas categorías pequeñas no se divulga.</caption>
  <thead><tr><th>Partido</th>${cols.map(({name,s})=>`<th>${esc(name)}<small>n = ${s.n_filas_sav.toLocaleString('es-ES')}</small></th>`).join('')}</tr></thead>
  <tbody>${body}</tbody></table></div>
  <p class="sm-warning"><strong>Interpretación:</strong> los porcentajes incluyen abstencionistas e indecisos en el denominador. Las diferencias entre olas pueden reflejar cambios de muestra o cuestionario. SocioMétrica declara utilizar correcciones basadas en recuerdo del 23J, pero los cuatro archivos no muestran un campo identificable de ponderación; no es posible reproducir aún su receta final.</p>
  <details class="sm-source"><summary>Descargas, variables y trazabilidad</summary>
   <div class="table-wrap"><table><thead><tr><th>Ola</th><th>Variable</th><th>n comunicado</th><th>n SAV</th><th>Hash y origen</th></tr></thead><tbody>
   ${cols.map(({name,s})=>`<tr><td>${esc(name)}</td><td><code>${esc(s.pregunta)}</code></td><td>${s.n_publicado}</td><td>${s.n_filas_sav}</td><td><a href="${esc(s.url_original)}" target="_blank" rel="noopener noreferrer">SAV original ↗</a><small>SHA-256: <code>${esc(s.sha256_original)}</code></small></td></tr>`).join('')}</tbody></table></div>
   <p>Los archivos individuales no se incorporan a GitHub. <a href="docs/archivo-microdatos.md">Método y límites ↗</a> · <a href="${SRC}">JSON de auditoría ↗</a></p></details>`;
 }catch(err){if(root.isConnected)root.textContent='No se han podido cargar los agregados de SocioMétrica: '+err.message;}
}

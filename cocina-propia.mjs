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
export function tablaValidacion(v){
 const etiquetas={directa:'Intención directa sin ponderar',peso:'+ peso del CIS',simpatia:'+ voto y simpatía',recuerdo:'+ calibración por recuerdo',indecisos:'+ indecisos por recuerdo',participacion:'Receta completa (+ probabilidad de votar)',cis_publicado:'Estimación publicada por el CIS'};
 const pasos=v.estudios['3411'].map(x=>x.paso);
 const rows=pasos.map(p=>`<tr${p==='participacion'?' class="ref"':''}><th scope="row">${h(etiquetas[p]||p)}</th>${['3411','3415'].map(e=>{const x=v.estudios[e].find(y=>y.paso===p);return `<td><b>${f(x.mae,2)}</b><small>PSOE ${sg(x.error.PSOE)} · PP ${sg(x.error.PP)} · Vox ${sg(x.error.VOX)}</small></td>`;}).join('')}</tr>`).join('');
 return `<h3>Examen frente al 23J</h3><div class="table-wrap"><table><caption>Error absoluto medio (MAE, puntos) de PP, PSOE, Vox y Sumar frente al resultado oficial. Debajo, error firmado: estimación − resultado.</caption><thead><tr><th>Procedimiento</th><th>CIS 3411 (junio 2023)</th><th>CIS 3415 (julio 2023)</th></tr></thead><tbody>${rows}</tbody></table></div>
 <div class="notice"><b>Veredicto.</b> ${h(v.veredicto)}</div><p class="muted">${h(v.limites.join(' '))}</p>`;
}
export async function bindCocinaPropia(){
 const a=document.querySelector('#cp-pasos'),b=document.querySelector('#cp-validacion');if(!a)return;
 try{const r=await fetch('data/microdatos/cocina_cis_3582.json',{cache:'no-store'});if(!r.ok)throw Error('HTTP '+r.status);a.innerHTML=tablaPasos(await r.json());}catch(e){a.textContent='Receta no disponible: '+e.message;}
 try{const r=await fetch('data/microdatos/validacion_cocina_cis.json',{cache:'no-store'});if(!r.ok)throw Error('HTTP '+r.status);b.innerHTML=tablaValidacion(await r.json());}catch(e){b.textContent='Validación no disponible: '+e.message;}
}

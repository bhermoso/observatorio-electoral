/** Vista de agregados auditados; los ZIP originales no se sirven ni se almacenan aquí. */
const e=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const nf=n=>Number(n).toLocaleString('es-ES',{minimumFractionDigits:1,maximumFractionDigits:1});
const H='data/microdatos/40db-auditoria-2026.json';
const LABELS={directa:'Intención directa ponderada entre votos válidos declarados',recuerdo:'Calibración experimental del recuerdo de 2023'};
export function renderMicrodatos40db(){
 return `<section class="micro40db" id="microdatos-40db" aria-labelledby="micro40db-title">
  <header class="micro40db-head"><div><span class="eyebrow">Investigación propia · microdatos contrastados · 2026</span>
   <h2 id="micro40db-title">40dB: de 4.800 entrevistas a la estimación publicada</h2>
   <p>Primera reconstrucción sobre respuestas individuales reales de tres encuestas. El archivo original no se publica aquí: solo agregados, método y huellas digitales.</p></div>
   <a href="data/microdatos/40db-auditoria-2026.json" download>Ver datos agregados y procedencia ↓</a>
  </header>
  <div class="micro40db-controls"><label for="micro40db-receta">Comparar procedimiento
   <select id="micro40db-receta"><option value="directa">Solo ponderación original y voto válido declarado</option>
   <option value="recuerdo">Añadir calibración experimental completa del recuerdo 2023</option></select>
  </label><span class="micro40db-state">Estimación publicada ≠ voto directo ≠ resultado electoral</span></div>
  <div id="micro40db-output" aria-live="polite"><p class="muted">Cargando resultados agregados verificados…</p></div>
 </section>`;
}
export async function bindMicrodatos40db(){
 const root=document.getElementById('micro40db-output'),control=document.getElementById('micro40db-receta');
 if(!root||!control)return;
 try{
  const r=await fetch(H,{cache:'no-store'});
  if(!r.ok)throw new Error('HTTP '+r.status);
  const d=await r.json();
  if(!root.isConnected)return;
  if(d.esquema!==1||d.tipo!=='auditoria_agregada_de_microdatos_40db'||d.olas?.length!==3||d.olas.reduce((n,o)=>n+o.entrevistas,0)!==4800)throw new Error('Agregados incoherentes');
  const cols=['PP','PSOE','VOX','SUMAR'];
  const total=d.olas.reduce((n,o)=>n+o.entrevistas,0);
  function draw(){
   const key=control.value==='recuerdo'?'recuerdo_calibrado':'directa';
   root.innerHTML=`<div class="micro40db-summary"><b>${total.toLocaleString('es-ES')} entrevistas analizadas</b> · Tres olas documentadas · Recuerdo, simpatía, participación y ponderador <code>ponde</code> verificados en la matriz</div>
   <div class="table-wrap"><table class="micro40db-matrix">
    <caption>${e(LABELS[control.value])}. Porcentajes sobre votos válidos. La estimación publicada es referencia documental, no verdad electoral.</caption>
    <thead><tr><th>Encuesta</th><th>Partido</th><th>Procedimiento probado</th><th>40dB publicado</th><th>Diferencia</th></tr></thead>
    <tbody>${d.olas.map(ola=>cols.map((p,i)=>`<tr${i===0?' class="micro40db-first"':''}>
      <th scope="row">${i===0?`<b>${e(ola.titulo)}</b><small>${ola.entrevistas.toLocaleString('es-ES')} entrevistas</small>`:''}</th>
      <td>${e(p==='SUMAR'?'Sumar':p==='VOX'?'Vox':p)}</td><td><strong>${nf(ola[key][p])} %</strong></td>
      <td>${nf(ola.estimacion_publicada[p])} %</td>
      <td>${(ola[key][p]-ola.estimacion_publicada[p]>0?'+':'')+nf(ola[key][p]-ola.estimacion_publicada[p])} pp</td>
      </tr>`).join('')).join('')}</tbody></table></div>
   <p class="micro40db-note"><strong>Qué prueba este contraste:</strong> la ponderación demográfica y el cambio de denominador no reproducen la cifra publicada. La calibración de recuerdo usa resultados del 23J solo como experimento; no demuestra que 40dB la aplique ni que mejore la predicción. Las distancias de esta tabla <strong>no son errores electorales</strong>.</p>
   <div class="micro40db-bottom"><p><strong>Escenario de candidatura unitaria (flash):</strong> 6,05 % de intención directa ponderada para Sumar/Frente Amplio y Podemos separados, frente a 8,34 % para una candidatura conjunta en respuestas a la misma muestra. No debe extrapolarse automáticamente a una elección.</p>
   <p><strong>Próxima validación:</strong> microdatos 40dB anteriores al 23J de 2023, con resultado electoral posterior disponible. <a href="${e(d.microdatos_2023_fuente_potencial)}" target="_blank" rel="noopener noreferrer">Consultar original 2023 ↗</a></p></div>
   <details class="micro40db-provenance"><summary>Fuentes, hashes y variables auditadas</summary>
   <div class="table-wrap"><table><thead><tr><th>Ola</th><th>Trabajo de campo</th><th>n efectivo</th><th>Preguntas</th><th>Descarga</th></tr></thead><tbody>${d.olas.map(o=>`<tr><td>${e(o.titulo)}</td><td>${e(o.campo)}</td><td>${nf(o.efectivo_kish)}</td><td>Intención ${e(o.intencion)} · simpatía ${e(o.simpatia)} · recuerdo ${e(o.recuerdo)} · participación ${e(o.participacion)}</td><td><a href="${e(o.zip)}" target="_blank" rel="noopener noreferrer">ZIP original ↗</a><small>SHA-256: <code>${e(o.sha256)}</code></small></td></tr>`).join('')}</tbody></table></div>
   </details>`;
  }
  control.addEventListener('change',draw);draw();
 }catch(err){if(root.isConnected)root.textContent='No se han podido cargar los resultados de microdatos: '+err.message}
}

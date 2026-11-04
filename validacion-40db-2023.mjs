/** Auditoría retrospectiva sobre tres encuestas de UNA elección: 23J de 2023.
 * Solo agregados (no se publican entrevistas). El resultado no valida un motor prospectivo.
 */
const JSON_URL='data/microdatos/40db-retrospectiva-2023.json';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>Number(n).toLocaleString('es-ES',{minimumFractionDigits:2,maximumFractionDigits:2});
export function renderRetrospectiva40db(){
 return `<section class="validacion40db" id="validacion-40db-23j" aria-labelledby="validacion40db-title">
  <div class="validacion40db-head"><div>
   <span class="eyebrow">Auditoría propia de microdatos · elección general del 23J de 2023</span>
   <h2 id="validacion40db-title">40dB en 2023: ¿qué procedimientos se acercaron al resultado real?</h2>
   <p>4.800 entrevistas anteriores al 23J, agrupadas en tres estudios. Comparación del error medio de PP, PSOE, Vox y Sumar frente al resultado oficial.</p>
  </div><a href="${JSON_URL}" download>Datos de auditoría y hashes ↓</a></div>
  <div class="validacion40db-result" id="validacion40db-result" aria-live="polite">Cargando evaluación retrospectiva…</div>
 </section>`;
}
export async function bindRetrospectiva40db(){
 const root=document.getElementById('validacion40db-result');
 if(!root)return;
 try{
  const res=await fetch(JSON_URL,{cache:'no-store'});if(!res.ok)throw Error('HTTP '+res.status);
  const d=await res.json();if(!root.isConnected)return;
  if(d.schema!==1||d.tipo!=='evaluacion_retrospectiva_exploratoria'||d.estudios?.length!==3||d.estudios.reduce((n,x)=>n+x.n,0)!==4800)throw Error('Auditoría agregada inconsistente');
  const methods=Object.entries(d.metodos);
  if(methods.length!==8||d.estudios.some(s=>s.mae_metodos?.length!==8))throw Error('Lista de recetas incompleta');
  const rows=[{label:'Estimación publicada por 40dB',key:'publicado'},
    ...methods.map(([key,label],index)=>({key,label,index}))];
  const mean=a=>a.reduce((x,y)=>x+y,0)/a.length;
  root.innerHTML=`<p class="validacion40db-lead"><strong>Hallazgo:</strong> la estimación publicada por 40dB tiene menor error que la directa ponderada en los tres estudios. En cambio, el ajuste parcial por recuerdo de 2019 aumenta el error en todos. Esto no identifica cómo cocina 40dB ni avala cambiar nuestro motor.</p>
   <div class="table-wrap"><table class="validacion40db-matrix">
    <caption>Error absoluto medio (MAE), puntos porcentuales. Cuanto menor, mejor. Las medias de la última columna son solo descriptivas.</caption>
    <thead><tr><th>Procedimiento</th>${d.estudios.map(s=>`<th>${esc(s.nombre)}<small>n = ${s.n.toLocaleString('es-ES')}</small></th>`).join('')}<th>Media de las tres</th></tr></thead>
    <tbody>${rows.map(m=>{
     const nums=d.estudios.map(s=>m.key==='publicado'?s.mae_publicado:s.mae_metodos[m.index]);
     return `<tr${m.key==='publicado'?' class="validacion40db-reference"':''}><th scope="row">${esc(m.label)}</th>${nums.map(v=>`<td>${fmt(v)}</td>`).join('')}<td><strong>${fmt(mean(nums))}</strong></td></tr>`;
    }).join('')}</tbody></table></div>
   <div class="validacion40db-notes">
    <p><strong>Cómo se ha calculado:</strong> intención de voto y `ponde` de los archivos originales; voto válido declarado como denominador (incluye voto blanco). Se comparan PP, PSOE+PSC, Vox y Sumar con el escrutinio definitivo del 23J. La propensión declarada, la simpatía y el ajuste del recuerdo son recetas experimentales nuestras, no técnicas atribuidas al instituto.</p>
    <p><strong>Límite esencial:</strong> las tres encuestas predicen <em>la misma elección</em>, con campo entre mayo y junio. No son tres validaciones independientes y parte de la distancia al 23J puede ser cambio real de opinión durante la campaña. Se midió el error retrospectivamente, sin validación fuera de muestra.</p>
   </div>
   <details class="validacion40db-provenance"><summary>Protocolo y trazabilidad de los originales</summary><div class="table-wrap">
   <table><thead><tr><th>Encuesta</th><th>Campo</th><th>Variables originales</th><th>SHA-256 del ZIP aportado</th></tr></thead><tbody>${d.estudios.map(s=>`<tr><td>${esc(s.nombre)}</td><td>${esc(s.campo)}</td><td>Voto ${esc(s.preguntas.voto)}, simpatía ${esc(s.preguntas.simpatia)}, participación ${esc(s.preguntas.participacion)}, recuerdo ${esc(s.preguntas.recuerdo_2019)}</td><td><code>${esc(s.sha256_zip)}</code></td></tr>`).join('')}</tbody></table></div>
   <p>Los archivos individuales no se publican. <a href="docs/alta-cocina-40db.md">Método y límites de la investigación 40dB ↗</a> · <a target="_blank" rel="noopener noreferrer" href="https://www.boe.es/diario_boe/txt.php?id=BOE-A-2023-18907">Resultados definitivos BOE ↗</a>.</p></details>`;
 }catch(err){if(root.isConnected)root.textContent='No se ha podido cargar la evaluación histórica: '+err.message}
}

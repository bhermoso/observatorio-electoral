// Laboratorio de validación: NO modifica ni entrena el Motor 29N.
// Una misma elección, aunque haya varias oleadas, es una sola unidad de validación.
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const format=n=>Number(n).toLocaleString('es-ES',{minimumFractionDigits:2,maximumFractionDigits:2});
export const REGLAS=Object.freeze({
 election:'2023-07-23',partyScope:'PP, PSOE/PSC, Vox, Sumar',
 metric:'MAE en puntos porcentuales, calculado sobre cuatro partidos',
 independentElections:1,
 operational:false,
 condition:'Requiere validación temporal con varias elecciones independientes, reglas predefinidas y comparación contra el motor completo.'
});
export function evaluarRecetas(cis,db){
 if(cis?.eleccion!=='2023-07-23'||db?.eleccion!=='2023-07-23')
  throw Error('La elección de referencia no coincide');
 if(!Array.isArray(cis?.pruebas_seleccion_y_traslado)||cis.pruebas_seleccion_y_traslado.length!==2)
  throw Error('Pruebas CIS incompletas');
 if(!Array.isArray(db?.estudios)||db.estudios.length!==3||!db.metodos)
  throw Error('Pruebas 40dB incompletas');
 const cisTrials=cis.pruebas_seleccion_y_traslado.map(t=>{
  const own=Number(t.error_prueba_mae_pp),base=Number(t.referencia_cis_mae_pp);
  if(!Number.isFinite(own)||!Number.isFinite(base)||own<0||base<0)throw Error('Error CIS inválido');
  return {selection:String(t.seleccion_estudio),test:String(t.evaluacion_estudio),
   method:String(cis.metodos[t.metodo_seleccionado]||t.metodo_seleccionado),error:own,reference:base,difference:own-base};
 });
 const keys=Object.keys(db.metodos);
 const dbTrials=db.estudios.map(st=>{
  if(st.mae_metodos?.length!==keys.length||!Number.isFinite(st.mae_publicado))
   throw Error('Errores 40dB incompletos');
  return {study:st.nombre,n:st.n,reference:st.mae_publicado,
   candidates:keys.map((id,i)=>({id,label:db.metodos[id],error:st.mae_metodos[i],difference:st.mae_metodos[i]-st.mae_publicado}))};
 });
 // Comparaciones descriptivas, no ensayos electorales independientes.
 return {cisTrials,dbTrials,keys,methodLabels:db.metodos,
  elections:1,operational:false,
  conclusion:'Evidencia insuficiente para sustituir o ajustar el Motor 29N: una sola elección observada.'};
}
export function renderEvaluacionMicrodatos(){
 return `<section class="panel evaluacion-microdatos" id="evaluacion-microdatos" aria-labelledby="em-title">
  <div class="evaluacion-microdatos-head"><span class="eyebrow">Laboratorio · comparación reproducible</span>
  <h2 id="em-title">¿Qué recetas se han probado y qué falta validar?</h2>
  <p>Este panel reúne la evidencia histórica ya calculada. Distingue la estimación publicada de cada instituto de nuestras transformaciones experimentales. No produce un nuevo pronóstico.</p></div>
  <div id="em-datos" aria-live="polite">Cargando pruebas documentadas…</div>
  <p class="muted">Protocolos: <a href="docs/alta-cocina-40db.md">40dB</a> ·
  <a href="data/microdatos/auditoria_cocina_23j.json" download>auditoría CIS</a> ·
  <a href="data/microdatos/40db-retrospectiva-2023.json" download>auditoría 40dB</a>.</p>
 </section>`;
}
export function tablaEvaluacionMicrodatos(d){
 const cis=d.cisTrials.map(t=>`<tr><th scope="row">${escape(t.selection)} → ${escape(t.test)}</th><td>${escape(t.method)}</td><td class="num">${format(t.error)}</td><td class="num">${format(t.reference)}</td><td class="num">${t.difference>0?'+':''}${format(t.difference)}</td></tr>`).join('');
 const metas=d.keys.map((key,i)=>{
  const dif=d.dbTrials.map(s=>s.candidates[i].difference);
  const mean=dif.reduce((a,b)=>a+b,0)/dif.length;
  return {id:key,label:d.methodLabels[key],dif,mean};
 });
 const db=metas.map(x=>`<tr><th scope="row">${escape(x.label)}</th>${x.dif.map(v=>`<td class="num">${v>0?'+':''}${format(v)}</td>`).join('')}<td class="num">${x.mean>0?'+':''}${format(x.mean)}</td></tr>`).join('');
 return `<div class="evaluacion-microdatos-resumen">
  <p><strong>1 elección independiente</strong><span>23J de 2023. Las cinco oleadas analizadas no equivalen a cinco elecciones.</span></p>
  <p><strong>0 recetas incorporadas</strong><span>Los resultados experimentales no alimentan el pronóstico operativo.</span></p>
 </div>
 <h3>Prueba CIS: seleccionar en una oleada y comprobar en otra</h3>
 <p>MAE de cuatro partidos. Diferencia positiva: mayor error que la estimación CIS publicada. Ambos estudios corresponden a la misma elección.</p>
 <div class="table-wrap"><table><thead><tr><th>Selección → prueba</th><th>Procedimiento</th><th class="num">MAE prueba</th><th class="num">MAE CIS</th><th class="num">Diferencia</th></tr></thead><tbody>${cis}</tbody></table></div>
 <h3>40dB: distancia de cada receta a la estimación publicada</h3>
 <p>Variación del MAE (pp) frente a la estimación 40dB en cada estudio. Negativo: menor error descriptivo; positivo: mayor. La media no es una validación independiente.</p>
 <div class="table-wrap"><table><thead><tr><th>Procedimiento</th>${d.dbTrials.map(x=>`<th class="num">${escape(x.study)}</th>`).join('')}<th class="num">Media descriptiva</th></tr></thead><tbody>${db}</tbody></table></div>
 <p class="evaluacion-microdatos-limite"><strong>Conclusión metodológica:</strong> ${escape(d.conclusion)} El estudio del efecto de recuerdo, simpatía, indecisión y participación es necesario, pero sin nuevas elecciones comparables no se puede establecer que una receta mejora el modelo completo ni asignar pesos predictivos fiables.</p>`;
}
export async function bindEvaluacionMicrodatos(){
 const box=document.querySelector('#em-datos');if(!box)return;
 try{
  const paths=['data/microdatos/auditoria_cocina_23j.json','data/microdatos/40db-retrospectiva-2023.json'];
  const [cis,db]=await Promise.all(paths.map(async url=>{const r=await fetch(url,{cache:'no-store'});if(!r.ok)throw Error(url+' · HTTP '+r.status);return r.json()}));
  if(box.isConnected)box.innerHTML=tablaEvaluacionMicrodatos(evaluarRecetas(cis,db));
 }catch(e){if(box.isConnected)box.textContent='No se puede evaluar: '+e.message;}
}

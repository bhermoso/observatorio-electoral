// Primer contraste histórico de recetas en dos convocatorias de 2019.
// Reutiliza el motor de comparación existente; no reentrena el Motor 29N.
import {retrospective2019,OFFICIAL_2019,METHODS_2019,PARTIES_2019} from './validacion-2019-retrospectiva.mjs';

const fmt=(v,d=2)=>Number.isFinite(v)?v.toLocaleString('es-ES',{minimumFractionDigits:d,maximumFractionDigits:d}):'—';
const signed=v=>(v>0?'+':v<0?'−':'±')+fmt(Math.abs(v));
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function renderEvaluacion2019(){
 return '<section id="evaluacion-2019" class="historical-2019" aria-labelledby="historical-2019-title">'+
  '<header class="historical-2019-head"><div><span class="eyebrow">Contraste de microdatos históricos · método constante</span>'+
  '<h3 id="historical-2019-title">Abril y noviembre de 2019: ¿mejora la misma receta en ambas?</h3>'+
  '<p>Cuatro formas de tratar la indecisión explícita (código 94), evaluadas frente al voto válido oficial (candidaturas + blanco) de cuatro partidos comparables.</p></div>'+
  '<a href="validacion-recetas.html#vh-2019-retro">Auditoría y datos de origen ↗</a></header>'+
  '<div id="historical-2019-data" aria-live="polite"><p class="muted">Cargando el contraste histórico de microdatos…</p></div>'+
  '</section>';
}
export function renderResultados2019(datos){
 if(!datos?.studies?.['3242']||!datos?.studies?.['3263'])throw Error('No están los dos estudios CIS de 2019');
 const result=retrospective2019(datos);
 if(result.distinctElectionsRetrospective!==2||result.independentProspectiveTests!==0||result.rows.length!==4)
   throw Error('La cobertura histórica no coincide con la documentada');
 for(const r of result.rows)for(const x of r.studies){
  if(!Number.isFinite(x.mae)||x.metrics.length!==4||x.metrics.some(m=>!Number.isFinite(m.error_pp)))
   throw Error('Inconsistencia en errores históricos');
 }
 const base=result.rows.find(r=>r.method==='exclude');
 const sympathy=result.rows.find(r=>r.method==='sympathy');
 if(!base||!sympathy)throw Error('Faltan las dos recetas de referencia');
 const april=sympathy.studies[0].mae-base.studies[0].mae;
 const nov=sympathy.studies[1].mae-base.studies[1].mae;
 const methodRows=result.rows.map(row=>'<tr><th scope="row">'+escape(row.label)+'</th>'+
  row.studies.map(study=>'<td><div class="historical-2019-measure">'+
   '<span class="historical-2019-bar" aria-hidden="true"><i style="width:'+Math.min(100,Math.max(0,study.mae/8*100)).toFixed(1)+'%"></i></span>'+
   '<b>'+fmt(study.mae)+' pp</b></div></td>').join('')+'</tr>').join('');
 const rows=PARTIES_2019.flatMap(p=>['3242','3263'].map((id,i)=>{
  const b=base.studies[i].metrics.find(m=>m.party===p);
  const s=sympathy.studies[i].metrics.find(m=>m.party===p);
  return '<tr><th scope="row">'+escape(p)+'</th><td>'+ (i===0?'28-A':'10-N') +'</td>'+
   '<td>'+signed(b.error_pp)+' pp</td><td>'+signed(s.error_pp)+' pp</td>'+
   '<td>'+signed(Math.abs(s.error_pp)-Math.abs(b.error_pp))+' pp</td></tr>';
 })).join('');
 return '<div class="historical-2019-summary">'+
  '<p><strong>Dos elecciones históricas estudiadas</strong> · 0 pruebas prospectivas de receta validadas</p>'+
  '<p>La imputación mediante VOTOSIMG cambia el MAE frente a no imputar: <b>abril '+signed(april)+' pp</b>; <b>noviembre '+signed(nov)+' pp</b>. La mejora de abril no se reproduce en noviembre.</p>'+
  '</div><div class="table-wrap historical-2019-matrix"><table>'+
  '<caption>Error medio absoluto por tratamiento (PP, PSOE, Vox y Ciudadanos; puntos porcentuales)</caption>'+
  '<thead><tr><th scope="col">Tratamiento</th><th scope="col">28-A 2019 · CIS 3242</th>'+
  '<th scope="col">10-N 2019 · CIS 3263</th></tr></thead><tbody>'+methodRows+'</tbody></table></div>'+
  '<details class="historical-2019-detail"><summary>Desglosar errores por partido y consultar los resultados oficiales</summary>'+
  '<p>Errores firmados: estimación menos escrutinio oficial; cambio positivo de error absoluto indica peor resultado. Denominador: candidaturas + voto blanco; no incluye nulos ni abstención.</p>'+
  '<div class="table-wrap"><table><thead><tr><th>Partido</th><th>Elección</th><th>Sin imputar</th>'+
  '<th>VOTOSIMG identificable</th><th>Variación de error absoluto</th></tr></thead><tbody>'+rows+'</tbody></table></div>'+
  '<p>Escrutinios oficiales: <a href="'+escape(OFFICIAL_2019['3242'].source)+'" target="_blank" rel="noopener">28-A (BOE) ↗</a> · '+
  '<a href="'+escape(OFFICIAL_2019['3263'].source)+'" target="_blank" rel="noopener">10-N (BOE) ↗</a>.</p>'+
  '</details><p class="historical-2019-limit"><b>Alcance:</b> el denominador estimado incluye el voto en blanco. Tratamientos retrospectivos sobre agregados CIS; se imputan solo los indecisos explícitos (94), no los códigos 98/99. No se verificó la equivalencia completa de todas las candidaturas ni se simulan escaños. Los métodos se han examinado con resultados históricos ya conocidos: <b>no validan prospectivamente ninguna corrección del Motor 29N.</b></p>';
}
export async function bindEvaluacion2019(){
 const root=document.querySelector('#historical-2019-data');if(!root)return;
 try{
  const response=await fetch('data/microdatos/diagnostico_2019_original.json',{cache:'no-store'});
  if(!response.ok)throw Error('No disponible, HTTP '+response.status);
  const data=await response.json();
  if(root.isConnected)root.innerHTML=renderResultados2019(data);
 }catch(e){
  if(root.isConnected)root.innerHTML='<p role="alert">No se pudo cargar el contraste histórico: '+escape(e.message)+'</p>';
 }
}

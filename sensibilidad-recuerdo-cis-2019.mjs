// Sensibilidad retrospectiva 2019 con calibración parcial y escenarios territoriales.
// No selecciona un parámetro para el Motor 29N ni valida causalidad territorial.
const h=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const f=x=>Number(x).toLocaleString('es-ES',{minimumFractionDigits:2,maximumFractionDigits:2});
const STEPS=[['sin_calibracion','0 %'],['calibracion_25','25 %'],['calibracion_50','50 %'],['calibracion_75','75 %'],['calibracion_100','100 %']];
const LIMITS=[['limite_05_2','Factores entre 0,5 y 2'],['limite_075_15','Factores entre 0,75 y 1,5'],['solo_pp_psoe_vox_cs','Solo recuerdo de PP, PSOE, Vox y Cs'],['cuatro_mas_up','Cuatro partidos + Unidas Podemos'],['cuatro_mas_otros','Cuatro partidos + residual Otros']];
export function validarSensibilidad2019(d){
 if(d?.esquema!==1||d.estado!=='EXPERIMENTAL_NO_ADMITIR'||d.estudios?.length!==2||d.estudios.map(s=>s.id).join(',')!=='3242,3263')throw Error('Datos de sensibilidad no autorizados');
 for(const e of d.estudios){
  if(!/^[a-f0-9]{64}$/.test(e.sha256_zip)||e.n<16000)throw Error('Origen CIS sin verificar');
  for(const [key] of [...STEPS,...LIMITS]){
   const v=e.escenarios?.[key]?.mae_pp;
   if(!Number.isFinite(v)||v<0||v>100)throw Error('Escenario ausente o inválido: '+e.id+'/'+key);
  }
 }
 return d.estudios;
}
export function renderSensibilidad2019(){
 return '<section class="panel" id="cocina-sensibilidad-2019"><span class="eyebrow">Auditoría · sensibilidad del recuerdo</span><h2>¿Cuánto cambia el error según la intensidad de calibración?</h2><p>Prueba histórica con los ZIP originales del CIS 3242 y 3263, comparando los mismos cuatro partidos y manteniendo constantes los demás tratamientos.</p><div id="cocina-sensibilidad-2019-tabla" aria-live="polite">Calculando tabla de sensibilidad…</div></section>';
}
export function tablaSensibilidad2019(d){
 const [abril,nov]=validarSensibilidad2019(d);
 const cell=(s,k)=>f(s.escenarios[k].mae_pp)+' pp';
 const changes=STEPS.map(([k,label])=>'<tr><th scope="row">'+h(label)+'</th><td>'+cell(abril,k)+'</td><td>'+cell(nov,k)+'</td></tr>').join('');
 const more=LIMITS.map(([k,label])=>'<tr><th scope="row">'+h(label)+'</th><td>'+cell(abril,k)+'</td><td>'+cell(nov,k)+'</td></tr>').join('');
 const diffs=[abril,nov].map(s=>s.escenarios.solo_pp_psoe_vox_cs.mae_pp-s.escenarios.calibracion_100.mae_pp);
 return '<div class="table-wrap"><table><caption>MAE sobre PP, PSOE, Vox y Ciudadanos, en puntos porcentuales (menor es mejor). La intensidad interpola el factor multiplicativo con factor^intensidad.</caption><thead><tr><th>Intensidad de recuerdo</th><th>28A · CIS 3242</th><th>10N · CIS 3263</th></tr></thead><tbody>'+changes+'</tbody></table></div>'+
 '<details><summary>Comprobar límites de factores y grupos calibrados</summary><div class="table-wrap"><table><thead><tr><th>Escenario al 100 %</th><th>28A</th><th>10N</th></tr></thead><tbody>'+more+'</tbody></table></div>'+
 '<p><b>Aislamiento parcial:</b> en abril, incorporar el residual Otros a los cuatro grupos principales modifica el MAE de '+f(abril.escenarios.solo_pp_psoe_vox_cs.mae_pp)+' a '+f(abril.escenarios.cuatro_mas_otros.mae_pp)+' pp; en noviembre de '+f(nov.escenarios.solo_pp_psoe_vox_cs.mae_pp)+' a '+f(nov.escenarios.cuatro_mas_otros.mae_pp)+' pp. Este residual incluye categorías no territoriales, por lo que no es un efecto causal territorial.</p>'+ 
 '<p>Calibrar solo los grupos PP, PSOE, Vox y Ciudadanos cambia el MAE respecto a calibrar también UP y Otros en '+(diffs[0]>0?'+':'')+f(diffs[0])+' pp en abril y '+(diffs[1]>0?'+':'')+f(diffs[1])+' pp en noviembre. <b>No identifica aisladamente el efecto territorial</b>: cambia también la calibración de Unidas Podemos y del grupo residual.</p></details>'+
 '<p><b>Lectura:</b> en ambas encuestas el error disminuye al intensificar la calibración dentro de la rejilla examinada. No se ha demostrado que el 100 % sea óptimo para futuras elecciones ni que esta regla mejore el resultado de 2023. Los grupos de recuerdo y las coaliciones de 2019 no están completamente homologados para atribución territorial.</p>'+
 '<p class="muted"><b>Decisión:</b> mantener como experimento. Se necesita validación histórica independiente y homologación territorial antes de modificar el Motor 29N.</p>';
}
export async function bindSensibilidad2019(){
 const el=document.getElementById('cocina-sensibilidad-2019-tabla');if(!el)return;
 try{
  const res=await fetch('data/microdatos/sensibilidad-recuerdo-cis-2019.json',{cache:'no-store'});
  if(!res.ok)throw Error('HTTP '+res.status);
  if(el.isConnected)el.innerHTML=tablaSensibilidad2019(await res.json());
 }catch(err){if(el.isConnected)el.textContent='Sensibilidad no disponible: '+err.message}
}

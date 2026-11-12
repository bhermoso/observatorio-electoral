// Comprobación retrospectiva PARCIAL de abril 2019.
// Solo PP, PSOE, Vox y Ciudadanos; UP y alianzas territoriales NO se imputan.
const REQUIRED=['BLANCO','CIUDADANOS','OTRAS_CANDIDATURAS','PP','PSOE','UNIDAS_PODEMOS','VOX'];
const MATCH=['PP','PSOE','VOX','CIUDADANOS'];
const LABEL={PP:'PP',PSOE:'PSOE',VOX:'Vox',CIUDADANOS:'Ciudadanos'};
const fmt=x=>Number(x).toLocaleString('es-ES',{minimumFractionDigits:2,maximumFractionDigits:2});
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
export function calcularDirecta2019A(ag,resultado,cotejo){
 if(ag?.schema_version!==1||resultado?.schema_version!==1||resultado.election!=='2019-04-28'||cotejo?.status!=='ZIP_ORIGINALES_Y_AGREGADOS_COTEJADOS')throw Error('Fuentes de 2019A incompletas');
 const s=ag.studies?.['3242'],orig=cotejo.studies?.['3242'];
 if(!s||s.n!==16194||s.sha256!==orig?.archive_sha256||orig.matched_existing_aggregates!==true)throw Error('ZIP 3242 no cotejado');
 const n=REQUIRED.reduce((sum,k)=>sum+(s.intention?.[k]?.n??0),0);
 const w=REQUIRED.reduce((sum,k)=>sum+(s.intention?.[k]?.w??0),0);
 if(!n||!w||!Number.isInteger(resultado.valid_votes)||resultado.valid_votes<10000000)throw Error('Denominador electoral o muestral inválido');
 const filas=MATCH.map(p=>{
  if(!Number.isInteger(resultado.parties[p])||!Number.isFinite(s.intention[p]?.w)||!Number.isInteger(s.intention[p]?.n))throw Error('Candidatura incompleta: '+p);
  const oficial=100*resultado.parties[p]/resultado.valid_votes;
  const directa=100*s.intention[p].n/n;
  const ponderada=100*s.intention[p].w/w;
  return {partido:LABEL[p],oficial,directa,ponderada,error_directa:directa-oficial,error_ponderada:ponderada-oficial};
 });
 const mae=key=>filas.reduce((a,r)=>a+Math.abs(r[key]),0)/filas.length;
 return {eleccion:resultado.election,estudio:'3242',base_entrevistas:n,base_ponderada:w,filas,mae_directa:mae('error_directa'),mae_ponderada:mae('error_ponderada'),validacion_recuerdo:false};
}
export function renderDirecta2019A(){
 return '<section class="panel" id="cocina-directa-2019a"><span class="eyebrow">Retrospectiva parcial · 28A 2019</span><h2>Comprobación de intención directa y ponderación en abril</h2><p>Resultado electoral contrastado con los agregados cotejados del CIS 3242; cuatro candidaturas inequívocas, sin equiparar alianzas territoriales ni calcular recuerdo de voto.</p><div id="cocina-directa-2019a-contenido" aria-live="polite">Preparando verificación retrospectiva…</div></section>';
}
export function tablaDirecta2019A(data){
 if(data?.validacion_recuerdo!==false||data.filas?.length!==4)throw Error('Resultados de abril incompletos');
 const rows=data.filas.map(r=>'<tr><th scope="row">'+esc(r.partido)+'</th><td>'+fmt(r.oficial)+' %</td><td>'+fmt(r.directa)+' %</td><td>'+fmt(r.ponderada)+' %</td></tr>').join('');
 return '<div class="table-wrap"><table><caption>CIS 3242: voto directo entre respuestas con candidatura o blanco frente a escrutinio 28A, con denominador de voto válido. Solo cuatro partidos.</caption><thead><tr><th>Partido</th><th>Escrutinio 28A</th><th>Directa sin PESO</th><th>Directa con PESO</th></tr></thead><tbody>'+rows+'</tbody></table></div>'+
 '<p><b>MAE de los cuatro partidos:</b> directa '+fmt(data.mae_directa)+' pp; ponderada '+fmt(data.mae_ponderada)+' pp. La base declarada con voto válido comprende '+data.base_entrevistas.toLocaleString('es-ES')+' entrevistas del estudio 3242.</p>'+
 '<p><b>Alcance:</b> abstención y categorías NS/NC excluidas de esta base; se conservan votos de otras candidaturas en el denominador. No se atribuye a una receta de simpatía, recuerdo o participación. Unidas Podemos/En Comú Podem y demás alianzas territoriales requieren homologación por provincia. <b>No constituye prueba de admisión al Motor 29N.</b></p>';
}
export async function bindDirecta2019A(){
 const root=document.getElementById('cocina-directa-2019a-contenido');if(!root)return;
 try{
  const read=async p=>{const r=await fetch(p,{cache:'no-store'});if(!r.ok)throw Error('HTTP '+r.status);return r.json()};
  const [ag,res,cot]=await Promise.all([read('data/microdatos/diagnostico_2019_original.json'),read('data/sources/resultados_2019A_parcial.json'),read('data/microdatos/cotejo_originales_2019.json')]);
  if(root.isConnected)root.innerHTML=tablaDirecta2019A(calcularDirecta2019A(ag,res,cot));
 }catch(e){if(root.isConnected)root.textContent='Retrospectiva 28A no disponible: '+e.message}
}

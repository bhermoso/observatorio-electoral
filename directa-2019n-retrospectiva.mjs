// Retrospectiva parcial 10N 2019: solo intención directa, con/sin PESO.
// No sustituye la homologación territorial ni valida calibración por RECUERDO.
const KEY=['PP','PSOE','VOX','CIUDADANOS','UNIDAS_PODEMOS'];
const LABEL=['PP','PSOE','Vox','Ciudadanos','Unidas Podemos'];
const OFFICIAL=['PP','PSOE','VOX','CS','UP'];
const VALID=['BLANCO','CIUDADANOS','OTRAS_CANDIDATURAS','PP','PSOE','UNIDAS_PODEMOS','VOX'];
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fmt=x=>Number(x).toLocaleString('es-ES',{minimumFractionDigits:2,maximumFractionDigits:2});
export function calcularDirecta2019N(ag,resultado,cotejo){
 if(ag?.schema_version!==1||resultado?.eleccion!=='2019-11-10'||cotejo?.status!=='ZIP_ORIGINALES_Y_AGREGADOS_COTEJADOS')throw Error('Fuentes de 2019 incorrectas');
 const a=ag.studies?.['3263'],check=cotejo.studies?.['3263'];
 if(!a||a.n!==17650||a.sha256!==check?.archive_sha256||check.matched_existing_aggregates!==true)throw Error('Original 3263 sin cotejar');
 const w=VALID.reduce((sum,k)=>sum+(a.intention[k]?.w??0),0);
 const n=VALID.reduce((sum,k)=>sum+(a.intention[k]?.n??0),0);
 if(!w||!n||!Number.isInteger(resultado.votos_validos))throw Error('Denominador inválido');
 const filas=KEY.map((k,i)=>{
  const oficial=100*resultado.votos[OFFICIAL[i]]/resultado.votos_validos;
  const directa=100*a.intention[k].n/n;
  const ponderada=100*a.intention[k].w/w;
  return {partido:LABEL[i],oficial,directa,ponderada,error_directa:directa-oficial,error_ponderada:ponderada-oficial};
 });
 const mae=k=>filas.reduce((s,row)=>s+Math.abs(row[k]),0)/filas.length;
 return {id:'3263',eleccion:'2019-11-10',base_entrevistas:n,base_peso:w,filas,mae_directa:mae('error_directa'),mae_ponderada:mae('error_ponderada'),admisible_recuerdo:false};
}
export function renderDirecta2019N(){
 return '<section class="panel" id="cocina-directa-2019n"><span class="eyebrow">Retrospectiva parcial · 10N 2019</span><h2>Comprobación independiente: intención directa y ponderación</h2><p>Reconstrucción desde agregados cotejados del CIS 3263. No atribuye resultados a recuerdo, simpatía ni participación.</p><div id="cocina-directa-2019n-contenido" aria-live="polite">Comprobando bases históricas…</div></section>';
}
export function tablaDirecta2019N(d){
 if(d?.admisible_recuerdo!==false||d.filas?.length!==5)throw Error('Salida incompleta');
 const tr=d.filas.map(r=>'<tr><th scope="row">'+esc(r.partido)+'</th><td>'+fmt(r.oficial)+' %</td><td>'+fmt(r.directa)+' %</td><td>'+fmt(r.ponderada)+' %</td></tr>').join('');
 return '<div class="table-wrap"><table><caption>Encuesta CIS 3263: intención directa entre quienes nombran candidatura o voto en blanco; comparación descriptiva con resultado real del 10N, sobre voto válido nacional. No son porcentajes entre todos los entrevistados.</caption><thead><tr><th>Partido</th><th>Resultado real 10N</th><th>Directa sin ponderar</th><th>Directa con PESO</th></tr></thead><tbody>'+tr+'</tbody></table></div>'+
 '<p><b>MAE (cinco partidos):</b> directa '+fmt(d.mae_directa)+' pp; directa ponderada '+fmt(d.mae_ponderada)+' pp. Este cálculo usa '+d.base_entrevistas.toLocaleString('es-ES')+' respuestas con voto válido de '+(17650).toLocaleString('es-ES')+' entrevistas y cifras de peso publicadas redondeadas; no comprende Más País por separado.</p>'+
 '<p><b>Restricción:</b> Unidas Podemos de 2019 no es Sumar de 2023; los partidos territoriales se conservan en el residual. Sin matriz conjunta de RECUERDO × VOTOSIMG × PESO no podemos calcular ni validar el efecto del recuerdo. La elección de abril y la cocina completa de noviembre siguen pendientes de homologación: <b>NO ADMITIR en el Motor 29N</b>.</p>';
}
export async function bindDirecta2019N(){
 const root=document.getElementById('cocina-directa-2019n-contenido');if(!root)return;
 try{
  const fetchJson=async path=>{const r=await fetch(path,{cache:'no-store'});if(!r.ok)throw Error('HTTP '+r.status);return r.json()};
  const [ag,res,cot]=await Promise.all([fetchJson('data/microdatos/diagnostico_2019_original.json'),fetchJson('data/sources/resultados_2019N.json'),fetchJson('data/microdatos/cotejo_originales_2019.json')]);
  if(root.isConnected)root.innerHTML=tablaDirecta2019N(calcularDirecta2019N(ag,res,cot));
 }catch(e){if(root.isConnected)root.textContent='Retrospectiva parcial no disponible: '+e.message}
}

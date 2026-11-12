// Serie longitudinal de tratamientos propios sobre originales CIS 2026.
// Cuatro encuestas, seis escenarios por muestra; no hay pronóstico independiente adicional.
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const fmt=x=>Number(x).toLocaleString('es-ES',{minimumFractionDigits:1,maximumFractionDigits:1});
const PARTIES=['PP','PSOE','VOX','SUMAR','PODEMOS'];
const STAGES=['directa','peso','simpatia','recuerdo','indecisos','participacion'];
const LABELS={directa:'Directa sin ponderar',peso:'Directa ponderada',simpatia:'Voto + simpatía',recuerdo:'Recuerdo calibrado',indecisos:'Indecisos por recuerdo',participacion:'Participación declarada'};
export function validarSerieCis2026(d){
 if(d?.esquema!==1||d?.estudios?.length!==4)throw Error('Serie CIS incompleta');
 if(d.estudios.map(x=>x.id).join(',')!=='3567,3571,3577,3582')throw Error('Orden CIS incorrecto');
 if(d.pasos?.join(',')!==STAGES.join(',')||d.partidos?.join(',')!==PARTIES.join(','))throw Error('Receta no identificada');
 for(const x of d.estudios){
  if(!Number.isInteger(x.n)||x.n<1000||!Number.isFinite(x.n_efectivo)||!(/^[0-9a-f]{64}$/.test(x.sha256_zip)))throw Error('Estudio sin procedencia verificable');
  for(const stage of STAGES){
   const row=x.pasos?.[stage];
   if(!row||!PARTIES.every(p=>Number.isFinite(row[p])&&row[p]>=0&&row[p]<=100)||PARTIES.reduce((a,p)=>a+row[p],0)>100.01)throw Error('Tratamiento CIS incorrecto: '+x.id+' '+stage);
  }
 }
 return d.estudios;
}
export function renderSerieCis2026(){
 return '<section class="panel" id="cocina-serie-cis-2026"><span class="eyebrow">CIS 2026 · cuatro muestras originales</span><h2>Evolución de la cocina propia sobre microdatos</h2><p>Seis tratamientos constantes aplicados a junio, julio, septiembre y octubre. <b>Son experimentos estadísticos no validados como predicción</b>, y cada oleada cuenta una sola vez.</p><div id="cocina-serie-cis-tabla" aria-live="polite">Cargando serie…</div></section>';
}
export function tablaSerieCis2026(data){
 const estudios=validarSerieCis2026(data);
 const th=PARTIES.map(p=>'<th>'+esc(p==='VOX'?'Vox':p==='SUMAR'?'Sumar':p==='PODEMOS'?'Podemos':p)+'</th>').join('');
 const cols=row=>PARTIES.map(p=>'<td class="num">'+fmt(row[p])+' %</td>').join('');
 const final=estudios.map(x=>'<tr><th scope="row">CIS '+esc(x.id)+'<small>'+esc(x.periodo)+'</small></th>'+cols(x.pasos.participacion)+'</tr>').join('');
 const hist=estudios.map(x=>'<h3>CIS '+esc(x.id)+' · '+esc(x.periodo)+'</h3><div class="table-wrap"><table><thead><tr><th>Tratamiento</th>'+th+'</tr></thead><tbody>'+STAGES.map(s=>'<tr><th scope="row">'+esc(LABELS[s])+'</th>'+cols(x.pasos[s])+'</tr>').join('')+'</tbody></table></div>').join('');
 return '<div class="table-wrap"><table><caption>Último tratamiento de cada oleada: voto válido estimado por receta experimental constante (no pronóstico operativo).</caption><thead><tr><th>Estudio</th>'+th+'</tr></thead><tbody>'+final+'</tbody></table></div><details><summary>Ver los seis tratamientos de cada estudio y sus cifras</summary>'+hist+'</details><p class="muted">Todos los porcentajes utilizan una base de voto válido incluida la categoría blanco, pero solo se muestran cinco partidos. La calibración de recuerdo usa el resultado del 23J; <b>no está validada fuera de muestra y no alimenta el Motor 29N</b>. Se conservan las huellas SHA-256 de los originales y se excluyen las entrevistas individuales de la web.</p>';
}
export async function bindSerieCis2026(){
 const root=document.getElementById('cocina-serie-cis-tabla');if(!root)return;
 try{
  const r=await fetch('data/microdatos/serie-cis-2026-experimental.json',{cache:'no-store'});
  if(!r.ok)throw Error('HTTP '+r.status);
  if(root.isConnected)root.innerHTML=tablaSerieCis2026(await r.json());
 }catch(e){if(root.isConnected)root.textContent='Serie CIS no disponible: '+e.message}
}

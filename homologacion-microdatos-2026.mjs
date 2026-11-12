// Homologación documental de agregados de microdatos disponibles.
// El esquema común identifica variables y denominadores, pero NO fusiona estudios.
const h=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=x=>Number.isFinite(x)?x.toLocaleString('es-ES',{minimumFractionDigits:1,maximumFractionDigits:1}):'—';
export const PARTIDOS_COMUNES=Object.freeze(['PP','PSOE','VOX','SUMAR']);
const valid=x=>x&&PARTIDOS_COMUNES.every(k=>Number.isFinite(x[k])&&x[k]>=0&&x[k]<=100)&&PARTIDOS_COMUNES.reduce((s,k)=>s+x[k],0)<=100.01;
const pick=x=>Object.fromEntries(PARTIDOS_COMUNES.map(k=>[k,Number(x[k])]));
export function normalizarAgregados2026(cis,db){
 if(cis?.estudio!=='3582'||!Array.isArray(cis?.pasos)||!Array.isArray(db?.olas)||db.olas.length<1)
  throw Error('Faltan agregados originales de CIS o 40dB');
 const direct=cis.pasos.find(p=>p.id==='directa');
 const weighted=cis.pasos.find(p=>p.id==='peso');
 const final=cis.pasos.find(p=>p.id==='participacion');
 if(!valid(direct?.estimacion)||!valid(weighted?.estimacion)||!valid(final?.estimacion))throw Error('Agregados CIS incompletos');
 const filas=[
  {id:'cis-3582-directa',casa:'CIS',periodo:'octubre 2026',base:'CIS 3582',metodo:'Intención directa sin ponderar',peso:'Sin ponderación',denominador:'Voto válido declarado, incluido blanco',voto:pick(direct.estimacion),n:direct.entrevistas_validas,estatus:'descriptivo',fuente:'data/microdatos/cocina_cis_3582.json'},
  {id:'cis-3582-ponderada',casa:'CIS',periodo:'octubre 2026',base:'CIS 3582',metodo:'Intención directa ponderada',peso:'PESO',denominador:'Voto válido declarado, incluido blanco',voto:pick(weighted.estimacion),n:null,estatus:'descriptivo',fuente:'data/microdatos/cocina_cis_3582.json'},
  {id:'cis-3582-receta',casa:'CIS',periodo:'octubre 2026',base:'CIS 3582',metodo:'Receta experimental completa',peso:'PESO + ajustes propios',denominador:'Voto válido, incluido blanco',voto:pick(final.estimacion),n:cis.resultado?.n_efectivo,estatus:'receta_no_validada',fuente:'data/microdatos/cocina_cis_3582.json'}
 ];
 const ids=new Set();
 for(const x of db.olas){
  if(!x.id||ids.has(x.id)||!valid(x.directa)||!valid(x.recuerdo_calibrado)||!Number.isFinite(x.entrevistas))throw Error('Ola 40dB inválida o duplicada');
  ids.add(x.id);
  filas.push({id:'40db-'+x.id+'-directa',casa:'40dB',periodo:x.campo,base:x.titulo,metodo:'Intención directa ponderada',peso:x.ponderador||'No identificado',denominador:'Voto válido declarado, incluido blanco',voto:pick(x.directa),n:x.entrevistas,estatus:'descriptivo',fuente:'data/microdatos/40db-auditoria-2026.json'});
  filas.push({id:'40db-'+x.id+'-recuerdo',casa:'40dB',periodo:x.campo,base:x.titulo,metodo:'Recuerdo calibrado experimental',peso:(x.ponderador||'No identificado')+' + ajuste propio',denominador:'Voto válido declarado, incluido blanco',voto:pick(x.recuerdo_calibrado),n:null,estatus:'receta_no_validada',fuente:'data/microdatos/40db-auditoria-2026.json'});
 }
 if(new Set(filas.map(x=>x.id)).size!==filas.length)throw Error('Registros duplicados');
 return {esquema:1,naturaleza:'agregados_de_entrevistas_no_combinados',partidos:[...PARTIDOS_COMUNES],
  reglas:{porcentajes:'Valores descriptivos originales de cada tratamiento, redondeados en los agregados de origen; cuatro partidos no suman necesariamente 100 %',denominador:'Todos refieren voto válido con blanco, pero las selecciones, las imputaciones y las ponderaciones no son necesariamente equivalentes',independencia:'Las tres filas CIS son una única muestra; cada pareja 40dB describe una misma muestra. No sumar n ni promediar tratamientos o casas.',validacion:'Una elección retrospectiva no valida la receta para 2026',motor:'No son entradas adicionales al Motor 29N'},
  filas};
}
export function renderHomologacion2026(){
 return `<section class="panel" id="cocina-homologacion-2026"><span class="eyebrow">Homologación · etapa 1</span><h2>Comparar preguntas antes de mezclar recetas</h2><p>Los porcentajes proceden de agregados de entrevistas. Cada pareja de filas comparte encuestados; los tratamientos <b>no son encuestas nuevas</b>. La homologación de categorías no demuestra equivalencia de muestras o ponderaciones.</p><div id="cocina-homologacion-tabla">Consultando agregados…</div></section>`;
}
export function tablaHomologacion2026(data){
 if(data?.esquema!==1||!Array.isArray(data.filas)||!data.filas.length)throw Error('Homologación no disponible');
 return `<div class="table-wrap"><table><caption>Porcentaje de voto válido declarado; muestras y tratamientos no agregables. Orden fijo PP, PSOE, Vox y Sumar. Datos históricos del estudio, no pronósticos de noviembre.</caption>
  <thead><tr><th>Fuente / campo</th><th>Tratamiento</th>${PARTIDOS_COMUNES.map(p=>`<th>${p}</th>`).join('')}<th>Ponderación / n</th></tr></thead>
  <tbody>${data.filas.map(x=>`<tr><th scope="row">${h(x.casa)}<small>${h(x.periodo)}</small></th><td>${h(x.metodo)}${x.estatus==='receta_no_validada'?'<small>Experimento NO validado</small>':''}</td>${PARTIDOS_COMUNES.map(p=>`<td class="num">${fmt(x.voto[p])} %</td>`).join('')}<td>${h(x.peso)}<small>${x.n==null?'n no comparable':h(x.n)}${x.n!=null&&x.metodo==='Receta experimental completa'?' (efectivo)':''}</small></td></tr>`).join('')}</tbody></table></div>
 <p class="muted"><b>Lectura:</b> la intención directa del CIS aparece tanto sin ponderar como ponderada; 40dB utiliza su ponderador publicado. Las filas con recuerdo calibrado son escenarios propios y no reconstruyen la estimación oficial de 40dB. Ninguna de estas filas se incorpora automáticamente al pronóstico operativo. <a href="#cocina-matriz-fuentes">Ver inventario y limitaciones de cada fuente</a>.</p>`;
}
export async function bindHomologacion2026(){
 const root=document.querySelector('#cocina-homologacion-tabla');if(!root)return;
 try{
  const load=async f=>{const r=await fetch('data/microdatos/'+f,{cache:'no-store'});if(!r.ok)throw Error('HTTP '+r.status+' ('+f+')');return r.json()};
  const [cis,db]=await Promise.all([load('cocina_cis_3582.json'),load('40db-auditoria-2026.json')]);
  if(root.isConnected)root.innerHTML=tablaHomologacion2026(normalizarAgregados2026(cis,db));
 }catch(e){if(root.isConnected)root.textContent='Homologación no disponible: '+e.message}
}

// Inventario armonizado de EVIDENCIA (no mezcla porcentajes con bases distintas).
// Solo lee agregados publicados; no recibe ni publica entrevistas individuales.
const h=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const PARTIES=['PP','PSOE','VOX','SUMAR'];
export function prepararMatrizFuentes({cis,db26,db23,socio,custodia}){
 if(cis?.estudio!=='3582'||!Array.isArray(cis.pasos)||!Array.isArray(db26?.olas)||!Array.isArray(db23?.estudios)||!Array.isArray(socio?.estudios)||!Array.isArray(custodia?.stored))
  throw Error('Faltan fuentes para la matriz armonizada');
 const result=[];
 const push=x=>{if(!x.id||!x.fuente||!x.origen||!x.criterio||!x.etapa)throw Error('Ficha incompleta');result.push(x);};
 const last=cis.pasos.at(-1);
 if(last?.id!=='participacion'||!PARTIES.every(p=>Number.isFinite(last.estimacion?.[p])))throw Error('Receta CIS incompleta');
 push({id:'cis-3582',fuente:'CIS',periodo:'oct. 2026',origen:'Agregados de entrevistas originales · estudio 3582',etapa:'Receta reproducida; pendiente de validación independiente',criterio:'Voto válido declarado; blanco incluido',variables:'Intención, ponderación, simpatía, recuerdo, indecisos, participación',n:cis.pasos[0].entrevistas||null,uso:'experimental',documento:'data/microdatos/cocina_cis_3582.json'});
 for(const x of db26.olas){
  if(!x.id||!x.titulo||!Number.isFinite(x.entrevistas)||!PARTIES.every(p=>Number.isFinite(x.directa?.[p])))throw Error('Agregado 40dB 2026 incompleto');
  push({id:'40db-'+x.id,fuente:'40dB',periodo:x.titulo,origen:'Matriz individual original · agregados reproducidos',etapa:'Directa ponderada y calibración exploratoria; no validación predictiva',criterio:'Voto válido declarado; ponderador ponde',variables:'Intención, simpatía, recuerdo, participación; nombres por estudio',n:x.entrevistas,uso:'experimental',documento:'data/microdatos/40db-auditoria-2026.json'});
 }
 for(const x of db23.estudios){
  if(!x.id||!Number.isFinite(x.n)||!Number.isFinite(x.mae_publicado))throw Error('Validación 40dB incompleta');
  push({id:'40db-2023-'+x.id,fuente:'40dB',periodo:x.nombre,origen:'Agregados de entrevistas de 2023',etapa:'Retrospectiva frente al 23J; una elección, métodos ex post',criterio:'Votos válidos; PSOE y PSC agrupados',variables:'Intención, simpatía, recuerdo, participación; recetas retrospectivas',n:x.n,uso:'validacion_exploratoria',documento:'data/microdatos/40db-retrospectiva-2023.json'});
 }
 for(const x of socio.estudios){
  if(!x.id||!Number.isFinite(x.n_filas_sav)||!Array.isArray(x.partidos_y_categorias_n_20))throw Error('Agregado SocioMétrica incompleto');
  push({id:x.id,fuente:'SocioMétrica',periodo:x.id.slice(-10),origen:'SAV original; categorías con al menos 20 casos',etapa:'Análisis parcial; ponderaciones sin identificar',criterio:'Todos los registros; no equiparable al voto válido',variables:'Intención directa sin ponderar; sin pesos identificados',n:x.n_filas_sav,uso:'pendiente_homologacion',documento:'data/microdatos/sociometrica-2025-agregados.json'});
 }
 for(const x of custodia.stored){
  if(!x.study_id||!x.sha256||!/^[0-9a-f]{64}$/i.test(x.sha256))throw Error('Custodia no verificable');
  push({id:x.study_id,fuente:'More in Common',periodo:x.study_id.slice(-10),origen:'Original verificado en custodia privada; no se exportan entrevistas',etapa:'Conservado; no homologado ni estimado',criterio:'Pendiente de inspección de variables y denominador',variables:'Pendientes de lectura de diccionario y ponderaciones',n:null,uso:'pendiente_homologacion',documento:'data/microdatos/custodia.json'});
 }
 if(new Set(result.map(x=>x.id)).size!==result.length)throw Error('Estudios duplicados');
 return result;
}
export function renderMatrizFuentes(){
 return `<section class="panel matriz-microdatos" id="cocina-matriz-fuentes"><span class="eyebrow">Base de investigación · control de comparabilidad</span>
 <h2>Matriz de microdatos disponibles</h2>
 <p>Registro de estudios de los que existen agregados verificables o un original custodiado. <b>No equivale a un promedio de microdatos</b>: antes de combinar porcentajes deben homologarse pregunta, territorio, periodo, denominador, candidaturas y ponderación.</p>
 <div id="cocina-matriz-datos" aria-live="polite"><p class="muted">Comprobando estudios y procedencia…</p></div></section>`;
}
export function tablaMatrizFuentes(rows){
 if(!Array.isArray(rows)||!rows.length)throw Error('Matriz vacía');
 const count=type=>rows.filter(x=>x.uso===type).length;
 const body=rows.map(x=>`<tr><th scope="row">${h(x.fuente)}<small>${h(x.periodo)}</small></th><td>${h(x.n??'—')}</td><td>${h(x.etapa)}<small>${h(x.origen)}</small></td><td>${h(x.criterio)}<small>${h(x.variables)}</small></td><td><code>${h(x.id)}</code></td></tr>`).join('');
 return `<div class="kitchen-contribution-summary"><div><span>Con cálculo experimental</span><strong>${count('experimental')}</strong></div><div><span>Retrospectivas 23J</span><strong>${count('validacion_exploratoria')}</strong></div><div><span>Pendientes de homologación</span><strong>${count('pendiente_homologacion')}</strong></div></div>
 <div class="table-wrap"><table><caption>Una fila por estudio; n es número de entrevistas o registros cuando consta, no suma de muestras comparables. El inventario no incluye todo el catálogo documental.</caption><thead><tr><th>Fuente / periodo</th><th>n</th><th>Estado de análisis</th><th>Denominador y variables</th><th>ID</th></tr></thead><tbody>${body}</tbody></table></div>
 <p class="muted"><b>Regla de admisión:</b> ninguna de estas filas se incorpora automáticamente al Motor 29N. Los cuatro originales de More in Common están custodiados, pero no se atribuyen estimaciones. Los análisis parciales de SocioMétrica no se comparan en porcentajes con el voto válido de CIS y 40dB.</p>`;
}
export async function bindMatrizFuentes(){
 const el=document.getElementById('cocina-matriz-datos');if(!el)return;
 const names=['cocina_cis_3582.json','40db-auditoria-2026.json','40db-retrospectiva-2023.json','sociometrica-2025-agregados.json','custodia.json'];
 try{
  const sources=await Promise.all(names.map(async n=>{const r=await fetch('data/microdatos/'+n,{cache:'no-store'});if(!r.ok)throw Error(n+': HTTP '+r.status);return r.json();}));
  if(el.isConnected)el.innerHTML=tablaMatrizFuentes(prepararMatrizFuentes({cis:sources[0],db26:sources[1],db23:sources[2],socio:sources[3],custodia:sources[4]}));
 }catch(e){if(el.isConnected)el.textContent='Matriz no disponible: '+e.message}
}

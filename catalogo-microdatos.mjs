/**
 * Archivo documental de microdatos multifuente.
 * No descarga ni redistribuye respuestas personales: solo muestra
 * enlaces originales, nivel de verificación y advertencias de cobertura.
 */
const SOURCE='data/microdatos/catalogo-publico.json';
const h=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const statuses={
 original_auditado:'Examinados y analizados; sin original almacenado',
 enlace_documentado:'Microdatos documentados',
 registro_requerido:'Requiere registro',
 formulario_requerido:'Requiere formulario',
 solicitud_requerida:'Bajo solicitud',
 estructura_sav_verificada:'SAV comprobado; análisis parcial',
 embargado:'Temporalmente embargado'
};
export function microdataState(s){
 const m=s.microdatos||{};
 if(m.original_almacenado)return m.analisis==='analizado'?'Almacenado y analizado':'Almacenado; análisis pendiente';
 if(m.analisis==='analizado')return 'Analizado; original NO guardado';
 if(m.analisis==='parcial')return 'Análisis parcial; original NO guardado';
 if(m.original_descargado_alguna_vez)return 'Descargado temporalmente; NO guardado';
 if(m.enlace_localizado)return 'Enlace localizado; sin descargar';
 return 'Sin archivo original descargable confirmado';
}
export function matchMicrodataFilter(s,choice){
 const m=s.microdatos||{};
 return choice==='todos'||
  (choice==='localizados'&&m.enlace_localizado)||
  (choice==='descargados'&&m.original_descargado_alguna_vez)||
  (choice==='almacenados'&&m.original_almacenado)||
  (choice==='analizados'&&(m.analisis==='analizado'||m.analisis==='parcial'))||
  (choice==='pendientes'&&!m.original_descargado_alguna_vez);
}
export function mergeAuditStatuses(catalog,manifest){
 if(!Array.isArray(catalog?.estudios)||!Array.isArray(manifest?.archivos))return catalog;
 const map=new Map(manifest.archivos.map(x=>[x.id,x]));
 for(const study of catalog.estudios){
  const r=map.get(study.id);
  if(!r?.sha256||r.estado==='descarga_fallida')continue;
  study.microdatos=study.microdatos||{};
  study.microdatos.original_descargado_alguna_vez=true;
  study.microdatos.descarga_verificada_en=r.verificado_en||null;
  study.microdatos.sha256_verificado=r.sha256;
  // Un manifiesto técnico no acredita copia conservada ni análisis electoral.
 }
 return catalog;
}
export function renderCatalogoMicrodatos(){
 return `<section class="archivo-md" id="archivo-microdatos" aria-labelledby="archivo-md-title">
 <div class="archivo-md-head"><div>
 <span class="eyebrow">Fuentes originales · transparencia y trazabilidad</span>
 <h2 id="archivo-md-title">Archivo de microdatos electorales: fuentes y estudios en ampliación</h2>
 <p>Buscamos entrevistas individuales anonimizadas, no solo PDFs o tablas de cruces. Cada estudio distingue enlace encontrado, descarga temporal, original almacenado y análisis disponible. «Almacenado» solo significa que existe una copia original recuperable. No es todavía un inventario exhaustivo.</p></div>
 <a href="${SOURCE}" download>Descargar catálogo JSON ↓</a></div>
 <div id="archivo-md-datos" aria-live="polite">Cargando catálogo de microdatos…</div>
 </section>`;
}
export async function bindCatalogoMicrodatos(){
 const root=document.getElementById('archivo-md-datos');
 if(!root)return;
 try{
  const res=await fetch(SOURCE,{cache:'no-store'});
  if(!res.ok)throw Error('HTTP '+res.status);
  const d=await res.json();
  try{
   const ar=await fetch('data/microdatos/estado-descargas.json',{cache:'no-store'});
   if(ar.ok)mergeAuditStatuses(d,await ar.json());
  }catch{/* El catálogo permanece visible aunque la auditoría no responda. */}
  if(!root.isConnected)return;
  if(d.esquema!==1||!Array.isArray(d.fuentes)||!Array.isArray(d.estudios))throw Error('Formato de catálogo inválido');
  const count=s=>d.estudios.filter(x=>x.productor===s).length;
  root.innerHTML=`
   <p class="archivo-md-metrics"><strong>${d.fuentes.length} repositorios</strong> con vías de acceso a datos individuales · <strong>${d.estudios.length} entradas documentales</strong> (incluidas series acumuladas, portales y varias encuestas por página) · <strong>${d.estudios.filter(x=>x.microdatos?.original_almacenado).length} originales almacenados</strong> · <strong>${d.estudios.filter(x=>x.microdatos?.original_descargado_alguna_vez).length} descargados alguna vez</strong> · <strong>${d.estudios.filter(x=>x.microdatos?.analisis==='analizado').length} análisis completos</strong> + <strong>${d.estudios.filter(x=>x.microdatos?.analisis==='parcial').length} parciales</strong> · <strong>${d.casas_pendientes.length} casas</strong> a investigar</p>
   <div class="archivo-md-providers">${d.fuentes.map(f=>`<div><b>${h(f.nombre)}</b><small>${h(f.ambito)} · ${h(f.acceso)}</small><small>${count(f.id)} entradas · ${h(f.formatos)}</small><a href="${h(f.portal)}" target="_blank" rel="noopener noreferrer">Fuente oficial ↗</a></div>`).join('')}</div>
   <div class="archivo-md-controls">
     <label>Fuente<select id="archivo-md-source"><option value="todos">Todas las fuentes</option>${d.fuentes.map(f=>`<option value="${h(f.id)}">${h(f.nombre)}</option>`).join('')}</select></label>
     <label>Ámbito<select id="archivo-md-scope"><option value="todos">Todos los ámbitos</option><option value="España">España</option><option value="regional">Autonómicas y regionales</option></select></label>
     <label>Situación documental<select id="archivo-md-status"><option value="todos">Cualquier estado</option>${Object.entries(statuses).map(([key,val])=>`<option value="${key}">${val}</option>`).join('')}</select></label>
     <label>Microdatos<select id="archivo-md-progreso"><option value="todos">Cualquier estado</option><option value="localizados">Enlace localizado</option><option value="descargados">Descargados alguna vez</option><option value="almacenados">Originales almacenados</option><option value="analizados">Con algún análisis</option><option value="pendientes">Pendientes de descarga</option></select></label>
     <label>Buscar<input id="archivo-md-query" type="search" placeholder="2024, Murcia, GESOP…"></label>
   </div>
   <p class="archivo-md-counter" id="archivo-md-counter" role="status"></p>
   <div id="archivo-md-table" class="table-wrap"></div>
   <button id="archivo-md-more" class="secondary" type="button" hidden>Mostrar todas las entradas</button>
   <details class="archivo-md-pendientes"><summary>Otras ${d.casas_pendientes.length} encuestadoras en investigación</summary>
     <p>La ausencia en este índice significa <strong>«todavía no hemos localizado microdatos abiertos»</strong>, no que no existan. Investigaremos datos de contratos públicos, estudios universitarios y solicitudes a sus responsables.</p>
     <p>${d.casas_pendientes.map(c=>h(c.nombre)).join(' · ')}</p>
   </details>
   <p class="archivo-md-notes"><b>Original almacenado = copia permanente recuperable, nunca un simple enlace ni una descarga temporal.</b> No se reproducen respuestas individuales en GitHub. Una serie acumulada no es una encuesta adicional y un trabajo regional no se agrega como si representara España. Fechas de campo, códigos, denominadores, licencias y coincidencias entre fuentes se verifican antes de cualquier cálculo.</p>`;
  const source=root.querySelector('#archivo-md-source'),scope=root.querySelector('#archivo-md-scope'),
  status=root.querySelector('#archivo-md-status'),progress=root.querySelector('#archivo-md-progreso'),query=root.querySelector('#archivo-md-query'),
  table=root.querySelector('#archivo-md-table'),counter=root.querySelector('#archivo-md-counter'),more=root.querySelector('#archivo-md-more');
  let all=false;
  function show(){
   const str=query.value.trim().toLocaleLowerCase('es');
   const filtered=d.estudios.filter(s=>
    (source.value==='todos'||s.productor===source.value)&&
    (scope.value==='todos'||(scope.value==='España'?s.ambito==='España':s.ambito!=='España'))&&
    (status.value==='todos'||s.estado===status.value)&&
    matchMicrodataFilter(s,progress.value)&&
    (!str||[s.id,s.titulo,s.ambito,s.fecha,s.productor,s.contratista].some(v=>String(v??'').toLocaleLowerCase('es').includes(str)))
   );
   const shown=all?filtered:filtered.slice(0,12);
   counter.textContent=`${filtered.length} entradas de microdatos coinciden con los filtros · ${shown.length} visibles`;
   table.innerHTML=`<table class="archivo-md-table"><caption>Acceso al origen. «Documentado» no significa que el ZIP haya sido descargado por el Observatorio.</caption>
    <thead><tr><th>Fuente / fecha</th><th>Estudio y territorio</th><th>Estado real de microdatos</th><th>Original guardado</th><th>Motor 29N</th><th>Documentación</th></tr></thead>
    <tbody>${shown.map(s=>`<tr><td><b>${h(d.fuentes.find(f=>f.id===s.productor)?.nombre||s.productor)}</b><small>${h(s.fecha)}</small></td>
    <td><b>${h(s.titulo)}</b><small>${h(s.ambito)}</small></td>
    <td><b>${h(microdataState(s))}</b><small>${h(statuses[s.estado]||s.estado)}</small>${s.microdatos?.resultados_agregados?`<small><a href="${h(s.microdatos.resultados_agregados)}" target="_blank" rel="noopener noreferrer">Ver resultados agregados ↗</a></small>`:''}</td>
    <td><strong>${s.microdatos?.original_almacenado?'Sí':'No'}</strong></td><td>${s.microdatos?.usado_en_motor_29n?'Sí':'No'}</td>
    <td><a href="${h(s.pagina)}" target="_blank" rel="noopener noreferrer">Fuente ↗</a>${s.archivo?` · <a href="${h(s.archivo)}" target="_blank" rel="noopener noreferrer">Archivo ↗</a>`:''}</td></tr>`).join('')}</tbody></table>`;
   more.hidden=all||filtered.length<=12;
  }
  for(const el of [source,scope,status,progress,query])el.addEventListener(el===query?'input':'change',()=>{all=false;show()});
  more.addEventListener('click',()=>{all=true;show()});
  show();
 }catch(err){if(root.isConnected)root.textContent='No se pudo abrir el catálogo de microdatos: '+err.message;}
}

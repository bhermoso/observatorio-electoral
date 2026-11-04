/**
 * Archivo documental de microdatos multifuente.
 * No descarga ni redistribuye respuestas personales: solo muestra
 * enlaces originales, nivel de verificación y advertencias de cobertura.
 */
const SOURCE='data/microdatos/catalogo-publico.json';
const h=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const statuses={
 original_auditado:'Original auditado',
 enlace_documentado:'Microdatos documentados',
 registro_requerido:'Requiere registro',
 formulario_requerido:'Requiere formulario',
 solicitud_requerida:'Bajo solicitud'
};
export function renderCatalogoMicrodatos(){
 return `<section class="archivo-md" id="archivo-microdatos" aria-labelledby="archivo-md-title">
 <div class="archivo-md-head"><div>
 <span class="eyebrow">Fuentes originales · transparencia y trazabilidad</span>
 <h2 id="archivo-md-title">Archivo de microdatos electorales: fuentes y estudios en ampliación</h2>
 <p>Buscamos entrevistas individuales anonimizadas, no solo PDFs o tablas de cruces. Cada registro identifica el productor, el ámbito, el acceso y el nivel de comprobación. No es todavía un inventario exhaustivo.</p></div>
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
  if(!root.isConnected)return;
  if(d.esquema!==1||!Array.isArray(d.fuentes)||!Array.isArray(d.estudios))throw Error('Formato de catálogo inválido');
  const count=s=>d.estudios.filter(x=>x.productor===s).length;
  root.innerHTML=`
   <p class="archivo-md-metrics"><strong>${d.fuentes.length} repositorios</strong> con vías de acceso a datos individuales · <strong>${d.estudios.length} entradas documentales</strong> (incluidas series acumuladas, portales y varias encuestas por página) · <strong>${d.estudios.filter(x=>x.estado==='original_auditado').length} originales auditados</strong> · <strong>${d.casas_pendientes.length} casas</strong> a investigar</p>
   <div class="archivo-md-providers">${d.fuentes.map(f=>`<div><b>${h(f.nombre)}</b><small>${h(f.ambito)} · ${h(f.acceso)}</small><small>${count(f.id)} entradas · ${h(f.formatos)}</small><a href="${h(f.portal)}" target="_blank" rel="noopener noreferrer">Fuente oficial ↗</a></div>`).join('')}</div>
   <div class="archivo-md-controls">
     <label>Fuente<select id="archivo-md-source"><option value="todos">Todas las fuentes</option>${d.fuentes.map(f=>`<option value="${h(f.id)}">${h(f.nombre)}</option>`).join('')}</select></label>
     <label>Ámbito<select id="archivo-md-scope"><option value="todos">Todos los ámbitos</option><option value="España">España</option><option value="regional">Autonómicas y regionales</option></select></label>
     <label>Acceso<select id="archivo-md-status"><option value="todos">Cualquier estado</option>${Object.entries(statuses).map(([key,val])=>`<option value="${key}">${val}</option>`).join('')}</select></label>
     <label>Buscar<input id="archivo-md-query" type="search" placeholder="2024, Murcia, GESOP…"></label>
   </div>
   <p class="archivo-md-counter" id="archivo-md-counter" role="status"></p>
   <div id="archivo-md-table" class="table-wrap"></div>
   <button id="archivo-md-more" class="secondary" type="button" hidden>Mostrar todas las entradas</button>
   <details class="archivo-md-pendientes"><summary>Otras ${d.casas_pendientes.length} encuestadoras en investigación</summary>
     <p>La ausencia en este índice significa <strong>«todavía no hemos localizado microdatos abiertos»</strong>, no que no existan. Investigaremos datos de contratos públicos, estudios universitarios y solicitudes a sus responsables.</p>
     <p>${d.casas_pendientes.map(c=>h(c.nombre)).join(' · ')}</p>
   </details>
   <p class="archivo-md-notes">No se reproducen respuestas individuales en GitHub. Una serie acumulada no es una encuesta adicional y un trabajo regional no se agrega como si representara España. Fechas de campo, códigos, denominadores, licencias y coincidencias entre fuentes se verifican antes de cualquier cálculo.</p>`;
  const source=root.querySelector('#archivo-md-source'),scope=root.querySelector('#archivo-md-scope'),
  status=root.querySelector('#archivo-md-status'),query=root.querySelector('#archivo-md-query'),
  table=root.querySelector('#archivo-md-table'),counter=root.querySelector('#archivo-md-counter'),more=root.querySelector('#archivo-md-more');
  let all=false;
  function show(){
   const str=query.value.trim().toLocaleLowerCase('es');
   const filtered=d.estudios.filter(s=>
    (source.value==='todos'||s.productor===source.value)&&
    (scope.value==='todos'||(scope.value==='España'?s.ambito==='España':s.ambito!=='España'))&&
    (status.value==='todos'||s.estado===status.value)&&
    (!str||[s.id,s.titulo,s.ambito,s.fecha,s.productor,s.contratista].some(v=>String(v??'').toLocaleLowerCase('es').includes(str)))
   );
   const shown=all?filtered:filtered.slice(0,12);
   counter.textContent=`${filtered.length} entradas de microdatos coinciden con los filtros · ${shown.length} visibles`;
   table.innerHTML=`<table class="archivo-md-table"><caption>Acceso al origen. «Documentado» no significa que el ZIP haya sido descargado por el Observatorio.</caption>
    <thead><tr><th>Fuente / fecha</th><th>Estudio y territorio</th><th>Estado del acceso</th><th>Documentación</th></tr></thead>
    <tbody>${shown.map(s=>`<tr><td><b>${h(d.fuentes.find(f=>f.id===s.productor)?.nombre||s.productor)}</b><small>${h(s.fecha)}</small></td>
    <td><b>${h(s.titulo)}</b><small>${h(s.ambito)}</small></td>
    <td>${h(statuses[s.estado]||s.estado)}</td>
    <td><a href="${h(s.pagina)}" target="_blank" rel="noopener noreferrer">Fuente ↗</a>${s.archivo?` · <a href="${h(s.archivo)}" target="_blank" rel="noopener noreferrer">Archivo ↗</a>`:''}</td></tr>`).join('')}</tbody></table>`;
   more.hidden=all||filtered.length<=12;
  }
  for(const el of [source,scope,status,query])el.addEventListener(el===query?'input':'change',()=>{all=false;show()});
  more.addEventListener('click',()=>{all=true;show()});
  show();
 }catch(err){if(root.isConnected)root.textContent='No se pudo abrir el catálogo de microdatos: '+err.message;}
}

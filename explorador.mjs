/** One selected view per workspace. Nodes are moved, never cloned or discarded. */
let serial=0;
const controllers=new WeakMap();
export function mountExplorer(root,groups,{label='Vistas',id='explorer',before=null,hash=false}={}){
 if(!root)return null;
 controllers.get(root)?.destroy();
 const valid=groups.map(g=>({...g,nodes:g.nodes.filter(Boolean)})).filter(g=>g.nodes.length);
 if(!valid.length)return null;
 const nav=document.createElement('div');nav.className='explorer-tabs';nav.setAttribute('role','tablist');nav.setAttribute('aria-label',label);
 const body=document.createElement('div');body.className='explorer-body';
 const entries=valid.map((g,i)=>{
  const panel=document.createElement('section');panel.className='explorer-panel';panel.dataset.explorerPanel='';panel.id=`${id}-view-${++serial}`;panel.setAttribute('role','tabpanel');panel.tabIndex=0;
  const button=document.createElement('button');button.type='button';button.id=panel.id+'-tab';button.setAttribute('role','tab');button.setAttribute('aria-controls',panel.id);button.textContent=g.label;
  panel.setAttribute('aria-labelledby',button.id);nav.append(button);for(const n of g.nodes)panel.append(n);body.append(panel);
  return {panel,button,anchor:g.anchor||g.nodes.find(n=>n.id)?.id,g};
 });
 if(before?.parentNode===root){root.insertBefore(nav,before);root.insertBefore(body,before);}else{root.append(nav,body);}
 let active=0;
 function select(index,{focus=false,updateHash=false}={}){
  active=index;
  root.classList.remove('reading-full','reading-compact');
  root.querySelectorAll('[data-reading]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.reading==='guided')));
  entries.forEach((e,i)=>{e.panel.hidden=i!==index;e.button.setAttribute('aria-selected',String(i===index));e.button.tabIndex=i===index?0:-1;});
  const current=entries[index];
  if(current.g.open!==false)current.panel.querySelectorAll(':scope > details').forEach(d=>d.open=true);
  if(focus)current.button.focus();
  if(updateHash&&hash&&current.anchor)history.replaceState(null,'','#'+current.anchor);
  root.dispatchEvent(new CustomEvent('explorer:change',{bubbles:true,detail:{panel:current.panel,index}}));
  requestAnimationFrame(()=>window.dispatchEvent(new Event('resize')));
 }
 entries.forEach((e,i)=>{
  e.button.onclick=()=>select(i,{updateHash:true});
  e.button.onkeydown=event=>{let next;if(event.key==='ArrowRight')next=(i+1)%entries.length;if(event.key==='ArrowLeft')next=(i+entries.length-1)%entries.length;if(event.key==='Home')next=0;if(event.key==='End')next=entries.length-1;if(next!==undefined){event.preventDefault();select(next,{focus:true,updateHash:true});}};
 });
 const reveal=e=>{const i=entries.findIndex(x=>x.panel.contains(e.detail.node));if(i>=0)select(i);};
 root.addEventListener('explorer:reveal',reveal);
 const api={select,reveal:node=>{const i=entries.findIndex(x=>x.panel.contains(node));if(i>=0)select(i);},get active(){return active;},get count(){return entries.length;},destroy(){root.removeEventListener('explorer:reveal',reveal);for(const e of entries)if(root.contains(e.panel))while(e.panel.firstChild)root.append(e.panel.firstChild);nav.remove();body.remove();controllers.delete(root);}};
 controllers.set(root,api);select(0);return api;
}
const child=(root,selector)=>root.querySelector(selector);
export function bindWorkspace(route,root){
 if(!root)return;
 const previous=root.querySelector(':scope > .explorer-body')?(controllers.get(root)?.active||0):0;
 controllers.get(root)?.destroy();
 const get=selector=>child(root,selector);
 let groups=[];const used=new Set();
 function group(label,selectors,anchor){const nodes=selectors.map(get).filter(Boolean);nodes.forEach(n=>used.add(n));groups.push({label,nodes,anchor});}
 if(route==='pronostico'){
  root.querySelector('.pr-indice')?.remove();
  for(const [i,label] of ['Resultado','Evolución','Territorio','Método','Encuestas usadas','Validación','Otros modelos'].entries())group(label,['#pronostico-cap'+(i+1)],'pronostico-cap'+(i+1));
 }
 if(route==='cocina'){
  root.querySelector('.cocina-indice')?.remove();
  group('Línea base',['#cocina-base'],'cocina-base');
  for(const [i,label] of ['Ingredientes','Caso 40dB','Microdatos','Contrastar recetas','Motor actual','Fuentes'].entries())group(label,['#cocina-cap'+(i+1)],'cocina-cap'+(i+1));
 }
 if(route==='encuestas'){
  group('Explorar sondeos',['#encuestas-archivo'],'encuestas-visual');
  group('Comparar y ponderar',['#encuestas-promedios'],'encuestas-promedios');
  group('Fuentes y corte',['#encuestas-todas','#analisis-externos'],'encuestas-todas');
  group('Vigilancia',['#encuestas-actualizar'],'encuestas-actualizar');
 }
 if(route==='metodologia'){
  group('Herramientas',['.herramientas-destacadas','.methods-split'],'metodologia');
  group('Fuentes y reglas',['#metodologia-fuentes'],'metodologia-fuentes');
  group('Directorio completo',['.tools-index'],'metodologia');
 }
 if(groups.length){
  const extras=[...root.children].filter(n=>!used.has(n)&&!n.matches('.interior-guide,.pr-cifras,.notice,.error,[role=alert]'));
  // The compact model figures stay above the selected forecast view.
  const metrics=get('#pr-cifras-clave');
  const documentary=extras.filter(n=>n!==metrics);
  if(documentary.length)groups.push({label:'Guía y documentación',nodes:documentary});
  const controller=mountExplorer(root,groups,{label:'Vistas de '+route,id:route,hash:true});
  if(controller)controller.select(Math.min(previous,controller.count-1));
  root.classList.add('interactive-workspace');
  if(route==='pronostico'){const cap=get('#pronostico-cap1');mountExplorer(cap,[{label:'Voto y escaños',nodes:[get('#pronostico-principal')]},{label:'Bloques',nodes:[get('#pronostico-bloques')]},{label:'Investidura',nodes:[get('.investidura')]}],{id:'resultado',label:'Formas de examinar el resultado'});}
  if(route==='encuestas'){const archive=get('#poll-archive-content');if(archive)mountExplorer(archive,[{label:'Gráfico',nodes:[get('#encuestas-visual')]},{label:'Tabla y fichas',nodes:[get('#poll-table')?.closest('details')]}],{id:'archivo',label:'Explorar el archivo'});}
 }
}
export function bindDashboardExplorer(){
 const root=document.querySelector('#impact');if(!root)return;controllers.get(root)?.destroy();
 const ids=[['Panorama','portada-hub'],['Evolución','home-series'],['Cocina y microdatos','hub-microdatos'],['Últimas encuestas','portada-ultimas'],['Explorar herramientas','portada-secciones']];
 const used=new Set();const groups=ids.map(([label,id])=>{const node=document.getElementById(id);if(node)used.add(node);return {label,nodes:[node]};});
 const extras=[...root.children].filter(n=>!used.has(n)&&!n.matches('.portada-cabecera,.explorer-tabs,.explorer-body'));
 if(extras.length)groups.push({label:'Fuentes y referencias',nodes:extras});
 mountExplorer(root,groups,{label:'Vistas del panorama',id:'dashboard'});
 root.classList.add('interactive-dashboard');
}

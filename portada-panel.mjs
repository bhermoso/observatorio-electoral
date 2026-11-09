// Panel lateral de Panorama: al pulsar un partido, un bloque o una encuesta se abre, sobre la
// portada, el detalle que antes había que buscar en otras pestañas, con enlace a la sección exacta.
// Solo presentación: lee el pronóstico publicado, el promedio (capa 1) y las encuestas recientes.
// Orden: toda lista de encuestas, la más reciente primero (orden.mjs).
import {PARTY_COLORS} from './portada-series.mjs';
import {PARTIES,BLOCKS,BLOCK_NOTE,productorExterno} from './capas.mjs';

const h=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=(v,d=1)=>Number(v).toLocaleString('es-ES',{minimumFractionDigits:d,maximumFractionDigits:d});
const fday=s=>s?new Date(String(s).slice(0,10)+'T12:00:00Z').toLocaleDateString('es-ES',{day:'numeric',month:'short',timeZone:'Europe/Madrid'}):'—';
const signed=(v,d=1)=>(v>0?'+':v<0?'−':'±')+fmt(Math.abs(v),d);
const share=p=>p<0.005?'menos del 1 %':p>0.995?'más del 99 %':fmt(p*100,0)+' %';
const name=id=>PARTIES.find(x=>x.id===id)?.label||id;
const color=id=>PARTY_COLORS[id]||'#7b8784';
const num=v=>Number.isFinite(v);

const enlaces=items=>`<nav class="panel-enlaces" aria-label="Seguir leyendo">${items.map(([href,t])=>`<a href="${href}">${h(t)} →</a>`).join('')}</nav>`;

/** Partido: las cuatro capas, cambio desde el corte anterior, encuestas del promedio y provincias. */
export function panelPartido(id,{forecast,prom,recientes=[]}){
 const p=forecast?.principal?.partidos?.[id];
 const clave2=forecast?.capas?.sin_cocina?.variante||'consenso_todas';
 const sin=forecast?.variantes?.[clave2]?.partidos?.[id];
 const pr=prom?.partidos?.[id];
 const N=prom?.estudios?.filter(e=>e.weight>0).length??0;
 const ca=forecast?.corte_anterior;
 const externos=[...(forecast?.externos||[])].filter(x=>num(x.voto?.[id]))
  .sort((a,b)=>String(b.fecha).localeCompare(String(a.fecha)));
 const ultimos=new Map();for(const x of externos){const k=productorExterno(x);if(!ultimos.has(k))ultimos.set(k,x);}
 const filasCapas=[
  ['Promedio de encuestas (capa 1)',pr?`${fmt(pr.valor)} %`:'—',pr?`${pr.n} de ${N} encuestas lo publican`:'Ninguna encuesta del promedio lo publica'],
  ...(sin?[['Motor 29N sin cocina (capa 2)',`${fmt(sin.voto[0])} %`,`${fmt(sin.escanos?.[0],0)} escaños`]]:[]),
  ['Motor 29N con cocina (capa 3, referencia)',p?`${fmt(p.voto[0])} %`:'—',p?`${fmt(p.escanos[0],0)} escaños · intervalo ${fmt(p.escanos[1],0)}–${fmt(p.escanos[2],0)}`:''],
  ...[...ultimos.values()].map(x=>[`${productorExterno(x)} (capa 4)`,`${fmt(x.voto[id])} %`,`${fday(x.fecha)}${num(x.escanos?.[id])?` · ${fmt(x.escanos[id],0)} escaños`:''}${x.verificado?'':' · original no consultado'}`])
 ];
 const fechas=new Map((prom?.estudios||[]).map(e=>[e.id,e.fieldEnd]));
 const contrib=[...(pr?.contribuciones||[])].map(c=>({...c,fin:fechas.get(c.id)})).sort((a,b)=>String(b.fin).localeCompare(String(a.fin)));
 const provincias=(forecast?.principal?.provincias||[]).map(x=>({prov:x.provincia,n:x.reparto?.[id]||0,total:x.escanos})).filter(x=>x.n>=0.5).sort((a,b)=>b.n-a.n);
 const encuestas=recientes.filter(x=>num(x.voto?.[id])).slice(0,8);
 return `<header class="panel-cab" style="--c:${color(id)}"><i></i><h2 id="panel-titulo">${h(name(id))}</h2></header>
 ${p?`<div class="panel-cifras"><div><span>Escaños</span><strong>${fmt(p.escanos[0],0)}</strong><small>${fmt(p.escanos[1],0)}–${fmt(p.escanos[2],0)} (90 %)</small></div>
  <div><span>Voto</span><strong>${fmt(p.voto[0])} %</strong><small>${fmt(p.voto[1])}–${fmt(p.voto[2])}</small></div>
  <div><span>Primera fuerza</span><strong>${num(p.primero)&&p.primero>0?share(p.primero):'—'}</strong><small>de las simulaciones</small></div></div>`:'<p class="empty">El pronóstico no estima este partido.</p>'}
 ${ca&&num(ca.escanos?.[id])?`<p class="panel-nota">Desde el corte del ${h(fday(ca.fecha))}: ${signed(ca.escanos[id],0)} escaños y ${num(ca.voto?.[id])?signed(ca.voto[id])+' puntos':'voto sin cambio registrado'}${ca.nuevas?.length?`; entraron ${ca.nuevas.length} encuestas nuevas`:''}.${ca.cambio_metodo?' Entre ambos cortes cambió la versión del modelo.':''}</p>`:''}
 <h3>La misma cifra, capa por capa</h3>
 <table class="panel-tabla"><tbody>${filasCapas.map(([a,b,c])=>`<tr><th scope="row">${h(a)}</th><td><b>${b}</b><small>${h(c)}</small></td></tr>`).join('')}</tbody></table>
 ${contrib.length?`<h3>Encuestas del promedio</h3><ol class="panel-lista">${contrib.map(c=>`<li><b>${h(c.institute)}</b> <span>${fmt(c.value)} %</span><small>campo hasta el ${h(fday(c.fin))}${c.label&&c.label!==name(id)?' · como «'+h(c.label)+'»':''}</small></li>`).join('')}</ol>`:''}
 ${encuestas.length?`<h3>Últimas encuestas publicadas</h3><ol class="panel-lista">${encuestas.map(x=>{const c=x.anterior?.cambio?.[id];return `<li><b>${h(x.casa)}</b> <span>${fmt(x.voto[id])} %${num(c)?` <small class="${c>0?'sube':c<0?'baja':''}">${signed(c)}</small>`:''}</span><small>${h(fday(x.pub))} · ${h(x.estado[1])}</small></li>`;}).join('')}</ol>`:''}
 ${provincias.length?`<h3>Dónde saca sus escaños</h3><p class="panel-nota">Reparto medio de las simulaciones; las cifras con decimales indican escaños en disputa.</p><ol class="panel-provincias">${provincias.slice(0,10).map(x=>`<li><span>${h(x.prov)}</span><b>${fmt(x.n,x.n%1?1:0)}</b><small>de ${x.total}</small></li>`).join('')}</ol>`:''}
 ${enlaces([['#pronostico-principal','Pronóstico completo'],['#pronostico-territorio','Las 52 circunscripciones'],['#pronostico-evolucion','Evolución por cortes'],['#pronostico-capas','Promedio frente a pronóstico']])}`;
}

/** Bloque: suma aritmética, intervalo y probabilidad de llegar a 176. */
export function panelBloque(id,{forecast}){
 const b=BLOCKS.find(x=>x.id===id),x=forecast?.principal?.bloques?.[id];
 if(!b||!x)return '<p class="empty">Bloque no disponible.</p>';
 const partes=b.parties.map(p=>[p,forecast.principal.partidos?.[p]?.escanos?.[0]]).filter(([,n])=>num(n));
 return `<header class="panel-cab"><h2 id="panel-titulo">${h(b.label)}</h2></header>
 <div class="panel-cifras"><div><span>Escaños</span><strong>${fmt(x.mediana,0)}</strong><small>${fmt(x.p5,0)}–${fmt(x.p95,0)} (90 %)</small></div>
  <div><span>176 o más</span><strong>${share(x.p_mayoria)}</strong><small>de las simulaciones</small></div></div>
 <h3>Composición</h3><ol class="panel-lista">${partes.map(([p,n])=>`<li><b><i class="panel-punto" style="--c:${color(p)}"></i>${h(name(p))}</b> <span>${fmt(n,0)}</span></li>`).join('')}</ol>
 <p class="panel-nota">${h(BLOCK_NOTE)} La mediana del bloque se calcula en cada simulación, así que no tiene por qué coincidir con la suma de las medianas de sus partidos.</p>
 ${enlaces([['#pronostico-bloques','Todos los bloques'],['#pronostico-principal','Pronóstico completo']])}`;
}

/** Encuesta: ficha, cifras, cambio frente a su oleada anterior y estado en el pronóstico. */
export function panelEncuesta(x){
 if(!x)return '<p class="empty">Encuesta no disponible.</p>';
 const ids=Object.keys(x.voto).filter(k=>num(x.voto[k]));
 const [cls,txt,motivo]=x.estado;
 return `<header class="panel-cab"><h2 id="panel-titulo">${h(x.casa)}</h2><p>Publicada el ${h(fday(x.pub))}</p></header>
 <dl class="panel-ficha"><dt>Trabajo de campo</dt><dd>${x.sinFin?(x.ini?`desde el ${h(fday(x.ini))}, sin fecha de fin publicada`:'no publicado'):`${x.ini?h(fday(x.ini))+' – ':'hasta el '}${h(fday(x.fin))}`}</dd>
  <dt>Muestra</dt><dd>${x.n?Number(x.n).toLocaleString('es-ES')+' entrevistas':'no publicada'}</dd>
  <dt>Estado</dt><dd><span class="hub-estado ${cls}">${h(txt)}</span>${motivo?`<small>${h(motivo)}</small>`:''}</dd></dl>
 <h3>Estimación de voto</h3>
 <table class="panel-tabla"><thead><tr><th>Partido</th><th>Voto</th><th>${x.anterior?`Cambio desde el ${h(fday(x.anterior.fin))}`:'Cambio'}</th></tr></thead><tbody>${ids.map(k=>{const c=x.anterior?.cambio?.[k];return `<tr><th scope="row"><i class="panel-punto" style="--c:${color(k)}"></i>${h(name(k))}</th><td><b>${fmt(x.voto[k])} %</b></td><td>${num(c)?`<span class="${c>0?'sube':c<0?'baja':''}">${signed(c)} pp</span>`:'—'}</td></tr>`;}).join('')}</tbody></table>
 ${x.anterior?'':'<p class="panel-nota">No hay una oleada anterior de esta casa registrada.</p>'}
 ${x.url?`<p><a class="panel-original" href="${h(x.url)}" target="_blank" rel="noopener">Fuente ↗</a></p>`:''}
 ${enlaces([['#encuestas','Archivo de encuestas'],['#pronostico-fuentes','Estudios usados y excluidos']])}`;
}

/** Monta el panel y delega los clics de la portada en elementos con data-panel="tipo:id". */
export function bindPanel(root,obtener){
 let aside=document.querySelector('#hub-panel-lateral');
 if(!aside){
  aside=document.createElement('div');aside.id='hub-panel-lateral';aside.hidden=true;
  aside.innerHTML=`<div class="panel-fondo" data-cerrar></div><aside class="panel-lateral" role="dialog" aria-modal="true" aria-labelledby="panel-titulo" tabindex="-1"><button type="button" class="panel-cerrar" data-cerrar aria-label="Cerrar">×</button><div data-contenido></div></aside>`;
  document.body.appendChild(aside);
 }
 const box=aside.querySelector('.panel-lateral'),contenido=aside.querySelector('[data-contenido]');
 let origen=null;
 const cerrar=()=>{aside.hidden=true;document.body.classList.remove('panel-abierto');origen?.focus?.();};
 const abrir=(clave,desde)=>{
  const html=obtener(clave);if(!html)return;
  origen=desde;contenido.innerHTML=html;aside.hidden=false;document.body.classList.add('panel-abierto');box.scrollTop=0;box.focus();
 };
 aside.onclick=e=>{if(e.target.closest('[data-cerrar]')||e.target.closest('.panel-enlaces a'))cerrar();};
 aside.onkeydown=e=>{if(e.key==='Escape')cerrar();};
 const activar=e=>{
  const t=e.target.closest('[data-panel]');if(!t||!root.contains(t))return;
  if(e.type==='keydown'&&e.key!=='Enter'&&e.key!==' ')return;
  if(t.tagName==='A')return;
  e.preventDefault();abrir(t.dataset.panel,t);
 };
 root.addEventListener('click',activar);root.addEventListener('keydown',activar);
 const salir=()=>{if(!root.isConnected){cerrar();window.removeEventListener('hashchange',salir);}};
 window.addEventListener('hashchange',salir);
}

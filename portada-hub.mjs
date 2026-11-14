// Portada como centro de la web: hemiciclo del Motor 29N, promedio de encuestas, últimas
// encuestas en tarjetas y accesos a cada sección con su cifra clave.
// Solo presentación. Las cifras salen del pronóstico publicado (capa 3), del promedio (capa 1)
// y del archivo verificado; aquí no se calcula ninguna estimación.
// Orden: toda lista de encuestas, la más reciente primero (orden.mjs).
import {PARTY_COLORS} from './portada-series.mjs';
import {PARTIES,canonicalValues} from './capas.mjs';

const h=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=(v,d=1)=>Number(v).toLocaleString('es-ES',{minimumFractionDigits:d,maximumFractionDigits:d});
const fday=s=>s?new Date(String(s).slice(0,10)+'T12:00:00Z').toLocaleDateString('es-ES',{day:'numeric',month:'short',timeZone:'Europe/Madrid'}):'—';
const signed=(v,d=1)=>(v>0?'+':v<0?'−':'±')+fmt(Math.abs(v),d);
const name=id=>PARTIES.find(x=>x.id===id)?.label||id;
const short=id=>({SUMAR:'FA',PODEMOS:'Pod.',BILDU:'Bildu'}[id]||name(id));
const color=id=>PARTY_COLORS[id]||'#7b8784';
const share=p=>p<0.005?'menos del 1 %':p>0.995?'más del 99 %':fmt(p*100,0)+' %';

/** Orden del hemiciclo, de izquierda a derecha. Convención gráfica, no clasificación ideológica oficial. */
export const ORDEN_HEMICICLO=['PODEMOS','SUMAR','BILDU','ERC','BNG','PSOE','PNV','CC','JUNTS','UPN','PP','VOX','SALF'];
export const PRINCIPALES=['PP','PSOE','VOX','SUMAR','PODEMOS'];

/** Posiciones de 350 escaños en semicírculo, de izquierda a derecha. */
export function asientos(total=350,filas=12){
 const r0=0.38,radios=Array.from({length:filas},(_,i)=>r0+(1-r0)*i/(filas-1));
 const suma=radios.reduce((s,r)=>s+r,0);
 let por=radios.map(r=>Math.floor(total*r/suma));
 for(let i=filas-1,rest=total-por.reduce((s,n)=>s+n,0);rest>0;i=(i-1+filas)%filas,rest--)por[i]++;
 const pts=[];
 radios.forEach((r,i)=>{const k=por[i];for(let j=0;j<k;j++){const a=Math.PI*(1-j/(k-1));pts.push({a,r,x:r*Math.cos(a),y:r*Math.sin(a)});}});
 return pts.sort((p,q)=>q.a-p.a||p.r-q.r);
}

/** Hemiciclo: un punto por escaño con la mediana de cada partido; los que no suman 350, en gris. */
export function hemiciclo(partidos){
 const reparto=ORDEN_HEMICICLO.filter(id=>Number.isFinite(partidos?.[id]?.escanos?.[0])).map(id=>[id,Math.round(partidos[id].escanos[0])]).filter(([,n])=>n>0);
 const otros=Object.entries(partidos||{}).filter(([id,v])=>!ORDEN_HEMICICLO.includes(id)&&v?.escanos?.[0]>0).map(([id,v])=>[id,Math.round(v.escanos[0])]);
 const lista=[...reparto,...otros],suma=lista.reduce((s,[,n])=>s+n,0);
 const pts=asientos(350),W=400,H=226,R=190,cx=200,cy=216;
 let i=0;const dots=[];
 for(const [id,n] of lista)for(let k=0;k<n&&i<350;k++,i++)dots.push([pts[i],color(id),id]);
 for(;i<350;i++)dots.push([pts[i],'#d9dfdc','resto']);
 const circles=dots.map(([p,c,id])=>`<circle${id==='resto'?'':` data-panel="partido:${id}"`} cx="${(cx+p.x*R).toFixed(1)}" cy="${(cy-p.y*R).toFixed(1)}" r="4.6" fill="${c}" data-p="${id}"/>`).join('');
 const label=lista.map(([id,n])=>`${name(id)} ${n}`).join(', ');
 return {svg:`<svg class="hub-hemiciclo" viewBox="0 0 ${W} ${H}" role="img" aria-label="Hemiciclo de 350 escaños con la mediana de cada partido: ${h(label)}${suma<350?`; ${350-suma} sin asignar porque las medianas no suman 350`:''}.">${circles}<line x1="${cx}" y1="${cy-R-9}" x2="${cx}" y2="${cy-R*0.3}" stroke="#16231e" stroke-width="1.2" stroke-dasharray="3 3"/><text x="${cx}" y="${cy-R-12}" text-anchor="middle" class="hub-176">176</text></svg>`,suma,lista};
}

export function renderHemiciclo(forecast){
 const p=forecast?.principal;
 if(!p?.partidos)return '<p class="empty">Pronóstico no disponible para este corte.</p>';
 const {svg,suma,lista}=hemiciclo(p.partidos);
 const b=p.bloques||{};
 const bloque=(id,lab)=>b[id]?`<div class="hub-bloque" role="button" tabindex="0" data-panel="bloque:${id}"><span>${lab}</span><strong>${fmt(b[id].mediana,0)}</strong><small>176 o más en ${share(b[id].p_mayoria)} de las simulaciones</small></div>`:'';
 const leyenda=lista.filter(([,n])=>n>0).sort((a,b)=>b[1]-a[1]).map(([id,n])=>`<li><button type="button" data-panel="partido:${id}"><i style="--c:${color(id)}"></i>${h(short(id))} <b>${n}</b></button></li>`).join('');
 return `${svg}<ul class="hub-leyenda">${leyenda}</ul>
 <div class="hub-bloques">${bloque('PP+VOX','PP + Vox')}${bloque('PSOE+SUMAR+PODEMOS','PSOE + FA + Podemos')}</div>
 <p class="hub-pista">Pulsa un partido, un bloque, una barra o una encuesta para ver el detalle.</p>
 <p class="hub-nota">Mediana de las simulaciones de cada partido${suma<350?`; las medianas suman ${suma}, los ${350-suma} puntos grises no se asignan`:''}. Las sumas de bloque son aritméticas, no pactos.</p>`;
}

/** Barras del promedio publicado (capa 1): valor y cuántas encuestas publican el partido. */
/** Barras del promedio publicado (capa 1) con una marca en la estimación del Motor 29N (capa 3). */
export function renderPromedio(prom,forecast=null,baseModelo=false){
 if(!prom)return '<p class="empty">Promedio no disponible.</p>';
 const activos=prom.estudios.filter(e=>e.weight>0);
 const N=activos.length;
 const modelo=forecast?.principal?.partidos||{};
 const filas=PARTIES.map(p=>[p.id,prom.partidos[p.id]]).filter(([,v])=>v&&Number.isFinite(v.valor)).sort((a,b)=>b[1].valor-a[1].valor).slice(0,8);
 const max=Math.max(35,...filas.map(([id,v])=>Math.max(v.valor,modelo[id]?.voto?.[0]||0)));
 const ultima=activos.map(e=>e.fieldEnd).sort().at(-1);
 const pos=v=>(v/max*100).toFixed(1)+'%';
 const filasHTML=filas.map(([id,v])=>{
  const m=modelo[id]?.voto?.[0];
  return `<li><div class="hub-barra-control" role="button" tabindex="0" data-panel="partido:${id}" aria-label="${h(name(id))}: detalle"><span class="hub-barra-nombre">${h(id==='SUMAR'?'Sumar / FA':name(id))}</span><span class="hub-barra-pista"><span style="width:${pos(v.valor)};--c:${color(id)}"></span>${Number.isFinite(m)?`<i class="hub-marca" style="left:${pos(m)}" title="Pronóstico ${fmt(m)} %"></i>`:''}</span><b>${fmt(v.valor)} %<small>${v.n} de ${N}</small></b><span class="hub-modelo">${Number.isFinite(m)?`${fmt(m)} %<small class="hub-diferencia" title="Diferencia frente al promedio">${signed(m-v.valor)} pp</small>`:'—'}</span></div></li>`;
 }).join('');
 return `<div class="hub-barras-cab" aria-hidden="true"><span></span><span><i class="hub-muestra"></i>promedio · <i class="hub-muestra-marca"></i>pronóstico</span><b>Promedio</b><span>Pronóstico<br><small>Dif. en pp</small></span></div>
 <ol class="hub-barras">${filasHTML}</ol>
 <p class="hub-nota">Promedio simple del último estudio de cada instituto con fin de campo en los ${prom.ventana} días anteriores al ${h(fday(prom.corte))}: <b>${N} encuestas de ${prom.institutos} institutos</b>${baseModelo?', las mismas que usa el pronóstico':''}; la más reciente, con campo hasta el ${h(fday(ultima))}. «X de ${N}»: cuántas publican ese partido; las ausentes no cuentan como cero. La marca negra y la última columna son la estimación del Motor 29N.</p>`;
}

/** Cuántas encuestas hay y en qué situación, para leer las tarjetas. */
export function renderRecuentoEncuestas(forecast,polls=[]){
 if(!forecast)return '';
 const dentro=forecast.entradas?.filter(e=>e.campo_fin>='2023-07-24').length??0;
 const fuera=forecast.excluidas?.length??0;
 const despues=polls.filter(p=>p.kind==='poll-estimate'&&p.published>forecast.corte).length;
 return `<b>${dentro}</b> encuestas en el pronóstico · <b>${fuera}</b> registradas fuera de él (sin original consultado, sin fecha de campo o sustituidas)${despues?` · <b>${despues}</b> publicadas después del corte`:''}. Corte del ${h(fday(forecast.corte))}.`;
}

const ESTADO={
 'verificada':['ok','En el pronóstico'],
 'prensa-original-consultado':['ok','En el pronóstico'],
 'terceros-29n':['ok','En el pronóstico · terceros'],
 'terceros-wikipedia':['ok','En el pronóstico · terceros'],
};

/** Lista de encuestas recientes, la más reciente primero, a partir de las entradas y exclusiones
 * del Motor 29N y del archivo verificado (lo publicado después del corte aún no está en el motor). */
export function encuestasRecientes(forecast,polls,{desde=null,limite=8,deduplicate=false,latestPerHouse=false}={}){
 const vistos=new Set(),out=[];
 const add=x=>{if(!x.id||vistos.has(x.id))return;vistos.add(x.id);out.push(x);};
 for(const e of forecast?.entradas||[])add({id:e.estudio,casa:e.casa,pub:e.publicacion||e.campo_fin,ini:e.campo_ini,fin:e.campo_fin,n:e.n_supuesto?null:e.n,voto:e.voto||{},estado:ESTADO[e.origen]||['ok','En el pronóstico'],url:e.url});
 for(const e of forecast?.excluidas||[])add({id:e.estudio,casa:e.casa,pub:e.publicacion||e.campo_fin,ini:e.campo_ini,fin:e.campo_fin,sinFin:!!e.campo_supuesto,n:e.n??null,voto:e.voto||{},estado:['fuera','Fuera del pronóstico',e.motivo],url:e.url});
 const ids=new Set(out.map(x=>x.id));
 for(const p of polls||[]){
  if(p.kind!=='poll-estimate'||ids.has(p.id))continue;
  const v=canonicalValues(p.values||{}),voto=Object.fromEntries(Object.entries(v.values||{}).map(([k,x])=>[k,x]));
  const pendiente=forecast?.corte&&p.published>forecast.corte;
  add({id:p.id,casa:p.institute,pub:p.published,ini:p.fieldStart,fin:p.fieldEnd,n:p.sample??null,voto,estado:pendiente?['pend','Pendiente del próximo corte']:['arch','Archivo verificado'],url:p.source});
 }
 // Presentation-only duplicates: the model and its complete audit retain all IDs.
 const fingerprint=x=>JSON.stringify([String(x.casa).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase(),x.ini||'',x.fin||'',x.n||null,Object.entries(x.voto).sort(([a],[b])=>a.localeCompare(b))]);
 const seen=new Set();const displayed=deduplicate?out.filter(x=>{const key=fingerprint(x);if(seen.has(key))return false;seen.add(key);return true;}):out;
 let lista=displayed.filter(x=>x.pub&&(!desde||x.pub>=desde)&&Object.keys(x.voto).length)
  .sort((a,b)=>String(b.pub).localeCompare(String(a.pub))||String(b.fin).localeCompare(String(a.fin))||String(a.casa).localeCompare(String(b.casa),'es'));
 if(latestPerHouse){const houses=new Set();lista=lista.filter(x=>{const key=String(x.casa).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();if(houses.has(key))return false;houses.add(key);return true;});}
 // Cambio frente a la oleada anterior de la misma casa (por fin de campo), dentro de todo lo registrado.
 const todas=[...out].sort((a,b)=>String(b.fin).localeCompare(String(a.fin)));
 for(const x of lista){
  const prev=todas.find(y=>y.casa===x.casa&&y.id!==x.id&&String(y.fin)<String(x.fin));
  x.anterior=prev?{fin:prev.fin,cambio:Object.fromEntries(PRINCIPALES.filter(k=>Number.isFinite(x.voto[k])&&Number.isFinite(prev.voto[k])).map(k=>[k,x.voto[k]-prev.voto[k]]))}:null;
 }
 return lista.slice(0,limite);
}

export function renderTarjetas(lista,{compacto=false}={}){
 if(!lista.length)return '<p class="empty">No hay encuestas recientes registradas.</p>';
 return `<ol class="hub-tarjetas${compacto?' hub-tarjetas-compactas':''}">${lista.map(x=>{
  const segs=PRINCIPALES.filter(k=>Number.isFinite(x.voto[k])).map(k=>`<span style="flex:${x.voto[k]} 0 0;--c:${color(k)}" title="${h(name(k))} ${fmt(x.voto[k])} %">${!compacto&&x.voto[k]>=9?fmt(x.voto[k]):''}</span>`).join('');
  const resto=100-PRINCIPALES.reduce((s,k)=>s+(Number.isFinite(x.voto[k])?x.voto[k]:0),0);
  const cifras=(compacto?PRINCIPALES.slice(0,3):PRINCIPALES).filter(k=>Number.isFinite(x.voto[k])).map(k=>{const c=compacto?null:x.anterior?.cambio?.[k];return `<li><i style="--c:${color(k)}"></i>${h(short(k))} <b>${fmt(x.voto[k])}</b>${Number.isFinite(c)?`<small class="${c>0?'sube':c<0?'baja':''}">${signed(c)}</small>`:''}</li>`;}).join('');
  const [cls,txt,motivo]=x.estado;
  return `<li class="hub-tarjeta"><div class="hub-tarjeta-control" role="button" tabindex="0" data-panel="encuesta:${h(x.id)}" aria-label="${h(x.casa)}, ${h(fday(x.pub))}: ficha">
   <div class="hub-tarjeta-cab"><b>${h(x.casa)}</b><time datetime="${h(x.pub)}">${h(fday(x.pub))}</time></div>
   <p class="hub-tarjeta-ficha">${x.sinFin?(x.ini?`Campo desde ${h(fday(x.ini))}, sin fecha de fin publicada`:'Fechas de campo no publicadas'):`Campo ${x.ini?h(fday(x.ini))+'–':'hasta '}${h(fday(x.fin))}`}${x.n?` · n=${Number(x.n).toLocaleString('es-ES')}`:''}</p>
   <div class="hub-apilada" role="img" aria-label="${h(PRINCIPALES.filter(k=>Number.isFinite(x.voto[k])).map(k=>name(k)+' '+fmt(x.voto[k])+' %').join(', '))}">${segs}<span class="resto" style="flex:${Math.max(0,resto)} 0 0"></span></div>
   <ul class="hub-cifras">${cifras}</ul>
   ${compacto?'':`<p class="hub-estado ${cls}"${motivo?` title="${h(motivo)}"`:''}>${h(txt)}${motivo?`<small>${h(motivo)}</small>`:''}</p>`}
   ${compacto?'':x.anterior?`<p class="hub-tarjeta-ref">Cambio frente a su oleada anterior (campo hasta el ${h(fday(x.anterior.fin))})</p>`:'<p class="hub-tarjeta-ref">Sin oleada anterior registrada</p>'}
  </div></li>`;}).join('')}</ol>`;
}

/** Accesos a cada sección con su cifra clave. */
export function renderAccesos({forecast,polls=[],events=[],references=[]}){
 const archivo=polls.filter(p=>p.kind==='poll-estimate');
 const ultimaPub=archivo.map(p=>p.published).sort().at(-1);
 const ev=[...events].sort((a,b)=>String(b.date).localeCompare(String(a.date)))[0];
 const ext=[...(forecast?.externos||[])].sort((a,b)=>String(b.fecha).localeCompare(String(a.fecha)))[0];
 const ranking=Object.entries(forecast?.principal?.partidos||{}).filter(([,v])=>Number.isFinite(v?.escanos?.[0])).sort((a,b)=>b[1].escanos[0]-a[1].escanos[0]);
 const cabeza=ranking[0];
 const items=[
  ['#pronostico','Pronóstico completo',forecast?`Corte del ${fday(forecast.corte)} · ${forecast.entradas?.length??'—'} estudios`:'No disponible',cabeza?`Primera fuerza estimada: ${name(cabeza[0])} · ${fmt(cabeza[1].escanos[0],0)} escaños`:''],
  ['#encuestas','Encuestas y promedios',`${forecast?.entradas?.length??'—'} en el pronóstico · ${forecast?.excluidas?.length??'—'} fuera`,`${archivo.length} fichas en el archivo verificado${ultimaPub?' · última: '+fday(ultimaPub):''}`],
  ['#contexto','Acontecimientos',`${events.length} registrados`,ev?`${fday(ev.date)} · ${ev.title}`:''],
  ['#cocina','Cocina','De la intención directa a la estimación','Microdatos del CIS y 40dB'],
  ['#atlas','Atlas y simulador','52 circunscripciones','Resultados de 2023 y escenarios D’Hondt'],
  ['#metodologia','Método y fuentes','Qué es cada cifra y de dónde sale','Capas, fuentes y límites'],
 ];
 return `<nav class="hub-accesos" aria-label="Secciones del Observatorio">${items.map(([href,t,a,b])=>`<a href="${href}"><b>${h(t)}</b><span>${h(a)}</span>${b?`<small>${h(b)}</small>`:''}</a>`).join('')}</nav>`;
}

/** Todas las encuestas registradas (pronóstico, fuera y pendientes), la más reciente primero. */
export function renderTodasEncuestas(forecast,polls){
 const lista=encuestasRecientes(forecast,polls,{limite:1000}).filter(x=>String(x.fin||x.pub)>='2026-01-01');
 if(!lista.length)return '<p class="empty">Sin encuestas registradas.</p>';
 const dentro=lista.filter(x=>x.estado[0]==='ok').length;
 const cel=(x,k)=>Number.isFinite(x.voto[k])?fmt(x.voto[k]):'—';
 return `<p class="muted">${lista.length} encuestas de 2026 registradas: ${dentro} en el pronóstico y ${lista.length-dentro} fuera o pendientes. Por fecha de publicación, la más reciente primero. «—»: no publicado o no transcrito.</p>
 <div class="table-wrap"><table class="todas-encuestas"><thead><tr><th>Casa</th><th>Publicación</th><th>Campo</th><th>n</th>${PRINCIPALES.map(k=>`<th class="num">${h(short(k))}</th>`).join('')}<th>Estado</th></tr></thead><tbody>${lista.map(x=>`<tr><th scope="row">${x.url?`<a href="${h(x.url)}" target="_blank" rel="noopener">${h(x.casa)} ↗</a>`:h(x.casa)}</th><td>${h(fday(x.pub))}</td><td>${x.sinFin?(x.ini?'desde '+h(fday(x.ini)):'no publicado'):`${x.ini?h(fday(x.ini))+'–':''}${h(fday(x.fin))}`}</td><td>${x.n?Number(x.n).toLocaleString('es-ES'):'—'}</td>${PRINCIPALES.map(k=>`<td class="num">${cel(x,k)}</td>`).join('')}<td><span class="hub-estado ${x.estado[0]}">${h(x.estado[1])}</span>${x.estado[2]?`<small>${h(x.estado[2])}</small>`:''}</td></tr>`).join('')}</tbody></table></div>`;
}

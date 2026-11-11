// Pronóstico completo por capítulos: cifras clave, índice visual y gráfico de intervalos.
// Reordena las secciones ya renderizadas (por id; los enlaces y los enlazados asíncronos siguen
// funcionando porque los ids no cambian). Solo presentación: lee el pronóstico publicado.
import {PARTY_COLORS} from './portada-series.mjs';
import {PARTIES} from './capas.mjs';

const h=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=(v,d=1)=>Number(v).toLocaleString('es-ES',{minimumFractionDigits:d,maximumFractionDigits:d});
const fday=s=>s?new Date(String(s).slice(0,10)+'T12:00:00Z').toLocaleDateString('es-ES',{day:'numeric',month:'long',timeZone:'Europe/Madrid'}):'—';
const name=id=>PARTIES.find(x=>x.id===id)?.label||id;
const share=p=>p<0.005?'menos del 1 %':p>0.995?'más del 99 %':fmt(p*100,0)+' %';

export const CAPITULOS=[
 ['pronostico-cap1','El resultado','Escaños y voto de cada partido, bloques e investidura',['pronostico-principal','pronostico-bloques','.investidura']],
 ['pronostico-cap2','Cómo se ha movido','Evolución por cortes y cambios desde el anterior',['pronostico-evolucion','pronostico-cambios']],
 ['pronostico-cap3','Dónde','Las 52 circunscripciones',['pronostico-territorio']],
 ['pronostico-cap4','Cómo se calcula','Del dato al escaño, las capas y las variantes',['pronostico-cocina','pronostico-capas','pronostico-procedencia','pronostico-variantes','.trace-cocina']],
 ['pronostico-cap5','Con qué encuestas','Estudios usados, excluidos y por qué',['fc-counts','pronostico-fuentes']],
 ['pronostico-cap6','¿Acierta?','Examen frente a elecciones pasadas',['pronostico-evaluacion']],
 ['pronostico-cap7','Otros modelos','Promedios y pronósticos de terceros',['pronostico-externos']],
];

/** Cifras clave del corte. */
export function renderCifrasClave(f){
 const p=f?.principal;if(!p?.partidos)return '';
 const top=Object.entries(p.partidos).filter(([,v])=>v?.escanos?.[0]>0).sort((a,b)=>b[1].escanos[0]-a[1].escanos[0]).slice(0,3);
 const b=p.bloques?.['PP+VOX'];
 return `<div class="pr-cifras">${top.map(([id,v])=>`<div style="--c:${PARTY_COLORS[id]||'#7b8784'}"><span>${h(name(id))}</span><strong>${fmt(v.escanos[0],0)}</strong><small>${fmt(v.escanos[1],0)}–${fmt(v.escanos[2],0)} escaños · ${fmt(v.voto[0])} %</small></div>`).join('')}
 ${b?`<div><span>PP + Vox</span><strong>${fmt(b.mediana,0)}</strong><small>176 o más en ${share(b.p_mayoria)} de las simulaciones</small></div>`:''}
 <div><span>Corte</span><strong class="pr-cifra-fecha">${h(fday(f.corte))}</strong><small>${f.entradas?.length??'—'} encuestas · ${f.excluidas?.length??0} fuera</small></div></div>`;
}

/** Escaños y voto por partido: punto en la mediana, barra del 5 al 95 %; sustituye a la tabla principal sin perder columnas. */
export function renderIntervalos(f){
 const pr=f?.principal,p=pr?.partidos;if(!p)return '';
 const sin=new Set(pr.sin_encuestas||[]);
 const filas=Object.entries(p).sort((a,b)=>b[1].escanos[0]-a[1].escanos[0]||b[1].voto[0]-a[1].voto[0]);
 const max=Math.max(160,...filas.map(([,v])=>v.escanos[2]));
 const x=v=>(v/max*100).toFixed(2)+'%';
 const marcas=[0,25,50,75,100,125,150].filter(v=>v<=max-12);
 return `<figure class="pr-intervalos"><figcaption>Mediana e intervalo del 90 % de ${fmt(pr.n,0)} simulaciones. Punto: escaños en la mediana; barra: del 5 al 95 %. Error de industria ${fmt(pr.industria,1)} pp para un partido del 25 %. La mayoría absoluta está en 176.</figcaption>
 
 <ol><li class="pr-int-fila pr-int-eje"><span>Partido</span><span class="pr-int-marcas" aria-hidden="true">${marcas.map(v=>`<span style="left:${x(v)}">${v}</span>`).join('')}</span><span>Escaños</span><span>Voto</span><span>1.ª fuerza</span></li>${filas.map(([id,v])=>{const c=PARTY_COLORS[id]||'#7b8784';return `<li class="pr-int-fila"><span class="pr-int-nombre">${h(name(id))}${sin.has(id)?' <small class="warn">sin encuestas · hipótesis 23J</small>':''}</span><span class="pr-int-pista" role="img" aria-label="${h(name(id))}: ${fmt(v.escanos[0],0)} escaños, entre ${fmt(v.escanos[1],0)} y ${fmt(v.escanos[2],0)}"><i class="pr-int-barra" style="left:${x(v.escanos[1])};width:calc(${x(v.escanos[2])} - ${x(v.escanos[1])});--c:${c}"></i><i class="pr-int-punto" style="left:${x(v.escanos[0])};--c:${c}"></i></span><span><b>${fmt(v.escanos[0],0)}</b> <small>${fmt(v.escanos[1],0)}–${fmt(v.escanos[2],0)}</small></span><span><b>${fmt(v.voto[0])} %</b> <small>${fmt(v.voto[1])}–${fmt(v.voto[2])}</small></span><span>${v.primero>0?fmt(v.primero*100,0)+' %':'—'}</span></li>`;}).join('')}</ol></figure>`;
}

/** Reordena la página en capítulos. Devuelve el número de secciones colocadas. */
export function organizarPronostico(root){
 if(!root||root.querySelector('.pr-indice'))return 0;
 const hero=root.querySelector('.editorial-opening')||root.querySelector('.hero');
 const sub=root.querySelector('.subnav');
 const indice=document.createElement('nav');indice.className='cocina-indice pr-indice';indice.setAttribute('aria-label','Capítulos del pronóstico');
 indice.innerHTML=CAPITULOS.map(([id,t,s],i)=>`<a href="#${id}"><b>${i+1}</b><span>${h(t)}</span><small>${h(s)}</small></a>`).join('');
 const cifras=document.createElement('div');cifras.id='pr-cifras-clave';
 (hero||root.firstChild)?.after?.(cifras);cifras.after(indice);
 sub?.remove();
 let colocadas=0,ancla=indice;
 CAPITULOS.forEach(([id,t,s,sels],i)=>{
  const cap=document.createElement('details');cap.open=i===0;cap.className='cocina-capitulo pr-capitulo chapter-reading';cap.id=id;cap.setAttribute('aria-labelledby',id+'-t');
  cap.innerHTML=`<summary class="cocina-cap-cab"><span class="cocina-cap-num">${i+1}</span><div><h2 id="${id}-t">${h(t)}</h2><p class="cocina-cap-pregunta">${h(s)}</p></div></summary>`;
  for(const sel of sels){const el=sel.startsWith('.')?root.querySelector(sel):root.querySelector('#'+sel);if(el){cap.append(el);colocadas++;}}
  ancla.after(cap);ancla=cap;
 });
 // Los títulos de sección ya no llevan la letra del orden antiguo (A., B.…).
 root.querySelectorAll('.pr-capitulo h2').forEach(t=>{t.textContent=t.textContent.replace(/^[A-I]\.\s+/,'');});
 return colocadas;
}

export async function bindOrdenPronostico(){
 const root=document.querySelector('#visor-contenido');if(!root)return;
 organizarPronostico(root);
 try{
  const r=await fetch('data/modelo/pronostico.json',{cache:'no-store'});if(!r.ok)return;
  const f=await r.json();if(!root.isConnected)return;
  const c=root.querySelector('#pr-cifras-clave');if(c)c.innerHTML=renderCifrasClave(f);
 }catch{}
}

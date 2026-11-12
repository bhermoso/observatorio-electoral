// Lectura por capítulos para páginas metodológicas extensas.
// Mejora progresiva: sin JavaScript todo el documento sigue visible.
const clean=s=>String(s??'').replace(/\s+/g,' ').trim();
const SHORT=[
 'Qué se calcula','De dónde sale','Qué significa','Cómo comprobarlo','Qué falta','Consultar fuentes'
];
function buildReading(){
 const main=document.querySelector('main.how,main.guide,main.method-wrap,main.vh');
 if(!main)return;
 let selector=main.matches('.how')?':scope > section.how-section':
   main.matches('.guide')?':scope > section.guide-section':
   main.matches('.method-wrap')?':scope > section.method-section':
   ':scope > section.vh-panel';
 const chapters=[...main.querySelectorAll(selector)].filter(s=>s.querySelector('h2'));
 if(chapters.length<3)return;
 chapters.forEach((section,i)=>{
  section.classList.add('lectura-capitulo');
  if(!section.id)section.id='capitulo-editorial-'+(i+1);
 });
 const root=document.createElement('section');
 root.className='lectura-directorio';
 root.setAttribute('aria-label','Índice de lectura');
 root.innerHTML='<div class="lectura-intro"><span class="lectura-kicker">UNA GUÍA PARA LEER, NO SOLO PARA CONSULTAR</span>'+
  '<h2>Elige qué quieres comprender.</h2><p>No tienes que recorrer todo el informe de principio a fin. Cada capítulo reúne una pregunta, los datos que la sustentan y sus limitaciones.</p>'+
  '</div><div class="lectura-acciones"><button type="button" class="lectura-modo active" data-reading-mode="guiada" aria-pressed="true">Lectura guiada</button>'+
  '<button type="button" class="lectura-modo" data-reading-mode="completa" aria-pressed="false">Documento completo</button>'+
  '<span class="lectura-contador">'+chapters.length+' capítulos · todo el contenido conservado</span></div>'+
  '<nav class="lectura-tarjetas" aria-label="Seleccionar capítulo"></nav>'+
  '<div class="lectura-progreso" role="status" aria-live="polite"></div>';
 const nav=root.querySelector('.lectura-tarjetas');
 const cards=chapters.map((section,i)=>{
  const heading=clean(section.querySelector('h2')?.textContent);
  const text=clean(section.querySelector('p')?.textContent).slice(0,160);
  const button=document.createElement('button');
  button.type='button';button.className='lectura-tarjeta';
  button.setAttribute('aria-controls',section.id);
  button.innerHTML='<span class="lectura-ordinal">'+String(i+1).padStart(2,'0')+'</span>'+
    '<strong></strong><small></small><span class="lectura-ir">Leer capítulo</span>';
  button.querySelector('strong').textContent=heading;
  button.querySelector('small').textContent=text||SHORT[i%SHORT.length];
  button.addEventListener('click',()=>select(i,true));
  nav.append(button);return button;
 });
 // Ubicar la navegación después de la introducción principal y antes del primer capítulo.
 chapters[0].before(root);
 let mode='guiada',current=0;
 function select(index,scroll=false){
  current=index;
  chapters.forEach((section,i)=>{section.hidden=mode==='guiada'&&i!==index;});
  cards.forEach((card,i)=>{
   card.classList.toggle('is-current',i===index);
   card.setAttribute('aria-pressed',String(i===index));
  });
  root.querySelector('.lectura-progreso').textContent=mode==='guiada'
   ?'Capítulo '+(index+1)+' de '+chapters.length+' · '+clean(chapters[index].querySelector('h2').textContent)
   :'Vista completa · '+chapters.length+' capítulos abiertos';
  if(scroll)chapters[index].scrollIntoView({behavior:'smooth',block:'start'});
 }
 root.querySelectorAll('[data-reading-mode]').forEach(button=>button.addEventListener('click',()=>{
  mode=button.dataset.readingMode;
  root.querySelectorAll('[data-reading-mode]').forEach(b=>{
   b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',String(b===button));
  });
  select(current,false);
 }));
 // Mantener operativos los enlaces internos y referencias cruzadas entre capítulos.
 document.addEventListener('click',event=>{
  const link=event.target.closest('a[href^="#"]');
  if(!link)return;
  const targetId=decodeURIComponent(link.getAttribute('href').slice(1));
  const target=document.getElementById(targetId);
  if(!target)return;
  const index=chapters.findIndex(section=>section===target||section.contains(target));
  if(index<0||mode!=='guiada')return;
  select(index,false);
 });
 const hash=decodeURIComponent(location.hash.slice(1));
 const requested=chapters.findIndex(section=>section.id===hash||section.querySelector('[id="'+CSS.escape(hash)+'"]'));
 select(requested<0?0:requested,false);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',buildReading);
else buildReading();

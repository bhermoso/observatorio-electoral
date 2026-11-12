import {renderTiposEstimacion} from './tipos-estimacion.mjs';
const h=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const guides={
 pronostico:['Estimación propia · Motor 29N','¿Qué resultados son plausibles?',[
  ['Comprender','El resultado, la incertidumbre y cómo se calcula','pronostico-comprender'],['Comparar','Variantes, promedios, bloques y evolución','pronostico-comparar'],['Auditar','Datos, exclusiones, métodos y evaluación','pronostico-auditar']]],
 encuestas:['Archivo de estimaciones publicadas','Compara fuentes antes de interpretar cambios.',[
  ['Ver la dispersión','Puntos por estudio y fechas de campo','encuestas-visual'],['Explorar el archivo','Filtra y consulta cada ficha original','encuestas-archivo'],['Seguir la actualización','Titulares, verificación y publicación','encuestas-actualizar']]],
 cocina:['Experimentación · no altera el pronóstico','Sigue el recorrido de la respuesta al escaño.',[
  ['Ver el motor vigente','Estimaciones publicadas y sus ajustes','cocina-cap5'],['Explorar los microdatos','Respuestas, cálculo y supuestos','cocina-cap3'],['Contrastar las recetas','Qué muestran las pruebas históricas','cocina-cap4']]],
 contexto:['Contexto documental · asociación temporal','Compara campos, fechas y fuentes.',[
  ['Elegir un suceso','Selecciona el acontecimiento y su ventana','contexto-explorar'],['Investigar cambios','Compara oleadas y su comparabilidad','contexto-resultados'],['Revisar los límites','Una coincidencia temporal no prueba causalidad','contexto-metodo']]],
 metodologia:['Método, fuentes y herramientas','Elige qué quieres comprender o comprobar.',[
  ['Entender el motor','Las operaciones y sus supuestos','flujograma.html'],['Explorar el territorio','Datos oficiales del 23J','atlas'],['Consultar las fuentes','Documentación y archivos reutilizables','metodologia-fuentes']]],
 atlas:['Datos oficiales · Congreso 2023','Explora las 52 circunscripciones.',[
  ['Elegir territorio','Busca, ordena o selecciona en el mapa','atlas-explorar'],['Leer el resultado','Voto, participación y escaños oficiales','atlas-detalle'],['Ensayar un cambio','Simulación sobre la base de 2023','laboratorio']]],
 laboratorio:['Experimento · fuera de las cuatro capas','¿Cómo cambia el reparto si cambian los votos?',[
  ['Definir un supuesto','Territorio y multiplicadores por partido','laboratorio-configurar'],['Comparar el reparto','Escaños simulados frente al 23J','laboratorio-resultado'],['Auditar la operación','Cocientes, umbral y empates','laboratorio-auditoria']]]
};
const openings={
 pronostico:['01','El pronóstico','Lo que sabemos. Lo que puede cambiar.','Una estimación se entiende mejor cuando se ve también su incertidumbre. Lee el resultado, compara las alternativas y sigue cada cifra hasta sus fuentes.'],
 encuestas:['02','Las encuestas','El pulso de las encuestas.','Una publicación no es una tendencia. Compara institutos, fechas y escenarios; después abre la ficha que sostiene cada punto.'],
 cocina:['03','La cocina electoral','De una respuesta a una estimación.','Datos, operaciones y supuestos: recorre el camino completo y comprueba qué puede reproducirse, qué se infiere y qué permanece sin identificar.'],
 contexto:['04','Los acontecimientos','Qué cambia alrededor de un suceso.','Cruza el calendario con los trabajos de campo. La proximidad de dos fechas abre una pregunta; por sí sola no demuestra una causa.'],
 metodologia:['05','El método','Cada cifra tiene un recorrido.','Conoce las operaciones del Motor 29N, sus fuentes y sus límites. Las herramientas permiten comprobar decisiones, no esconderlas detrás de una cifra.'],
 atlas:['06','El territorio','Un Congreso. Cincuenta y dos repartos.','El voto se convierte en escaños circunscripción a circunscripción. Explora la base oficial de 2023 antes de ensayar qué ocurriría si cambiara.'],
 laboratorio:['07','El laboratorio','Cambia el supuesto. Observa el reparto.','Un experimento para comprender D’Hondt: modifica el voto, compara con el 23J y examina los cocientes que deciden cada escaño.']
};
export function renderInteriorGuide(route,{polls=[],events=[]}={}){
 const g=guides[route],o=openings[route];if(!g||!o)return '';
 const count=new Set(polls.map(p=>p.institute)).size;
 const stats=route==='encuestas'?[[polls.length,'estudios en el archivo'],[count,'institutos documentados'],['Originales','fichas y fuentes accesibles']]:
  route==='cocina'?[[6,'capítulos para investigar'],['Datos / cálculo / hipótesis','tres naturalezas distintas'],['Fuera del motor','experimentos separados']]:
  route==='contexto'?[[events.length,'acontecimientos documentados'],['Campo','antes, durante y después'],['Cautela','asociación no implica causalidad']]:
  route==='atlas'||route==='laboratorio'?[[52,'circunscripciones'],[350,'escaños en la base oficial'],['23J · 2023','referencia territorial']]:
  [['4 tipos','procedencia de cada cifra'],['Motor 29N','pronóstico operativo'],['Auditoría abierta','fuentes, método y límites']];
 return `<section class="editorial-opening interior-guide" aria-label="Guía de la sección"><div class="editorial-kicker"><span>Cuaderno ${o[0]}</span><span>${h(o[1])}</span><a href="#dashboard">Observatorio Electoral Español ↗</a></div><div class="editorial-opening-grid"><div><span class="eyebrow">${h(g[0])}</span><h1>${h(o[2])}</h1><p class="editorial-deck">${h(o[3])}</p></div><aside class="editorial-margin" aria-label="Claves para esta lectura">${stats.map(([value,label])=>`<p><strong>${h(value)}</strong><span>${h(label)}</span></p>`).join('')}</aside></div><nav class="interior-paths editorial-contents" aria-label="Niveles de exploración">${g[2].map(([label,desc,target],i)=>`<a href="${target.endsWith('.html')?target:'#'+target}"><span class="interior-step">0${i+1}</span><strong>${h(label)}</strong><span>${h(desc)}</span></a>`).join('')}</nav><details class="layer-key"><summary>Qué clase de estimación estoy viendo</summary>${renderTiposEstimacion({compacto:true})}<p class="muted">Las capas técnicas del Motor 29N son variantes de cálculo, no cuatro clases diferentes de fuentes.</p></details></section>`;
}
/** Preserve explanatory copy in a native disclosure, without duplicating a second hero. */
export function prepareEditorialContent(route,markup){
 const template=document.createElement('template');template.innerHTML=markup;
 const hero=template.content.querySelector('.hero');
 if(hero){const details=document.createElement('details');details.className='editorial-context';
  const summary=document.createElement('summary');summary.textContent='Contexto de esta lectura · alcance, fechas y advertencias';
  details.append(summary);hero.querySelectorAll('h1').forEach(h=>{const title=document.createElement('h2');title.innerHTML=h.innerHTML;h.replaceWith(title);});
  hero.replaceWith(details);details.append(hero);
 }
 return template.innerHTML;
}
export function revealEditorialTarget(node){
 for(let parent=node;parent;parent=parent.parentElement)if(parent.tagName==='DETAILS')parent.open=true;
 node.scrollIntoView({block:'start'});
}
/** Shared zero-centred seat change graphic; raw counts remain in the adjacent table. */
export function renderSeatChanges(groups,baseline){
 const rows=groups.map(p=>({...p,delta:p.seats-(baseline.find(b=>b.id===p.id)?.seats||0)})).filter(p=>p.seats||baseline.find(b=>b.id===p.id)?.seats);
 const max=Math.max(1,...rows.map(p=>Math.abs(p.delta)));
 return `<figure class="seat-changes"><figcaption>Cambio de escaños frente al 23J · escala simétrica ±${max}</figcaption>${rows.map(p=>`<div class="seat-change"><span>${h(p.label)}</span><span class="delta-track"><i style="left:${p.delta<0?50+p.delta/max*50:50}%;width:${Math.abs(p.delta)/max*50}%;background:${p.delta<0?'#a34a39':'#286c58'}"></i></span><b>${p.delta>0?'+':''}${p.delta}</b></div>`).join('')}</figure>`;
}

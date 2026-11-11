import {LAYERS} from './capas.mjs';
const h=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const guides={
 pronostico:['Estimación propia · Motor 29N','¿Qué resultados son plausibles?',[
  ['Ver el panorama','Escaños, voto e intervalos del 90 %','pronostico-principal'],['Comparar escenarios','Variantes, bloques y territorio','pronostico-variantes'],['Auditar el resultado','Estudios, exclusiones y evaluación','pronostico-fuentes']]],
 encuestas:['Archivo de estimaciones publicadas','Compara fuentes antes de interpretar cambios.',[
  ['Ver la dispersión','Puntos por estudio y fechas de campo','encuestas-visual'],['Explorar el archivo','Filtra y consulta cada ficha original','encuestas-archivo'],['Seguir la actualización','Titulares, verificación y publicación','encuestas-actualizar']]],
 cocina:['Experimentación · no altera el pronóstico','Sigue el recorrido de la respuesta al escaño.',[
  ['Entender los pasos','Datos, cálculos e hipótesis','cocina-cap1'],['Probar un caso','De las respuestas al reparto territorial','cocina-cap2'],['Comprobar la evidencia','Contrastes con elecciones reales','cocina-cap4']]],
 contexto:['Contexto documental · asociación temporal','Compara campos, fechas y fuentes.',[
  ['Elegir un suceso','Selecciona el acontecimiento y su ventana','contexto-explorar'],['Investigar cambios','Compara oleadas y su comparabilidad','contexto-resultados'],['Revisar los límites','Una coincidencia temporal no prueba causalidad','contexto-metodo']]],
 metodologia:['Método, fuentes y herramientas','Elige qué quieres comprender o comprobar.',[
  ['Entender el motor','Las operaciones y sus supuestos','flujograma.html'],['Explorar el territorio','Datos oficiales del 23J','atlas'],['Consultar las fuentes','Documentación y archivos reutilizables','metodologia-fuentes']]],
 atlas:['Datos oficiales · Congreso 2023','Explora las 52 circunscripciones.',[
  ['Elegir territorio','Busca, ordena o selecciona en el mapa','atlas-explorar'],['Leer el resultado','Voto, participación y escaños oficiales','atlas-detalle'],['Ensayar un cambio','Simulación sobre la base de 2023','laboratorio']]],
 laboratorio:['Experimento · fuera de las cuatro capas','¿Cómo cambia el reparto si cambian los votos?',[
  ['Definir un supuesto','Territorio y multiplicadores por partido','laboratorio-configurar'],['Comparar el reparto','Escaños simulados frente al 23J','laboratorio-resultado'],['Auditar la operación','Cocientes, umbral y empates','laboratorio-auditoria']]]
};
export function renderInteriorGuide(route){
 const g=guides[route];if(!g)return '';
 return `<section class="interior-guide" aria-label="Guía de la sección"><span class="eyebrow">${h(g[0])}</span><h2>${h(g[1])}</h2><nav class="interior-paths" aria-label="Niveles de exploración">${g[2].map(([label,desc,target],i)=>`<a href="${target.endsWith('.html')?target:'#'+target}"><span class="interior-step">0${i+1}</span><strong>${h(label)}</strong><span>${h(desc)}</span></a>`).join('')}</nav><details class="layer-key"><summary>Cómo distinguir las cuatro capas y los experimentos</summary><div>${Object.values(LAYERS).map(l=>`<p><b>${l.capa} · ${h(l.nombre)}</b><br>${h(l.explica)}</p>`).join('')}<p><b>Experimentos:</b> cocina de microdatos y simuladores. Sus controles no modifican el pronóstico publicado.</p></div></details></section>`;
}
/** Shared zero-centred seat change graphic; raw counts remain in the adjacent table. */
export function renderSeatChanges(groups,baseline){
 const rows=groups.map(p=>({...p,delta:p.seats-(baseline.find(b=>b.id===p.id)?.seats||0)})).filter(p=>p.seats||baseline.find(b=>b.id===p.id)?.seats);
 const max=Math.max(1,...rows.map(p=>Math.abs(p.delta)));
 return `<figure class="seat-changes"><figcaption>Cambio de escaños frente al 23J · escala simétrica ±${max}</figcaption>${rows.map(p=>`<div class="seat-change"><span>${h(p.label)}</span><span class="delta-track"><i style="left:${p.delta<0?50+p.delta/max*50:50}%;width:${Math.abs(p.delta)/max*50}%;background:${p.delta<0?'#a34a39':'#286c58'}"></i></span><b>${p.delta>0?'+':''}${p.delta}</b></div>`).join('')}</figure>`;
}

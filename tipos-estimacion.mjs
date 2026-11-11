// Vocabulario público único de fuentes y estimaciones.
// No confundir las cuatro NATURALEZAS con las capas técnicas del Motor 29N.
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const TIPOS_ESTIMACION=Object.freeze([
 {numero:'01',etiqueta:'Instituto',titulo:'Estimación de una encuesta',
  descripcion:'Cifra elaborada por una encuestadora a partir de sus entrevistas. Cuando no publica microdatos, no podemos reconstruir su cocina completa.',
  estado:'Dato publicado por terceros · entra como estimación de la casa, no como respuesta individual',
  destino:'#encuestas',enlace:'Examinar encuestas',codigo:'instituto'},
 {numero:'02',etiqueta:'Agregación',titulo:'Promedio de encuestas',
  descripcion:'Combina estimaciones publicadas mediante una regla explícita de selección y ponderación. No reconstruye entrevistas ni equivale a una cocina individual.',
  estado:'Promedio propio de referencia · se compara, no se añade otra vez al motor',
  destino:'#pronostico-capas',enlace:'Ver comparación',codigo:'promedio'},
 {numero:'03',etiqueta:'Observatorio · vigente',titulo:'Nuestra estimación a partir de otras estimaciones',
  descripcion:'Motor 29N: combina estimaciones admitidas de las casas, tendencias, calibración histórica e incertidumbre para producir voto y escaños.',
  estado:'Pronóstico operativo · las estimaciones y promedios externos sirven de contraste; no se vuelven a incorporar como entradas',
  destino:'#pronostico',enlace:'Ver pronóstico y trazabilidad',codigo:'modelo'},
 {numero:'04',etiqueta:'Observatorio · investigación',titulo:'Nuestra estimación a partir de microdatos',
  descripcion:'Reconstruimos medidas desde respuestas individuales y probamos ponderaciones, recuerdo, simpatía, indecisión y participación, con evaluación de errores.',
  estado:'Estimaciones experimentales · todavía no alimentan el pronóstico operativo',
  destino:'#cocina-cap4',enlace:'Ver pruebas y cocina',codigo:'microdatos'}
]);
export function renderTiposEstimacion({compacto=false}={}){
 if(compacto)return `<div class="tipos-resumen" aria-label="Cuatro naturalezas de estimación">
 ${TIPOS_ESTIMACION.map(t=>`<a href="${t.destino}" class="tipos-resumen-item"><b>${t.numero} · ${esc(t.titulo)}</b><small>${esc(t.codigo==='modelo'?'Pronóstico vigente':t.codigo==='microdatos'?'Investigación, no incorporada':t.codigo==='promedio'?'Referencia comparativa':'Fuente de una encuestadora')}</small></a>`).join('')}
 </div>`;
 return `<section class="tipos-estimacion" aria-labelledby="tipos-estimacion-t">
 <div class="tipos-estimacion-cab"><h2 id="tipos-estimacion-t">Cuatro formas de llegar a una cifra</h2><p>No todas son estimaciones del Observatorio, ni todas alimentan su pronóstico.</p></div>
 <div class="tipos-estimacion-grid">
 ${TIPOS_ESTIMACION.map(t=>`<article${t.codigo==='modelo'?' class="tipo-actual"':''}><span class="tipo-n">${t.numero} · ${esc(t.etiqueta)}</span><h3>${esc(t.titulo)}</h3><p>${esc(t.descripcion)}</p><small>${esc(t.estado)}</small><a href="${t.destino}">${esc(t.enlace)} →</a></article>`).join('')}
 </div></section>`;
}

// Una misma lectura de los recuentos para portada, promedio y pronóstico.
const h=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const n=x=>Number.isInteger(x)&&x>=0?x.toLocaleString('es-ES'):'—';
const fecha=x=>x?new Date(x+'T12:00:00Z').toLocaleDateString('es-ES',{timeZone:'Europe/Madrid'}):'sin corte disponible';

export function renderRecuento({forecast=null,archivo=null,seleccion=null}={}){
 const inv=forecast?.auditoria_fuentes?.inventario;
 const entradas=forecast?.entradas;
 const admitidas=Array.isArray(entradas)?entradas.length:null;
 const casas=Array.isArray(entradas)?new Set(entradas.map(e=>e.casa)).size:null;
 const excluidas=Array.isArray(forecast?.excluidas)?forecast.excluidas.length:null;
 const ficha=(valor,titulo,detalle)=>`<div><dt>${titulo}</dt><dd>${n(valor)}</dd><p>${detalle}</p></div>`;
 return `<section class="panel poll-counts" aria-label="Cuántas encuestas usa cada cálculo">
 <h2>¿Cuántas encuestas usa cada cálculo?</h2>
 <p class="muted">Pronóstico e histórico: corte ${h(fecha(forecast?.corte))}. El promedio responde a los filtros de esta pantalla.</p>
 <dl class="poll-count-grid">
 ${seleccion?ficha(seleccion.estudios,'En el promedio seleccionado',`${n(seleccion.institutos)} institutos activos · ${h(seleccion.detalle||'última encuesta por instituto')}.`):''}
 ${ficha(archivo??inv?.archivo_verificado,'Fichas del archivo verificado','Colección del Observatorio, con estudios actuales e históricos. <a href="#encuestas">Ver fichas y fuentes →</a>')}
 ${ficha(admitidas,'En el pronóstico principal',`${n(casas)} institutos; puede usar varias oleadas de una casa. <a href="#pronostico-fuentes">Ver estudios y exclusiones →</a>`)}
 ${ficha(inv?.historicas,'Históricas para análisis y pruebas',`${n(inv?.wikipedia)} proceden de Wikipedia${inv?.wikipedia_desde&&inv?.wikipedia_hasta?` (${h(fecha(inv.wikipedia_desde))}–${h(fecha(inv.wikipedia_hasta))})`:''}. No se suman al promedio actual.`)}
 ${ficha(inv?.total,'Total cargado por el motor',`${n(inv?.historicas)} históricas + ${n(inv?.ciclo_actual)} del ciclo actual. De estas últimas, ${n(admitidas)} admitidas y ${n(excluidas)} excluidas.`)}
 </dl>
 <p class="muted">Estos recuentos se solapan: el <a href="#analisis">promedio</a> selecciona fichas del archivo y el pronóstico combina varias procedencias. No deben sumarse entre sí. Una fila por partido y una simulación no son encuestas nuevas.</p>
 <details><summary>Procedencia y uso de las históricas</summary><p>Las históricas se usan en análisis de tendencias, sesgos, retropruebas y pruebas placebo. No son entrevistas actuales ni tienen el mismo grado de verificación que el archivo del Observatorio. Wikipedia es una fuente secundaria.</p>
 <p>${inv?'Recuento calculado después de deduplicar y limitar los datos al corte del modelo.':'El desglose histórico no está disponible en esta salida; no se sustituyen los datos ausentes por cero.'} <a href="data/modelo/pronostico.json">Descargar salida y recuentos JSON →</a> · <a href="https://github.com/bhermoso/observatorio-electoral/blob/main/modelo/externos/PROCEDENCIA.md" target="_blank" rel="noopener">Procedencia de las fuentes externas ↗</a></p></details>
 </section>`;
}

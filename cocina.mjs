import {renderEvaluacion2019,bindEvaluacion2019} from './evaluacion-2019.mjs';
import {renderEvaluacionMicrodatos,bindEvaluacionMicrodatos} from './evaluacion-microdatos.mjs';
import {renderHomologacion2019,bindHomologacion2019} from './homologacion-2019.mjs';
import {renderCocinaPropia,bindCocinaPropia} from './cocina-propia.mjs';
import {renderMatrizFuentes,bindMatrizFuentes} from './matriz-microdatos.mjs';
import {renderHomologacion2026,bindHomologacion2026} from './homologacion-microdatos-2026.mjs';
import {renderLeccion,bindLeccion} from './cocina-leccion.mjs';
import {renderResultadosCocina,bindResultadosCocina} from './cocina-resultados.mjs';
import {renderEvidencia40db} from './evidencia-40db.mjs';
import {renderContraste40db} from './contraste-40db.mjs';
import {renderMicrodatos40db,bindMicrodatos40db} from './microdatos-40db.mjs';
import {renderRetrospectiva40db,bindRetrospectiva40db} from './validacion-40db-2023.mjs';
import {renderCatalogoMicrodatos,bindCatalogoMicrodatos} from './catalogo-microdatos.mjs';
import {renderSocioMetrica,bindSocioMetrica} from './microdatos-sociometrica.mjs';
import {renderCasoCocina,renderExperimentoCis,renderCadenaCocina} from './casos-cocina.mjs';
import {renderBuscadorMicrodatos} from './buscador-microdatos.mjs';
import {renderEstadoDescargas} from './auditoria-microdatos.mjs';
// Cocina electoral: resultados agregados de estudio CIS 3582, sin entrevistas individuales.
// Los métodos alternativos NO son etapas acumulables ni reconstrucciones de la receta del CIS.
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const fmt=n=>Number(n).toLocaleString('es-ES',{minimumFractionDigits:1,maximumFractionDigits:1});
const METHODS=[
 {key:'direct',title:'Intención directa (2026)',type:'Dato de encuesta',text:'Porcentaje de todos los entrevistados que declara que votaría a este partido. Incluye indecisos y personas que no votarían en el denominador.'},
 {key:'decided',title:'Entre quienes eligen partido',type:'Cambio de denominador',text:'Es el voto declarado entre quienes mencionan una candidatura. Al excluir respuestas sin partido cambia el porcentaje, pero no aparecen nuevos votantes.'},
 {key:'sympathy',title:'Voto + simpatía',type:'Otra pregunta',text:'Se incorpora la simpatía de parte de quienes no expresan intención partidista. Es una medida distinta, no un paso posterior obligatorio.'},
 {key:'official',title:'Estimación publicada por CIS',type:'Referencia oficial',text:'El porcentaje de voto válido estimado por el instituto. La diferencia con las otras medidas no identifica por sí sola qué correcciones aplicó.'}
];
const EXPERIMENTS=[
 {key:'turnout',title:'Supuesto de participación',text:'Se repondera con la probabilidad autodeclarada de votar (PROBVOTO/10). Es una hipótesis; no predice con precisión quién acudirá a las urnas.'},
 {key:'recall',title:'Corrección parcial por recuerdo',text:'Ajuste exploratorio de cuatro partidos tomando como referencia el resultado oficial de 2023. No está validado como fórmula de estimación.'}
];
// Bloques de la página (HTML estático con datos ya presentes en el módulo).
const NOTICE=()=>`<div class="notice"><strong>Tres cosas distintas:</strong> el <b>voto real de 2023</b> son los votos contados en las urnas; el <b>recuerdo de voto</b> es lo que las personas dicen en 2026 que votaron en 2023; la <b>intención directa</b> es lo que dicen que votarían ahora. No son equivalentes.</div>`;
const CONCEPTS=()=>`<section class="panel cocina-concepts"><div class="panel-head"><div><span class="eyebrow">Primero, entender los conceptos</span><h2>Qué es un dato, qué es un cálculo y qué es una hipótesis</h2><p class="muted">La cocina no es un porcentaje oculto añadido a los votos. Es el conjunto de decisiones con las que una encuesta se transforma en una estimación.</p></div><a href="guia-cocina.html">Guía completa con ejemplos y fuentes →</a></div>
 <div class="kitchen-concept-grid">
 <article class="kitchen-concept"><span class="kitchen-concept-label">01 · Respuesta</span><h3>Intención directa</h3><p>Lo que una persona responde que votaría <b>ahora</b>. No son los votos reales de 2023. Incluye entre las respuestas posibles indecisión, abstención y no respuesta.</p><small>Origen: cuestionario y microdatos.</small></article>
 <article class="kitchen-concept"><span class="kitchen-concept-label">02 · Otra pregunta</span><h3>Simpatía</h3><p>Afinidad hacia un partido, útil para describir preferencias entre quienes no eligen una candidatura. <b>Sentir simpatía no implica votar.</b> Voto + simpatía es una variable combinada que requiere reglas explícitas.</p><small>Origen: respuestas y recodificaciones.</small></article>
 <article class="kitchen-concept"><span class="kitchen-concept-label">03 · Memoria</span><h3>Recuerdo de voto</h3><p>Lo que se declara haber votado en una elección anterior. Puede compararse con sus resultados oficiales para detectar desajustes de la muestra, pero el recuerdo puede ser erróneo.</p><small>Origen: microdatos + escrutinio histórico.</small></article>
 <article class="kitchen-concept"><span class="kitchen-concept-label">04 · Cálculo</span><h3>Ponderar y repartir indecisos</h3><p>Los pesos corrigen la composición representada por la muestra; distribuir indecisos según afinidad o comportamiento previo exige <b>un supuesto</b>, no se deduce de forma única.</p><small>Origen: pesos documentados o escenarios propios.</small></article>
 <article class="kitchen-concept"><span class="kitchen-concept-label">05 · Probabilidad declarada</span><h3>Participación</h3><p>La disposición a votar puede servir para ensayar escenarios de participación. Una persona que responde «seguro que votaré» puede finalmente no acudir.</p><small>Origen: respuesta; conversión a probabilidad = hipótesis.</small></article>
 <article class="kitchen-concept"><span class="kitchen-concept-label">06 · Contexto</span><h3>Acontecimientos</h3><p>Las fechas permiten comparar encuestas anteriores y posteriores. Sin datos comparables ni control de otras influencias, el cambio observado <b>no demuestra un efecto causal</b>.</p><small>Origen: registro documental y trabajo de campo.</small></article>
 </div>
 <div class="kitchen-levels"><div><b>Publicado</b><p>Encuesta, pregunta, respuestas, ponderación disponible y cifra oficial de la casa.</p></div><div><b>Reproducible</b><p>Tabulación sobre microdatos, porcentaje entre decididos y cruces por recuerdo, con denominadores explícitos.</p></div><div><b>Inferido o supuesto</b><p>Redistribución de indecisos, calibración por recuerdo, efecto de acontecimientos y escenarios de incertidumbre.</p></div></div>
 </section>`;
const AUDIT=()=>`<section class="panel cocina-audit"><div class="panel-head"><div><span class="eyebrow">Auditoría documental · Encuestadoras</span><h2>Qué sabemos realmente de su cocina</h2><p class="muted">Una ficha técnica describe cómo se pregunta y pondera la muestra. Eso no basta para afirmar cómo se calcula la estimación electoral final.</p></div></div>
<div class="toolbar"><label>Instituto<select id="kitchen-evidence-house"><option value="cis">CIS</option><option value="metroscopia">Metroscopia</option><option value="40db-">40dB.</option><option value="gad3">GAD3</option><option value="imop-insights">IMOP Insights</option><option value="dym">DYM</option><option value="ateneo-del-dato">Ateneo del Dato</option><option value="sigma-dos">Sigma Dos</option></select></label></div>
<div id="kitchen-evidence" role="status">Comprobando fuentes electorales publicadas…</div></section>`;
const COMO=()=>`<section class="panel cocina-main"><div class="panel-head"><div><h2>¿Cómo cambia la cifra que vemos?</h2><p class="muted">Comparamos distintas medidas para el mismo partido, no etapas sucesivas de un algoritmo.</p></div><label>Partido<select id="kitchen-party"><option value="PSOE">PSOE</option><option value="PP">PP</option><option value="VOX">Vox</option><option value="SUMAR">Sumar</option><option value="PODEMOS">Podemos</option><option value="ERC">ERC</option></select></label></div><div id="kitchen-study" role="status">Cargando estudio y resultados agregados…</div></section>`;
const RECUERDO=()=>`<section class="panel cocina-main"><h2>¿Qué revela el recuerdo de voto?</h2><p>Entre quienes <b>dicen</b> que votaron a un partido en 2023, ¿qué declaran que harían ahora? Las transferencias reflejan respuestas de la muestra, no cambios de voto efectivamente ocurridos.</p><div id="kitchen-transfers"></div></section>`;
const HIST=()=>`<section class="panel cocina-main" id="kitchen-history"><div class="panel-head"><div><h2>¿Funcionó mejor algún método en las elecciones de 2023?</h2><p class="muted">Dos estudios anteriores al 23J comparados con los votos que finalmente se contaron.</p></div><label>Encuesta<select id="kitchen-historic-study"><option value="3411">CIS 3411 · junio de 2023</option><option value="3415">CIS 3415 · julio de 2023</option></select></label></div><div id="kitchen-historic-results" role="status">Cargando validación de 2023…</div></section>`;
const VALID=()=>`<section class="panel cocina-main cocina-validation"><div class="panel-head"><div><span class="eyebrow">Verificación de la alta cocina</span><h2>¿Mejora realmente una corrección fuera del estudio donde se eligió?</h2><p class="muted">Elegimos un procedimiento con el CIS 3411 y lo evaluamos sin retocarlo en el CIS 3415; repetimos a la inversa. Los dos pertenecen al mismo 23J, así que esta prueba es limitada.</p></div></div><div id="kitchen-validation" role="status">Cargando contraste reproducible…</div><p class="muted">No se ha utilizado el resultado de 2023 para entrenar un coeficiente aplicado al estudio de evaluación. No se incluyen comparaciones engañosas de intención directa sobre todas las personas entrevistadas frente a voto válido.</p><a href="data/microdatos/auditoria_cocina_23j.json" download>Descargar auditoría y errores por partido (JSON) ↓</a> · <a href="https://github.com/bhermoso/observatorio-electoral/blob/main/scripts/auditar_cocina_23j.py" target="_blank" rel="noopener">Código reproducible ↗</a></section>`;
const CONTRIB=()=>`<section class="panel cocina-main cocina-contributions"><div class="panel-head"><div><span class="eyebrow">Pruebas de sensibilidad · Cocina reproducible</span><h2>¿Qué cambia al utilizar otra receta?</h2><p class="muted">Comparación por partido y por estudio. La cifra muestra cuánto varía la estimación y cuánto aumenta o disminuye su error respecto a los resultados del 23J; no es una atribución causal de ingredientes.</p></div></div><div class="toolbar"><label>Comparar procedimiento<select id="kitchen-contribution-method"><option value="simpatia">Voto + simpatía frente a decididos</option><option value="participacion">Participación frente a decididos</option><option value="estimacion_publicada">Estimación publicada frente a decididos</option></select></label><label>Estudio<select id="kitchen-contribution-study"><option value="3411">CIS 3411</option><option value="3415">CIS 3415</option></select></label></div><div id="kitchen-contribution-data" role="status">Cargando contribuciones observables…</div><div class="notice"><b>Sobre recuerdo, transferencias, eventos y efecto en escaños:</b> todavía no existe una comparación equivalente y reproducible para estos dos estudios. No se imputan coeficientes ni cambios de diputados.</div><p><a href="data/microdatos/contribuciones_cocina_23j.json" download>Datos completos de contribuciones (JSON) ↓</a> · <a href="https://github.com/bhermoso/observatorio-electoral/blob/main/scripts/analizar_contribuciones.py" target="_blank" rel="noopener">Reproducir el cálculo ↗</a></p></section>`;
const ORIGEN=()=>`<section class="panel cocina-main"><h2>¿De dónde salen los datos?</h2><p>El análisis utiliza resultados <b>agregados</b> reconstruidos de 5.024 registros utilizables del fichero CIS 3582 y los contrasta con su estimación oficial. No publicamos aquí entrevistas individuales. Se utiliza el peso nacional <code>PESO</code>; el fichero agregado incluye hipótesis parciales que no sustituyen una validación externa.</p><p><a href="data/microdatos/analisis_3582.json" download>Descargar las cifras y los supuestos (JSON) ↓</a> · <a href="https://www.cis.es/es/estudios/barometro-de-octubre-2026" target="_blank" rel="noopener">Estudio original del CIS ↗</a></p><div class="kitchen-limits"><h3>Qué se puede y qué no se puede concluir</h3><p>Se pueden reproducir medidas descriptivas y probar el efecto de algunas decisiones de cálculo. No se puede afirmar que una coincidencia numérica descubra el algoritmo interno del CIS, ni atribuir a una sola corrección toda la diferencia con la estimación publicada.</p></div><p><a href="guia-cocina.html">Leer guía de cocina, documentación y supuestos →</a> · <a href="sala-mandos.html#microdatos">Abrir laboratorio técnico opcional →</a></p></section>`;
const LAB_INTRO=()=>`<section class="cocina-lab-intro"><p><a href="construye-estimacion.html"><strong>CONSTRUYE UNA ESTIMACIÓN PASO A PASO →</strong></a> · Elige encuesta, denominador y correcciones, observa porcentajes y errores.</p><p class="cocina-regla"><b>Regla de entrada.</b> Una receta solo pasará al pronóstico si mejora el acierto en varias elecciones independientes, sin ajustar sus parámetros al resultado con el que se evalúa. Los experimentos de este capítulo no cambian el Motor 29N.</p><div class="cocina-compare"><div><b>¿Cómo calculamos hoy los escaños?</b><p>Fuentes, tendencia, simulaciones, territorio y D’Hondt.</p><a href="flujograma.html">Ver algoritmo actual →</a></div><div><b>¿Qué ajustes estamos evaluando?</b><p>Recuerdo, simpatía, participación, transferencias y sus limitaciones.</p><strong>Estás en el laboratorio experimental.</strong></div></div></section>`;
export function renderCocina(){
 const cap=(n,id,titulo,pregunta,intro,cuerpo)=>`<details ${n===1?'open':''} class="cocina-capitulo chapter-reading" id="${id}" aria-labelledby="${id}-t">
  <summary class="cocina-cap-cab"><span class="cocina-cap-num">${n}</span><div><h2 id="${id}-t">${titulo}</h2><p class="cocina-cap-pregunta">${pregunta}</p></div></summary>
  <div class="cocina-cap-intro">${intro}</div>${cuerpo}</details>`;
 return `<div class="hero cocina-hero"><div><div class="eyebrow">Cocina electoral · microdatos y transparencia metodológica</div><h1>Entender la cocina electoral</h1>
 <p>Una encuesta recoge respuestas; una estimación de voto es una cifra calculada a partir de ellas. Aquí se explica primero cómo calcula el Observatorio su pronóstico, después cómo se transforma una encuesta en una estimación y finalmente qué hemos comprobado con microdatos. Los ensayos de investigación se muestran por separado del modelo publicado.</p></div></div>
 <div class="cocina-orientacion" aria-label="Cómo se organiza este apartado">
  <p><strong>Pronóstico vigente:</strong> combina estimaciones publicadas y ajustes propios, pero no reanaliza las entrevistas individuales.</p>
  <p><strong>Laboratorio de microdatos:</strong> comprueba procedimientos alternativos con datos originales; sus ensayos no cambian el pronóstico.</p>
  <p><strong>Comprobación:</strong> los resultados de 2023 sirven para estudiar errores, no para garantizar aciertos futuros.</p>
 </div>
 <nav class="cocina-indice" aria-label="Recorrido por la cocina">
  <a href="#cocina-cap5"><b>1</b><span>Cómo estimamos hoy</span><small>Encuestas, correcciones, incertidumbre y escaños</small></a>
  <a href="#cocina-cap1"><b>2</b><span>Entender una encuesta</span><small>Respuestas, pesos, recuerdo y participación</small></a>
  <a href="#cocina-cap2"><b>3</b><span>Seguir un ejemplo</span><small>40dB, Madrid y Jaén</small></a>
  <a href="#cocina-cap3"><b>4</b><span>Examinar microdatos</span><small>CIS, 40dB y SocioMétrica</small></a>
  <a href="#cocina-cap4"><b>5</b><span>Contrastar métodos</span><small>Resultados de 2023 y limitaciones</small></a>
  <a href="#cocina-cap6"><b>6</b><span>Consultar las fuentes</span><small>Archivo y auditoría</small></a>
 </nav>
 ${cap(1,'cocina-cap5','La cocina del Observatorio','¿Qué corrige el Motor 29N, cuánto y con qué riesgo?',
  '<p>El Motor 29N combina tres variantes basadas en estimaciones publicadas: consenso privado, consenso general y calibración histórica. Modela tendencias e incertidumbre, traslada el voto al territorio y reparte escaños. No utiliza directamente los microdatos; las correcciones históricas y sus supuestos se documentan.</p>',
  renderLeccion().replace('<h2 id="lc-h">La cocina del Observatorio</h2>','<h3 class="vh" id="lc-h">La cocina del Observatorio</h3>'))}
 ${cap(2,'cocina-cap1','Qué es cocinar una encuesta','¿Qué pasos separan lo que la gente responde de la estimación que se publica?',
  '<p>Cada paso del esquema transforma la cifra anterior. Algunos son datos (lo que se respondió), otros cálculos (pesos, repartos) y otros hipótesis (cuánto se cree el recuerdo, quién votará). Distinguirlos es la condición para leer cualquier encuesta.</p>',
  renderCadenaCocina()+NOTICE()+CONCEPTS())}
 ${cap(3,'cocina-cap2','Un caso completo','¿Cómo se llega de las respuestas de una encuesta concreta a los escaños de Madrid y de Jaén?',
  '<p>La encuesta flash de 40dB de octubre de 2026, recorrida de principio a fin: respuestas, depuración, ponderación, recuerdo, estimación publicada, traslado a las provincias y reparto D’Hondt.</p>',
  renderCasoCocina().replace(/<h2 id="caso-heading">[^<]*<\/h2>/,'<h3 class="vh" id="caso-heading">Caso 40dB: Madrid y Jaén</h3>'))}
 ${cap(4,'cocina-cap3','Cómo cocinan las encuestadoras','¿Qué se puede comprobar de la cocina de cada casa con sus datos originales?',
  '<p>En los casos documentados del CIS, 40dB y SocioMétrica se examinan materiales y datos originales disponibles. Puede reconstruirse una parte del cálculo, pero no se presume conocer la fórmula completa de cada instituto.</p>',
  `${AUDIT()}${renderContraste40db()}${renderMicrodatos40db()}${renderSocioMetrica()}${COMO()}${RECUERDO()}${renderExperimentoCis()}`)}
 ${cap(5,'cocina-cap4','¿Qué receta acierta?','¿Mejora alguna corrección el resultado cuando se prueba contra votos reales?',
  '<p>La única prueba disponible es el 23J de 2023: encuestas hechas antes, comparadas con los votos contados. Es una sola elección, así que los resultados orientan pero no demuestran.</p>'+LAB_INTRO(),
  `${renderEvaluacionMicrodatos()}${renderEvidencia40db()}${renderRetrospectiva40db()}${HIST()}${renderEvaluacion2019()}${renderHomologacion2019()}${renderCocinaPropia()}${renderMatrizFuentes()}${renderHomologacion2026()}${renderResultadosCocina()}${VALID()}${CONTRIB()}`)}
 ${cap(6,'cocina-cap6','Archivo de microdatos','¿Dónde están los datos originales y qué se ha auditado?',
  '<p>Catálogo de fuentes, buscador y almacén de los originales descargados. El repositorio guarda agregados y documentación, no entrevistas.</p>',
  `${renderCatalogoMicrodatos()}${renderBuscadorMicrodatos()}${renderEstadoDescargas()}${ORIGEN()}`)}`;
}
export async function bindCocina(){
 void bindEvaluacionMicrodatos();
 // Los enlaces del índice abren el capítulo elegido sin ocultar el contenido al navegar.
 const indice=document.querySelector('.cocina-indice');
 if(indice){
  indice.addEventListener('click',ev=>{
   const link=ev.target.closest('a[href^="#cocina-cap"]');
   if(!link)return;
   const panel=document.getElementById(link.getAttribute('href').slice(1));
   if(panel?.tagName==='DETAILS')panel.open=true;
  });
  const current=document.getElementById(location.hash.slice(1));
  if(current?.matches('details.cocina-capitulo'))current.open=true;
 }
 void bindEvaluacion2019();void bindHomologacion2019();void bindSocioMetrica();void bindCatalogoMicrodatos();void bindRetrospectiva40db();void bindMicrodatos40db();void bindResultadosCocina();void bindLeccion();void bindCocinaPropia();void bindMatrizFuentes();void bindHomologacion2026();
 const box=document.querySelector('#kitchen-study'),trans=document.querySelector('#kitchen-transfers'),selector=document.querySelector('#kitchen-party');
 bindHistoricCis();
 bindEvidenceAudit();
 bindKitchenValidation();
 bindKitchenContributions();
 if(!box||!trans||!selector)return;
 try{
  const response=await fetch('data/microdatos/analisis_3582.json',{cache:'no-store'});
  if(!response.ok)throw Error('No disponible (HTTP '+response.status+')');
  const data=await response.json();
  if(!box.isConnected)return;
  const bar=(v,official=false)=>`<div class="kitchen-bar"><i style="width:${Math.min(100,Math.max(0,v/40*100))}%;${official?'background:#aa7034;':''}"></i></div>`;
  function render(){
   const party=selector.value,record=data.comparison.find(x=>x.party===party);if(!record)return;
   box.innerHTML=`<p class="muted">CIS 3582 · ${data.n.toLocaleString('es-ES')} entrevistas · peso ${esc(data.weighted)} · las barras tienen la misma escala (0–40 %).</p><div class="kitchen-stage-grid">`
    +METHODS.map(m=>`<article class="kitchen-stage"><span class="badge">${esc(m.type)}</span><h3>${esc(m.title)}</h3><div class="kitchen-value">${fmt(record[m.key])} %</div>${bar(record[m.key],m.key==='official')}<p>${esc(m.text)}</p></article>`).join('')
    +`</div><div class="notice kitchen-explain"><b>Ejemplo con ${esc(party)}:</b> al comparar el ${fmt(record.direct)} % de intención directa con el ${fmt(record.decided)} % entre decididos, la diferencia de ${fmt(record.decided-record.direct)} puntos se debe principalmente al denominador. No significa un aumento observado del voto.</div>
     <div class="kitchen-experiments"><h3>Dos hipótesis adicionales, fuera de cualquier receta demostrada</h3><div class="kitchen-stage-grid">`
    +EXPERIMENTS.map(m=>`<article class="kitchen-stage"><span class="badge sim">Experimento</span><h3>${esc(m.title)}</h3><div class="kitchen-value">${fmt(record[m.key])} %</div>${bar(record[m.key])}<p>${esc(m.text)}</p><small>Diferencia con «entre decididos»: ${record[m.key]-record.decided>0?'+':''}${fmt(record[m.key]-record.decided)} pp.</small></article>`).join('')
    +`</div><p class="muted">Son cálculos independientes con supuestos y bases distintos. No deben sumarse sus efectos ni interpretarse como el procedimiento aplicado por el CIS.</p></div>`;
   const names={PSOE:'PSOE',PP:'PP',VOX:'Vox',SUMAR:'Sumar'};
   trans.innerHTML=`<div class="table-wrap"><table><caption>Porcentajes ponderados dentro de cada grupo de recuerdo; se muestran solo algunos destinos, por lo que las filas no suman 100 %.</caption><thead><tr><th>Recuerda votar</th><th>Repetiría</th><th>Al PP</th><th>A Vox</th><th>Al PSOE</th><th>Indeciso</th><th>No votaría</th></tr></thead><tbody>`
    +Object.entries(data.transfers||{}).map(([key,r])=>`<tr><td><b>${esc(names[key]||key)}</b><small>n=${r.n}</small></td><td>${fmt(r[key])} %</td><td>${fmt(r.PP)} %</td><td>${fmt(r.VOX)} %</td><td>${fmt(r.PSOE)} %</td><td>${fmt(r.indecision)} %</td><td>${fmt(r.abstention)} %</td></tr>`).join('')
    +`</tbody></table></div>`;
  }
  selector.addEventListener('change',render);render();
 }catch(err){if(box.isConnected)box.textContent='No se ha podido cargar el análisis agregado: '+err.message}
}

const HISTORIC_METHODS=[
 ['direct_all','Intención directa'],
 ['decided','Solo quienes eligen partido'],
 ['sympathy_decided','Voto + simpatía'],
 ['turnout_decided','Ajuste exploratorio de participación'],
 ['published_cis','Estimación publicada CIS']
];
async function bindHistoricCis(){
 const target=document.querySelector('#kitchen-historic-results'),picker=document.querySelector('#kitchen-historic-study');if(!target||!picker)return;
 try{
  const response=await fetch('data/microdatos/validacion_23j.json',{cache:'no-store'});
  if(!response.ok)throw Error('HTTP '+response.status);
  const data=await response.json();
  if(!target.isConnected)return;
  function update(){
   const study=data.studies[picker.value];
   const num=n=>Number(n).toLocaleString('es-ES',{minimumFractionDigits:2,maximumFractionDigits:2});
   const worst=Math.max(...Object.values(study.mae_four_parties));
   target.innerHTML=`<p class="muted">Estudio ${esc(picker.value)} · ${study.sample_size.toLocaleString('es-ES')} entrevistas · error absoluto medio sobre cuatro partidos (puntos porcentuales). Cuanto menor, más cerca quedó del resultado.</p>
    <div class="kitchen-error-bars">`
    +HISTORIC_METHODS.map(([id,label])=>`<div class="kitchen-error-row"><span>${esc(label)}</span><div class="kitchen-error-track"><i style="width:${study.mae_four_parties[id]/worst*100}%;${id==='published_cis'?'background:#ac7234;':''}"></i></div><strong>${num(study.mae_four_parties[id])} pp</strong></div>`).join('')
    +`</div><div class="table-wrap"><table class="kitchen-history-table"><caption>Comparación por partido. Se muestran estimaciones de voto sobre candidaturas y resultado oficial final; la intención directa usa un denominador distinto.</caption><thead><tr><th>Partido</th><th>Resultado real 23J</th><th>Entre decididos</th><th>Con participación</th><th>Estimación CIS</th></tr></thead><tbody>`
    +data.party_order.map(p=>`<tr><td><b>${esc(p==='SUMAR'?'Sumar':p)}</b></td><td>${num(data.official_vote_valid_percent[p])} %</td><td>${num(study.scenarios.decided[p])} %</td><td>${num(study.scenarios.turnout_decided[p])} %</td><td>${num(study.scenarios.published_cis[p])} %</td></tr>`).join('')
    +`</tbody></table></div><div class="notice"><b>El recuerdo es de las elecciones de noviembre de 2019.</b> No sería correcto recalibrarlo contra el 23J de 2023. La validación del recuerdo exige los resultados de 2019 y un mapa de candidaturas comparable.</div>
    <p class="muted">Son dos estudios y cuatro partidos. El error es descriptivo y no demuestra que un método prediga mejor otras elecciones; el voto puede cambiar entre la entrevista y el día de votación. El CIS 3415 incluye votos emitidos por correo en parte de sus variables, pero la comparación de simpatía mostrada utiliza VOTOSIMG sin ese componente.</p>
    <a href="data/microdatos/validacion_23j.json" download>Descargar resultados y metodología (JSON) ↓</a>`;
  }
  picker.addEventListener('change',update);update();
 }catch(e){if(target.isConnected)target.textContent='No se ha podido cargar la validación histórica: '+e.message}
}

async function bindEvidenceAudit(){
 const output=document.querySelector('#kitchen-evidence'),select=document.querySelector('#kitchen-evidence-house');if(!output||!select)return;
 try{
  const r=await fetch('data/cocinas-evidencia.json',{cache:'no-store'});if(!r.ok)throw Error('HTTP '+r.status);
  const data=await r.json();if(!output.isConnected)return;
  function draw(){
   const entry=data.entries.find(x=>x.id===select.value);
   if(!entry){output.textContent='Sin ficha de evidencia';return}
   const status=entry.evidence==='metodo_publicado_general'?'Modelo de estimación descrito en documentos públicos (sin reconstrucción exacta del estudio)':entry.evidence==='sin_formula_electoral_verificada'?'No consta una fórmula electoral específica verificada':'Estimaciones archivadas; fórmula electoral no documentada suficientemente';
   output.innerHTML='<div class="kitchen-audit-status"><strong>'+esc(entry.name)+'</strong><span>'+esc(status)+'</span></div>'
    +'<div class="kitchen-audit-columns"><div><h3>Comprobado en las fuentes</h3><ul>'+entry.observed.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul></div>'
    +'<div><h3>No acreditado / pendiente</h3><ul>'+entry.notVerified.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul></div></div>'
    +(entry.sources.length?'<p class="kitchen-audit-sources"><b>Documentos pertinentes:</b> '+entry.sources.filter(x=>entry.id!=='metroscopia').map(x=>'<a target="_blank" rel="noopener" href="'+esc(x.url)+'">'+esc(x.label)+' ↗</a>').join(' · ')+'</p>':'')
    +'<p class="muted">Criterio de admisión: '+esc(data.criterion)+'</p>';
  }
  select.addEventListener('change',draw);draw();
 }catch(e){if(output.isConnected)output.textContent='No se ha podido cargar la evidencia: '+e.message}
}

async function bindKitchenValidation(){
 const root=document.querySelector('#kitchen-validation');if(!root)return;
 try{
  const res=await fetch('data/microdatos/auditoria_cocina_23j.json',{cache:'no-store'});if(!res.ok)throw Error('HTTP '+res.status);
  const data=await res.json();if(!root.isConnected)return;
  const n=v=>Number(v).toLocaleString('es-ES',{minimumFractionDigits:2,maximumFractionDigits:2});
  const rows=data.pruebas_seleccion_y_traslado.map(t=>{
   const method=data.metodos[t.metodo_seleccionado];
   return '<tr><td><b>'+esc(t.seleccion_estudio)+'</b></td><td><b>'+esc(t.evaluacion_estudio)+'</b></td><td>'+esc(method)+'</td><td><b>'+n(t.error_prueba_mae_pp)+'</b> pp</td><td>'+n(t.referencia_cis_mae_pp)+' pp</td><td><b>'+(t.cambio_frente_publicado_pp>0?'+':'')+n(t.cambio_frente_publicado_pp)+' pp</b></td></tr>';
  }).join('');
  root.innerHTML='<div class="table-wrap"><table><caption>MAE sobre PSOE, PP, Vox y Sumar; variación positiva = mayor error que la referencia CIS publicada.</caption><thead><tr><th>Método elegido con</th><th>Evaluado en</th><th>Método elegido</th><th>Error de prueba</th><th>Referencia CIS</th><th>Diferencia</th></tr></thead><tbody>'+rows+'</tbody></table></div>'
   +'<div class="notice"><b>Resultado:</b> una mejora puntual en un estudio no basta para aprobar un método. Ninguna de estas pruebas justifica aplicar una corrección automática al pronóstico operativo del Motor 29N.</div>'
   +'<div class="kitchen-limits"><h3>Errores, avisos y límites del contraste</h3><ul>'+data.limitaciones.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul></div>';
 }catch(err){if(root.isConnected)root.textContent='No disponible: '+err.message}
}

async function bindKitchenContributions(){
 const root=document.querySelector('#kitchen-contribution-data'),method=document.querySelector('#kitchen-contribution-method'),study=document.querySelector('#kitchen-contribution-study');
 if(!root||!method||!study)return;
 try{
  const r=await fetch('data/microdatos/contribuciones_cocina_23j.json',{cache:'no-store'});
  if(!r.ok)throw Error('HTTP '+r.status);
  const report=await r.json();if(!root.isConnected)return;
  const n=v=>Number(v).toLocaleString('es-ES',{minimumFractionDigits:2,maximumFractionDigits:2});
  const signed=v=>(v>0?'+':'')+n(v);
  function show(){
   const scenario=report.comparaciones.find(x=>x.codigo===method.value);
   const current=scenario?.estudios.find(x=>x.estudio===study.value);
   if(!current){root.textContent='Datos no disponibles';return}
   const rows=current.partidos.map(p=>'<tr><td><b>'+esc(p.partido)+'</b></td><td>'+n(p.base)+' %</td><td>'+n(p.alternativa)+' %</td><td>'+signed(p.cambio_estimacion_pp)+' pp</td><td>'+signed(p.cambio_error_absoluto_pp)+' pp</td></tr>').join('');
   root.innerHTML='<div class="kitchen-contribution-summary"><div><span>MAE entre decididos</span><strong>'+n(current.mae_base)+' pp</strong></div><div><span>MAE con la alternativa</span><strong>'+n(current.mae_alternativa)+' pp</strong></div><div><span>Variación del error medio</span><strong>'+signed(current.diferencia_mae_pp)+' pp</strong><small>'+(current.diferencia_mae_pp>0?'Mayor error':current.diferencia_mae_pp<0?'Menor error':'Sin variación')+'</small></div></div>'
   +'<div class="table-wrap"><table><caption>Variación del error absoluto: valor negativo = menor error; positivo = mayor error. Una diferencia de voto no es un porcentaje de influencia.</caption><thead><tr><th>Partido</th><th>Decididos</th><th>Alternativa</th><th>Cambio en voto</th><th>Cambio en error absoluto</th></tr></thead><tbody>'+rows+'</tbody></table></div>'
   +'<p class="muted">En este estudio: '+current.partidos_con_menor_error+' partidos con menor error y '+current.partidos_con_mayor_error+' con mayor error. Consistencia del MAE en los dos estudios: '+(scenario.consistencia_mae==='mejora_ambos'?'menor error en ambos':scenario.consistencia_mae==='empeora_ambos'?'mayor error en ambos':'resultado no consistente')+'.</p>'
   +'<p class="muted"><b>Interpretación:</b> '+esc(report.descripcion)+' Las operaciones no deben sumarse ni atribuirse como porcentajes del pronóstico principal.</p>';
  }
  method.addEventListener('change',show);study.addEventListener('change',show);show();
 }catch(err){if(root.isConnected)root.textContent='No se pudo cargar la comparación: '+err.message}
}

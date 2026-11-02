// Glosario contextual, accesible por cursor, teclado y toque. Sin dependencias.
export const TERMINOS = [
 ["intención directa ponderada","Porcentaje de respuestas a una pregunta de voto después de aplicar pesos muestrales. Depende del denominador: todas las entrevistas o solo las que declaran un partido. No equivale automáticamente a una estimación electoral."],
 ["intención directa de voto","Respuesta espontánea o elegida a qué candidatura votaría una persona si hubiera elecciones. Incluye indecisión y no respuesta cuando se calcula sobre toda la muestra."],
 ["intención de voto","Preferencia electoral declarada en la encuesta. Puede referirse a respuesta directa o a una estimación modelizada: conviene comprobar cuál se está mostrando."],
 ["recuerdo de voto","Declaración sobre a quién se votó en unas elecciones anteriores. Puede contener errores de memoria o respuesta; su distribución no equivale necesariamente al resultado real."],
 ["voto más simpatía","Variable que combina intención directa y afinidad partidista según reglas definidas en el estudio. La simpatía no garantiza un voto futuro."],
 ["simpatía","Afinidad o proximidad subjetiva hacia un partido, preguntada de forma diferente a la intención de voto. Puede explorarse para estudiar indecisión."],
 ["transferencias de voto","Cruce entre el voto recordado de una elección anterior y la intención declarada actual. Describe respuestas de personas encuestadas, no flujos de votos ya observados."],
 ["probabilidad de votar","Disposición declarada a acudir a las urnas, a menudo en una escala. No es una probabilidad real calibrada salvo que se haya comprobado empíricamente."],
 ["probabilidad de voto","Expresión ambigua: puede referirse a la probabilidad declarada de participar o a una predicción probabilística del voto a un partido. Hay que identificar la variable."],
 ["participación electoral","Proporción de electores que votan. La participación que declara una persona antes de la elección puede diferir de la participación efectiva."],
 ["error muestral","Incertidumbre derivada de entrevistar una muestra y no a toda la población. Depende del diseño y tamaño efectivo de la muestra; no incluye todos los posibles sesgos."],
 ["error no muestral","Errores ajenos a la variabilidad aleatoria de la muestra: cobertura, no respuesta, medición, modo de entrevista, procesamiento o modelos de estimación."],
 ["error de industria","Componente de error que puede afectar de manera compartida a varias encuestadoras. En este Observatorio su magnitud y correlación son supuestos modelizados, no observaciones directas."],
 ["efecto de encuestadora","Diferencia sistemática estimada entre las cifras de una casa y el anclaje del modelo. Puede reflejar metodología, composición de muestras o periodo; no demuestra por sí sola un sesgo frente al resultado real."],
 ["sesgo de casa","Desviación persistente atribuida estadísticamente a una encuestadora respecto de una referencia. Depende de la elección de referencia y del ciclo estudiado."],
 ["sesgo de encuestadora","Desviación persistente atribuida estadísticamente a una encuestadora respecto de una referencia. No es necesariamente un error conocido frente al voto real."],
 ["ponderación","Aplicación de pesos a entrevistas para ajustar la composición de la muestra o definir un promedio. Debe indicarse qué pesos, variables y población se emplean."],
 ["postestratificación","Ajuste de pesos de una muestra para acercarla a distribuciones conocidas de la población, como edad, sexo o territorio. No es por sí misma una fórmula de voto estimado."],
 ["muestra efectiva","Tamaño equivalente de la muestra una vez considerados pesos y diseño. Puede ser menor que el número de entrevistas recogidas."],
 ["efecto de diseño","Factor que refleja cómo el diseño y los pesos de una encuesta modifican su precisión respecto a una muestra aleatoria simple."],
 ["indecisos","Personas que no señalan una candidatura definida. Repartirlas entre partidos requiere reglas o hipótesis explícitas."],
 ["abstención","Decisión de no votar. En una investidura parlamentaria, abstenerse significa no votar ni sí ni no; no se añade a los votos afirmativos."],
 ["estimación publicada","Porcentaje electoral difundido por una encuestadora después de su tratamiento estadístico. La receta interna completa no siempre está documentada."],
 ["estimación de voto","Proyección del porcentaje de votos atribuible a una candidatura en una elección. No es necesariamente idéntica a la intención directa declarada."],
 ["tendencia latente","Nivel de intención de voto inferido por el modelo a partir de encuestas ruidosas y su evolución temporal. No se observa directamente."],
 ["paseo aleatorio","Modelo temporal en el que el nivel de hoy depende del anterior más un cambio aleatorio. Controla cuánto puede fluctuar una tendencia entre observaciones."],
 ["calibración histórica","Uso de errores o resultados de elecciones previas para fijar o contrastar parámetros. Si se usa el mismo resultado para calibrar y evaluar, la prueba es circular."],
 ["validación fuera de muestra","Evaluación de un método con datos que no participaron en su elección o ajuste. Validar en otra encuesta de la misma elección no sustituye hacerlo en elecciones independientes."],
 ["ablación","Experimento que elimina o modifica un componente del modelo manteniendo el resto lo más constante posible para comprobar su sensibilidad. No prueba causalidad electoral por sí solo."],
 ["intervalo de incertidumbre","Rango de resultados generado bajo los supuestos del modelo. Su cobertura real necesita validación con elecciones conocidas."],
 ["percentil","Valor por debajo del cual queda una fracción determinada de las simulaciones; por ejemplo, el percentil 95 deja por debajo al 95 %."],
 ["simulaciones conjuntas","Repartos completos de voto y escaños generados coherentemente en cada iteración. Permiten sumar bloques sin sumar medianas de partidos independientes."],
 ["error provincial","Variación o error supuesto al trasladar estimaciones nacionales a circunscripciones. Afecta al reparto de escaños."],
 ["d’Hondt","Procedimiento de reparto de escaños por circunscripción mediante cocientes sucesivos de los votos de cada candidatura, con las reglas legales aplicables."],
 ["mayoría absoluta","Al menos 176 de los 350 diputados del Congreso. En una segunda votación de investidura basta la mayoría simple de votos afirmativos frente a negativos."],
 ["mayoría simple","Más votos a favor que en contra entre los votos emitidos en la decisión correspondiente. Las abstenciones no son votos afirmativos."],
 ["bloque parlamentario","Agrupación analítica de escaños de varios partidos en una simulación. No implica un pacto ni que sus miembros voten siempre juntos."],
 ["escenario de investidura","Hipótesis sobre qué diputados votan sí, no o se abstienen; permite calcular condiciones aritméticas de investidura, sin predecir acuerdos."],
 ["cocina electoral","Conjunto de decisiones documentadas o modelizadas que transforma respuestas y encuestas en estimaciones: ponderaciones, indecisos, sesgos, tendencias e incertidumbre."],
 ["cocina demoscópica","Conjunto de decisiones estadísticas que transforma respuestas o encuestas en estimaciones electorales, con supuestos que deben explicarse y contrastarse."],
 ["media ponderada","Promedio en el que cada observación recibe un peso. Para interpretarlo hay que saber qué determina los pesos."],
 ["margen de error","Medida aproximada de incertidumbre muestral bajo supuestos estadísticos concretos. No recoge automáticamente los errores no muestrales."],
 ["microdatos","Registros individuales de respuestas de una encuesta, normalmente anonimizados, que permiten reconstruir tabulaciones y cruces cuando existe documentación."],
 ["trabajo de campo","Periodo en que se realizan las entrevistas. No debe confundirse con la fecha en que se publica el sondeo."],
 ["voto estimado","Porcentaje de voto proyectado por una encuestadora o modelo, diferente de la respuesta directa si hay ajustes."],
 ["swing proporcional","Método territorial que modifica proporcionalmente las cuotas provinciales de un partido según el cambio estimado en su voto nacional."],
 ["IPF","Ajuste iterativo de proporciones que hace compatibles totales de distintas dimensiones respetando aproximadamente una estructura de referencia."],
 ["MAE","Error absoluto medio: promedio de las diferencias absolutas entre una estimación y el resultado observado, medido aquí en puntos porcentuales."],
 ["rho_bloque","Parámetro que controla la parte del error de industria compartida entre bloques en el Motor 29N. Es un supuesto que debe analizarse por sensibilidad."],
];
const lookup=new Map(TERMINOS.map(([term,description])=>[term.toLocaleLowerCase('es'),description]));
const patterns=TERMINOS.map(([term])=>term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).sort((a,b)=>b.length-a.length);
const regex=new RegExp('(?<![\\p{L}\\p{N}])('+patterns.join('|')+')(?![\\p{L}\\p{N}])','giu');
const SKIP='a,button,input,select,textarea,script,style,noscript,code,pre,svg,math,nav,[contenteditable],.term-help,.glossary-tooltip,[data-no-glossary]';
let tooltip=null,active=null,rafScheduled=false;
function explanation(s){return lookup.get(s.toLocaleLowerCase('es'))}
function markText(node){
 if(!node?.parentElement||node.parentElement.closest(SKIP))return;
 const text=node.nodeValue;if(!text||!text.trim())return;
 regex.lastIndex=0;if(!regex.test(text))return;regex.lastIndex=0;
 const fragment=document.createDocumentFragment();let index=0,match;
 while((match=regex.exec(text))){
  if(match.index>index)fragment.append(document.createTextNode(text.slice(index,match.index)));
  const term=document.createElement('span');term.className='term-help';term.tabIndex=0;
  term.setAttribute('role','button');term.setAttribute('aria-haspopup','true');
  term.setAttribute('aria-label',match[0]+': mostrar definición');
  term.dataset.glossary=match[0].toLocaleLowerCase('es');term.textContent=match[0];
  fragment.append(term);index=match.index+match[0].length;
 }
 if(index<text.length)fragment.append(document.createTextNode(text.slice(index)));
 node.replaceWith(fragment);
}
function decorate(root){
 if(!root||!root.isConnected)return;
 const walk=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:n=>
  n.parentElement&&!n.parentElement.closest(SKIP)?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT});
 const nodes=[];while(walk.nextNode())nodes.push(walk.currentNode);
 nodes.forEach(markText);
}
function close(){if(active)active.setAttribute('aria-expanded','false');active=null;if(tooltip)tooltip.hidden=true}
function show(el){
 if(!el?.dataset?.glossary)return;
 const description=explanation(el.dataset.glossary);if(!description)return;
 if(active&&active!==el)active.setAttribute('aria-expanded','false');
 active=el;active.setAttribute('aria-expanded','true');
 if(!tooltip){tooltip=document.createElement('div');tooltip.className='glossary-tooltip';tooltip.id='glossary-floating';tooltip.setAttribute('role','tooltip');tooltip.hidden=true;document.body.append(tooltip)}
 tooltip.replaceChildren();
 const head=document.createElement('strong');head.textContent=el.textContent;
 const body=document.createElement('p');body.textContent=description;
 tooltip.append(head,body);tooltip.hidden=false;el.setAttribute('aria-describedby',tooltip.id);
 position();
}
function position(){
 if(!active||!tooltip||tooltip.hidden)return;
 const b=active.getBoundingClientRect();const width=tooltip.offsetWidth;
 const left=Math.max(12,Math.min(innerWidth-width-12,b.left+b.width/2-width/2));
 const above=b.bottom+tooltip.offsetHeight+12>innerHeight&&b.top>tooltip.offsetHeight+12;
 const top=above?b.top-tooltip.offsetHeight-9:b.bottom+9;
 tooltip.style.left=left+'px';tooltip.style.top=Math.max(8,top)+'px';
}
function initialise(){
 if(!document.body)return;
 decorate(document.body);
 const observer=new MutationObserver(records=>{
  const nodes=[];for(const record of records){for(const n of record.addedNodes){if(n.nodeType===1&&n.classList?.contains('glossary-tooltip'))continue;if(n.nodeType===3)nodes.push(n.parentElement);else if(n.nodeType===1)nodes.push(n)}}
  if(!nodes.length||rafScheduled)return;
  rafScheduled=true;requestAnimationFrame(()=>{rafScheduled=false;nodes.forEach(n=>{if(n?.isConnected&&!n.closest?.('.term-help')){if(n.nodeType===1)decorate(n);else if(n.parentElement)decorate(n.parentElement)}});if(active&&!active.isConnected)close()});
 });
 observer.observe(document.body,{childList:true,subtree:true});
 document.addEventListener('pointerover',event=>{const el=event.target.closest?.('.term-help');if(el&&event.pointerType!=='touch')show(el)});
 document.addEventListener('pointerout',event=>{if(active&&event.target===active&&!active.contains(event.relatedTarget)&&!tooltip?.contains(event.relatedTarget))close()});
 document.addEventListener('focusin',event=>{const el=event.target.closest?.('.term-help');if(el)show(el);else if(active)close()});
 document.addEventListener('click',event=>{
  const el=event.target.closest?.('.term-help');
  if(el){event.preventDefault();if(active===el&&!tooltip?.hidden)close();else show(el)}
  else if(active&&!tooltip?.contains(event.target))close();
 });
 document.addEventListener('keydown',event=>{
  if(event.key==='Escape')close();
  if((event.key==='Enter'||event.key===' ')&&event.target.classList?.contains('term-help')){event.preventDefault();if(active===event.target&&!tooltip?.hidden)close();else show(event.target)}
 });
 window.addEventListener('resize',position,{passive:true});window.addEventListener('scroll',position,{passive:true,capture:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initialise,{once:true});else initialise();

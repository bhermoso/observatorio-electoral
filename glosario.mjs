// Glosario contextual, accesible por cursor, teclado y toque. Sin dependencias.
export const TERMINOS = [
 ["intención directa ponderada","Se cuenta a cada entrevistado con un peso, en vez de contar a todos por igual. Ejemplo: si hay pocos jóvenes en la muestra, sus respuestas pueden valer más para representar su proporción en la población. Hay que indicar si el porcentaje se calcula sobre todas las entrevistas o solo sobre quienes eligen partido."],
 ["intención directa de voto","Se pregunta «Si mañana hubiera elecciones, ¿a qué partido votaría?». Se registran también «no sé», «no contestaré», blanco o abstención. Ejemplo: 250 menciones al PSOE entre 1.000 entrevistas equivalen al 25 % de todas las respuestas, antes de otros ajustes."],
 ["intención de voto","Lo que una persona dice que haría en unas elecciones hipotéticas. Si el 30 % de los entrevistados elige PP, ese 30 % describe respuestas, no necesariamente la cuota de votos que obtendría PP entre quienes finalmente voten."],
 ["recuerdo de voto","Se pregunta por el partido al que la persona afirma haber votado en una elección pasada. Si el PSOE obtuvo el 32 % pero lo recuerda el 40 % de la muestra, existe un desajuste que puede deberse a composición, memoria o respuesta; no se corrige automáticamente multiplicando por 32/40."],
 ["voto más simpatía","En determinadas encuestas, cuando alguien no declara a quién votará, se utiliza otra pregunta sobre qué partido siente más cercano para construir una variable combinada. Hay que conocer la regla exacta: no todo simpatizante termina votando."],
 ["simpatía","Es la cercanía que una persona siente hacia un partido, aunque no haya decidido votarlo. Por ejemplo, alguien puede simpatizar con Sumar y, sin embargo, votar al PSOE, abstenerse o seguir indeciso. No garantiza un voto."],
 ["transferencias de voto","Una tabla cruza lo que la persona recuerda haber votado antes con lo que dice que votaría ahora. Por ejemplo, de 100 antiguos votantes declarados del PP, 12 dicen ahora Vox. Son declaraciones muestrales, no 12 votos efectivos transferidos."],
 ["probabilidad de votar","Se pregunta cuán seguro está alguien de acudir a las urnas: por ejemplo, de 0 a 10. Un 10 expresa máxima seguridad declarada, no un 100 % comprobado de participación. Transformar esa escala en pesos exige validarla."],
 ["probabilidad de voto","Puede significar dos cosas distintas: posibilidad de que una persona vote a un partido, o posibilidad estimada de que ocurra un resultado electoral. En el Observatorio conviene especificar la unidad y el suceso; no es lo mismo «votaré seguro» que «probabilidad de mayoría»."],
 ["participación electoral","De cada 100 personas del censo, cuántas depositaron su voto. Por ejemplo, 70 votantes sobre 100 electores representan una participación del 70 %. No equivale al porcentaje que afirma en una encuesta que piensa votar."],
 ["error muestral","Variación esperable porque se entrevista solo a una parte de la población. Por ejemplo, un 30 % observado en una muestra de 1.000 personas no equivale a conocer el porcentaje exacto de millones de electores. Los pesos y el diseño afectan a su magnitud."],
 ["error no muestral","Diferencias que no desaparecen necesariamente por entrevistar a más personas: algunas no responden, otras interpretan mal la pregunta, determinados grupos quedan infrarrepresentados o los ajustes del instituto fallan. No queda cubierto por el margen de error habitual."],
 ["error de industria","Varias encuestadoras pueden equivocarse en el mismo sentido. Por ejemplo, todas podrían infravalorar un partido porque comparten dificultades para captar a sus votantes. El Motor 29N añade una dispersión común supuesta de 2,2 puntos para un partido cercano al 25 %; no es una corrección de voto fija."],
 ["efecto de encuestadora","El modelo compara las cifras de cada instituto con una tendencia común en fechas similares. Si una casa suele dar al PP 1,5 puntos más que el consenso, puede estimarse un efecto de +1,5; esto no demuestra que el instituto se equivoque 1,5 puntos respecto a las urnas."],
 ["sesgo de casa","Diferencia repetida entre las estimaciones de un instituto y una referencia compartida. Si una casa sitúa sistemáticamente a Vox un punto por encima de otras, el modelo puede atribuirle +1; el signo depende de la referencia elegida."],
 ["sesgo de encuestadora","Si, a igualdad aproximada de fecha, una casa publica resultados persistentemente mayores o menores que otras, se estima una diferencia sistemática. No debe confundirse con el error real del instituto, que solo se comprueba al conocer el escrutinio."],
 ["ponderación","Cada entrevista recibe un peso. Ejemplo: si un grupo supone el 20 % de la población pero solo el 10 % de la muestra, sus respuestas podrían duplicar su peso, dependiendo del procedimiento. Ponderar una muestra no es lo mismo que ponderar encuestas en una media."],
 ["postestratificación","Después de entrevistar, se ajustan pesos para acercar la muestra a distribuciones conocidas, como edad, sexo o territorio. Ejemplo: corregir una muestra con demasiadas personas mayores. No determina por sí sola a quién votarán quienes no responden."],
 ["muestra efectiva","Número aproximado de entrevistas independientes que proporcionarían una precisión similar. Si pocos participantes reciben pesos muy altos, una muestra nominal de 1.000 puede contener menos información estadística que 1.000 respuestas equilibradas."],
 ["efecto de diseño","Indica cuánto cambia la varianza frente a una muestra aleatoria simple de igual tamaño. Ejemplo: con un efecto de diseño de 1,5, la varianza es un 50 % mayor y el tamaño efectivo aproximado pasa de 1.500 a 1.000."],
 ["indecisos","Personas que todavía no indican un partido en la pregunta electoral. Si 200 de 1.000 no saben qué votarán, no se puede repartir esos 200 proporcionalmente sin explicar por qué esa regla sería razonable."],
 ["abstención","En elecciones, no acudir a votar; en una investidura, estar presente y no votar ni a favor ni en contra. Ejemplo parlamentario: 170 síes, 165 noes y 15 abstenciones no alcanzan 176 en primera votación, pero sí superan los noes en segunda."],
 ["estimación publicada","Cifra final difundida por una encuestadora, normalmente después de ajustes sobre las respuestas. Si una casa publica PSOE 29 %, ese porcentaje puede incorporar indecisos, participación y recuerdo, pero no podemos separar sus aportaciones sin conocer su procedimiento."],
 ["estimación de voto","Porcentaje esperado de votos válidos para cada candidatura, no de personas entrevistadas. Por ejemplo, excluir a quienes se abstendrán y asignar indecisos puede convertir un 24 % de respuestas directas en otra cifra; cada paso necesita justificación."],
 ["tendencia latente","Trayectoria de apoyo electoral que el modelo intenta reconstruir detrás de encuestas dispersas. Si tres casas publican 28 %, 30 % y 31 % para el PP, el modelo busca un nivel común compatible con esas mediciones y sus fechas."],
 ["paseo aleatorio","Supone que el apoyo de hoy es el de ayer más una pequeña variación impredecible. Cuanto más tiempo pase sin encuestas, mayor puede ser la dispersión de la estimación. No implica que el voto cambie siempre al azar en la realidad."],
 ["calibración histórica","Se observan errores de elecciones anteriores para fijar supuestos del modelo. Por ejemplo, si una casa sobreestimó al PP en 2023, puede ensayarse reducir parcialmente su peso relativo o ajustar su sesgo. Evaluar el ajuste sobre ese mismo resultado sería circular."],
 ["validación fuera de muestra","Un método se define usando ciertos estudios y se comprueba con otros que no intervinieron en su diseño. La prueba más exigente es evaluar elecciones diferentes, evitando usar el escrutinio futuro para escoger parámetros."],
 ["ablación","Se repite el mismo cálculo quitando una pieza. Por ejemplo, ejecutar el modelo con y sin correlación entre bloques y comparar cuántas simulaciones alcanzan 176 escaños. El cambio mide sensibilidad a ese supuesto, no un efecto probado sobre los votantes."],
 ["intervalo de incertidumbre","Si un partido obtiene entre 100 y 125 escaños entre los percentiles 5 y 95, el 90 % central de las simulaciones cae en ese rango. No asegura que el resultado verdadero quede ahí: depende de que el modelo esté bien calibrado."],
 ["percentil","Ordena las simulaciones de menor a mayor. El percentil 5 deja aproximadamente el 5 % por debajo; el 95 deja el 95 % por debajo. Entre ambos se encuentra el 90 % central de los escenarios simulados."],
 ["simulaciones conjuntas","Cada ejecución genera a la vez los escaños de todos los partidos. Si PP obtiene 140 y Vox 35 en una ejecución, el bloque suma 175 en esa ejecución. Se repite en todos los escenarios; no se suman las medianas separadas."],
 ["error provincial","Dos partidos con el mismo voto nacional pueden obtener distintos diputados según dónde se concentren sus apoyos. El motor añade variación al traslado del voto de 2023 a cada provincia para representar parte de esa incertidumbre territorial."],
 ["d’Hondt","En cada provincia se dividen los votos de las candidaturas por 1, 2, 3… y se asignan los escaños a los cocientes más altos. Por ejemplo, una provincia que reparte 3 diputados elige los tres mayores cocientes entre todas sus listas, sujeto a las reglas aplicables."],
 ["mayoría absoluta","En el Congreso de 350 diputados exige al menos 176 votos afirmativos. Un candidato con 175 síes no supera la primera votación de investidura aunque el resto se abstenga."],
 ["mayoría simple","En la segunda votación de investidura basta con más síes que noes. Por ejemplo, 170 a favor, 165 en contra y 15 abstenciones permiten la investidura; no hacen falta 176 síes."],
 ["bloque parlamentario","Suma hipotética de escaños de determinados partidos. Por ejemplo, PP + Vox se calcula en cada simulación aunque no exista un acuerdo de gobierno. La cifra no indica por sí misma que vayan a votar juntos."],
 ["escenario de investidura","Se fija qué formaciones apoyarían al candidato, cuáles votarían en contra y cuáles se abstendrían. Con esas decisiones hipotéticas se comprueba si se alcanzan 176 síes o, en segunda votación, si los síes superan a los noes."],
 ["cocina electoral","Son decisiones que cambian el resultado mostrado por una encuesta: a quién contar, qué pesos aplicar, cómo tratar indecisos y qué correcciones usar. En este Observatorio, la cocina de microdatos es un laboratorio; no alimenta automáticamente el Motor 29N."],
 ["cocina demoscópica","Por ejemplo, pasar de 250 menciones a un partido entre 1.000 entrevistados a una estimación entre votos válidos exige decidir cómo tratar abstención, indecisión y pesos. La cifra final puede cambiar sin que cambie una sola respuesta."],
 ["media ponderada","No todas las observaciones cuentan igual. Ejemplo: dos encuestas dan 30 % y 34 %; si la primera tiene peso doble, la media es (30×2 + 34×1)/3 = 31,33 %, no 32 %. El peso debe estar justificado."],
 ["margen de error","Rango aproximado asociado al muestreo bajo un nivel de confianza y un diseño específicos. Un «±3 puntos» no significa que todas las estimaciones estén a menos de 3 puntos de la realidad: puede haber errores sistemáticos."],
 ["microdatos","Una fila por persona entrevistada y columnas para sus respuestas, con anonimización. Permiten comprobar, por ejemplo, cuántos declaran PSOE entre quienes recuerdan haber votado PP, siempre que las variables estén disponibles."],
 ["trabajo de campo","Días concretos en los que se realizaron las entrevistas. Una encuesta publicada el 10 de noviembre puede reflejar opiniones recogidas entre el 2 y el 6; por eso no debe atribuirse automáticamente a hechos posteriores."],
 ["voto estimado","Porcentaje que el instituto o el modelo espera que obtenga cada partido entre los votos computados. Si PP tiene un 22 % de respuestas directas y se publica 28 %, la diferencia exige conocer denominadores y ajustes; no revela por sí sola la receta."],
 ["swing proporcional","Se parte de la distribución provincial anterior. Si un partido sube del 20 % al 25 % nacional, un traslado proporcional multiplicaría por 1,25 sus cuotas territoriales antes de los ajustes para preservar totales y restricciones."],
 ["IPF","Procedimiento iterativo que reajusta una tabla para que sus filas y columnas alcancen totales fijados. Ejemplo: distribuir el voto de un partido entre provincias conservando aproximadamente su patrón anterior y ajustando la suma nacional."],
 ["MAE","Se calcula la media de los errores sin signo. Si tres partidos tienen errores de 1, 2 y 3 puntos, el MAE es (1+2+3)/3 = 2 puntos. Un MAE menor indica mejor ajuste en esa evaluación, no necesariamente mayor precisión futura."],
 ["rho_bloque","Regula cuánta variación aleatoria del error de las casas se comparte entre partidos de un bloque. En el Motor 29N se usa 0,5 como supuesto; cambiarlo altera la dispersión conjunta de escaños y las frecuencias de mayoría."],
 ["placebo","En evaluación electoral, es una prueba de control realizada en una fecha sin el acontecimiento investigado. Sirve para saber si el método detecta cambios aparentes incluso cuando no hay un suceso que los explique."],
 ["prueba placebo","Se aplica el mismo análisis a fechas de control sin el acontecimiento. Si aparecen saltos parecidos, el cambio observado tras el suceso puede ser ruido normal de encuestas o del modelo."],
 ["pruebas placebo","Comparaciones repetidas en fechas de control sin el acontecimiento. Permiten medir la frecuencia de cambios aparentes y construir un umbral de detección; no prueban que el suceso haya causado nada."],
 ["umbral placebo","Valor de referencia obtenido de cambios en fechas sin acontecimiento. Ejemplo: si el 95 % de los cambios placebo no supera 2 puntos, un salto de 1 punto no destaca del ruido habitual. Superar 2 tampoco demuestra causalidad."],
 ["percentil 95","Valor por debajo del cual queda el 95 % de las observaciones o simulaciones. En las pruebas placebo, el percentil 95 de los cambios absolutos es un umbral de detección, no una probabilidad de causalidad."],
 ["percentil 5","Valor que deja el 5 % inferior de las simulaciones. Junto al percentil 95 delimita el 90 % central de los resultados simulados, siempre condicionado al modelo."],
 ["p5","Abreviatura del percentil 5: el 5 % de las simulaciones queda por debajo. No es una estimación mínima garantizada."],
 ["p95","Abreviatura del percentil 95: el 95 % de las simulaciones queda por debajo. No es un límite máximo garantizado."],
 ["salto inmediato","Cambio que un modelo de tendencia atribuye alrededor de una fecha concreta, por ejemplo de un día al siguiente. Puede reflejar ruido, cambios de muestra, tendencias previas o el acontecimiento; no identifica por sí solo su causa."],
 ["salto estimado","Variación de una tendencia reconstruida por el modelo alrededor de una fecha. No es una variación observada de una misma persona ni una prueba de que el acontecimiento la causó."],
 ["cambio a 14 días","Diferencia estimada entre el nivel de voto cercano al acontecimiento y el de dos semanas después. Requiere encuestas realmente posteriores y puede contener cambios ajenos al acontecimiento."],
 ["efecto causal","Cambio que habría ocurrido por el acontecimiento y no se habría producido en su ausencia. Para estimarlo haría falta una comparación contrafactual defendible; observar encuestas antes y después no basta."],
 ["causalidad","Relación en la que un acontecimiento produce efectivamente un cambio. La sucesión temporal o correlación entre encuestas no basta para demostrarla."],
 ["correlación","Relación estadística entre dos variables. Que el voto cambie tras una noticia no implica que la noticia sea su causa: ambas cosas pueden responder a otros factores."],
 ["comparabilidad","Grado en que dos mediciones pueden contrastarse sin mezclar diferencias de método, universo, fechas, pregunta o candidaturas. Usar el mismo instituto no garantiza por sí solo comparabilidad."],
 ["campo íntegramente posterior","Encuesta cuyas entrevistas comenzaron después del día del acontecimiento. Una encuesta que incluye ese mismo día no se clasifica como plenamente posterior si se desconoce la hora de cada entrevista."],
 ["oleada","Trabajo de campo específico de un instituto. Dos oleadas pueden representar poblaciones o cuestionarios diferentes, aunque las publique la misma empresa."],
 ["serie temporal","Secuencia de estimaciones ordenadas por fecha de trabajo de campo. Los cambios entre puntos pueden mezclar variaciones reales de opinión y diferencias entre institutos."],
 ["error típico","Estimación de la variabilidad de un estimador al repetir un procedimiento bajo sus supuestos. Un salto de 1 punto con error típico de 1,5 no permite distinguir fácilmente el cambio del ruido."],
 ["error estándar","Otra denominación habitual de error típico: mide variación estadística estimada, no todos los sesgos posibles ni la veracidad causal del resultado."],
 ["intervalo de confianza","Intervalo que, bajo un procedimiento de muestreo y supuestos correctos, cubriría el parámetro en una proporción fijada de repeticiones. En cuotas online no probabilísticas no debe interpretarse automáticamente así."],
 ["significación estadística","Un resultado puede ser poco compatible con una hipótesis estadística según un modelo de error. No demuestra causalidad ni que el cambio tenga importancia política."],
 ["ruido estadístico","Oscilación de cifras que puede aparecer sin cambio real: variabilidad muestral, diferencias de diseño, redondeos o incertidumbre del modelo."],
 ["incertidumbre de método","Variación de las estimaciones al elegir razonablemente distintas reglas, fuentes, anclas o parámetros. No se elimina simplemente aumentando el número de simulaciones."],
 ["intervalo del 90 %","Tramo entre los percentiles 5 y 95 de las simulaciones, que contiene su 90 % central. Si el modelo está mal calibrado, no implica que el resultado real caiga dentro nueve de cada diez veces."],
 ["mediana de escaños","Valor central de los escaños obtenidos en todas las simulaciones: la mitad de los escenarios queda a cada lado. La suma de medianas de partidos no tiene por qué coincidir con la mediana de un bloque."],
 ["probabilidad de mayoría","Proporción de simulaciones en que un bloque suma al menos 176 escaños. Depende de los supuestos del modelo y no es la probabilidad de que esos partidos acuerden gobernar."],
 ["simulación electoral","Escenario generado por el modelo con votos, reparto provincial y escaños compatibles entre partidos. Muchas simulaciones describen la incertidumbre asumida, no garantizan que esté bien calibrada."],
 ["error de pronóstico","Diferencia entre lo estimado antes de votar y el resultado oficial, medida tras la elección. Puede estudiarse en puntos de voto, escaños o cobertura de intervalos; no se conoce para unas elecciones futuras."],
 ["retroprueba","Aplicación del modelo a una fecha pasada usando solo la información disponible entonces, para compararlo después con el resultado real. Si ajusta parámetros con ese resultado, deja de ser una evaluación independiente."],
 ["backtesting","Retroprueba del método en elecciones y cortes anteriores. Debe respetar fechas de publicación, evitar duplicaciones y no utilizar el resultado futuro para seleccionar la receta evaluada."],
 ["veda electoral","Período legal anterior a la votación durante el cual se restringe publicar sondeos electorales. Las retropruebas deben detener su información en la fecha legal de publicación."],
 ["fecha de publicación","Día en que una encuesta se hizo accesible al público. Es distinto de las fechas de entrevista: una retroprueba no puede utilizarla antes de su publicación."],
 ["fecha de corte","Fecha hasta la cual el Observatorio incorpora información conocida y disponible. Dos modelos con cortes diferentes no deben compararse como si midieran la misma actualidad."],
 ["media simple","Promedio que da el mismo peso a cada observación o instituto. Ejemplo: encuestas con 30 % y 34 % producen 32 %. No equivale a estimación propia corregida ni a sumar entrevistas de distintos institutos."],
 ["promedio publicado","Agregación de las estimaciones finales difundidas por las encuestadoras. Esas cifras ya pueden incluir su propia cocina; no son una media de respuestas directas sin ajustar."],
 ["promedio de encuestas","Media de estimaciones publicadas por distintos estudios, seleccionados con reglas de fecha y peso. No utiliza necesariamente los microdatos individuales."],
 ["margen de diferencia","Incertidumbre aproximada de la resta de dos mediciones bajo un diseño y supuestos concretos. No equivale a sumar sin más dos márgenes y no recoge necesariamente sesgos comunes."],
 ["fuente primaria","Documento o base original que contiene los datos y la ficha del estudio: informe, cuestionario, microdatos o tablas oficiales. Una noticia que cita una encuesta puede ser una fuente secundaria."],
 ["fuente secundaria","Publicación que resume o reproduce datos de otro productor. Puede servir para localizar una encuesta, pero debe cotejarse con el original antes de utilizarla como dato verificado."],
 ["muestra","Conjunto de personas entrevistadas. Una cifra grande no elimina sesgo de selección, no respuesta ni diferencias entre universos de estudio."],
 ["universo","Población a la que pretende representar una encuesta, por ejemplo electores residentes en España. Cambiar el universo puede impedir comparar dos oleadas directamente."],
 ["cuota electoral","Porcentaje de votos válidos atribuido a una candidatura. Debe precisarse el denominador; no equivale al porcentaje de entrevistados que la menciona espontáneamente."],
 ["distribución provincial","Reparto territorial de los votos por las 52 circunscripciones del Congreso. Con la misma cifra nacional de voto, una distribución provincial distinta puede cambiar bastante los escaños."],
 ["magnitud de distrito","Número de diputados que elige una circunscripción. Provincias con pocos escaños presentan barreras efectivas más altas para candidaturas pequeñas."],
 ["ancla de consenso","Referencia elegida por el motor para identificar los sesgos relativos de las casas. Elegir solo privadas o incluir CIS puede cambiar el nivel estimado; la elección no equivale a descubrir la verdad."],
 ["contrafactual","Situación hipotética que habría ocurrido sin un acontecimiento. Es necesaria para atribuir un efecto causal, pero no se observa directamente en una comparación sencilla de antes y después."],
 ["ajuste histórico","Corrección basada en errores de encuestas anteriores. Solo es razonable si se valida fuera del mismo resultado usado para calcular el ajuste y si las condiciones son comparables."],
 ["puerta de calidad","Reglas que determinan qué registros pueden alimentar el pronóstico: se excluyen citas sin verificar, fechas de campo supuestas y solapamientos susceptibles de duplicar entrevistas."],
 ["instituto demoscópico","Empresa u organismo que realiza una encuesta. En el promedio por institutos se intenta no otorgar más peso a quien publica más oleadas en una misma ventana."],
 ["número de simulaciones","Cantidad de elecciones ficticias que ejecuta el motor. Aumentarla reduce el error numérico de Monte Carlo, pero no corrige supuestos erróneos, fuentes deficientes ni sesgos del modelo."],
 ["Monte Carlo","Método que repite cálculos con valores aleatorios para representar distribuciones de posibles resultados. Sus frecuencias dependen de las distribuciones introducidas, no son evidencias directas de acierto histórico."],
 ["efecto de casa","Desviación sistemática estimada de una encuestadora respecto a una referencia temporal común. No debe confundirse con una acusación de manipulación."],
 ["diferencia en puntos porcentuales","Resta entre dos porcentajes. Pasar del 25 % al 23 % son −2 puntos porcentuales, no una caída del 2 % relativo."],
 ["puntos porcentuales","Unidad para restar porcentajes: del 30 % al 27 % hay −3 puntos porcentuales. Un cambio relativo sería −10 % respecto a 30."],
 ["voto válido","Voto a una candidatura o voto en blanco; los votos nulos no se cuentan como válidos. El denominador determina cómo se expresan las cuotas de partido."],
 ["voto directo","Respuesta declarada en una pregunta sobre intención de voto antes de determinadas imputaciones o correcciones. Puede cambiar el denominador según se incluyan indecisos y abstencionistas."],
 ["voto estimado por partido","Porcentaje que un instituto o modelo calcula para una candidatura entre votos válidos. No equivale necesariamente a las respuestas directas de los entrevistados."],
]; 
const lookup=new Map(TERMINOS.map(([term,description])=>[term.toLocaleLowerCase('es'),description]));
const patterns=TERMINOS.map(([term])=>term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).sort((a,b)=>b.length-a.length);
const regex=new RegExp('(?<![\\p{L}\\p{N}])('+patterns.join('|')+')(?![\\p{L}\\p{N}])','giu');
const SKIP='a,button,summary,input,select,textarea,script,style,noscript,code,pre,svg,math,nav,[contenteditable],.term-help,.glossary-tooltip,[data-no-glossary]';
let tooltip=null,active=null,rafScheduled=false;
const queuedDecorations=new Set();
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
function decorateSummaries(root){
 const summaries=[...(root.matches?.('summary')?[root]:[]),...(root.querySelectorAll?.('summary')||[])];
 for(const summary of summaries){
  regex.lastIndex=0;
  const seen=new Set(),definitions=[];
  for(const match of summary.textContent.matchAll(regex)){
   const key=match[0].toLocaleLowerCase('es');
   if(seen.has(key))continue;
   seen.add(key);
   definitions.push(match[0]+': '+explanation(match[0]));
   if(definitions.length===2)break;
  }
  if(definitions.length){
   summary.title=definitions.join(' | ');
   summary.setAttribute('aria-description',definitions.join(' '));
  }
 }
}
function decorate(root){
 if(!root||!root.isConnected)return;
 // No se introducen controles enfocables dentro de summary: título y descripción nativos.
 decorateSummaries(root);
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
  nodes.forEach(n=>queuedDecorations.add(n));
  if(!queuedDecorations.size||rafScheduled)return;
  rafScheduled=true;requestAnimationFrame(()=>{
   rafScheduled=false;
   const pending=[...queuedDecorations];queuedDecorations.clear();
   pending.forEach(n=>{
    if(n?.isConnected&&!n.closest?.('.term-help')){
     if(n.nodeType===1)decorate(n);
     else if(n.parentElement)decorate(n.parentElement);
    }
   });
   if(active&&!active.isConnected)close();
  });
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

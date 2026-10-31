# Promedio y proyección condicionada

La vista `#analisis` conecta los sondeos incorporados con una media y una proyección territorial experimental. Se ejecuta en el navegador con los datos publicados del repositorio. No añade nuevas entrevistas ni atribuye a un instituto las cifras del modelo.

## Selección y promedio

Fecha de referencia elegible y ventana de 30, 45 o 90 días naturales desde el fin de campo. Solo estudios publicados hasta esa fecha, del tipo encuesta estimada y ámbito España (incluido el estudio que excluye Ceuta y Melilla). Se conserva un estudio por instituto, el de campo más reciente; los agregadores externos no participan. La diferencia de cobertura territorial de 40dB. permanece visible y su extrapolación al agregado nacional es una aproximación que el usuario puede excluir con peso cero.

Cada instituto empieza con peso 1, sin ponderación automática por muestra ni calificaciones subjetivas de calidad. Se puede introducir peso manual entre 0 y 5. Cero excluye. La recencia es opcional: peso efectivo = peso manual × 2^(-días desde fin de campo / semivida). Sin recencia, peso efectivo = peso manual. Se pueden comparar los resultados incluyendo o excluyendo CIS con la misma regla que cualquier instituto.

Para cada categoría se divide la suma de porcentaje × peso por la suma de pesos de las fuentes que efectivamente publican ese porcentaje. Ausencia no equivale a cero. Se muestran cobertura, fuentes y pesos. La media de Sumar/FA combina etiquetas distintas con una advertencia expresa: es descriptiva y no alimenta la proyección. Podemos y SALF también tienen cobertura parcial y quedan fuera del reparto. Las medias parciales no se normalizan a 100 ni constituyen una distribución electoral completa.

## Proyección territorial

Se requieren al menos dos institutos activos y porcentajes de PP, PSOE y Vox publicados por todos ellos. Es el núcleo común de la carga actual. Ningún porcentaje nacional se transforma directamente en escaños nacionales.

1. Se agrupan los votos oficiales provinciales de 2023 en PP, PSOE/PSC, Vox y resto de candidaturas. Se conservan los votos válidos, blancos y magnitudes de aquella convocatoria. No se predice participación ni un nuevo reparto de escaños entre provincias.
2. Se fijan como objetivos nacionales los tres porcentajes del promedio sobre el voto válido total de 2023. El resto de votos a candidaturas es el residuo tras descontar esos objetivos y los votos en blanco conservados.
3. Ajuste proporcional iterativo: se escalan columnas para acercarse a los objetivos nacionales y filas para conservar el voto provincial a candidaturas. Se repite hasta un error máximo inferior a 0,0001 votos o se rechaza si no converge. También se rechazan objetivos negativos o sin soporte territorial.
4. Redondeo por restos mayores dentro de cada provincia para conservar su total entero. El resto se distribuye entre sus candidaturas originales de 2023 en proporción al voto que tuvieron allí. Se preservan ausencias territoriales y no se crean papeletas nuevas.
5. D’Hondt provincial, umbral 3 % sobre válidos con blancos y mayoría simple en Ceuta/Melilla. Se suman los 52 repartos. Se usa la misma convención didáctica de empates reproducibles del laboratorio.

La tabla publica PP, PSOE, Vox y **Resto 2023**. El último grupo no es una candidatura ni el pronóstico de las formaciones actuales: mezcla los resultados que obtendrían bajo ese supuesto todas las restantes papeletas históricas. Las candidaturas subyacentes y los votos modelizados se conservan para auditoría en la descarga. Esta versión no separa una proyección territorial de Podemos, SALF o de las coaliciones actuales: faltan bases y decisiones de armonización justificadas.

El resultado es una estimación condicional experimental, no un pronóstico completo de 2026. No se publican probabilidades ni intervalos de confianza sin una modelización adicional. Que el motor reproduzca 2023 no valida la capacidad predictiva territorial del ajuste. No se han evaluado sus errores fuera de muestra. El peso manual y la recencia expresan decisiones de sensibilidad, no correcciones de sesgo demostradas. Los acontecimientos no introducen multiplicadores de voto.

## Fuentes metodológicas

El ajuste de márgenes se inspira en el procedimiento matemático IPF descrito en la [documentación oficial de R](https://stat.ethz.ch/R-manual/R-patched/RHOME/library/stats/html/loglin.html). Esa referencia explica el algoritmo, no valida esta aplicación electoral. [AAPOR](https://aapor.org/polling-accuracy/) explica las limitaciones de las encuestas y la incertidumbre de sus promedios. Datos base y motor: [metodología del observatorio](methodology.md); selección: [archivo y originales](poll-archive.md).

La exportación identifica tipo, fecha, ventana, semivida, pesos, estudios y fuentes, medias y contribuciones, objetivos y porcentajes alcanzados, supuestos y reparto por circunscripción. No contiene registros individuales.

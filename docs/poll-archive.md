# Archivo de encuestas y fuentes de referencia

Actualización revisada: 30 de octubre de 2026. Nueve estudios, siete institutos con datos transcritos. La selección no es exhaustiva; se revisa mediante una tarea programada.

## Registro incorporado

| Instituto | Estudio / publicación | Campo | Muestra | Escaños transcritos |
| --- | --- | --- | --- | --- |
| CIS | 3411, 05/07/2023 | 08–27/06/2023 | 29.201 | Cuatro horquillas históricas |
| CIS | 3415, 17/07/2023 | 10–12/07/2023 | 8.798 | No publicados en la estimación consultada |
| CIS | 3582, 14/10/2026 | 01–06/10/2026 | 5.025 | No publicados |
| 40dB. / EL PAÍS–SER | Flash, 09/10/2026 | 07–08/10/2026 | 800 | Puntos y horquillas del escenario de listas separadas |
| GAD3 / ABC–Vocento | 12/10/2026 | 06–08/10/2026 | 1.077 | Puntos; Otros conserva el grupo de la fuente |
| DYM / 20minutos | 09/10/2026 | 05–07/10/2026 | 1.011 | Tres horquillas verificadas en el texto original |
| IMOP Insights / El Confidencial | Metadatos 23/10/2026; encabezado 21/10 | 13–16/10/2026 | 1.000 | Tabla completa del gráfico del instituto |
| Sigma Dos / El Mundo | 26/10/2026 | 08–22/10/2026 | 3.122 | Once horquillas y dos puntos, con categorías originales |
| Ateneo del Dato / elDiario.es | 25/10/2026 | 20–22/10/2026 | 2.000 | Sin transcribir hasta verificar el gráfico original |

Los enlaces originales, localizadores y observaciones de cada registro están en `data/polls.json` y en la ficha visible del archivo. No se rellenan campos desde otros recopiladores cuando hay discrepancias con la fuente primaria.

## Fuentes consultadas

- CIS 3582: https://www.cis.es/documents/d/guest/3582_estimacion-pdf y https://www.cis.es/documents/d/guest/es3582mar_A-pdf. Descarga directa de ambos PDF, extracción y revisión visual de la tabla de estimación. La publicación se contrasta con el anuncio del CIS y la cobertura fechada del 14 de octubre. PESO y PESOCCAA según la ficha original.
- 40dB.: https://ep00.epimg.net/infografias/encuestas40db/2026/10-08-barometro-flash/2026_10_informe_voto_barometro_flash.pdf. Voto en página 5, escaños en página 8 y ficha en página 26; tablas revisadas visualmente. La muestra excluye Ceuta y Melilla. El escenario unitario del mismo informe no se añade como una encuesta independiente.
- GAD3: https://www.gad3.com/barometro-abc-estimacion-de-voto-nacional-octubre-2026/. Texto y ficha del instituto. La descarga directa del HTML dio 403; el lector web permitió revisar el original. Cuatro porcentajes y cinco grupos de escaños. La cifra de Otros del texto no cuadra con las principales; no se incorpora como dato comparable. No se decide entre valores contradictorios de Podemos en recopiladores.
- IMOP: https://www.imop.es/encuesta-pre-electoral-el-confidencial-ola-2/. HTML original descargado: campo, muestra, tres porcentajes y matriz de datos del gráfico de escaños. Solo se verifica información pública; no se ejecutan scripts del proveedor. La página combina encabezado 21 de octubre y metadatos datePublished del 23: discrepancia conservada. Método de entrevista ausente en la página consultada, por tanto `null`.
- DYM: https://www.20minutos.es/nacional/psoe-absorbe-intencion-votos-sumar-podemos-mientras-pp-vox-consolidan-su-mayoria_7046598_0.html. Resultados y ficha publicados por el comitente; solo se transcriben escaños expresamente verificados en el texto.
- Ateneo: https://www.eldiario.es/politica/bloque-izquierdas-recorta-distancias-pp-vox-mantienen-mayoria-absoluta_1_13611052.html. Resultados y ficha del comitente; las coaliciones valenciana y canaria se incluyen en Frente Amplio según su nota.

Las huellas de los documentos descargados se conservan en `data/poll-source-hashes.json`. No se redistribuyen los PDF ni el contenido completo de las publicaciones periodísticas.

## Directorio y agregadores

Metroscopia está registrada con su fuente institucional y metodología: https://metroscopia.org/lo-que-medimos/ y https://metroscopia.org/como-medimos/. No se ha localizado en las fuentes consultadas un registro electoral reciente con ficha suficiente para transcribir; no se afirma que no exista. No se convierten estudios de clima social en voto estimado.

El promedio de EL PAÍS de Kiko Llaneras se registra por separado con referencia al **3 de octubre de 2026**, no como dato del día: https://elpais.com/actualidad/newsletter-kiko-llaneras/2026-10-03/que-dicen-las-encuestas-si-hay-elecciones-la-ventaja-pp-vox-y-las-opciones-de-sanchez.html. Porcentajes redondeados y puntos centrales del modelo externo, según la publicación. No se mezcla con las encuestas de origen ni se reproduce su modelo. El contenido está en `data/references.json`; no se incluye en los nueve sondeos ni en el número de institutos con datos.

## Reglas de mantenimiento

1. Buscar un original del instituto o del comitente e identificar fecha, muestra, campo, universo, método y escenario.
2. Registrar ausentes como `null` o claves ausentes. Cero solo cuando se publica como tal. Las categorías agrupadas conservan su nombre.
3. Transcribir puntos y horquillas por separado; no imputar el punto medio ni sumar extremos como un Congreso.
4. Documentar las discrepancias y el método de verificación. No extrapolar escaños de un porcentaje nacional.
5. Deduplicar por identificador y estudio, regenerar ambos CSV con `node scripts/export-csv.mjs`, ejecutar `npm test` y `npm run build` y revisar la ficha en navegador antes de publicar.

No hay promedio propio. No se asume que una encuesta anterior al 28 de octubre de 2026 mida el efecto del accidente de Urda. La fecha relevante para esa comparación es la de las entrevistas, no la de publicación.

## Ampliación del directorio académico y territorial

Se documentan IESA-CSIC (Córdoba), CADPEA y laboratorio CATI de la UGR, ICPS y su serie Sondeig d’Opinió Catalunya, GESOP como productor/empresa de campo, y CENTRA con su barómetro andaluz. No aumentan las nueve encuestas nacionales transcritas mientras no se incorpore un estudio electoral concreto y verificable. La documentación de 2015 de la UGR y el sondeo ICPS de 2025 se identifican como históricos. Las ejecuciones diarias deben revisar nuevos originales, sin confundir estudios de clima social, métodos de entrevista, encuestas autonómicas y estimaciones nacionales.

## Revisión del 30 de octubre de 2026

Se incorpora el sondeo de Sigma Dos para El Mundo publicado el 26 de octubre: https://www.sigmados.com/noticia?id=OUze2FxEIVfARtu3. Verificados texto, ficha y gráfico ampliado en el navegador. El catálogo actual del instituto permitió corregir un identificador de noticia obsoleto de los resultados de búsqueda; la descarga directa devolvía 403. Campo 8–22 de octubre, 3.122 entrevistas, CATI + CAWI. Se conservan Frente Amplio, Compromís y Adelante Andalucía separados. No se adopta el 8,2 % agrupado de recopiladores. Coalición Canaria tiene intervalo 0–1; las horquillas no se suman ni se convierten en puntos medios.

Esta incorporación amplía cobertura histórica reciente, sin aportar entrevistas posteriores al accidente del 28 de octubre. GESOP continúa pendiente: el enlace del comitente no permitió verificar el original. Las búsquedas y catálogos consultados no justifican añadir una encuesta posterior ni completar cifras desde recopiladores. Las fechas de verificación anteriores se conservan en sus fichas.

### Fuente vasca pendiente de informe original

El 30 de octubre se localizó una noticia de elDiario.es sobre un Sociómetro para las generales en Euskadi. Se verificó la identidad del Gabinete de Prospección Sociológica en su catálogo oficial: https://www.euskadi.eus/estudios-sociologicos/. El catálogo cronológico consultado no permitió localizar el informe concreto con ficha y tablas. Se incorpora solo como referencia institucional pendiente, sin cifras ni aumento del recuento de encuestas. La noticia sirve de pista de búsqueda en `leadSource`, no sustituye la documentación del productor. Mantener separados los ámbitos y las elecciones; no confundir el Sociómetro 89 de junio sobre Juntas Generales con el estudio anunciado en octubre.

# Incorporación del 14 de noviembre de 2026

Se revisan fuentes primarias de encuestas, promedios y estimaciones alternativas. No cambian los parámetros del modelo ni las cuatro secciones del producto.

## Tres encuestas incorporadas

- **40dB. / EL PAÍS-SER, tracking día 1**, publicado el 13: 1.000 entrevistas CAWI del 10 al 12. Se usa el PDF original (voto p. 6, escaños p. 8 y ficha p. 24), que difiere de la recopilación secundaria: PP 126 (122–135) y Frente Amplio nacional 3,5 %, con 5 (4–6) escaños. Compromís-FV, Ara Més y UPC permanecen separados. La estimación de voto suma 100 sobre las categorías originales y los puntos de escaños transcritos suman 350 sin duplicar el grupo «Otros». Solo PP, PSOE, Vox y SALF tienen equivalencias ya establecidas en el motor para esta entrega; no se fabrica un agregado territorial.
- **Sigma Dos / El Mundo, entrega del 12**: 3.870 entrevistas mixtas CATI/CAWI, del 3 al 11. Se conserva el cierre explícito del campo pese al rótulo «estimación 12/11» de la ficha.
- **Sigma Dos / El Mundo, entrega del 13**: 4.620 entrevistas mixtas, del 3 al 12. Son 750 entrevistas más que la entrega anterior, no una muestra nueva independiente. La puerta de calidad existente conserva la posterior y excluye las solapadas del corte operativo; el archivo retiene todas.

Estos campos atraviesan el 11N y contienen entrevistas anteriores y posteriores o realizadas durante la huelga. No permiten atribuir causalmente los cambios a ese acontecimiento. No se incorporan las afirmaciones causales de los titulares como hechos del modelo.

## Promedios externos y estimaciones

- **EL PAÍS / Kiko Llaneras, 14 de noviembre**: se conserva una instantánea del promedio central del texto y su método, con Vox expresado aproximadamente porque el original dice «alrededor del 19 %».
- **elDiario.es, 13 de noviembre**: porcentajes del texto y proyección parcial. Los 13 escaños de Frente Amplio más Podemos se mantienen conjuntos, sin repartirlos entre candidaturas.
- **Demócrata, 14 de noviembre**: media fechada de quince institutos. El Congreso mostrado es una media de proyecciones de diez empresas, no un modelo propio. Su metodología de recencia, muestra y exclusiones se documenta, sin adoptarla como receta del Observatorio.
- **Ateneo del Dato sobre CIS 3584**: se amplía la referencia existente con el CSV original de sus gráficos. Continúa siendo la misma muestra del CIS, no una encuesta adicional. Se conservan sus agrupaciones y horquillas; no se usan como cifras oficiales del CIS los comparadores agregados de su CSV que difieren de las categorías del documento primario.
- **NC Report / La Razón, 9 de noviembre**: se verifican texto y gráfico con PP 32,6 % y 136–138 escaños. Muestra y modo siguen sin ficha completa verificada. Se incorpora como estimación documentada con metodología incompleta, fuera del archivo de encuestas verificadas, sin crear otra observación en el motor; el registro de prensa ya existente conserva su marca de muestra supuesta.

Las cifras de referencias antiguas almacenadas en `values` también pasan a ser consultables; antes el directorio solo mostraba las guardadas como `approximateValues`. Se presentan en un desplegable dentro de cada referencia de «Promedios y fuentes», sin añadir un destino al menú principal. Los porcentajes, puntos, horquillas, ceros y ausencias permanecen distintos.

## Pendientes

Winston / Artículo14 devuelve HTTP 403 en el original consultado; no se importa desde el recopilador. Las entregas de SW Demoscopia localizadas en Electomanía no tienen aquí un nuevo informe primario con muestra y campo verificados; no se extrapolan a partir de entregas previas. La vigilancia obtiene catorce de quince fuentes accesibles, por lo que no se declara búsqueda exhaustiva.

## Trazabilidad y publicación

`data/sources/revision-2026-11-14.json` registra fuentes consultadas, huellas SHA-256, CSV de Ateneo transcrito y pendientes. La publicación anterior observada se conserva en `modelo/registro/publicados` antes de cambiar el archivo. Se regeneran CSV, procedencia histórica y pronóstico; el build sigue rechazando una salida cuyo hash de encuestas esté desactualizado.

La portada conserva tres tarjetas, ahora una por instituto, para que el tracking diario de una casa no ocupe dos o tres espacios. Es una regla de presentación: no borra oleadas del archivo ni cambia la selección o los pesos del motor.

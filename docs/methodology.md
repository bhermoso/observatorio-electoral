# Metodología

## Tres naturalezas de información

1. `official`: escrutinio definitivo del Congreso del 23 de julio de 2023 publicado por la JEC. Datos históricos con CERA.
2. `poll-estimate`: estimación de voto publicada por un instituto y su comitente; no equivale a voto directo ni a un recuento real. El archivo incorpora estudios del CIS, 40dB., GAD3, IMOP, DYM y Ateneo del Dato. Cada ficha conserva fechas, ámbito, escenario y evidencia. No es un archivo exhaustivo.
3. `simulation`: cálculo didáctico sobre votos transformados mediante pesos. No es una predicción y no hereda el carácter oficial de su base.

## Denominadores

Participación = votantes / censo total, con residentes en España y CERA. Votos válidos = votos a candidaturas + votos en blanco. Los nulos no se incluyen en porcentajes de voto válido ni en el umbral. PSOE y PSC se agregan solo para presentación; se preservan los originales separados en datos y pesos.

## Transformación y reparto

Para cada circunscripción y candidatura: `votos_simulados = Math.round(votos_2023 * peso)`. Pesos entre 0 y 5; por defecto 1. El voto en blanco tiene su propio peso. No se normalizan votos ni se imponen censo, abstención o conservación de participación: los pesos son una transformación algebraica, no un modelo de comportamiento. Las candidaturas ausentes de una provincia permanecen ausentes.

Se utiliza el reparto de escaños de la convocatoria de 2023, no el de una futura convocatoria. El total nacional se obtiene sumando 52 repartos, nunca aplicando D’Hondt al voto nacional.

1. Excluir candidaturas con menos del umbral sobre votos válidos provinciales. Regla ordinaria: 3 %, configurable para experimentos. La igualdad exacta con el umbral sí entra.
2. Adjudicar los escaños a los mayores cocientes `votos / (escaños_asignados + 1)`.
3. Comparar cocientes por productos cruzados con `BigInt`. Igual cociente: mayor número total de votos.
4. Igualdad también en votos: orden inicial reproducible mediante semilla y hash del identificador; sucesivos empates de las mismas candidaturas favorecen a la que recibió menos escaños (alternancia en empates de dos). Es una convención didáctica, no un sorteo oficial. En empates de tres o más también se usa esta convención de prioridad; debe revisarse cualquier aplicación jurídica.
5. Ceuta y Melilla: mayor número de votos sin aplicar el umbral. Una única plaza; empate bajo la convención didáctica anterior.

Si no hay votos elegibles, se rechaza el escenario. No se adjudican escaños arbitrarios. La exportación JSON contiene tipo, elección base, fuente, pesos, umbral, semilla, cocientes, empates y escaños.

## Encuestas y microdatos

Los errores de muestreo de las fichas describen un supuesto de muestreo aleatorio simple y no son intervalos de confianza de la estimación electoral. El archivo presenta estudios individuales y la vista Promedio y escaños añade un promedio configurable con una proyección condicionada; consultar analysis.md. Los modelos y promedios externos se identifican con su autor y fecha, fuera del recuento de encuestas. Los escaños publicados conservan puntos y horquillas por separado; los ausentes no equivalen a cero. La visualización conjunta Sumar/FA no establece equivalencia entre candidaturas de años o escenarios distintos.

Para reanalizar entrevistas, descargar el fichero original y su diccionario en el CIS; usar PESO a nivel nacional y, en el estudio 3411, PESOPROV o PESOCCAA para sus respectivos ámbitos. No aplicar esos pesos a los agregados del dashboard. Ver [archivo y verificación](poll-archive.md) y [política de mantenimiento](maintenance.md).

## Validación

Las pruebas comparan los 52 repartos con la JEC, comprueban sumas de votos, blancos, válidos y escaños, verifican hashes de fuentes y ejercitan umbral, empate, mayoría simple, entradas inválidas y conservación de escaños en 30 escenarios deterministas. La equivalencia de la base histórica no valida la capacidad predictiva de un escenario.

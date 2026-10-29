# Diccionario y repositorio de microdatos

Todos los ficheros de datos están en UTF-8; los CSV usan comas, cabeceras y campos entre comillas. Incluyen BOM para facilitar su lectura en Excel. Los enteros no tienen separador de millares; los decimales usan punto.

## election.json

- `election`: fecha ISO de la convocatoria; `verified`: fecha de verificación documental; `kind`: official.
- `source`, `seatSource`: publicaciones del BOE.
- `parties`: identificador interno `p0`…`p58`, denominación oficial y etiqueta breve. El identificador no es código oficial INE.
- `districts.id`: índice interno según orden alfabético del BOE (Ceuta y Melilla al final). **No es código INE**.
- `districts.name`, `seats`: denominación y magnitud de 2023.
- `electors`, `turnout`: censo y votantes, incluidos CERA.
- `candidacy`, `blank`, `valid`, `invalid`: votos a candidaturas, blancos, válidos y nulos.
- `votes`: votos enteros por candidatura. Clave ausente = sin dato de candidatura presentada en ese territorio, no un cero observado. El simulador conserva esa ausencia.
- `officialSeats`: escaños del cuadro II; candidaturas del cuadro III no tienen escaños.

`results.csv` conserva candidaturas separadas (PSOE/PSC); `districts.csv` contiene magnitudes y participación. Son agregados, no microdatos individuales.

## polls.json y polls.csv

Estudio, instituto, fechas de campo/publicación, tamaño realizado de muestra, modo, ámbito, valores porcentuales de PP/PSOE/Sumar/VOX sobre voto válido, enlace de estimación y documentación. Los cuatro valores no suman el total electoral. `kind=poll-estimate`.

## Acceso a entrevistas originales

| Estudio | Microdatos y condiciones | Catálogo oficial | Ponderadores |
| --- | --- | --- | --- |
| CIS 3411 | https://www.cis.es/es/estudios/preelectoral-elecciones-generales-2023?showModal=true | https://datos.gob.es/es/catalogo/ea0040772-preelectoral-elecciones-generales-2023 | PESO, PESOPROV, PESOCCAA |
| CIS 3415 | https://www.cis.es/es/estudios/encuesta-flash-elecciones-generales-2023?showModal=true | https://datos.gob.es/es/catalogo/ea0040772-encuesta-flash-elecciones-generales-2023 | PESO |

Las fichas de catálogo indican CC BY 4.0. Citar al CIS y el estudio. Consultar códigos de no respuesta, valores perdidos, diseño muestral y universo antes de calcular. Los microdatos se descargan y analizan en origen; no se almacenan entrevistas en este repositorio ni se permite su carga en la web.

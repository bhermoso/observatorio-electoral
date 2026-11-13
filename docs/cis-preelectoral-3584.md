# CIS 3584 · preelectoral de las generales 2026

Incorporación verificada el 13 de noviembre de 2026. Fuentes primarias:

- [Anuncio oficial, 12/11/2026](https://www.cis.es/es/w/avance-de-resultados-del-estudio-3584-preelectoral-elecciones-generales-2026-).
- [Estimación original, tabla nacional en página 2 y provincias en páginas 3–4](https://www.cis.es/documents/d/guest/3584_estimacion-pdf).
- [Avance y ficha técnica, páginas 3–6](https://www.cis.es/documents/d/guest/es3584mar_A-pdf).

45.074 entrevistas CATI realizadas entre el 7 y el 30 de octubre. Se incorporan las 18 categorías de estimación nacional, las 14 horquillas nacionales publicadas y el desglose original de las 52 circunscripciones. Se conservan aparte el voto directo y su denominador, que no se intercambian con la estimación sobre voto válido. Las huellas SHA-256 y los datos completos están en `data/sources/cis-3584.json`, enlazado desde la ficha del archivo.

## Identidad de candidaturas

El documento presenta un desglose que no equivale automáticamente a las etiquetas agregadas de otros sondeos: Frente Amplio, ERC-Podemos, Compromís: Front Valencià, Adelante Andalucía, Podemos, UPC y Ara Més-Front Ampli. El CIS aclara que ERC y Podemos no concurren formalmente en coalición y realizan campaña conjunta en Cataluña.

En el archivo se precisan los rótulos de Frente Amplio y Podemos para distinguir este desglose. `sourceLabels` conserva todos los nombres literales; la ficha muestra los originales y la advertencia de comparabilidad. No se suman espacios ni se atribuye ERC-Podemos a ERC o Podemos. Las formas nominales EH-Bildu y EAJ-PNV se identifican como EH Bildu y PNV, conservando la denominación original en la procedencia.

El cargador y las series reciben únicamente los ocho valores que corresponden a categorías ya reconocidas y comparables: PSOE, PP, Vox, EH Bildu, Junts, BNG, PNV y SALF. Las demás cifras siguen disponibles íntegramente en la ficha y los datos originales; no se usan como ceros ni se fabrican equivalencias para el modelo. No cambia ningún coeficiente ni receta del Observatorio.

## Escaños y acontecimientos

Se guardan las horquillas nacionales tal como las publica el CIS. No se obtienen sumando extremos provinciales: los percentiles no son aditivos. Los guiones de SALF y CC-Municipalistas Primero Canarias no se convierten en cero escaños.

El trabajo de campo solapa el acontecimiento de Urda del 28 de octubre y es anterior a la huelga del 11 de noviembre. Que la publicación sea posterior no convierte la encuesta en una medición de sus efectos.

El anuncio enlaza agregados, cruces sociodemográficos, políticos, socioeconómicos y de creencias, además de Excel. Se conservan sus enlaces; no se presupone disponible una matriz individual ni se incorpora una receta de microdatos.

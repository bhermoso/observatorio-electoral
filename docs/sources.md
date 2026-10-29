# Registro de fuentes · 28 de octubre de 2026

| Recurso | Fuente primaria | Verificación y uso |
| --- | --- | --- |
| Escrutinio definitivo | https://www.boe.es/diario_boe/txt.php?id=BOE-A-2023-18907 | HTML descargado: cuadros II/III de 52 circunscripciones y 59 candidaturas. Cuadro I extraído de la página 2 del PDF oficial. Sumas cruzadas y 52 repartos probados. |
| Escaños provinciales | https://www.boe.es/buscar/doc.php?id=BOE-A-2023-12663 | Anexo HTML descargado y comparado con las 52 magnitudes del escrutinio. |
| Regla de reparto | https://www.boe.es/buscar/act.php?id=BOE-A-1985-11672#a163 | Lectura del artículo 163: umbral, cocientes, desempate y excepción Ceuta/Melilla. |
| CIS 3411 estimación | https://www.cis.es/documents/d/cis/3411_estimacion | Texto indexado del documento oficial: 31,4 / 31,2 / 16,4 / 10,6. |
| CIS 3411 ficha | https://www.cis.es/documents/20117/1557956/FT3411.pdf | Muestra 29.201, campo 8–27 junio, CATI, ponderadores contrastados con ficha oficial indexada y catálogo datos.gob.es. |
| CIS 3411 publicación | https://www.cis.es/es/w/avance-de-resultados-del-estudio-3411-preelectoral-elecciones-generales-2023-1 | Página oficial: 5 de julio de 2023. |
| CIS 3415 estimación | https://www.cis.es/documents/d/cis/es3415marMT_a | Documento oficial indexado: 30,8 / 32,2 / 14,9 / 11,8. |
| CIS 3415 ficha | https://www.cis.es/documents/20117/1557966/FT3415pdf.pdf | Muestra 8.798, campo 10–12 julio, CATI y PESO. |
| Catálogos CIS | https://datos.gob.es/es/catalogo/ea0040772-preelectoral-elecciones-generales-2023 y https://datos.gob.es/es/catalogo/ea0040772-encuesta-flash-elecciones-generales-2023 | Enlaces a ficheros, fichas y condiciones CC BY 4.0. |

Algunas peticiones directas a cis.es devuelven 403 al cliente automatizado. Las estimaciones y fichas se contrastaron con la indexación de documentos del dominio oficial y los metadatos del catálogo estatal; no se afirma haber descargado ni auditado los ficheros individuales. Se conserva esta limitación para una revisión posterior.

Los archivos BOE conservados tienen huellas SHA-256 en `data/source-hashes.json`. No se usan resultados provisionales de la noche electoral. No se sustituyen datos ausentes por cifras inventadas. No hay actualización automática.

## Cartografía del atlas

Fuente oficial Eurostat/GISCO: https://gisco-services.ec.europa.eu/distribution/v2/nuts/geojson/NUTS_RG_10M_2024_4326_LEVL_3.geojson, consultada el 29 de octubre de 2026. Se agrupan 59 unidades estadísticas en 52 circunscripciones; Balears reúne ES531–ES533, Las Palmas ES704/ES705/ES708 y Santa Cruz de Tenerife ES703/ES706/ES707/ES709. La geometría de 2024 es un soporte visual generalizado, no define el reparto electoral de 2023. Canarias se desplaza a un recuadro.

© EuroGeographics para los límites administrativos. Condiciones específicas de uso **no comercial**, con atribución: https://ec.europa.eu/eurostat/web/gisco/geodata/statistical-units. La cartografía no está cubierta por MIT. El SHA-256 del fichero fuente completo se conserva en `data/cartography.json`; la transformación reproducible está en `scripts/import-map.mjs`.

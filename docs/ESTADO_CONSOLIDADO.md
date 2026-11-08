# Observatorio Electoral · estado consolidado

**Corte de integración: 4 de noviembre de 2026.**

## Funciones en el código principal

- **Panorama (`#dashboard`):** titular con la estimación de referencia, reparto de escaños y bloques, tabla por partido, evolución, contraste de capas y detalle plegado; sin pestañas ni altura fija.
- **Promedios (`#analisis`):** encuestas originales comparables por instituto, con fechas, muestras, pesos editables y una proyección territorial experimental separada.
- **Acontecimientos (`#contexto`):** diferencias descriptivas entre dos oleadas del mismo instituto y enlaces a fuentes; no implica causalidad.
- **Cocina (`#cocina`):** tabla inicial del CIS 3582, seis partidos, denominadores y prueba de recetas con CIS 3411/3415. No se reconstruye la fórmula interna del CIS.
- **Pronóstico completo (`#pronostico`):** tendencias, bloques, fuentes y evaluación en `#pronostico-evaluacion`: cortes temporales del 23J y contraste retrospectivo de tratamientos de indecisos del CIS en las dos elecciones generales de 2019. La sección incorpora el estado documental de homologación CIS 3242/3263.

## Límites explícitos

1. El Motor 29N consume estimaciones ya publicadas; no lee las entrevistas individuales de encuestadoras privadas.
2. Los agregados CIS se calcularon a partir del archivo identificado como `MD3582.zip`; los escenarios directos, entre decididos, simpatía y participación difieren en pregunta o denominador, y no son componentes aislados de una receta causal.
3. La selección de procedimientos con CIS 3411/3415 no mejora la estimación publicada en las dos pruebas documentadas; ambas son de la **misma elección**.
4. La auditoría temporal del promedio respeta publicación, cortes y veda, pero evalúa **solo una convocatoria (23J)**. Separadamente, el análisis retrospectivo compara cuatro tratamientos de indecisión explícita en los estudios CIS 3242 y 3263, usando como denominador candidaturas y voto en blanco para ser comparable con el voto válido oficial: son dos elecciones históricas, **no pruebas prospectivas ni validación del Motor 29N**.
5. La base territorial del pronóstico sigue siendo las generales de 2023. Los datos adicionales de europeas de 2024 no están incorporados.
6. El catálogo oficial del CIS ofrece la búsqueda del estudio 3582, pero no se proporciona un enlace directo a su ficha hasta verificarlo.

**Origen temporal de RECUERDO:** en 3242 corresponde a las generales de 2016; en 3263 a las de abril de 2019. Las escalas P12/P11 (0–10) son distintas de las preguntas P9/P8 sobre intención de acudir a votar.

## Criterios de publicación

- `npm test`: pruebas de cálculo, vistas, referencias y contrato transversal de las secciones.
- `python -m unittest discover -s modelo/tests -t .`: comprobaciones del Motor y auditorías históricas.
- `npm run build`: construcción de la web en `dist`, incluyendo módulos JS y JSON de salida.
- GitHub Pages: el despliegue no se declara completado hasta que el proceso `Test and deploy GitHub Pages` termina con `success`.
- Las auditorías con navegador se ejecutan deliberadamente cuando hay cambios visuales; las pruebas rápidas se reservan para cada PR, a fin de reducir correos y ejecuciones duplicadas.

## Pendiente para una validación predictiva

- Nuevas elecciones independientes, con resultados oficiales y encuestas con fecha de publicación documentada. No confundir las dos elecciones 2019 del contraste de recetas con validación del pronóstico principal.
- **Archivos originales cotejados (4-nov-2026):** MD3242.zip (16.194 entrevistas) y MD3263.zip (17.650), con coincidencia de SHA-256, sumas de PESO, n de Kish, variables y recuentos agregados. El registro reproducible y sin entrevistas está en `data/microdatos/cotejo_originales_2019.json`. Además, `data/microdatos/transiciones_2019.json` y `docs/AUDITORIA_TRANSICIONES_CIS_2019.md` documentan una correspondencia empírica unívoca por provincia para las combinaciones observadas de voto y simpatía. Esto NO recupera la fórmula original ni resuelve las coaliciones para otros procesos electorales. Falta validación fuera de muestra. No se han subido microdatos individuales al repositorio.
- Calibración empírica de intervalos y probabilidades de mayoría; no sustituirla por multiplicar cortes de una sola elección.
- Verificar URL directa del estudio CIS 3582 y disponibilidad pública de su archivo original.

## Ramas

Los cambios descritos están integrados en `main`. La antigua propuesta de cocina con **muestra ficticia de 1.000 entrevistas** no forma parte de la ruta principal de Cocina y no debe reemplazar los cálculos publicados.

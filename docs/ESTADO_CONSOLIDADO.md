# Observatorio Electoral · estado consolidado

**Corte de integración: 4 de noviembre de 2026.**

## Funciones en el código principal

- **Panorama (`#dashboard`):** cifras del Motor 29N, bloques, KPIs y pestañas de comparación.
- **Promedios (`#analisis`):** encuestas originales comparables por instituto, con fechas, muestras, pesos editables y una proyección territorial experimental separada.
- **Acontecimientos (`#contexto`):** diferencias descriptivas entre dos oleadas del mismo instituto y enlaces a fuentes; no implica causalidad.
- **Cocina (`#cocina`):** tabla inicial del CIS 3582, seis partidos, denominadores y prueba de recetas con CIS 3411/3415. No se reconstruye la fórmula interna del CIS.
- **Pronóstico completo (`#pronostico`):** tendencias, bloques, fuentes y evaluación temporal del 23J en `#pronostico-evaluacion`.

## Límites explícitos

1. El Motor 29N consume estimaciones ya publicadas; no lee las entrevistas individuales de encuestadoras privadas.
2. Los agregados CIS se calcularon a partir del archivo identificado como `MD3582.zip`; los escenarios directos, entre decididos, simpatía y participación difieren en pregunta o denominador, y no son componentes aislados de una receta causal.
3. La selección de procedimientos con CIS 3411/3415 no mejora la estimación publicada en las dos pruebas documentadas; ambas son de la **misma elección**.
4. La auditoría temporal del 23J respeta fechas de publicación, cortes y veda, pero solo incluye **una convocatoria independiente**. No valida todavía las probabilidades de mayoría del Motor 29N.
5. La base territorial del pronóstico sigue siendo las generales de 2023. Los datos adicionales de europeas de 2024 no están incorporados.
6. El catálogo oficial del CIS ofrece la búsqueda del estudio 3582, pero no se proporciona un enlace directo a su ficha hasta verificarlo.

## Criterios de publicación

- `npm test`: pruebas de cálculo, vistas, referencias y contrato transversal de las secciones.
- `python -m unittest discover -s modelo/tests -t .`: comprobaciones del Motor y auditorías históricas.
- `npm run build`: construcción de la web en `dist`, incluyendo módulos JS y JSON de salida.
- GitHub Pages: el despliegue no se declara completado hasta que el proceso `Test and deploy GitHub Pages` termina con `success`.
- Las auditorías con navegador se ejecutan deliberadamente cuando hay cambios visuales; las pruebas rápidas se reservan para cada PR, a fin de reducir correos y ejecuciones duplicadas.

## Pendiente para una validación predictiva

- Nuevas elecciones independientes, con resultados oficiales y encuestas con fecha de publicación documentada.
- Homologación de candidaturas y verificación de fuentes territoriales de otros ciclos.
- Calibración empírica de intervalos y probabilidades de mayoría; no sustituirla por multiplicar cortes de una sola elección.
- Verificar URL directa del estudio CIS 3582 y disponibilidad pública de su archivo original.

## Ramas

Los cambios descritos están integrados en `main`. La antigua propuesta de cocina con **muestra ficticia de 1.000 entrevistas** no forma parte de la ruta principal de Cocina y no debe reemplazar los cálculos publicados.

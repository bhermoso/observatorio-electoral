# Observatorio Electoral · reglas del proyecto

- **Orden de las listas.** Toda lista de encuestas, promedios o estimaciones se ordena por fecha, con la más reciente al principio: tablas, tarjetas y leyendas. Los gráficos y líneas temporales dibujan el tiempo de izquierda a derecha. Criterios y excepciones en `orden.mjs`.
- **Estatuto de cada cifra.** Una encuesta entra en el pronóstico solo si se ha consultado su original con la ficha técnica (`original_url` y fin de campo en `modelo/externos/prensa_2026.csv`). Una cifra tomada de un agregador o de otra noticia se registra como «prensa sin verificar» y se dice de dónde viene. Las discrepancias entre fuentes se anotan; no se resuelven por conveniencia.
- **Ficheros generados.** No se suben `modelo/salida/*`, `modelo/registro/*` ni `data/microdatos/catalogo.json`.
- **Comprobaciones.** `npm test`, `python3 -m unittest discover -s modelo/tests -t .` y `npm run build` (añadir cada `.mjs` nuevo a `scripts/build.mjs`).

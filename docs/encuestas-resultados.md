# Encuestas frente a resultados

Vista descriptiva `encuestas-resultados.html`. Ofrece seis convocatorias (2011, 2015, 2016, abril y noviembre de 2019 y 2023) y los horizontes de 90, 60, 30, 15 y 7 días. No selecciona ni calibra recetas del pronóstico actual.

## Archivo y calidad

`python scripts/generar_encuestas_resultados.py` exporta `data/historico/encuestas-resultados.json` desde la importación histórica congelada y las series de 2023 del cargador existente. Incluye 921 registros fechados. Descarta 28 entradas sin cronología admisible, con fechas supuestas o publicadas el día electoral. No convierte muestras desconocidas en entrevistas observadas. La salida conserva nombres, procedencias, referencias bibliográficas y huellas de los archivos utilizados.

Tres registros atribuidos a partidos (PP, PSOE y Podemos) se conservan identificados como sondeos internos, sin presentarlos como institutos. Los resultados proceden del BOE. En 2011 se conserva la corrección de IU Lugo y del denominador de votos válidos de mayo de 2012. Las encuestas antiguas incluyen **transcripciones secundarias con referencia fechada**: no se afirma que todos sus originales hayan sido contrastados. Las fechas bibliográficas reconstruidas tampoco son capturas de pronósticos publicados entonces por el Observatorio.

## Selección y cálculo

1. Corte = día electoral menos antelación elegida. No hay acceso a publicaciones posteriores, aunque su campo sea anterior.
2. Inicio de campo ≤ fin de campo ≤ publicación ≤ corte. Fin de campo dentro de los 180 días anteriores al corte. No se supone una publicación a partir del campo.
3. Mismo instituto, campo y cifras sobre las candidaturas seleccionadas: se conserva la primera publicación conocida. Entre los estudios restantes, una última publicación por casa; desempate por fin de campo e identificador. La selección no recibe resultados oficiales.
4. Todas las candidaturas elegidas deben tener cifras publicadas. El soporte común es PP/PSOE; las demás solo se ofrecen en las convocatorias con resultado y encuesta comparables. No se imputa cero ni se equiparan coaliciones entre elecciones.
5. Error firmado = encuesta menos porcentaje oficial. MAE = promedio de errores absolutos, igual peso por candidatura. Resumen del corte = promedio de MAE por casa. Recorrido de una casa = promedio de MAE por elección disponible al mismo horizonte y soporte; conserva las ausencias.

La muestra admisible cambia al cambiar candidatura o corte. No comparar sus MAE como si procedieran del mismo universo. Los gráficos usan escala común dentro de cada selección. Las diferencias históricas incorporan cambios electorales entre campo y urnas y no identifican por sí solas sesgos persistentes de un instituto. Los cortes de una elección son correlacionados; no cuentan como convocatorias independientes. Sin evaluación de escaños ni afirmación de validación prospectiva.

## Comprobaciones

Pruebas de fechas, publicación futura, duplicación, conservación de ceros y ausencias, signo y MAE; reproducción exacta del JSON y de su procedencia; auditoría de navegador a 390 y 1440 px con cambio de elección/horizonte/soporte/casa, recorrido, apertura con teclado, fuentes y WCAG.

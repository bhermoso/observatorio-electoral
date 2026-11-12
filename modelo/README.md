# Estado científico (12-11-2026)

Versión operativa 5: publicación documentada, empates simétricos y reconstrucción retrospectiva identificada. **El motor completo es auditable, no está independientemente validado.** La nueva evaluación parcial cubre seis elecciones para PP/PSOE y ampliaciones con soporte propio, sin validar escaños. Véase [auditoría y protocolo](../docs/consolidacion-cientifica.md) y [resultados](validacion/multieleccion.md).

# Motor de pronóstico 29N

Analiza las encuestas, mide el sesgo y la exactitud de cada casa, estima el efecto de los acontecimientos y produce un pronóstico de voto y escaños con su incertidumbre. Python 3.11+ con numpy; sin más dependencias.

```sh
python3 -m modelo                     # informe completo con el corte de hoy
python3 -m modelo --hoy 2026-11-05    # otro corte
python3 -m unittest discover -s modelo/tests -t .
```

Registro en `modelo/registro/`: `encuestas.csv` (todas las encuestas consultadas, con su estado de verificación) e `historial.json` (el pronóstico principal de cada día desde el 1 de octubre, calculado solo con las encuestas ya publicadas ese día; se reutiliza si no cambian las encuestas ni los parámetros).

Salidas en `modelo/salida/`: `informe.md` (tablas), `pronostico.json` (cifras), `datos_pagina.json` y `pagina.html`. La página explica las encuestas con su ficha técnica y el modelo paso a paso, con los datos del corte; se genera desde `modelo/pagina/plantilla.html`.

## Qué hace cada parte

| Módulo | Función |
|---|---|
| `motor/fuentes.py` | Une tres fuentes en un formato común: el registro verificado (`data/polls.json`), las tablas de Wikipedia 2019-23 y las encuestas privadas del proyecto 29N (`externos/`). Cada encuesta conserva su `origen`. Normaliza los nombres de casas y partidos. |
| `motor/tendencia.py` | Modelo de estado latente por partido: intención diaria (paseo aleatorio) + sesgo fijo de cada casa + error muestral y no muestral. Solución exacta (gaussiana lineal) con intervalos. Admite saltos en fechas de acontecimientos y sesgos previos calibrados con resultados reales. |
| `motor/evaluacion.py` | Error de la última encuesta de cada casa frente al resultado, error común de la industria, sesgo de cada casa por ciclo y su estabilidad entre ciclos. Ficha de método (modo, muestra, días de campo) sacada de los datos. |
| `motor/eventos.py` | Efecto de un acontecimiento: pares antes/después por casa, salto y cambio acumulado según el modelo, umbral de detección calibrado con placebos. Excluye las encuestas cuyo campo coincide con el suceso. |
| `motor/escanos.py`, `motor/dhondt.py` | Traslado del voto nacional a las 52 circunscripciones (swing proporcional sobre el 23J) y D'Hondt con umbral del 3 %. Reproduce exactamente los escaños de 2023 (test). |
| `motor/exportar.py` | Reúne fichas, tendencias, sesgos, descomposición de la incertidumbre e histogramas para la página. |
| `motor/registro.py` | Registro de encuestas consultadas y evolución diaria del pronóstico principal. |
| `motor/pronostico.py` | Simulación hasta el día de la elección. Suma la incertidumbre de la estimación actual, el movimiento hasta el 29N, el error de industria y el error provincial. Tres variantes de referencia y un promedio simple como comparación. |

## Libro de recetas y microdatos

- `recetario/recetas.json`: lo que cada instituto explica de su método (entrevista, muestra, ponderación, recuerdo de voto, indecisos, estimación, microdatos), cada afirmación con su fuente. Solo textos de documentos del instituto; lo que no consta queda vacío.
- `microdatos/`: cocina propia sobre respuestas individuales (voto directo ponderado, transferencias recuerdo × intención, reponderación por recuerdo de voto de 2023). `estudios.json` declara variables y códigos copiados del cuestionario; los ficheros descargados van a `microdatos/crudos/` (no se versionan). Leer `.sav` requiere `pip install pyreadstat`.

## Señales y escenarios

`senales/senales.json` registra afirmaciones de analistas y encuestadores influyentes (quién, cuándo, dónde, qué dicen, dirección, si aportan datos y qué falta), con el error de su casa en el 23J cuando se conoce. No entran en el pronóstico. `motor/senales.py` calcula escenarios explícitos (traslados de voto declarados) con el pronóstico principal e indica si un cambio de ese tamaño superaría el umbral de detección.

## Pronóstico principal

Une a partes iguales las tres variantes de referencia y usa un error de industria de 2,2 pp para un partido del 25 % (`INDUSTRIA_PRINCIPAL`), intermedio entre el supuesto inicial y el que habría cubierto 2023. Incluye el reparto medio por provincia. Otros agregadores (`externos/agregadores.csv`) se comparan con el pronóstico del motor en su misma fecha. Las encuestas citadas solo en prensa (`externos/prensa_2026.csv`) entran de forma provisional con `origen` = `prensa-sin-verificar`.

## Decisiones de método (todas modificables)

- **Qué es "sesgo cero".** Una casa solo puede compararse con otras o con un resultado. Se publican tres variantes: consenso de las privadas, consenso de todas (con CIS) y calibrada con el error de cada casa en el 23J. Que las variantes discrepen indica cuánto depende el pronóstico de esa elección.
- **Peso de las casas que publican a diario.** Su varianza se multiplica por el número de encuestas propias en ±7 días, para que una casa no domine el promedio por volumen.
- **Tolerancias proporcionales al tamaño del partido.** La deriva diaria, el sesgo de casa y el error no muestral escalan con √(p/25).
- **Error de industria.** 1,5 pp para un partido del 25 %, a partir del 23J, donde el error medio de las casas fue de −2,5 en el PSOE y su raíz cuadrática media de 1,4 pp en los cuatro grandes partidos.
- **Error común entre bloques.** La mitad de la varianza del error de industria (`RHO_BLOQUE = 0.5`) es un factor que mueve en sentidos opuestos a PP, Vox y UPN frente a PSOE, Sumar y Podemos. Es un supuesto: con una sola elección no se puede estimar. El informe muestra la sensibilidad con 0, 0,5 y 0,8.
- **Tamaño del error de industria.** La retroprueba del 23J indica que 1,5 pp fue insuficiente: habría hecho falta unos 2,9 pp para cubrir todos los casos. El pronóstico mantiene 1,5 y el informe muestra también 2,2 y el valor que cubre 2023, calculado cada vez con `evaluacion.industria_que_cubre`.
- **Traslado geográfico.** El pronóstico usa el proporcional; el informe lo compara con el uniforme (mismos puntos donde el partido se presentó en 2023).
- **Urda.** No se aplica ningún efecto supuesto. En cuanto entren encuestas con campo posterior al 28-oct, el informe calcula los pares y el salto, y los compara con el umbral de detección.

## Añadir encuestas

Las encuestas nuevas se incorporan al registro verificado del observatorio (`data/polls.json`, siguiendo `docs/poll-archive.md`); el motor las lee de ahí. Los datos de terceros de `externos/` solo se usan para la evaluación histórica y el contexto; ver `externos/PROCEDENCIA.md`.

## Puerta de calidad y contraste de recetas (2026-11-02)

- Los registros etiquetados `prensa-sin-verificar` se conservan en el registro documental pero **quedan excluidos del pronóstico principal**, porque el original y los campos de entrevista no se han verificado. El archivo sigue conteniendo otras fuentes secundarias cuya validación tampoco es exhaustiva.
- `scripts/auditar_cocina_23j.py` calcula errores por partido y una prueba de selección de procedimiento entre estudios CIS 3411/3415, guardada en `data/microdatos/auditoria_cocina_23j.json` y mostrada en la pestaña Cocina. La selección del procedimiento usa solo un estudio, la medición de prueba el otro.
- Los estudios pertenecen a la misma convocatoria 23J, por lo que **no** existe aún una validación fuera de elección. No aplicar al pronóstico principal correcciones inferidas por simpatía, participación o recuerdo hasta obtener ciclos comparables.
- `PESO` en los estudios es una ponderación publicada, no evidencia de los ajustes internos usados por cada instituto para producir su estimación final.

## Sensibilidad de procedimientos de microdatos

`scripts/analizar_contribuciones.py` reconstruye a partir de `data/microdatos/validacion_23j.json` las diferencias de estimación y error entre voto entre decididos y tres salidas alternativas (simpatía, participación y estimación publicada). Exporta `data/microdatos/contribuciones_cocina_23j.json`, que aparece en Cocina electoral. **No son ablaciones causales**: los denominadores, preguntas o tratamientos pueden diferir, y una comparación con la estimación publicada engloba operaciones no documentadas. No se puede sumar cada diferencia como una proporción de la «receta».

Sobre cuatro partidos, la simpatía presenta mayor error medio en los dos estudios (diferencias de aproximadamente +0,80 y +0,44 pp respecto a decididos), mientras que la participación lo reduce ligeramente en uno y lo eleva en otro (−0,12 y +0,02 pp). Dos estudios de una misma elección no autorizan generalización ni cambios al pronóstico principal. Recuerdo, transferencia, eventos, peso demográfico aislado y escaños **no disponen aquí de una ablación**.

## Laboratorio de ablaciones del Motor 29N

El módulo `modelo/motor/ablaciones.py` compara el algoritmo principal con siete cambios controlados: sin error común de industria; sin correlación de bloques; sin dispersión provincial; traslado provincial uniforme; ancla solo privada; ancla con CIS; y exclusión de la variante histórica calibrada con el 23J. `modelo/__main__.py` exporta `sensibilidad_cocina` a `modelo/salida/pronostico.json` para visualizarla por partido y bloque en el Observatorio.

Todos los escenarios usan semillas fijas por variante y el mismo tamaño muestral de Monte Carlo. Son **pruebas de sensibilidad contemporáneas**, no pruebas de exactitud predictiva ni de causalidad. Las variantes de anclaje pueden modificar también las casas empleadas. El número reducido de simulaciones del laboratorio (`n_por_variante=80`) limita especialmente la precisión de percentiles y frecuencias cercanas a umbrales. No se incorporan a la estimación principal por elección automática del experimento con resultado «mejor»: no existe resultado futuro conocido contra el que validar.

**No son ablaciones de microdatos**: intención directa, recuerdo, simpatía, transferencias y propensión a votar no son parámetros independientes del motor, que consume estimaciones publicadas por institutos. El contraste histórico exploratorio con CIS 3411 y 3415 se mantiene separado; no identifica efectos causales ni valida fuera de la elección del 23J. Una validación predictiva real requiere microdatos comparables y resultados de varios procesos electorales y cortes temporalmente anteriores.

## Límites

Un solo precedente con encuestas privadas evaluadas (23J). Para evaluar 2015, 2016 y 2019 hacen falta las tablas históricas (Wikipedia u originales). La retroprueba en el 23J muestra que corregir sesgos de casa no supera automáticamente al promedio simple: en 2023 el CIS fue la única casa que acertó con el PSOE.

## Modelo de datos públicos: primera fase (4 de noviembre de 2026)

- **Evaluación temporal reproducible:** `modelo/motor/validacion_publica.py` selecciona la última encuesta de cada instituto por **fecha documentada de publicación**, sin filtrar retrospectivamente con información futura y congelando los cortes durante la veda. El control usa el promedio simple, no una variante calibrada con el resultado observado.
- **Unidad de evidencia:** cada convocatoria electoral constituye una observación independiente. Los cortes 30, 15, 7 y 1 días antes del 23J **no representan cuatro elecciones**. Se publica el recuento explícito y el error descriptivo en `pronostico.json.validacion_publica`.
- **Geografía oficial:** `modelo/motor/geografia_publica.py` establece un contrato verificable para futuras distribuciones provinciales de europeas 2024. Rechaza perfiles parciales, duplicados, denominadores incoherentes, fuentes no institucionales y asignaciones automáticas de partidos.
- **Estado territorial actual:** el pronóstico sigue usando el mapa provincial del Congreso de 2023. Los datos de europeas 2024 están disponibles en el [Ministerio del Interior](https://descargas.interior.gob.es/datasets/resultados_electorales/Elecciones-al-Parlamento-Europeo.xlsx), pero **no se han importado ni mezclado** sin comprobar la equivalencia territorial y entre candidaturas. El contrato y su estado se exportan en `pronostico.json.geografia_publica`.
- **Consecuencia:** ninguna cifra de mayoría debe presentarse como probabilidad empíricamente calibrada. La auditoría es el primer componente de una futura evaluación multielectoral; no valida por sí misma la incertidumbre de 29N.

El siguiente paso de datos requiere descargar y normalizar las 52 provincias de las europeas de 2024 desde la fuente oficial, documentar las candidaturas realmente comparables y evaluar la variación de acierto fuera de muestra antes de tocar la mezcla territorial del modelo principal.

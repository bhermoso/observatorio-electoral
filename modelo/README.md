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

## Límites

Un solo precedente con encuestas privadas evaluadas (23J). Para evaluar 2015, 2016 y 2019 hacen falta las tablas históricas (Wikipedia u originales). La retroprueba en el 23J muestra que corregir sesgos de casa no supera automáticamente al promedio simple: en 2023 el CIS fue la única casa que acertó con el PSOE.

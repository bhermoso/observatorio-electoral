# Qué errores de las casas utiliza el Observatorio

Error firmado = estimación publicada menos resultado; positivo sobreestima, negativo infraestima.

## Evidencia que se compara

23J de 2023. Campo terminado dentro de los 21 días anteriores y publicación documentada hasta el 17 de julio. Una encuesta por casa: la última publicada entre las elegibles.

| Casa | Publicación | Fin de campo | PP | PSOE | Vox | Sumar |
|---|---|---|---:|---:|---:|---:|
| 40dB. | 2023-07-17 | 2023-07-16 | -0.16 | -2.98 | +1.12 | +1.37 |
| AtlasIntel | 2023-07-17 | 2023-07-17 | -2.26 | -2.28 | +4.62 | +3.77 |
| CIS | 2023-07-17 | 2023-07-12 | -2.26 | +0.52 | -0.58 | +2.57 |
| Celeste-Tel | 2023-07-14 | 2023-07-12 | +3.44 | -3.28 | -0.98 | -0.83 |
| Cluster17 | 2023-07-17 | 2023-07-14 | +0.54 | -2.78 | +1.32 | +1.17 |
| DYM | 2023-07-17 | 2023-07-13 | +2.44 | -4.58 | -0.08 | +0.77 |
| Data10 | 2023-07-17 | 2023-07-17 | +2.94 | -4.18 | +0.12 | +0.17 |
| EM-Analytics | 2023-07-17 | 2023-07-17 | +1.44 | -2.88 | +0.52 | +1.07 |
| GAD3 | 2023-07-17 | 2023-07-17 | +3.84 | -3.08 | -0.68 | -0.83 |
| GESOP | 2023-07-16 | 2023-07-15 | -2.46 | -4.28 | +2.62 | +2.07 |
| Hamalgama Métrica | 2023-07-16 | 2023-07-13 | +3.24 | -4.18 | +1.42 | -0.23 |
| IMOP | 2023-07-17 | 2023-07-14 | -0.16 | -3.48 | +2.12 | +0.47 |
| InvyMark | 2023-07-16 | 2023-07-14 | +0.44 | -5.38 | +1.42 | +1.37 |
| Ipsos | 2023-07-09 | 2023-07-06 | +2.24 | -3.48 | +0.22 | +0.57 |
| KeyData | 2023-07-17 | 2023-07-17 | +1.64 | -3.68 | +0.52 | +0.47 |
| NC Report | 2023-07-17 | 2023-07-16 | +4.14 | -3.38 | -1.28 | -1.03 |
| Opinòmetre | 2023-07-08 | 2023-07-04 | -0.46 | -2.68 | +0.32 | +3.17 |
| Sigma Dos | 2023-07-17 | 2023-07-17 | +2.34 | -3.68 | -1.18 | +1.27 |
| Simple Lógica | 2023-07-17 | 2023-07-16 | -0.86 | -3.08 | +1.52 | +1.47 |
| SocioMétrica | 2023-07-17 | 2023-07-16 | +0.44 | -3.38 | +1.32 | +0.87 |
| Sondaxe | 2023-07-17 | 2023-07-16 | +1.24 | -2.98 | +0.12 | +1.67 |
| Target Point | 2023-07-17 | 2023-07-16 | +3.34 | -3.58 | +0.02 | -0.23 |
| Top Position | 2023-07-11 | 2023-07-06 | +1.14 | -3.58 | +0.92 | +0.47 |
| YouGov | 2023-07-17 | 2023-07-17 | -1.06 | -3.68 | +1.62 | +1.67 |

## Del error observado a nuestra cocina actual

La variante calibrada usa como centro previo de cada casa la mitad de su error de 2023 para PP, PSOE y Vox. Es un supuesto de persistencia parcial, no un error actual conocido.

Las dos variantes de consenso reciben una corrección igual a menos la mitad del error medio histórico, con al menos cinco casas por partido. La implementación usa todas las casas elegibles, incluido CIS, incluso al corregir el consenso de privadas. Esta decisión debe mostrarse y contrastarse; no ocultarse bajo la etiqueta «industria».

| Partido | Error promedio, todas | Error promedio, sin CIS | Corrección actual a consensos |
|---|---:|---:|---:|
| PP | +1.053 | +1.196 | -0.526 |
| PSOE | -3.336 | -3.504 | +1.668 |
| VOX | +0.709 | +0.765 | -0.355 |
| SUMAR | +0.966 | +0.897 | -0.483 |

El promedio anterior es simple, con una entrada por casa y los partidos disponibles; no es un promedio ponderado por muestra ni el pronóstico actual del Observatorio.

El parámetro de incertidumbre de industria del principal es 2,2 puntos para el nivel de referencia del modelo. No significa que cada casa haya errado 2,2 puntos: es una decisión sobre incertidumbre, diferente de las correcciones anteriores.

## Límites de atribución

- Una sola elección no identifica sesgo persistente por casa ni varianza de industria entre elecciones.
- La desviación puede incluir cambio posterior al campo. No identifica su causa.
- MAE entre casas solo comparable con el mismo conjunto de partidos.
- El factor 0.5 es una decisión de cocina, no una recurrencia aprendida con elecciones independientes.
- Un error medio compartido no significa que todas las casas errasen con el mismo signo.

## Fichas comprobables

El JSON adjunto conserva para cada casa estudio, URL, fechas, cifra publicada, resultado, resta y prior aplicado. Son las entradas realmente seleccionadas por el motor.

Reproducir: `python -m scripts.explicar_error_casas`.
Detalle: `data/microdatos/trazabilidad-error-casas-23j.json`.

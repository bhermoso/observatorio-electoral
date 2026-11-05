# Cuánto depende el pronóstico del error de 2023

Corte: 2026-11-05. Elección modelada: 2026-11-29.
Sensibilidad del modelo, no validación del porcentaje correcto.

## Qué se ha cambiado

Se varían conjuntamente la corrección de consenso y el centro previo histórico de casa.
Sin CIS excluye sus encuestas actuales y su error histórico; no es un efecto exclusivo sobre el ancla.
0 % anula el traslado direccional del error de 2023, pero mantiene la variante calibrada con centros cero y su dispersión previa. No equivale a eliminar esa variante ni toda la información histórica.

Mismas semillas, inicio temporal y 2000 simulaciones por cada una de las tres variantes. Incertidumbre de industria, correlación de bloques y traslado territorial constantes.

## Voto central por partido

| CIS | Traslado del error | PP | PSOE | Vox | Sumar | Podemos |
|---|---:|---:|---:|---:|---:|---:|
| Con | 0 % | 30.93 | 26.75 | 18.94 | 6.17 | 2.54 |
| Con | 25 % | 30.59 | 27.55 | 18.81 | 6.00 | 2.54 |
| Con | 50 % | 30.25 | 28.33 | 18.69 | 5.83 | 2.54 |
| Con | 100 % | 29.59 | 29.92 | 18.44 | 5.48 | 2.54 |
| Sin | 0 % | 31.45 | 26.30 | 19.04 | 6.16 | 2.52 |
| Sin | 25 % | 31.07 | 27.14 | 18.90 | 6.00 | 2.52 |
| Sin | 50 % | 30.69 | 27.99 | 18.76 | 5.85 | 2.51 |
| Sin | 100 % | 29.91 | 29.68 | 18.46 | 5.52 | 2.51 |

## Escaños y mayorías

Medianas de escaños por partido. Las medianas no tienen por qué sumar 350. La frecuencia de mayoría se calcula sumando escaños en cada simulación.

| CIS | Traslado | PP | PSOE | Vox | Sumar | Podemos | Mayoría PP + Vox |
|---|---:|---:|---:|---:|---:|---:|---:|
| Con | 0 % | 130 | 110 | 68 | 8 | 1 | 94.4 % |
| Con | 25 % | 128 | 113 | 67 | 7 | 1 | 92.3 % |
| Con | 50 % | 126 | 117 | 67 | 7 | 1 | 88.9 % |
| Con | 100 % | 122 | 124 | 66 | 6 | 1 | 80.2 % |
| Sin | 0 % | 132 | 108 | 68 | 8 | 1 | 96.1 % |
| Sin | 25 % | 130 | 112 | 67 | 7 | 1 | 94.2 % |
| Sin | 50 % | 128 | 115 | 67 | 7 | 1 | 91.4 % |
| Sin | 100 % | 123 | 122 | 66 | 6 | 1 | 82.8 % |

## Diferencia entre no trasladar el error y trasladar la mitad

- Con CIS: PP: -0.68 puntos, PSOE: +1.58 puntos, VOX: -0.25 puntos, SUMAR: -0.33 puntos, PODEMOS: -0.00 puntos.
- Sin CIS: PP: -0.76 puntos, PSOE: +1.69 puntos, VOX: -0.27 puntos, SUMAR: -0.31 puntos, PODEMOS: -0.00 puntos.

## Qué se puede concluir

Las diferencias cuantifican cuánto depende el resultado de nuestras decisiones. No prueban que una casa vaya a repetir su desviación histórica ni que el 50 % sea el porcentaje correcto.

La referencia es con CIS y 50 %. Sin CIS retira tanto sus encuestas actuales como su contribución histórica; este contraste no separa ambos mecanismos.

Los intervalos de voto y escaños y las frecuencias de todos los bloques se conservan en el JSON. No se presentan como validación histórica.

## Límites

- El experimento no demuestra cuál de las fracciones acierta más.
- Las mayorías son frecuencias condicionadas al modelo; no probabilidades empíricamente calibradas.
- Con y sin CIS cambia la evidencia actual y la histórica; se conserva el mismo inicio temporal.
- 100 % traslada el error entero en los centros y correcciones, no obliga a la salida final a moverse esa cantidad.
- El ensayo conserva el principal sobre agregados; no incluye todavía la receta candidata More in Common.

## Reproducción

`python -m scripts.sensibilidad_error_23j --simulaciones-por-variante 2000`
Datos: `data/microdatos/sensibilidad-error-23j.json`.

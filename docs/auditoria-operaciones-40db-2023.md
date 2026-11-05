# Auditoría de operaciones: 40dB y las generales de 2023

Fuente: agregados previamente calculados desde los tres ZIP originales (4.800 entrevistas).
La primera sección recalcula diferencias desde esos agregados. La última incorpora una nueva ejecución desde las entrevistas originales.
Una elección, tres oleadas: no son tres validaciones independientes.

## Operaciones añadidas a la intención directa ponderada

Cambio del error absoluto medio en puntos porcentuales; negativo significa menor error.

| Operación | Flash de junio | Barómetro de junio | Preelectoral de julio |
|---|---:|---:|---:|
| recuerdo | +0.865 | +1.127 | +1.236 |
| simpatia | +0.107 | -0.175 | -0.252 |
| participacion | +0.151 | -0.170 | -0.205 |

## Error de la receta completa, desglosado por partido

Cambio de error absoluto frente a la directa ponderada; positivo significa empeoramiento.

| Encuesta | PP | PSOE | Vox | Sumar |
|---|---:|---:|---:|---:|
| junio_flash | +1.411 | +0.673 | +1.534 | +1.090 |
| junio_barometro | +0.795 | +0.349 | +1.512 | +0.896 |
| julio_preelectoral | +0.730 | +0.650 | +1.239 | +0.623 |

## Decisiones de desarrollo

- No adoptar la calibración parcial del recuerdo de 2019 como corrección por defecto: empeora estas tres oleadas. El resultado se limita a esta calibración, esta casa y esta elección.
- No descartar el recuerdo: distinguir sesgo de composición, recuerdo erróneo, nuevos votantes y abstención. El ensayo previo usa seis referencias aproximadas y una intensidad fija del 50 %, sin modelar esos mecanismos.
- No interpretar participación / 10 como una probabilidad calibrada: probar transformaciones fijadas antes de evaluar otra elección y contrastar cobertura por grupo.
- Separar simpatía de voto observado. La imputación supone una conducta de los indecisos; su mejora eventual no demuestra ese mecanismo.
- En el ensayo previo faltaba simpatía + participación sin recuerdo. Se ha completado desde los originales en la ejecución descrita más abajo; no se ha inferido a partir de los MAE.
- La receta de More in Common contiene imputación por donantes y contracción que no se ensayaron aquí. Este análisis no valida esa receta por transferencia entre casas.
- Próximo desarrollo: auditar etiquetas y faltantes y contrastar recuerdo sin ajuste, parcial y regularizado. Elegir parámetros y evaluar acierto en convocatorias distintas.
- Conservar fecha de campo: el error contra el 23J incluye movimientos posteriores al campo y no identifica exclusivamente error de encuesta.
- Las referencias oficiales y las cifras publicadas se heredan del análisis previo; no se han verificado de nuevo contra fuentes externas en esta ejecución.

## Reproducción

`python scripts/auditar_operaciones_40db_2023.py`

Entrada: `data/microdatos/40db-2023-recetas-detalle.json`.
Salida numérica: `data/microdatos/40db-2023-efectos-operaciones.json`.
Las pequeñas diferencias con MAE publicados en la auditoría previa proceden del redondeo de los votos a tres decimales.

## Combinación completada desde los originales

Se han verificado los tres SHA-256 y reproducido las siete recetas ponderadas previas con tolerancia de 0,00051 puntos por partido. Se calcula la octava combinación sobre las 4.800 entrevistas.

| Encuesta | Directa ponderada | Simpatía + participación | Publicada por 40dB |
|---|---:|---:|---:|
| junio_flash | 2.854 | 3.106 | 2.430 |
| junio_barometro | 3.195 | 2.927 | 1.628 |
| julio_preelectoral | 2.926 | 2.508 | 2.005 |

La combinación mejora las dos oleadas posteriores, empeora el flash y no supera a la estimación publicada en ninguna de las tres. No elegirla como ganadora para 2026 a partir de este único resultado electoral.

Reproducción desde matrices: `python -m scripts.completar_factorial_40db_2023 /carpeta/zip`.
Se mantienen los supuestos anteriores para aislar el contraste. La participación no numérica conserva la imputación 0,5 del ensayo previo; no es una probabilidad calibrada.

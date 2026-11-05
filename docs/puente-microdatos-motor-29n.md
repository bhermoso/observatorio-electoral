# Primer puente reproducible de microdatos al Motor 29N

Corte: 5 de noviembre de 2026. Receta candidata, sin validación predictiva independiente. No sustituye al pronóstico principal.

## Datos y receta

Se verifica el SHA-256 del ZIP de More in Common de octubre y se leen cinco columnas de 2.210 entrevistas: intención bruta, simpatía, recuerdo bruto de 2023, peso demográfico y participación declarada. El SAV temporal se elimina y solo se guardan agregados. No se usan las variables finales imputadas ni el peso electoral final de la casa. El peso demográfico sí procede del productor.

1. Peso demográfico publicado, sin el peso final que añade recuerdo.
2. Intención bruta: candidaturas y blanco; nulo, abstención y NS/NC excluidos del denominador inicial.
3. Para NS, se usa simpatía válida; Ninguno nunca se transforma en voto blanco.
4. Para NS restantes, distribución de donantes por recuerdo; contracción hacia distribución global con masa previa 50, expresada en entrevistas efectivas de Kish.
5. Sin donantes o recuerdo ausente se usa la distribución global; NC queda sin imputar en la referencia.
6. Cada peso se multiplica por probabilidad declarada de votar / 10; faltantes usan la media ponderada observada.
7. Normalización final sobre masa asignada a candidaturas y blanco.

La masa previa 50 es un supuesto explícito de regularización, no un coeficiente aprendido o elegido por coincidir con una publicación. Se comparan 0/50/100 y la imputación alternativa de NC. Se supone que los indecisos se parecen a los donantes de su recuerdo; no es voto observado. Kish no acredita muestreo probabilístico ni calibra intervalos.

## Sobre la misma encuesta

| Partido | Receta OEE | More in Common publicado |
|---|---:|---:|
| PP | 24.32 % | 28.3 % |
| PSOE | 28.37 % | 27.6 % |
| Vox | 22.20 % | 20.8 % |
| Frente Amplio | 5.59 % | 7.8 % |
| Podemos | 1.88 % | 2.6 % |

## Puente al pronóstico del 29N

Se ejecutan tres escenarios. More in Common no estaba entre las veinte entradas originales. La estimación publicada y nuestra receta de la misma muestra nunca se introducen juntas. Para aislar el contraste de receta se comparan los dos escenarios de 21 entradas: misma casa, fechas, muestra, cinco partidos y modelo. SALF no tiene cifra puntual transcrita en la referencia publicada y no se inventa.

| Escenario | Encuestas | PP | PSOE | Vox | Sumar / FA | Podemos |
|---|---:|---:|---:|---:|---:|---:|
| sin_more_in_common | 20 | 30.25 % | 28.36 % | 18.68 % | 5.84 % | 2.55 % |
| con_more_publicada | 21 | 30.05 % | 28.38 % | 18.80 % | 5.98 % | 2.55 % |
| con_more_cocina_oee | 21 | 29.80 % | 28.47 % | 18.92 % | 5.78 % | 2.46 % |

Se declara para este ensayo la equivalencia Frente Amplio de octubre → SUMAR del modelo; su composición y geografía no están validadas contra 2023. No es una equivalencia universal.

Cada escenario usa 2.250 simulaciones y los supuestos actuales del motor. No se suma todavía la incertidumbre específica de imputación o selección de receta. Las diferencias no prueban acierto ni son efectos causales. La estimación de encuesta se refiere al campo de octubre; la proyección temporal y territorial corresponde al motor.

## Histórico y otras matrices

Siguen cargadas 887 encuestas históricas, 870 de Wikipedia. Aportan evaluación y errores históricos de casas, sin contarse como encuestas actuales. CIS y 40dB conservan sus análisis separados. La nota antigua del agregado CIS que dice que Kish se usa en el motor no describe la ruta operativa comprobada: esa receta no entra actualmente en el principal.

## Reproducción y comprobación

- Ejecutar `python -m scripts.estimar_microdatos_more_octubre` con numpy y pyreadstat==1.3.2.
- Ejecutar `python -m unittest modelo.tests.test_receta_declarada -v` y `python -m unittest discover -s modelo/tests -t .`.
- Agregados: `data/microdatos/candidata-more-in-common-octubre-2026.json`.

Las pruebas verifican conservación de masa, NS/NC, Ninguno/Blanco, donantes ausentes, contracción y participación. No sustituyen una evaluación entre elecciones independientes. Los archivos y parámetros del pronóstico principal y su historial no se modifican.

Fuente: https://moreincommon.es/pulso-electoral.html . ZIP: https://moreincommon.es/data/microdatos-2026-10.zip .

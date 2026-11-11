# Contrato de capas

Toda cifra de voto o escaños del Observatorio pertenece a una de estas clases. Ninguna pantalla puede mostrar una en lugar de otra.

| Capa | Nombre | Origen | Cálculo | Qué no es |
|---|---|---|---|---|
| 1 | Promedio de encuestas publicadas | `data/polls.json` (o, a elección del usuario, las mismas entradas del motor) | `capas.mjs` · `promedioPublicado`: último estudio por instituto con fin de campo en la ventana (30/45/90 días) y publicado antes del corte; con o sin CIS; peso igual, por recencia o manual. Etiquetas «Sumar», «Sumar/FA» y «Frente Amplio» unificadas y registradas. Bloques solo con encuestas que publican todos sus partidos y si cubren al menos la mitad de los estudios. | No es cocina del Observatorio. Las cifras de cada encuestadora ya incluyen su propia cocina. |
| 2 | Observatorio sin cocina adicional | Motor 29N, variante `consenso_todas` | Tendencia diaria (paseo aleatorio), efecto de casa con ancla en la media de todas las casas activas, error muestral con efecto de diseño 1,5, simulación hasta la elección, traslado provincial y D’Hondt. | No incluye calibración con errores históricos ni error de industria ampliado. |
| 3 | Observatorio con cocina · **estimación de referencia** | Motor 29N, `principal` | Mezcla a partes iguales de `consenso_privadas`, `consenso_todas` y `calibrada_23j`; las dos de consenso corrigen la mitad del sesgo común de las casas en el 23J (PSOE +1,27, PP −0,30, Sumar −0,33, Vox +0,06 puntos), con error de industria de 2,2 pp y correlación entre bloques 0,5. | No es cocina sobre microdatos: no usa voto directo, recuerdo, simpatía, transferencias ni probabilidad de votar. No incorpora efectos de acontecimientos. |
| 4 | Otros observatorios y modelos | `data/references.json` (`aggregate-model`) y `modelo/externos/agregadores.csv` | Se muestran tal como se publicaron, con fecha, método declarado y si el original se consultó. | No entra en ningún promedio ni en el motor. |
| — | Experimento | Microdatos CIS (`data/microdatos/`), laboratorio D’Hondt, simulaciones de acontecimientos | Ilustrativo. | No es una capa ni un pronóstico. |

**Capa 3 − capa 2** es una diferencia conjunta de configuraciones: cambian la mezcla de variantes y el error de industria (1,5 frente a 2,2 pp). No aísla el efecto de cada ajuste ni mide un efecto político. Los 2,2 pp son un supuesto intermedio contrastado con el 23J, no una calibración independiente.

## Recuentos visibles

La portada, Promedios y Pronóstico completo muestran el archivo verificado, los estudios admitidos en el pronóstico y el conjunto histórico. El promedio cuenta solo estudios con peso positivo de la selección activa. Los demás recuentos corresponden al corte publicado del motor, que puede diferir de la fecha elegida para el promedio.

`modelo/motor/inventario.py` cuenta estudios después de la deduplicación y el filtro de disponibilidad del corte; `pronostico.json → auditoria_fuentes → inventario` conserva total, históricos, ciclo actual y procedencias, incluido Wikipedia. Las filas de partidos y las simulaciones no incrementan el número de encuestas. Los conjuntos se solapan: no se suman archivo, promedio y motor.

## Puerta de calidad del motor

`modelo/motor/fuentes.py · seleccion_pronostico` excluye, con motivo publicado en `pronostico.json → excluidas`:

1. Citas de prensa sin original ni ficha técnica.
2. Registros de terceros con fecha de campo no publicada (supuesta).
3. Registros de terceros cuyo campo se solapa con un registro verificado de la misma casa (posible doble cuenta de entrevistas).

## Acontecimientos

Una encuesta con entrevistas el mismo día del suceso es «coincidente» y no entra en la comparación (misma regla en `events.mjs` y `modelo/motor/eventos.py`). Las diferencias entre dos oleadas se comparan con una referencia teórica al 95 % bajo independencia y muestreo probabilístico, con efecto de diseño fijado en 1,5. No acredita significación en paneles no probabilísticos ni incluye error de estimación o sesgo de instituto. El cambio a 14 días del motor se compara con el umbral placebo. Nada de esto es un efecto causal estimado.

## Versiones

`modelo/motor/registro.py · VERSION` cambia cuando cambia el método. Cada entrada del historial guarda su versión; la portada y el pronóstico señalan cuándo una diferencia entre cortes es, en parte, metodológica. Versión 2 (3-nov-2026): puerta de calidad de fuentes; el historial se recalculó entero con ella.

## Puerta de validación de recetas de microdatos (12-nov-2026)

La pantalla **Cocina → Contrastar métodos** presenta una evaluación conjunta calculada a partir de
`data/microdatos/auditoria_cocina_23j.json` (CIS) y
`data/microdatos/40db-retrospectiva-2023.json` (40dB).
`evaluacion-microdatos.mjs` comprueba la concordancia de elección, estructura y errores.
Su salida es **investigación**: no crea una quinta capa ni se usa como predictor.

**Reglas para considerar una incorporación futura al motor:**

1. Comparar procedimientos sobre el mismo objetivo de voto válido, con un mapa de candidaturas documentado y fechas de campo comparables.
2. Mantener separados los cambios de denominador, la ponderación, la imputación de indecisos, la simpatía, el recuerdo y la participación. No inferir los coeficientes privados de una encuestadora.
3. Separar elección/validación de hiperparámetros de la evaluación independiente; todas las encuestas de una misma elección pertenecen al mismo grupo de validación.
4. Evaluar la alternativa frente a la estimación publicada *y* frente al motor conjunto, sin sumar una transformación del microdato a la propia estimación publicada del mismo estudio: sería doble cómputo.
5. Exigir varias elecciones independientes, sensibilidad por instituto, intervalos de incertidumbre, registro de decisiones y conservación de la línea base; una mejora retrospectiva aislada no cambia el pronóstico.
6. Una vez exista evidencia suficiente, introducir el cambio detrás de una variante versionada, con la procedencia exacta y la posibilidad de comparar con el motor sin esa variante.

**Resultado actual:** CIS (dos oleadas) y 40dB (tres oleadas) comparten la misma elección general del 23J. La tabla ofrece errores descriptivos y comprobaciones entre oleadas, pero **una sola unidad electoral independiente**. Por ello no activa ninguna receta en `modelo/motor/pronostico.py`.

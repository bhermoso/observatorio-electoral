# Contrato de capas

Toda cifra de voto o escaños del Observatorio pertenece a una de estas clases. Ninguna pantalla puede mostrar una en lugar de otra.

| Capa | Nombre | Origen | Cálculo | Qué no es |
|---|---|---|---|---|
| 1 | Promedio de encuestas publicadas | `data/polls.json` (o, a elección del usuario, las mismas entradas del motor) | `capas.mjs` · `promedioPublicado`: último estudio por instituto con fin de campo en la ventana (30/45/90 días) y publicado antes del corte; con o sin CIS; peso igual, por recencia o manual. Etiquetas «Sumar», «Sumar/FA» y «Frente Amplio» unificadas y registradas. Bloques solo con encuestas que publican todos sus partidos y si cubren al menos la mitad de los estudios. | No es cocina del Observatorio. Las cifras de cada encuestadora ya incluyen su propia cocina. |
| 2 | Observatorio sin cocina adicional | Motor 29N, variante `consenso_todas` | Tendencia diaria (paseo aleatorio), efecto de casa con ancla en la media de todas las casas activas, error muestral con efecto de diseño 1,5, simulación hasta la elección, traslado provincial y D’Hondt. | No incluye calibración con errores históricos ni error de industria ampliado. |
| 3 | Observatorio con cocina · **estimación de referencia** | Motor 29N, `principal` | Mezcla a partes iguales de `consenso_privadas`, `consenso_todas` y `calibrada_23j`, con error de industria de 2,2 pp y correlación entre bloques 0,5. | No es cocina sobre microdatos: no usa voto directo, recuerdo, simpatía, transferencias ni probabilidad de votar. No incorpora efectos de acontecimientos. |
| 4 | Otros observatorios y modelos | `data/references.json` (`aggregate-model`) y `modelo/externos/agregadores.csv` | Se muestran tal como se publicaron, con fecha, método declarado y si el original se consultó. | No entra en ningún promedio ni en el motor. |
| — | Experimento | Microdatos CIS (`data/microdatos/`), laboratorio D’Hondt, simulaciones de acontecimientos | Ilustrativo. | No es una capa ni un pronóstico. |

**Capa 3 − capa 2** es una diferencia conjunta de configuraciones: cambian la mezcla de variantes y el error de industria (1,5 frente a 2,2 pp). No aísla el efecto de cada ajuste ni mide un efecto político. Los 2,2 pp son un supuesto intermedio contrastado con el 23J, no una calibración independiente.

## Puerta de calidad del motor

`modelo/motor/fuentes.py · seleccion_pronostico` excluye, con motivo publicado en `pronostico.json → excluidas`:

1. Citas de prensa sin original ni ficha técnica.
2. Registros de terceros con fecha de campo no publicada (supuesta).
3. Registros de terceros cuyo campo se solapa con un registro verificado de la misma casa (posible doble cuenta de entrevistas).

## Acontecimientos

Una encuesta con entrevistas el mismo día del suceso es «coincidente» y no entra en la comparación (misma regla en `events.mjs` y `modelo/motor/eventos.py`). Las diferencias entre dos oleadas se comparan con una referencia teórica al 95 % bajo independencia y muestreo probabilístico, con efecto de diseño fijado en 1,5. No acredita significación en paneles no probabilísticos ni incluye error de estimación o sesgo de instituto. El cambio a 14 días del motor se compara con el umbral placebo. Nada de esto es un efecto causal estimado.

## Versiones

`modelo/motor/registro.py · VERSION` cambia cuando cambia el método. Cada entrada del historial guarda su versión; la portada y el pronóstico señalan cuándo una diferencia entre cortes es, en parte, metodológica. Versión 2 (3-nov-2026): puerta de calidad de fuentes; el historial se recalculó entero con ella.

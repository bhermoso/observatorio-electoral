# Evaluación retrospectiva nacional parcial

6 elecciones; 30 cortes correlacionados. Soporte: PP y PSOE. Nivel 3 para estos comparadores; el Motor 29N completo no queda validado.

| Variante | MAE pp | RMSE pp | Sesgo pp | Cobertura 90 % | Anchura pp |
|---|---:|---:|---:|---:|---:|
| ultima_publicacion | 2.289 | 2.862 | -0.131 | 85.0% | 7.714 |
| media_casas | 2.286 | 2.874 | -0.274 | 80.0% | 7.714 |
| media_recencia | 2.280 | 2.863 | -0.244 | 80.0% | 7.714 |
| media_casas_corregida | 2.363 | 2.913 | -0.400 | 80.0% | 7.714 |
| latente_sin_correccion | 2.280 | 2.895 | -0.284 | 80.0% | 8.046 |
| mezcla_nacional_historica | 2.294 | 2.888 | -0.328 | 80.0% | 8.113 |

- PP/PSOE son las únicas candidaturas homologadas en las seis convocatorias; no se normalizan entre sí.
- Las referencias secundarias fechadas no equivalen al contraste de todos los originales.
- La mezcla nacional histórica reutiliza tendencia. No reproduce calibración 23J, normalización conjunta, correlación entre partidos ni geografía del Motor 29N.
- Intervalos marginales; seis elecciones correlacionadas temporalmente no bastan para validar probabilidades de mayoría.
- Industria 2.0 pp es una hipótesis fijada para este protocolo, no la calibración 2.2 del Motor 29N basada en 23J.
- No se usa el resultado objetivo para ajustar. No se ha escogido una variante ganadora ni cambiado el principal por estos resultados.

JSON: `modelo/validacion/multieleccion.json`. Contiene admisiones por corte, entrenamiento, errores por candidatura, fuentes y huellas del código/datos.

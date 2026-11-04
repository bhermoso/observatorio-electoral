# Recodificaciones CIS 2019 · reconstrucción observacional

**Fecha:** 4 de noviembre de 2026. **Fuentes:** ZIP originales MD3242 y MD3263 aportados por el usuario, ficheros DA, sintaxis ES y libros de códigos.

## Comprobaciones empíricas

| Relación observada | CIS 3242 · abril | CIS 3263 · noviembre |
|---|---:|---:|
| Entrevistas analizadas | 16.194 | 17.650 |
| Combinaciones voto original + provincia → intención recodificada | 764 | 832 |
| Combinaciones simpatía original + provincia → simpatía recodificada | 582 | 612 |
| Claves de simpatía original + provincia → VOTOSIMG entre respuestas no resueltas o no votantes | 530 | 556 |
| Ambigüedades en las tres correspondencias provinciales | **0** | **0** |
| Respuestas electorales definidas (incluidos voto en blanco y nulo) conservadas por VOTOSIMG | 8.786 de 8.786 | 9.675 de 9.675 |
| Respuestas restantes: 94, 97, 98 y 99 | 7.408 | 7.975 |
| De esas respuestas, VOTOSIMG coincide con simpatía recodificada | 7.223 | 7.712 |
| Otras transformaciones territoriales adicionales | 185 | 263 |

**Conclusión limitada:** las correspondencias son unívocas **en las combinaciones presentes en estas muestras**. Es una *reconstrucción empírica* de las transiciones observadas, no prueba de que se haya recuperado el algoritmo de programación del CIS ni de que funcionaría para códigos/provincias ausentes.

## Ejemplos de coaliciones territoriales

En el **3242**, respuesta original 3 (Podemos) se convierte en 3 (Unidas Podemos) en 592 entrevistas y 6 (En Comú Podem) en 65.

En el **3263**, respuesta original 21 (Unidas Podemos) termina como 21 en 632 casos, 6 (En Comú Podem) en 52 y 67 (En Común–Unidas Podemos) en 61. La respuesta 3 (Podemos) se recodifica en 21 (239), 6 (33) y 67 (24). La respuesta 50 (Más País) termina en 50 (69) o 95 (Otro partido; 88), con 20 casos adicionales agrupados entre otras transformaciones.

Todos los recuentos son **no ponderados** y provienen de los ficheros DA originales. Se suprimen los recuentos individuales inferiores a 20 al publicar ejemplos; se muestra un residual agregado. Estos códigos no autorizan a combinar automáticamente Unidas Podemos, En Comú Podem, En Común–Unidas Podemos, Más País, Más País–Chunta, Més Compromís ni Sumar.

## Reproducción

```bash
python scripts/auditar_transiciones_cis_2019.py /ruta/MD3242.zip /ruta/MD3263.zip --output /tmp/transiciones_2019.json
```

El script verifica el SHA-256 contra `data/microdatos/cotejo_originales_2019.json`, la cantidad de entrevistas y la consistencia de las claves observadas. Su resultado público, sin microdatos individuales, se conserva en `data/microdatos/transiciones_2019.json`.

**No usar como validación predictiva:** el análisis utiliza exactamente las mismas muestras de las que deriva la correspondencia. No es un ensayo independiente de recetas ni evalúa escaños. No modifica el Motor 29N.

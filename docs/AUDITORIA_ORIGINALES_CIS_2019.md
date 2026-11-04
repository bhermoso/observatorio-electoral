# Auditoría de originales CIS 3242 y 3263 — 4 noviembre 2026

## Archivos recibidos y cotejo

El usuario aportó `MD3242.zip` y `MD3263.zip`. Ambos incluyen `DA` (casos), `ES` (sintaxis), `.sav`, `codigo.pdf`, `cues.pdf` y `FT.pdf`. El segundo contiene el anexo territorial.

| Estudio | Elección | N original | Σ PESO | Kish aproximado | SHA-256 del ZIP |
|---|---|---:|---:|---:|---|
| 3242 | 28-abr-2019 | 16.194 | 16.193,9455 | 11.435,6 | `24cbdbccf119d1174fb6ed5cd3fc7a23aa8303d8244ca5cdf717d27399f08bbc` |
| 3263 | 10-nov-2019 | 17.650 | 17.649,9982 | 11.747,6 | `efe93eeb74047a677d2cd4c39be0fa5e340c5f7db4ec651fc4e4a6f3bcc3532c` |

**Resultado:** los SHA-256 coinciden con `diagnostico_2019_original.json`. Se vuelven a obtener 12 grupos de intención de voto, 3 grupos de indecisión/no respuesta, los tamaños muestrales, Σ PESO y el Kish de cada estudio (redondeo de milésimas en subtotales).

## Correspondencia verificada entre pregunta, código y variable

| Concepto | Estudio 3242 | Estudio 3263 |
|---|---|---|
| Intención directa original | P10 | P9 |
| Intención de voto recodificada | **P10R**, DA 225–226 | **P9R**, DA 252–253 |
| Simpatía original / recodificada | P10A / P10AR | P9A / P9AR |
| Voto + simpatía derivado | **VOTOSIMG**, DA 229–230 | **VOTOSIMG**, DA 256–257 |
| Ponderación nacional utilizada | **PESO**, DA 214–220 | **PESO**, DA 271–277 |
| Peso para comunidades autónomas | PESOCCAA, DA 246–252 | PESOCCAA, DA 278–284 |
| Intención de acudir a votar | P9 | P8 |
| Probabilidad declarada de votar (0–10) | **P12**, DA 86–87 | **P11**, DA 79–80 |
| Recuerdo de voto recodificado | **RECUERDO**, DA 233–234; votó en 2016 | **RECUERDO**, DA 268–269; votó en abril 2019 |

Los diccionarios originales y la sintaxis `ES` etiquetan las variables. `WEIGHT BY PESO` confirma la ponderación nacional prevista en el fichero; `PESOCCAA` no la reemplaza para inferencia nacional.

**No existe discrepancia entre P8 y P11 del 3263:** miden cosas distintas (intención de acudir frente a escala 0–10). Lo mismo sucede con P9 y P12 del 3242.

El código **94** corresponde a indecisión explícita, **98** a no sabe y **99** a no contesta. No se pueden fusionar sin una regla explícita.

## Límites que continúan bloqueando una receta electoral

1. Los nombres de las variables y sus posiciones están confirmados; **aún falta reconstruir y auditar exhaustivamente la regla de recodificación** de P10/P9 hacia P10R/P9R y la construcción de VOTOSIMG, incluidos los filtros.
2. Las categorías territoriales de candidaturas en 2019 deben homologarse por circunscripción. Los códigos de Unidas Podemos, En Comú Podem, En Común-Unidas Podemos, Más País y Més Compromís no se pueden sumar por semejanza de nombre con Sumar.
3. Falta una evaluación fuera de muestra definida de antemano, con todas las bases de voto válido, reglas de imputación y parámetros congelados. Los ensayos de 2019 y 2023 son retrospectivos.
4. Por tanto, **0 de 2 estudios habilitados para incorporar una receta experimental al Motor 29N**. No se modifican las estimaciones centrales ni se anuncian probabilidades calibradas.

## Cómo reproducir el cotejo sin publicar entrevistas

Guarda ambos ZIP fuera del repositorio y ejecuta:

```bash
python scripts/cotejar_originales_cis_2019.py /ruta/MD3242.zip /ruta/MD3263.zip --output resumen_cotejo.json
```

El script verifica SHA-256, ficheros internos, posiciones de `ES`, ponderación nacional, recuentos y sumas agregadas. **No sube ni vuelca entrevistas individuales**. El manifiesto de hashes y estadísticas agregadas está en `data/microdatos/cotejo_originales_2019.json`.

Documentación de contraste: `codigo3242.pdf`, `codigo3263.pdf`, `cues3242.pdf`, `cues3263.pdf`, `FT3242.pdf` y `FT3263.pdf` incluidos en los ZIP originales.

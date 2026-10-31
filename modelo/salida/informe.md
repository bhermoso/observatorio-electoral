# Motor de pronóstico 29N — corte 2026-10-31

Encuestas cargadas: 675 (terceros-29n: 23, terceros-wikipedia: 643, verificada: 9). `verificada` = registro primario del observatorio; `terceros-*` = ver `modelo/externos/PROCEDENCIA.md`.

## 1. Pronóstico 29N

Faltan 29 días. Mediana e intervalo del 90 % de 3000 simulaciones por variante. La diferencia entre variantes es la incertidumbre de método: depende de qué casas se toman como referencia.

| Partido | Promedio simple % | consenso_privadas: voto % · escaños | consenso_todas: voto % · escaños | calibrada_23j: voto % · escaños |
|---|---|---|---|---|
| PP | 30.7 | 31.7 (28.2–35.1) · **133** (119–148) | 30.8 (27.3–34.2) · **129** (115–144) | 30.2 (26.6–33.6) · **126** (111–141) |
| PSOE | 27.6 | 26.8 (23.7–30.0) · **110** (95–125) | 27.5 (24.4–30.7) · **113** (98–129) | 28.5 (25.1–31.8) · **118** (102–134) |
| VOX | 18.8 | 18.7 (16.2–21.4) · **67** (56–79) | 18.6 (16.1–21.2) · **67** (55–79) | 18.6 (15.9–21.4) · **67** (55–79) |
| SUMAR | 6.0 | 6.0 (4.4–7.6) · **8** (5–13) | 6.1 (4.5–7.6) · **8** (5–13) | 6.0 (4.4–7.6) · **8** (5–13) |
| PODEMOS | 2.7 | 2.7 (1.6–3.7) · **2** (0–3) | 2.7 (1.7–3.8) · **2** (0–3) | 2.7 (1.6–3.7) · **2** (0–3) |
| SALF | 1.8 | 1.8 (0.5–3.0) · **0** (0–1) | 1.8 (0.7–2.8) · **0** (0–0) | 1.8 (0.5–3.0) · **0** (0–1) |
| ERC | 2.8 | 2.4 (1.3–3.4) · **10** (6–14) | 2.5 (1.5–3.6) · **11** (7–15) | 2.4 (1.3–3.4) · **10** (6–14) |
| JUNTS | 1.1 | 1.2 (0.4–2.0) · **4** (0–8) | 1.1 (0.4–1.9) · **4** (0–8) | 1.2 (0.4–2.0) · **4** (0–8) |
| BILDU | 1.4 | 1.3 (0.4–2.1) · **7** (1–11) | 1.4 (0.6–2.2) · **7** (2–11) | 1.3 (0.4–2.1) · **7** (1–11) |
| PNV | 0.8 | 0.9 (0.2–1.6) · **4** (0–8) | 0.8 (0.2–1.5) · **3** (0–7) | 0.9 (0.2–1.6) · **4** (0–8) |
| BNG | 0.9 | 0.9 (0.3–1.7) · **2** (0–6) | 0.9 (0.3–1.6) · **2** (0–6) | 0.9 (0.3–1.7) · **2** (0–6) |
| CC | 0.3 | 0.4 (0.0–1.0) · **1** (0–4) | 0.4 (0.0–1.0) · **1** (0–4) | 0.4 (0.0–1.0) · **1** (0–4) |
| UPN | 0.1 | 0.1 (0.0–0.7) · **0** (0–3) | 0.1 (0.0–0.7) · **0** (0–3) | 0.1 (0.0–0.7) · **0** (0–3) |

| Bloque | consenso_privadas | consenso_todas | calibrada_23j |
|---|---|---|---|
| PP+VOX | 200 (183–217) · P(≥176) 99% | 196 (179–213) · P(≥176) 98% | 193 (174–209) · P(≥176) 94% |
| PP+VOX+UPN | 201 (183–218) · P(≥176) 99% | 197 (179–215) · P(≥176) 98% | 194 (175–211) · P(≥176) 94% |
| PSOE+SUMAR+PODEMOS | 119 (102–137) · P(≥176) 0% | 123 (105–142) · P(≥176) 0% | 127 (109–147) · P(≥176) 0% |
| PSOE+SUMAR+PODEMOS+ERC+JUNTS+BILDU+PNV+BNG+CC | 149 (132–167) · P(≥176) 1% | 153 (135–171) · P(≥176) 2% | 156 (139–175) · P(≥176) 5% |
| PP primera fuerza | 92% | 85% | 68% |

Variantes:
- `consenso_privadas`: Sesgo cero = media de las casas privadas (CIS fuera del ancla).
- `consenso_todas`: Sesgo cero = media de todas las casas, CIS incluido.
- `calibrada_23j`: Sesgo previo de cada casa = 50 % de su error en el 23J (PP, PSOE, Vox); sin ancla de consenso.
- Promedio simple: última encuesta de cada casa en 30 días, mismo peso (40dB., Ateneo del Dato, CIS, DYM, GAD3, IMOP, NC Report, Sigma Dos, SocioMétrica).

### Sensibilidad: error común entre bloques

Fracción de la varianza del error de industria que desplaza voto entre bloques (PP, Vox, UPN frente a PSOE, Sumar, Podemos). No se puede estimar con una sola elección evaluada; el pronóstico usa 0.5. Variante `consenso_privadas`.

| Correlación entre bloques | PP − PSOE (pp, 90 %) | PP + Vox escaños (90 %) | P(PP+Vox ≥ 176) | P(PP primero) |
|---|---|---|---|---|
| 0.0 | +4.9 (+0.1 a +9.8) | 200 (188–213) | 100% | 95% |
| 0.5 (pronóstico) | +4.9 (-0.6 a +10.3) | 200 (183–217) | 99% | 92% |
| 0.8 | +4.9 (-1.0 a +10.8) | 200 (181–219) | 98% | 92% |

## 2. Evaluación de las encuestas frente al 23J

Última encuesta de cada casa en las 3 semanas previas. Error = encuesta − resultado (pp). Resultado oficial: PP 33.06, PSOE 31.68, VOX 12.38, SUMAR 12.33.

| Casa | Fin campo | Origen | PP | PSOE | VOX | SUMAR | MAE |
|---|---|---|---|---|---|---|---|
| CIS | 2023-07-12 | verificada | -2.3 | +0.5 | -0.6 | +2.6 | 1.48 |
| SocioMétrica | 2023-07-16 | terceros-29n | +0.4 | -3.4 | +1.3 | +0.9 | 1.50 |
| Sigma Dos | 2023-07-21 | terceros-29n | +1.1 | -2.8 | -1.2 | +1.0 | 1.52 |
| Simple Lógica | 2023-07-13 | terceros-29n | -0.9 | -3.1 | +1.5 | +1.5 | 1.73 |
| GAD3 | 2023-07-15 | terceros-29n | +3.9 | -3.3 | -0.5 | -0.8 | 2.14 |
| NC Report | 2023-07-16 | terceros-29n | +4.1 | -3.4 | -1.3 | -1.0 | 2.46 |
| IMOP | 2023-07-14 | terceros-29n | -0.2 | — | — | — | 0.16 (incompleta) |
| 40dB. | 2023-07-07 | terceros-29n | -1.6 | -2.4 | — | — | 1.97 (incompleta) |

**Error de industria** (media de casas; lo que ningún promedio corrige): PP +0.6 (sd entre casas 2.4, n=8), PSOE -2.5 (sd entre casas 1.4, n=7), VOX -0.1 (sd entre casas 1.2, n=6), SUMAR +0.7 (sd entre casas 1.4, n=6).

**Retroprueba en el 23J** (datos hasta el 22-jul-2023; error en pp):

| Método | PP | PSOE | VOX | SUMAR | MAE |
|---|---|---|---|---|---|
| Promedio simple de las últimas | +0.6 | -2.5 | -0.1 | +0.7 | 0.98 |
| Modelo `consenso_privadas` | +0.9 | -3.7 | +0.7 | +0.4 | 1.45 |
| Modelo `consenso_todas` | +0.6 | -3.3 | +0.4 | +0.8 | 1.25 |

La variante calibrada no se puede retroprobar en el 23J (usaría el propio resultado). Con una sola elección evaluada, ninguna diferencia entre métodos es concluyente.

## 3. Cocinas: cómo trabaja y hacia dónde se desvía cada casa

Sesgo actual = desviación respecto al consenso de las privadas en el ciclo 2023-26 (pp, ± error típico). IZQ = Sumar + Podemos, solo cuando la casa publica ambos.

| Casa | Modo | Muestra | Días campo | Encuestas | PP | PSOE | Vox | IZQ | Error 23J |
|---|---|---|---|---|---|---|---|---|---|
| 40dB. | CAWI, CAWI (online) | 800 | 2.0 | 1 | -0.3±1.7 | +1.1±1.6 | +0.1±1.4 | -0.5±0.9 | PP-1.6 PSOE-2.4 |
| Ateneo del Dato | CAWI | 2000 | 3.0 | 1 | -0.7±1.5 | +0.7±1.4 | +0.7±1.2 | +0.8±0.8 | — |
| CIS | CATI | 6911 | 6.0 | 1 | -8.4±1.4 | +6.0±1.3 | -1.3±1.1 | +0.6±0.8 | PP-2.3 PSOE+0.5 VOX-0.6 |
| DYM | CAWI | 1011 | 3.0 | 1 | +1.2±1.7 | +1.2±1.6 | -0.4±1.3 | -1.6±0.8 | — |
| Demoscopia y Servicios | mixta: panel tabulado + entrevista telefónica asistida por ordenador (CATI) | 3000 | 4.0 | 1 | +1.2±2.4 | -0.1±2.2 | -0.8±1.9 | — | — |
| GAD3 | CATI, CATI (telefónica), CATI + CAWI | 1077 | 3.5 | 2 | -0.2±1.4 | -0.1±1.3 | -0.7±1.1 | — | PP+3.9 PSOE-3.3 VOX-0.5 |
| IMOP | CATI (telefónica asistida por ordenador; 60% móvil), CATI (telefónica asistida por ordenador; 61% móvil), CATI + CAWI, Híbrida: CATI + CAWI (distribución aprox. 45%/55%; en el canal telefónico 70% móvil) | 1000 | 4.0 | 2 | -2.3±1.3 | -0.1±1.2 | +0.6±1.1 | — | PP-0.2 |
| NC Report | no consta en la fuente consultada, telefónica/online, telefónico + online | 1000 | 2.5 | 2 | +1.7±1.4 | -1.5±1.2 | -0.3±1.1 | — | PP+4.1 PSOE-3.4 VOX-1.3 |
| Sigma Dos | CATI (telefónica), CATI + CAWI, mixta CATI + CAWI (panel), mixta CATI/CAWI (panel), mixta telefónica (CATI) / online (CAWI) / RRSS | 3122 | 12.5 | 3 | -0.1±1.1 | -1.0±1.0 | +0.2±0.9 | +1.4±0.7 | PP+1.1 PSOE-2.8 VOX-1.2 |
| SocioMétrica | Mixta CATI + CAWI (plataforma Gandia Integra), Online (CAWI panel), telefónica/online | 1005 | 3.0 | 2 | +0.8±1.3 | -0.3±1.2 | -0.2±1.1 | — | PP+0.4 PSOE-3.4 VOX+1.3 |

**Comparabilidad entre ciclos**: sesgo de cada casa en 2019-23 (nov-2019 a ene-2023, tablas de Wikipedia) frente a 2023-26. IZQ 2019-23 = UP + Más País.

| Casa | PP | PSOE | Vox | IZQ |
|---|---|---|---|---|
| 40dB. | -1.6 → -0.3 | +0.8 → +1.1 | -0.8 → +0.1 | +1.2 → -0.5 |
| CIS | -2.9 → -8.4 | +3.7 → +6.0 | -3.1 → -1.3 | +0.3 → +0.6 |
| DYM | +0.2 → +1.2 | -0.5 → +1.2 | +0.0 → -0.4 | +0.1 → -1.6 |
| Demoscopia y Servicios | +0.6 → +1.2 | -2.1 → -0.1 | +0.4 → -0.8 | — |
| GAD3 | +2.6 → -0.2 | +0.6 → -0.1 | -1.9 → -0.7 | — |
| IMOP | -0.6 → -2.3 | +0.4 → -0.1 | +0.5 → +0.6 | — |
| NC Report | +1.8 → +1.7 | -0.7 → -1.5 | -0.6 → -0.3 | — |
| Sigma Dos | +1.2 → -0.1 | +0.4 → -1.0 | -1.1 → +0.2 | -0.1 → +1.4 |
| SocioMétrica | -0.5 → +0.8 | -0.5 → -0.3 | +0.4 → -0.2 | — |
| **Correlación** | 0.7 | 0.8 | 0.6 | -0.3 |

Una correlación alta indica que la casa conserva su forma de cocinar entre ciclos; baja, que su sesgo pasado no sirve para corregir el actual. Con pocas casas comunes, el coeficiente es orientativo.

## 4. Acontecimientos: accidente de Urda (28-oct-2026)

Encuestas con campo íntegramente posterior al 28-oct: **0**. Pares antes/después por casa: **0**.

Todavía no se puede medir: ninguna encuesta del sistema tiene entrevistas posteriores al suceso. El pronóstico de la sección 1 no incorpora ningún efecto de Urda.

**Umbral de detección** (calibrado con placebos en el ciclo 2019-23: cambio a 14 días en fechas sin suceso elegido, cada 14 días; percentil 95 del valor absoluto):

PP ±3.1 pp, PSOE ±1.2 pp, VOX ±1.8 pp. Un efecto de Urda menor que esto no se distinguirá del ruido aunque exista.

**Validación del método** con un suceso conocido — crisis Casado–Ayuso (17-feb-2022):

| Partido | Pares por casa | Salto inmediato | Cambio a 14 días | Umbral placebo | Distinguible |
|---|---|---|---|---|---|
| PP | -2.0 (n=13) | -1.9 ± 0.9 | -1.5 ± 0.8 | ±3.1 | no |
| PSOE | +1.3 (n=13) | +1.3 ± 0.9 | +1.2 ± 0.8 | ±1.2 | sí |
| VOX | +2.1 (n=13) | +2.0 ± 0.8 | +1.9 ± 0.7 | ±1.8 | sí |

El método detecta la subida de Vox; la caída del PP (real, de 2 a 4 puntos según la casa) queda en el límite porque el PP tuvo grandes oscilaciones en ese ciclo, lo que eleva su umbral.

## 5. Contraste con promedios externos

Para comparar en igualdad de condiciones, el motor se ejecuta con los datos que existían en la fecha de cada referencia (encuestas con campo terminado hasta ese día), variante `consenso_privadas`.

### Promedio de EL PAÍS · Kiko Llaneras — 2026-10-03

| Partido | Referencia voto % | Motor voto % | Referencia escaños | Motor escaños (90 %) |
|---|---|---|---|---|
| PP | 33.0 | 33.4 | 137 | 143 (126–159) |
| PSOE | 26.0 | 25.7 | 107 | 106 (89–122) |
| VOX | 18.0 | 18.2 | 62 | 64 (51–77) |
| SUMAR | 6.0 | 5.9 | 9 | 8 (5–14) |
| PODEMOS | 3.0 | — | 3 | — |

Encuestas disponibles para el motor en esa fecha: 5 de 5 casas. Fuente: https://elpais.com/actualidad/newsletter-kiko-llaneras/2026-10-03/que-dicen-las-encuestas-si-hay-elecciones-la-ventaja-pp-vox-y-las-opciones-de-sanchez.html. Referencia del 3 de octubre, no una cifra actualizada a hoy. Los porcentajes están redondeados en el texto original. Los escaños son resultados centrales del modelo de EL PAÍS. No es una encuesta independiente y queda fuera del archivo de entrevistas y de cualquier cómputo de institutos.

## 6. Límites conocidos

- Un solo precedente evaluado (23J). Faltan 2015, 2016 y 2019 (requieren acceso a Wikipedia o a las fuentes originales).
- Ciclo 2023-26 con pocas encuestas antes de octubre de 2026: la tendencia previa es poco informativa.
- Algunas encuestas finales de 2023 están incompletas en la fuente de terceros (marcadas).
- Partidos regionales: pocas casas publican su voto; sus sesgos están poco identificados.
- El traslado a escaños supone que la geografía relativa del 23J se mantiene.


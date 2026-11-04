# Alta cocina demoscópica: fuentes 40dB y validación predictiva

**Estado (4 de noviembre de 2026): los tres ZIP originales aportados por el usuario han sido abiertos, con 4.800 entrevistas auditadas y agregados verificables.**
Esta fase incorpora el análisis empírico de 2.000 entrevistas de enero, 2.000 de octubre y 800 del flash de octubre, con variables, ponderación y ejercicios comparables desde los archivos originales. **No añade una receta ganadora, no cambia el Motor 29N y no autoriza a publicar una mejora de acierto.**

## 1. Fuentes primarias, públicas, pero no necesariamente de libre redistribución

EL PAÍS publica enlaces gratuitos a ZIP con cuestionarios, documentación metodológica, cruces y matrices de respuestas de 40dB:

- Barómetro del 12 de enero de 2026: https://elpais.com/espana/2026-01-12/consulte-todos-los-datos-internos-de-la-encuesta-de-el-pais-cuestionarios-cruces-y-respuestas-individuales.html
- Barómetro del 5 de octubre de 2026: https://elpais.com/espana/2026-10-05/consulte-todos-los-datos-internos-de-la-encuesta-de-el-pais-cuestionarios-cruces-y-respuestas-individuales.html
- Flash electoral del 9 de octubre de 2026: https://elpais.com/espana/2026-10-09/consulte-todos-los-datos-internos-de-la-encuesta-de-el-pais-cuestionarios-cruces-y-respuestas-individuales.html

Los enlaces exactos a los ZIP están en `data/microdatos/fuentes-40db.json`. Los ZIP llegaron como archivos aportados por el usuario; contienen DTA, SAV, hojas de cálculo y PDF. Se analizaron las matrices DTA (enero: 71 variables; octubre: 97; flash: 33), el ponderador ponde y los cuestionarios. Las condiciones de redistribución no están confirmadas: los ZIP no se publican en GitHub.

No se suben respuestas individuales a GitHub o GitHub Pages. Las condiciones de acceso de una publicación **no equivalen** a una licencia abierta de redistribución. Mantener fuente, atribución y restricciones del titular.

## 1 bis. Contraste histórico publicado por Llaneras y Andrino (19/10/2026)

Fuente: [¿Qué encuestas aciertan más? Compara los errores y los sesgos de cada encuestadora](https://elpais.com/espana/elecciones-generales/2026-10-18/que-encuestas-aciertan-mas-compara-los-errores-y-los-sesgos-de-cada-encuestadora.html), EL PAÍS, Kiko Llaneras y Borja Andrino, publicado el 19 de octubre de 2026.

- El análisis utiliza **44 elecciones desde 2018** y compara **17 encuestadoras** con al menos cinco citas electorales. Para cada casa, incluye su última encuesta cuyo trabajo de campo terminó entre **5 y 41 días** antes de votar.
- Según sus resultados, **40dB fue la encuestadora más precisa en las tres generales evaluadas**, pero presentó un error aproximadamente medio al considerar juntas generales, autonómicas y europeas. **GAD3** registró el menor error medio general (aproximadamente 1,5 puntos por partido); siguieron IMOP, Sociométrica y Sigma Dos.
- El **promedio de EL PAÍS** tuvo error medio similar al de GAD3 y fue más preciso que la encuestadora mediana en las 19 elecciones en que se publicó. Esta regularidad sugiere evaluar una combinación robusta de fuentes; no acredita que se conozca ni replique la cocina individual de 40dB.
- En el estudio se considera la **publicación de microdatos** como criterio específico de transparencia. No debe confundirse publicación de respuestas individuales con acceso a todas las decisiones internas de estimación.
- Los autores advierten que diferencias pequeñas no son estadísticamente concluyentes y que su evaluación **no mide** dependencia entre casas (*herding*) ni capacidad de detectar cambios antes del consenso.
- El artículo define error absoluto medio por partido, con candidaturas de al menos el 2 % y, para las generales, presentadas en más de diez provincias. Mide también sesgo agregado entre bloques, con categorías y exclusiones explícitas. Estas decisiones deben reproducirse como **una evaluación de referencia documentada**, sin confundirla con otros denominadores o métricas del Motor 29N.

**Criterio para nuestro trabajo:** evaluar por separado generales y otras convocatorias, documentar los horizontes temporales y contrastar la capacidad de la cocina sobre microdatos con un promedio robusto y con la estimación publicada *sin contar dos veces 40dB*. La referencia de Llaneras no es validación propia ni justifica reasignar automáticamente pesos por reputación.

## 1 ter. Contraste agregado previo a recibir las entrevistas (etapa superada)

**Esta fase inicial examinó solo cifras publicadas. Posteriormente se recibieron y analizaron los microdatos originales; sus resultados figuran en la sección siguiente.** Se revisaron las páginas con intención directa, estimación y no respuesta de los informes originales: barómetro mensual del **5 de octubre** (pp. 8 y 13) y flash del **9 de octubre** (pp. 5 y 16). Inicialmente no estaban disponibles los ZIP; después los aportó el usuario y se analizaron localmente. La web publica agregados, nunca entrevistas individuales.

El módulo `contraste-40db.mjs` conserva los valores transcritos y calcula:
- `D = 100 - (nulo + no votaría + no lo sabe + no contesta)` puntos de la población entrevistada; incluye **voto en blanco** entre los declarantes de voto válido. Los datos redondeados dan **81,2 %** el 5/10 y **83,1 %** el 9/10.
- `directa_valida = directa / D * 100`, una **normalización mecánica**, no una estimación electoral.
- `residuo = estimacion_40db - directa_valida`, brecha que **no permite recuperar por sí sola** un coeficiente interno, ni imputar causalmente efecto a recuerdo, simpatía o propensión.

| Partido | 5/10 directa | 5/10 normalizada | 5/10 estimación | Brecha | 9/10 directa | 9/10 normalizada | 9/10 estimación | Brecha |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| PP | 19,6 | 24,14 | 31,6 | +7,46 | 20,5 | 24,67 | 31,9 | +7,23 |
| PSOE | 22,4 | 27,59 | 27,4 | −0,19 | 23,0 | 27,68 | 28,1 | +0,42 |
| Vox | 19,1 | 23,52 | 18,4 | −5,12 | 20,1 | 24,19 | 18,9 | −5,29 |
| Sumar | 4,4 | 5,42 | 5,6 | +0,18 | 4,2 | 5,05 | 5,3 | +0,25 |

Valores en porcentaje; brechas en puntos porcentuales. Las pequeñas diferencias están afectadas por redondeos de los originales. **Patrón descriptivo:** la normalización por denominador no explica la brecha positiva del PP y negativa de Vox; el patrón aparece en dos informes muy cercanos, que no constituyen validaciones electorales independientes.

**Situación posterior:** ya se reconstruyó el voto directo ponderado, se verificó ponde, se contrastó recuerdo y simpatía y se ensayaron reponderaciones sobre matrices reales. Ninguno de estos ejercicios justifica por ahora modificar el Motor 29N.

## 1 quater. Auditoría realizada con 4.800 entrevistas originales

Se recibieron los tres ZIP y se verificaron sus SHA-256. Las matrices DTA contienen **2.000 + 2.000 + 800 entrevistas**. El ponderador `ponde` permite reproducir la intención directa publicada, una vez normalizado el denominador; no permite recuperar por sí mismo el algoritmo final de estimación.

- **Enero 2026 (campo 29/12/2025–05/01/2026):** PP 18,62 %, PSOE 21,30 %, Vox 17,38 % sobre todas las personas entrevistadas; voto válido declarado 81,21 %; n efectivo Kish 1.935.
- **Octubre mensual (25–28/09/2026):** PP 19,62 %, PSOE 22,37 %, Vox 19,08 %; voto válido declarado 81,14 %; Kish 1.816.
- **Flash (07–08/10/2026):** PP 20,47 %, PSOE 22,98 %, Vox 20,06 %; voto válido declarado 83,02 %; Kish 785.

**Experimento de recuerdo:** el recuerdo ponderado del PP supone el 29,69 % de los recuerdos de PP, PSOE, Vox y Sumar en octubre, frente al 36,98 % de sus resultados de 2023 normalizados entre esas cuatro candidaturas. Vox representa el 19,53 % de recuerdos frente al 13,85 % de referencia. Una calibración completa hipotética mueve el voto válido declarado de octubre de **PP 24,17 → 28,84 %**, **Vox 23,52 → 19,93 %**, **PSOE 27,57 → 24,83 %** y **Sumar 5,38 → 6,54 %**. La estimación publicada fue 31,6 / 18,4 / 27,4 / 5,6 % respectivamente. La calibración acerca algunas cifras y aleja otras. **No reproduce la fórmula de 40dB ni demuestra más acierto electoral**.

**Escenario conjunto:** entre los 800 entrevistados del flash, Sumar/Frente Amplio y Podemos tienen juntos un 6,05 % de intención directa ponderada si concurren separados, frente al 8,34 % de una candidatura unitaria; son dos respuestas hipotéticas dentro de la misma muestra, no una ganancia electoral observada.

Los [agregados públicos con variables y huellas SHA-256](../data/microdatos/40db-auditoria-2026.json) no contienen entrevistas individuales; la pantalla Cocina permite cambiar entre directa ponderada y la calibración de recuerdo. Los datos completos permanecen fuera del repositorio.

**Nueva fuente para evaluación histórica:** [microdatos preelectorales de 40dB del 3 de julio de 2023](https://elpais.com/espana/2023-07-03/consulte-todos-los-datos-internos-de-la-encuesta-de-el-pais-publicada-este-3-de-julio.html), anteriores al escrutinio conocido del 23J. Todavía no se han descargado sus ZIP ni se ha ejecutado esa validación.


## 1 quinquies. Prueba retrospectiva sobre 4.800 entrevistas 40dB anteriores al 23J de 2023

Los ZIP originales aportados por el usuario contienen 800 entrevistas de una flash (publicada el 5/06/2023), 2.000 del barómetro (19/06/2023) y 2.000 del preelectoral (3/07/2023). Incluyen ponderador `ponde`, voto directo, simpatía, probabilidad declarada de acudir y recuerdo del voto **de 2019**. El resultado de contraste es el escrutinio definitivo de 2023, que entonces todavía no se conocía.

**MAE frente al 23J en PP, PSOE/PSC, Vox y Sumar, puntos porcentuales:**

| Procedimiento | 5 junio | 19 junio | 3 julio |
| --- | ---: | ---: | ---: |
| Estimación publicada 40dB | 2,43 | 1,63 | 2,01 |
| Voto directo ponderado | 2,85 | 3,20 | 2,93 |
| Directo ponderado × participación declarada | 3,01 | 3,03 | 2,72 |
| Imputación simple a indecisos por simpatía | 2,96 | 3,02 | 2,67 |
| Calibración parcial de recuerdo de 2019 | 3,72 | 4,32 | 4,16 |

El módulo `validacion-40db-2023.mjs` expone además las recetas sin ponderación y las combinaciones experimentales. El JSON en `data/microdatos/40db-retrospectiva-2023.json` conserva tamaños, fechas de campo, preguntas originales, hashes y el error de cada procedimiento. Solo se publican **agregados**, no registros originales.

**Interpretación:** la estimación publicada por 40dB se aproximó más a las cuatro cifras oficiales que el cálculo directo ponderado en las tres olas. La corrección exploratoria del recuerdo 2019 empeoró el MAE en las tres, pero esto no descarta otras técnicas de calibración correctamente documentadas. Simpatía y participación presentan resultados variables entre fechas. **Una elección = una unidad de validación; estas tres encuestas no equivalen a tres elecciones independientes**. Las olas terminan semanas antes del escrutinio, durante las que también pudo cambiar la intención de voto. No podemos usar la elección 2023 para elegir parámetros y declararla al mismo tiempo una validación futura.

No se ha cambiado ninguna ponderación ni receta del Motor 29N. El objetivo es identificar hipótesis de investigación, no copiar una fórmula privada que no está publicada.

## 2. Auditoría local, antes de cualquier cocina

Después de descargar manualmente el ZIP desde la fuente:

```sh
python scripts/inspeccionar_40db.py 40db-2026-10-flash /ruta/a/2026_10_08_barometro_flash_descargables.zip --salida auditoria-local.json
```

La herramienta solo registra SHA-256, nombres, tamaños y tipos de archivos del ZIP sin descomprimir ni leer respuestas. Rechaza rutas peligrosas y archivos cifrados. El manifiesto no contiene datos individuales. Guardar las matrices en privado y revisar el cuestionario original antes de leerlas; no inferir etiquetas a partir de la posición de las columnas. La auditoría local no equivale a validación estadística.

## 3. Programa de recetas, separadas del pronóstico principal

| Experimento | Operación prevista | Qué debe comprobarse |
| --- | --- | --- |
| A. Directa ponderada | Intención de voto entre respuestas válidas; numerador y denominador explícitos | Peso oficial, codificación, blanco, abstención y no respuesta |
| B. Simpatía | Imputación declarada solo a indecisos elegibles, con tasa observada de elegibilidad | Doble cuenta, simpatía faltante, sensibilidad de imputaciones |
| C. Recuerdo | Calibración por resultado electoral de referencia, regularizada y con límites a pesos extremos | Sesgo de recuerdo, población base, cambio de candidaturas |
| D. Propensión | Uso de escala de probabilidad declarada de votar, calibrada con datos históricos | Deseabilidad social y abstención real |
| E. Transferencias | Matriz condicionada recuerdo × voto actual; intervalos por tamaño de celda | Coaliciones territoriales, no respuesta, efectividad muestral |
| F. Multinivel | Estimación geográfica con regularización parcial y covariables documentadas | Validación por territorio, identidad de candidaturas, cobertura |
| G. Agregación robusta | Peso de casa, recencia, tamaño efectivo, dependencia entre oleadas y error común | Evitar doble conteo y ajuste por error de una sola elección |
| H. Incertidumbre | Correlación entre partidos y provincias, colas pesadas y calibración histórica | Cobertura real de intervalos y escaños, no solo Monte Carlo |

Los ajustes A–F forman una **capa experimental de cocina de entrevistas**; G–H son operaciones del **motor de agregación y pronóstico**. No sumar una estimación reconstruida con microdatos 40dB al promedio que ya incluye la estimación publicada de 40dB: ambas proceden de la misma muestra.

Se conserva la geografía de 52 circunscripciones, el voto blanco en el denominador de votos válidos y la separación entre partidos y candidaturas provinciales. Los acontecimientos son observaciones para contraste antes/después, no multiplicadores automáticos de voto.

## 4. Evaluación predictiva, no selección retrospectiva de la receta más vistosa

- **Congelar fecha:** usar únicamente encuestas, microdatos y documentación *disponibles en el corte* de la elección evaluada. Respetar la veda.
- **Separar convocatorias:** abril y noviembre de 2019 son elecciones distintas; varios cortes de julio de 2023 no se convierten en elecciones independientes.
- **Aprender y evaluar en elecciones distintas:** la elección reservada no puede usarse para elegir factores, parámetros, correlaciones, casas ni distribución territorial. Evitar pruebas con filtración temporal.
- **Comparar línea base y recetas:** MAE de voto por partido y elección, error provincial, escaños, calibración/anchura de intervalos y, si se publican probabilidades, puntuaciones probabilísticas apropiadas.
- **Registrar cobertura:** partidos realmente comparables, estudios excluidos, pesos y tamaño efectivo, incertidumbre del propio backtesting. No declarar mejora con pocos casos o sin intervalos.
- **Puerta de publicación:** un experimento solo puede sustituir la referencia si se documenta mejora estable fuera de muestra sobre la línea base, no empeora de forma significativa la cobertura y quedan trazadas las decisiones.

## 5. Situación concreta del repositorio

- `modelo/motor/pronostico.py` ya modela tendencia, error de industria, correlación de bloques y variación provincial. Por tanto, no sería correcto decir que el Observatorio «solo promedia».
- `modelo/motor/ablaciones.py` permite contrastes de sensibilidad, que **no** prueban precisión histórica.
- `modelo/motor/validacion_publica.py` evalúa cortes temporalmente, aunque solo dispone de una convocatoria suficiente para la auditoría principal.
- Los CIS 3242 y 3263 permiten estudiar empíricamente recodificaciones de 2019. Los datos de 40dB de 2026 aportarán contemporaneidad y contraste entre casas, pero por sí solos no aportan un resultado electoral futuro con el que validar.
- El estudio 40dB flash figura en data/polls.json; los tres ZIP de 2026 ya tienen agregados auditados en data/microdatos/40db-auditoria-2026.json, sin convertir ninguna receta experimental en pronóstico operativo.

**Siguiente puerta de trabajo:** aprovechar microdatos preelectorales de 40dB de julio de 2023, cuyo resultado del 23J es conocido, para una evaluación temporal estricta. No seleccionar coeficientes con 2023 y declarar la misma elección una validación independiente.

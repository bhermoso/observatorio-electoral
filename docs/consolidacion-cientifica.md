# Consolidación científica — 12 de noviembre de 2026

## Resultado y alcance

Se incorpora un banco reproducible de **seis elecciones generales** (2011, 2015, 2016, abril y noviembre de 2019, 2023), con cortes de **90, 60, 30, 15 y 7 días**, selección temporal estricta y entrenamiento expansivo por convocatoria. Las predicciones no reciben el resultado de la elección objetivo. Los resultados oficiales solo se leen para puntuar después de predecir; las correcciones de casa solo aprenden de resultados anteriores ya publicados en la fecha de corte.

El soporte primario común es **PP/PSOE**, sin convertir sus porcentajes en una composición de dos partidos. Las ampliaciones tienen soporte propio: Ciudadanos (4 elecciones/20 cortes), Vox (3/15), IU (1/5), UPyD (1/5) y Sumar (1/3). Los dos cortes iniciales sin suficientes casas para Sumar se registran como no evaluables. No se inventan equivalencias entre UP, Podemos y Sumar. Los comparadores reciben las mismas entradas por candidatura/corte. La vista pública permite filtrar y recalcula los errores desde las predicciones, sin promediar métricas de bases distintas.

**No se ha demostrado que la mezcla sea superior y no se cambia el principal por ese motivo.** Las mejoras de una candidatura pueden acompañarse de empeoramientos de otra. El archivo JSON conserva también los resultados negativos, errores firmados, cobertura, anchura, interval score y sensibilidad. Ningún número de cortes transforma seis convocatorias en treinta elecciones independientes.

## Inventario contrastado

| Componente | Implementado y probado | Evaluación y límite |
|---|---|---|
| Puerta de fuentes del principal | Sí: originales, campo y publicación; reemplazos seleccionados después del corte temporal | Fecha desconocida ya no se imputa en producción ni en el historial v5 |
| Tendencia latente por partido y efectos de casa | Sí: paseo diario, ancla y priors; pruebas sintéticas y temporales | Comparador nacional retrospectivo parcial; no validación del simulador completo |
| Mezcla igual de tres variantes | Sí en Motor 29N | Peso igual es una decisión de modelo. No hay evidencia suficiente para declararlo óptimo |
| Corrección histórica de casas | Sí: entrenamiento expansivo en backtest; 23J en principal actual | No usa el resultado objetivo; no mejora uniformemente todas las candidaturas |
| Industria y dependencia | Sí: error común, escala por tamaño, factor de bloque | 2,2 pp/rho 0,5 del principal no están independientemente calibrados. El ensayo parcial usa hipótesis 2,0 pp, sin reutilizar la calibración 23J como evidencia de ese mismo 23J |
| Normalización conjunta y recortes | Sí: se añaden frecuencias de recorte, residual mínimo y factores de renormalización por variante | Diagnóstico cuantitativo; no sustituye una validación composicional multielectoral |
| Traslado proporcional/uniforme y D'Hondt legal | Implementados, con sensibilidad existente y pruebas | No se usan provincias de 2023 para simular 2011. Faltan bases provinciales previas homologadas para validar históricamente los escaños |
| Microdatos y cocina secuencial | Scripts y agregados disponibles, pruebas de códigos/denominadores | Experimentales; no se promueven al motor por MAE sobre una misma elección |
| Cohorte común de microdatos | Nuevo contraste agregado identificable para 3411, 3415, 3582 | Misma elegibilidad de PROBVOTO válida; n exacto y Kish no recuperables del cubo. Recuerdo/indecisos requieren cruces no conservados |
| Acontecimientos, campos solapados y placebos | Mecanismos y pruebas existentes; huelga 11/11 documentada | Asociación temporal, no causalidad; sin salto automático ni estimación con campo que incluya el suceso |
| Primera fuerza y neutralidad | Corregido el empate que favorecía al primer índice; pruebas de permutación | `primero` = primera fuerza exclusiva; `primero_o_empate` conserva el caso compartido |
| Historial | Reconstrucción tipada/versionada y copia de v4 | No se presenta como registro de predicciones emitidas. Solo las capturas observadas son evidencia de publicación |

## Protocolo y comparadores

Se comparan última publicación (si hay empate de fecha, media), última encuesta de cada casa con pesos iguales, media por recencia (semivida 15 días), media con corrección de casa, tendencia sin corrección y mezcla histórica nacional. Las medias usan 30 días; la tendencia, 180. Es parte de la definición de cada algoritmo y está expuesto en el protocolo; todos parten del mismo conjunto documental disponible al corte. Cada instituto aporta una última publicación al promedio; el modelo de tendencia limita la dominancia de series repetidas de una casa mediante su varianza.

La mezcla histórica es un **comparador nuevo y diferente del principal 29N**: generaliza el entrenamiento a elecciones anteriores, pero no reproduce su calibración fija 23J, desplazamiento de industria, normalización conjunta ni geografía. El principal exacto no puede aplicarse retrospectivamente a 2011 con correcciones y mapa de 2023 sin fuga de información. Tampoco sería una validación independiente usar 23J para calibrarlo y puntuarlo sobre ese mismo 23J.

Los hiperparámetros se fijan para este protocolo antes de consultar sus resultados; no se ejecuta una búsqueda para elegir ganador. **El protocolo se construye en 2026, no está preregistrado antes de esas elecciones**: hay riesgo de selección de diseño retrospectiva. Por eso el ensayo no alcanza validación independiente. Se utiliza entrenamiento cronológico, más estricto temporalmente que un LOEO simétrico que permitiera entrenar con elecciones futuras. El objetivo propio y las elecciones futuras no entran en la corrección. Los tests mutan el resultado de prueba y verifican que las predicciones permanecen iguales.

Las métricas son MAE, RMSE, sesgo, cobertura marginal al 90 %, anchura e interval score. Se guardan por elección, horizonte y candidatura. El intervalo bootstrap de MAE remuestrea elecciones completas (10.000 réplicas, semilla 20261112); con seis unidades su precisión es limitada. No se estiman probabilidades de mayoría calibradas desde dos partidos. El tamaño efectivo por casa se refiere a pesos de recencia y **no** al tamaño efectivo de personas entrevistadas ni al número de elecciones independientes.

La sensibilidad a 7 días cambia tau (0,10/0,20), industria (1,5), ventana (90 días) y exclusión de muestras imputadas. Se conservan todos los escenarios; no se escoge retrospectivamente el que mejor predice. Una n no publicada se marca como supuesto (1.000 para verosimilitud), y la sensibilidad permite excluirla. La incertidumbre de las medias usa un envolvente predictivo declarado; no se confunde con error muestral dividido por raíz del número de encuestas.

## Fuentes y trazabilidad

`data/historico/multieleccion.json` contiene agrupaciones oficiales, denominadores, referencias de publicación, identificadores de fila, huellas y ledger de exclusión. Las tablas de Wikipedia son secundarias: se conserva el HTML completo comprimido con atribución CC BY-SA; las referencias enlazadas no se convierten por ello en originales verificados. No se imputan fechas de publicación con «fin de campo + 2». Tampoco se utilizan fechas de archivo o consulta como publicación.

Los resultados proceden de BOE/JEC, cuadros I y II. La corrección BOE-A-2012-6674 añade 49 votos válidos en 2011: se usa **24.348.886**, sin alterar PP/PSOE. Se conserva la transcripción del PDF y su huella original. Las agrupaciones territoriales (PSC, PP-PAR, PP-Foro, etc.) se declaran para cada elección.

`modelo/validacion/multieleccion.json` contiene predicciones, errores, entradas admitidas y excluidas por corte, elecciones de entrenamiento, parámetros, semillas, versiones de bibliotecas y SHA-256 de datos/código. La ejecución puede señalar árbol con cambios por artefactos generados; las huellas exactas son la referencia verificable. El manifiesto operativo incluye commit, hashes, semillas por variante, número de simulaciones y parámetros. No se publica ninguna fila de entrevista.

`modelo/registro/publicados/` conserva la publicación realmente observada al comenzar este trabajo (URL, fecha de captura, metadatos y huella). `modelo/registro/reconstrucciones/v4-9bad6e6.json` conserva el historial previo como reconstrucción, sin convertirlo en predicciones históricamente emitidas. La versión 5 marca expresamente esa naturaleza y supone una discontinuidad de reglas: publicación estricta y tratamiento simétrico de empates.

## Microdatos: qué puede medirse ahora

`data/microdatos/cohorte-comun.json` compara PESO frente a PESO × PROBVOTO/10 **entre las mismas entrevistas con probabilidad explícita válida**. No elimina adicionalmente a quienes carecen de recuerdo. Expone base total, masa de candidatura, base de candidaturas y porcentajes sobre ambas bases. El cambio del porcentaje se descompone algebraicamente en cambio de numerador y efecto del denominador. Eso evita atribuir al peso lo que procede de cambiar la base.

El cubo agregado no conserva el número de participantes con PROBVOTO válida ni la suma de pesos cuadrados. Esos valores se escriben `null`, sin inventar Kish. Tampoco contiene los cruces necesarios para aislar recuerdo, transferencia e indecisión. Los dos estudios 3411/3415 son una sola elección; 3582 aún no tiene resultado futuro observable. La reconstrucción adaptada de 2019 permanece experimental y no se presenta como réplica homologada de los mismos componentes. Los originales de CIS utilizados en trabajos previos no están en este espacio de ejecución; no se han reconstruido entrevistas desde agregados ni cambiado su custodia para simular una validación nueva.

## Niveles alcanzados

1. **Funcional**: código ejecutable y salida comprobable.
2. **Auditable**: trazabilidad operativa, parámetros, fuentes, semillas e historial tipado. Nivel del Motor 29N completo.
3. **Evaluado retrospectivamente**: seis comparadores nacionales, soporte PP/PSOE en seis elecciones y ampliaciones identificadas por candidatura. No equivale a evaluar todo el motor.
4. **Validado independientemente**: **no alcanzado**. Falta evidencia no usada en diseño/calibración, contraste íntegro de fuentes originales y validación de geografía/probabilidades conjuntas. No se ha denominado validado al sistema por pasar tests.

## Ejecución reproducible

```sh
python -m pip install -r requirements-ciencia.txt
OPENBLAS_NUM_THREADS=1 OMP_NUM_THREADS=1 python scripts/validar_multieleccion.py
python scripts/auditar_cohorte_comun.py
node scripts/export-csv.mjs
npm test
python -m unittest discover -s tests -p 'test_*.py'
OPENBLAS_NUM_THREADS=1 OMP_NUM_THREADS=1 python -m unittest discover -s modelo/tests -t .
OPENBLAS_NUM_THREADS=1 OMP_NUM_THREADS=1 python -m modelo --n 1500
python scripts/procesar_microdatos.py
npm run build
```

Las variables de BLAS limitan hilos, no alteran el algoritmo. El principal usa 750 simulaciones por variante (2.250 conjuntas) con `--n 1500`; el historial usa 500 por variante y día. Esas cantidades reales se registran, en lugar de llamar «1.500» a toda la mezcla. Las comparaciones nacionales usan solución analítica e intervalos exactos de la mezcla gaussiana, sin ruido Monte Carlo en sus cuantiles.

Las cifras y comprobaciones finales, incluido antes/después, se recogen en `modelo/validacion/comparacion-versiones.json` y en la descripción de la revisión. Los resultados nacionales completos están en `modelo/validacion/multieleccion.md` y `.json`.

# Alta cocina demoscópica: fuentes 40dB y validación predictiva

**Estado (4 de noviembre de 2026): fuentes localizadas; contenido de los ZIP no inspeccionado.**
Esta incorporación abre el acceso a fuentes primarias recientes y un procedimiento de auditoría de procedencia. **No añade una receta ganadora, no cambia el Motor 29N y no autoriza a publicar una mejora de acierto.**

## 1. Fuentes primarias, públicas, pero no necesariamente de libre redistribución

EL PAÍS publica enlaces gratuitos a ZIP con cuestionarios, documentación metodológica, cruces y matrices de respuestas de 40dB:

- Barómetro del 12 de enero de 2026: https://elpais.com/espana/2026-01-12/consulte-todos-los-datos-internos-de-la-encuesta-de-el-pais-cuestionarios-cruces-y-respuestas-individuales.html
- Barómetro del 5 de octubre de 2026: https://elpais.com/espana/2026-10-05/consulte-todos-los-datos-internos-de-la-encuesta-de-el-pais-cuestionarios-cruces-y-respuestas-individuales.html
- Flash electoral del 9 de octubre de 2026: https://elpais.com/espana/2026-10-09/consulte-todos-los-datos-internos-de-la-encuesta-de-el-pais-cuestionarios-cruces-y-respuestas-individuales.html

Los enlaces exactos a los ZIP están en `data/microdatos/fuentes-40db.json`. El servidor de publicaciones anuncia un archivo ZIP en cada enlace, pero la revisión actual no ha logrado descargarlo. No se ha verificado aún qué variables y ponderaciones contiene cada matriz, ni sus códigos, universo o permisos de reutilización.

No se suben respuestas individuales a GitHub o GitHub Pages. Las condiciones de acceso de una publicación **no equivalen** a una licencia abierta de redistribución. Mantener fuente, atribución y restricciones del titular.

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
- El estudio 40dB flash del 9 de octubre figura en `data/polls.json`; se enlaza su ZIP original, y su catálogo lo seguirá señalando como **pendiente de procesamiento**, no como receta lista.

**Siguiente puerta de trabajo:** inspeccionar matrices y diccionarios de 40dB, comprobar pesos y universos, construir una tabla de equivalencias estudiada y reejecutar las recetas sin publicar filas de entrevistas. Solo después contrastar con elecciones históricas independientes y considerar cambios al motor.

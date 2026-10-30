# Registro de acontecimientos

`data/events.json` recoge hechos documentados, con identificador estable, tipo `documented-event`, fecha civil (`YYYY-MM-DD`), precisión de día, lugar, ámbito de seguimiento, categoría, descripción neutral, fuentes con autor/editor y fecha de publicación, notas y fecha de verificación. El ámbito de seguimiento no atribuye exposición al suceso a todos los electores.

Se aplica el mismo criterio de evidencia a hechos favorables o desfavorables para cualquier formación. Una fuente original institucional o periodística contrastada debe respaldar el hecho y la fecha. Un perfil de redes sociales por sí solo no basta. Registrar las discrepancias y los enlaces inaccesibles. Eliminar rumores y separar responsabilidades alegadas de conclusiones firmes. No incluir datos personales, balances provisionales innecesarios o coeficientes partidistas.

El registro inicial contiene el accidente ferroviario de Urda del 28 de octubre de 2026, contrastado en las publicaciones originales de EFE y EL PAÍS. El comunicado de Renfe encontrado mediante búsqueda no se presenta como comprobado: devolvía 404 al abrirlo.

## Cruce con trabajo de campo

- Anterior: el campo termina antes del día del acontecimiento.
- Posterior: el campo empieza después de ese día.
- Coincidente: el intervalo toca ese día, incluidos sus extremos. Sin horas individuales no se puede saber qué respuestas se recogieron antes o después del momento del suceso.

La publicación no interviene en esta clasificación: una encuesta publicada después puede haber recogido todas sus respuestas antes. Se incluyen intervalos de campo que solapan la ventana elegida (14, 30 o 90 días a cada lado), incluidos los límites. Las barras se recortan a esa ventana; no indican número de entrevistas por día.

La selección es temporal y conserva el ámbito de cada estudio. La comparación descriptiva exige igualdad exacta de instituto, método conocido, ámbito, universo y escenario. Toma el último campo completamente anterior y el primero completamente posterior de cada grupo y compara solo etiquetas de partido idénticas. No fusiona coaliciones por parecido de nombre ni sustituye porcentajes ausentes por ceros. La selección exacta es conservadora y puede omitir estudios cuya equivalencia exigiría revisión manual.

La diferencia en puntos porcentuales no estima un efecto causal ni su significación. También pueden cambiar composición de la muestra, cuestionario, ponderación y contexto. No se combinan encuestas originales con agregadores. Un análisis causal requeriría un diseño adicional, controles adecuados, incertidumbre y una hipótesis previa; la coincidencia de fechas no lo sustituye.

La exportación incluye el acontecimiento, fuentes, estudios seleccionados, ventana, clasificación y pares descriptivos. Su tipo es `event-context-analysis` y declara `causalEffectEstimated:false`. El laboratorio conserva escenarios independientes y no recibe ajustes de voto de este registro.

## Actualización

La revisión diaria debe leer este documento, admitir nuevos hechos con estos criterios y revisar posibles estudios posteriores. Actualizar JSON y notas cuando haya evidencia; no cambiar solo una fecha para aparentar una revisión. Ejecutar pruebas y compilación, comprobar la cronología en móvil y publicar únicamente en el repositorio del Observatorio. No avisar si no hay cambios relevantes. Las limitaciones de la ejecución programada se describen en [mantenimiento](maintenance.md).

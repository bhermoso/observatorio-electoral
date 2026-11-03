# Mantenimiento y actualización revisada

## Programación

Comprobación del 3 de noviembre de 2026: el repositorio configura `.github/workflows/vigilancia-encuestas.yml` para descubrir publicaciones diariamente a las 07:40 UTC (08:40 en Madrid en invierno; 09:40 en verano). El programa no modifica `data/polls.json`: prepara candidatos para revisión editorial. No se encontraron ejecuciones de vigilancia entre las ejecuciones programadas disponibles consultadas, por lo que la configuración no demuestra que esté funcionando.

La revisión cada 60 minutos mencionada anteriormente pertenecía al chat previo. Su estado actual no se ha podido confirmar; no debe darse por activa. La publicación programada de GitHub Pages reconstruye la web con los datos existentes y tampoco descubre ni incorpora encuestas. La actualización requiere verificar originales, modificar los datos y superar las pruebas antes del despliegue.

No debe notificar si no hay novedades significativas. Debe avisar si se incorporan o corrigen datos relevantes, falla la actualización o se necesita una intervención. No se envían mensajes a institutos, periodistas ni otros terceros.

## Repositorio y límites de actuación

- Directorio activo: la carpeta de trabajo de este chat, dedicada al Observatorio Electoral.
- Único remoto autorizado: `https://github.com/bhermoso/observatorio-electoral.git`.
- Único sitio: `https://bhermoso.github.io/observatorio-electoral/`.
- Proyectos ajenos excluidos: Aula de Salud Comunitaria, Compás NG y cualquier otro repositorio.
- Antes de editar: comprobar `git status`, remoto e instrucciones; preservar cambios ajenos, sin reset ni force push.

## Política de fuentes

Se admiten institutos con identidad verificable, organismos públicos, universidades, centros de investigación y la publicación original del medio comitente. La calidad se evalúa por fuente primaria, universo, muestra, método, fechas, cuestionario y transparencia del estudio, no por número de seguidores o afinidad política.

Un perfil de X u otra red puede ayudar a descubrir un original; no basta para validar cifras. Un comentario de un experto no equivale a una encuesta. Una mención institucional no garantiza que exista una estimación electoral actual.

Fuentes prioritarias: CIS, 40dB./EL PAÍS-SER, GAD3/ABC-Vocento, Metroscopia, IMOP, DYM, Ateneo del Dato, Sigma Dos, GESOP/Prensa Ibérica, IESA-CSIC, CADPEA/UGR, ICPS, CEO y Fundación CENTRA. El directorio documentado se conserva en `data/references.json`.

- GAD3 es la fuente a revisar para los sondeos de Michavila.
- CADPEA y el laboratorio de la UGR son productores/recursos de investigación; CATI es el modo de entrevista, no otro instituto.
- ICPS y GESOP se registran por separado como entidad del estudio y empresa de campo cuando corresponda. No se duplica el estudio.
- IESA-CSIC, CENTRA y CADPEA no son nombres intercambiables.
- Mantener elecciones nacionales, autonómicas y locales en sus ámbitos. Un sondeo del Parlamento andaluz no alimenta directamente una estimación del Congreso.
- Los promedios y modelos de Llaneras u otros analistas son referencias externas fechadas. Nunca cuentan como nuevas entrevistas ni se añaden a una media junto a sus fuentes originales.

## Primera actualización y decisiones pendientes

La carga inicial ampliada contiene ocho estudios de seis institutos, con seis publicaciones de octubre de 2026. Los porcentajes y escaños se transcriben solo donde se han podido comprobar. ICPS, IESA, CADPEA, GESOP y CENTRA quedan documentados en el directorio; esto no aumenta el número de encuestas cargadas.

Las limitaciones concretas, incluida la discrepancia de fechas en IMOP y la cifra de Otros de GAD3, están en las fichas. No rellenarlas con datos de recopiladores para conseguir una tabla completa.

## Flujo por ejecución

1. Leer `docs/poll-archive.md` y los registros existentes. Revisar las fuentes de los institutos y de sus comitentes. Un 403, un timeout o una publicación retirada se registra como limitación, sin inventar resultados ni eludir restricciones.
2. Identificar estudio, instituto, comitente, empresa de campo, elección, territorio, escenario y denominadores. Deduplicar muestras y revisiones de un mismo informe.
3. Verificar cifras en el documento original. Conservar punto, mínimo y máximo por separado. Ausente no es cero. No recalcular escaños desde porcentajes nacionales ni mezclar escenarios alternativos del mismo estudio.
4. Registrar evidencia, localización, fecha de revisión y discrepancias. No redistribuir textos completos, microdatos restringidos o PDF sin condiciones adecuadas. Enlazar los originales y conservar huellas cuando proceda.
5. Actualizar `data/polls.json`, los CSV, la cobertura visible y el historial. Evitar commits que solo cambien una fecha.
6. Ejecutar `node scripts/export-csv.mjs`, `npm test` y `npm run build`. La compilación también valida el esquema y la cobertura.
7. Revisar búsqueda por instituto, detalle, ausentes, puntos, horquillas, acceso a fuentes y visualización móvil. Publicar al remoto autorizado y comprobar Actions y respuesta HTTP antes de afirmar que el cambio está publicado.

La vista `#analisis` calcula medias y proyecciones en el navegador desde el archivo publicado: una nueva encuesta se incluye cuando cumple fecha, ventana, ámbito y deduplicación por instituto. Leer [sus supuestos](analysis.md). Mantener separadas las cifras del instituto y las del modelo; nunca etiquetar «Resto 2023» como candidaturas actuales ni atribuir intervalos de confianza a los puntos de escaños.

## Acontecimientos y encuestas

Un accidente, sentencia, crisis o decisión política se registra con fecha y fuente comprobada, sin penalizaciones o bonificaciones electorales automáticas. Distinguir fecha de entrevistas de fecha de publicación. Comparar estudios equivalentes y no afirmar causalidad por proximidad temporal. Un dato ya recogido en una encuesta no debe recibir además una corrección manual por el mismo supuesto efecto.

El registro está en `data/events.json` y la vista pública en `#contexto`. Cada revisión diaria debe leer [criterios de acontecimientos](events.md), incorporar hechos documentados que cumplan esos criterios y revisar si hay encuestas con campo posterior. No utilizar borradores, rumores ni fuentes inaccesibles como si estuvieran verificados. La compilación valida también este registro. Mantener el análisis temporal separado de los pesos del laboratorio.


## Botón de actualización

En el archivo de encuestas, «Actualizar encuestas» abre la vigilancia de GitHub. El propietario inicia sesión y pulsa Run workflow para lanzar la búsqueda. La web consulta el estado público al abrir el archivo y al volver a la pestaña. No almacena credenciales ni afirma haber iniciado una ejecución por abrir un enlace. «Cargar últimas encuestas publicadas» recupera el JSON sin caché, valida el archivo y refresca las vistas; conserva los datos anteriores ante un error. La búsqueda genera candidatos y no publica cifras sin verificación.


## Ciclo de incorporación verificada (3 de noviembre de 2026)

La portada de Encuestas muestra la cola de GitHub Issues creada por el workflow de vigilancia. **Candidato no significa encuesta incluida**. El botón de búsqueda solicita el workflow autenticado; la cola permite examinar enlaces y el estado. La validación de contenido sigue siendo editorial: origen primario, fechas, ficha técnica, ámbito nacional, variables y porcentajes.

Para incorporar un estudio, crear una rama, introducir su ficha documentada en `data/polls.json`, sin alterar originales ajenos, y abrir un PR. El workflow `auditoria-encuestas.yml` compara el archivo con la rama base, bloquea fechas o porcentajes inválidos, IDs duplicados, posibles muestras repetidas, fuentes inseguras y supresiones no revisadas. Adjunta `auditoria.md` y `auditoria.json`. **No certifica la autenticidad de una fuente externa**: hace falta comprobar la publicación original.

Cuando el cambio validado se integra en `main`, el workflow `pages.yml` ejecuta pruebas, recalcula `python -m modelo` (Motor 29N), procesa microdatos agregados y publica el sitio. Un fallo de pruebas impide desplegar. En la sección Encuestas se recargan los registros publicados sin caché, y los resúmenes del dashboard se regeneran al acceder a su vista.

No se crea una encuesta a partir de un titular, no se adivinan datos ausentes y no se incluye un estudio regional en la estimación nacional sin tratamiento territorial explícito. La auditoría no sustituye la revisión de sesgos, microdatos ni recetas del motor.

## Actualización de datos en el mismo workflow de vigilancia

El workflow `vigilancia-encuestas.yml`, programado diariamente o lanzado con **Run workflow**, ahora también procesa `data/ingesta/validadas.json`: documentos con campos ya contrastados por una fuente original. Las nuevas fichas se incorporan a `data/polls.json` si pasan validaciones de integridad, duplicados y fechas; se regeneran CSV, se ejecutan pruebas, se confirma el cambio en `main` y se lanza `pages.yml` para recalcular el Motor 29N.

**Límite importante:** la búsqueda RSS sigue detectando solo candidatos, y NO alimenta por sí misma la bandeja `validadas.json`. El sistema no aprueba noticias no estructuradas; los estudios que no tienen una ficha validada no se importan. Por tanto, «Run workflow» puede terminar correctamente con cero altas. Incorporación real confirmada el 3/11/2026: Hamalgama Métrica/Vozpópuli, 2/11/2026, muestra 1000, campo 22–28/10/2026 (fuente original en el registro).

La ejecución de GitHub utiliza la cuenta ya autenticada, sin necesidad de pegar un token en la web. El formulario de disparo desde el sitio sigue requiriendo autorización personal; no guardar tokens en JavaScript distribuido públicamente.

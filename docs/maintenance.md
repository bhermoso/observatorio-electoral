# Mantenimiento y actualización revisada

## Programación

Se ha creado una automatización diaria de este chat a las **09:00, Europe/Madrid**, para buscar nuevas publicaciones, contrastarlas, actualizar el archivo y publicar las incorporaciones que superen las comprobaciones. Es una revisión programada por el agente, no una fuente de datos en tiempo real ni un proceso de extracción garantizado a cada instante. Las ejecuciones dependen de la disponibilidad de la app, permisos, herramientas, fuentes y límites de uso de la cuenta.

No debe notificar si no hay novedades significativas. Debe avisar si se incorporan o corrigen datos relevantes, falla la actualización o se necesita una intervención. No se envían mensajes a institutos, periodistas ni otros terceros.

## Repositorio y límites de actuación

- Directorio activo: `C:\Users\blash\Documents\ChatGPT\Observatorio electoral`.
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

## Acontecimientos y encuestas

Un accidente, sentencia, crisis o decisión política se registra con fecha y fuente comprobada, sin penalizaciones o bonificaciones electorales automáticas. Distinguir fecha de entrevistas de fecha de publicación. Comparar estudios equivalentes y no afirmar causalidad por proximidad temporal. Un dato ya recogido en una encuesta no debe recibir además una corrección manual por el mismo supuesto efecto.

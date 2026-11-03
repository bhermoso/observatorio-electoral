# Auditoría y consolidación local de PR #21

Fecha: 3 de noviembre de 2026. Base: `0a4d7d283bdec3aac0dd656aec239098e1a1ac7c`; comparación con `224b23a` (37 archivos). Repositorio comprobado: `bhermoso/observatorio-electoral`. Rama de correcciones: `audit-pr21-consolidacion`.

## Veredicto en tres líneas

La versión publicada sirve para explorar datos y supuestos, pero necesita las correcciones descritas antes de considerarla consolidada.
Los principales impedimentos son la publicación de datos durante la veda, la caché incompleta y explicaciones que sobrestiman qué se ha calibrado o comparado.
Las correcciones están en una rama local con pruebas; no se ha modificado `main`, abierto un PR ni publicado esta revisión.

## Alcance y evidencia

Se revisó el cambio integrado y su contrato `docs/capas.md`. La ejecución pesada del motor se hizo en una copia de los archivos versionados, `work/audit-pr21`, para conservar intactos los resultados de la rama auditada. Los registros de ejecución están en `work/audit-*.log`; las capturas en `outputs/audit-*.png`. Esas carpetas están ignoradas por Git y son evidencia local, no archivos publicados.

No se han incorporado encuestas nuevas ni alterado las cifras de voto, escaños o probabilidades versionadas. En `modelo/salida/pronostico.json` solo se corrige una descripción del error de industria.

Las referencias de archivo y línea siguientes corresponden a la rama corregida. Los defectos se reprodujeron en la base; las pruebas de regresión ejercitan la corrección. «Demostrado» significa resultado observado o contradicción directa de código y datos; «riesgo» no significa que se haya demostrado daño en el corte actual.

## Hallazgos por gravedad

| Gravedad y naturaleza | Hallazgo | Evidencia reproducible | Consecuencia | Corrección / estado |
|---|---|---|---|---|
| Alta · demostrado | La veda no retiraba los datos del sitio generado. | Base `scripts/build.mjs`: copia incondicional de `data`; compilar normalmente y repetir con fecha 25-nov-2026 conservó `dist/data/modelo/pronostico.json` y 13 encuestas en `dist/data/polls.json`, aunque aparecía el aviso. | La restricción anunciada no se cumplía técnicamente. | `scripts/build.mjs:7`: artefacto limpio y, en veda, solo dos páginas de aviso y `.nojekyll`. Regresión `tests/veda-build.test.mjs`. No equivale a dictamen jurídico. |
| Alta · demostrado | La caché histórica ignoraba correcciones de muestra y fechas. | Base `modelo/motor/registro.py`, `_firma`: cambiar n de 100 a 100000 no cambiaba la firma `69aa81092062da2f`. Solo entraban ID y voto, además de algunos parámetros. | Podía mantenerse una serie antigua tras corregir datos que cambian la estimación. | `modelo/motor/registro.py:41,74`: incluir casa, n, campo, publicación, método, origen, inicio, elección y calibración histórica. Regresión `modelo/tests/test_audit_pr21.py`. |
| Alta · riesgo de procedencia | Cinco de ocho entradas externas del motor enlazan recopiladores, no originales. Dos enlaces no permitieron consulta. | Inventario individual más abajo y `work/audit-third-party.json`. La puerta de calidad comprueba campo y solapamiento, no certifica la ficha primaria. | La referencia depende parcialmente de registros cuya trazabilidad no está plenamente comprobada en esta auditoría. | Mantener la distinción de origen y la sensibilidad solo verificadas. Pendiente contraste editorial de las cinco fichas; no se han cambiado cifras ni convertido registros en «verificados». |
| Media · demostrado | Pesos manuales cero reducían indebidamente la cobertura de bloques. | Tres estudios sintéticos; solo A activo, A publica PP=30 y Vox=20. Base: bloque vacío porque contaba tres estudios. | Un bloque con cobertura completa entre fuentes activas podía desaparecer. | `capas.mjs:83,97,102`: denominador e institutos activos excluyen peso cero. `tests/audit-pr21.test.mjs`: resultado 50, un instituto. |
| Media · demostrado | La capa 1 con entradas del motor anticipaba publicaciones ausentes. | Base `pollsFromModelInputs`: sin publicación usaba fin de campo; el motor supone fin +2 días. Caso 31-oct: entraba el 1-nov en la media, pero no en el motor. | Selecciones temporales distintas sin explicación. | `capas.mjs`, conversor: usar también fin +2 días. Regresión nueva y actualización de la expectativa antigua en `tests/capas.test.mjs`. |
| Media · demostrado | «Error común ... calibrado con el 23J» atribuía demasiado al parámetro 2,2. | `modelo/__main__.py:462`; `modelo/motor/pronostico.py`, constante `INDUSTRIA_PRINCIPAL=2.2`. Es una hipótesis intermedia; no un estimador independiente de ese error. | Apariencia de validación mayor que la disponible. | Descripción corregida en productor y JSON versionado; contrato actualizado. No se altera el parámetro. |
| Media · demostrado | Capa 3 menos capa 2 se podía leer como efecto aislado de la cocina. | `home-impact.mjs:46,127`: además del anclaje cambian la mezcla y el error de industria, de 1,5 a 2,2. «Mueve poco las medianas y mucho la incertidumbre» era texto fijo. | La diferencia conjunta podía atribuirse a un único ingrediente. | Explicación explícita de comparación conjunta y retirada de la conclusión fija; `docs/capas.md`. Las ablaciones controladas siguen siendo otra sección. |
| Media · demostrado | La serie recalculada no se identificaba suficientemente como reconstrucción. | Todo el historial de versión 2 se recalculó; las marcas que buscan cambios entre versiones consecutivas no muestran ese reinicio si todas son 2. | Se podía confundir la serie actual con lo efectivamente publicado en cada fecha. | `pronostico-vista.mjs:30`: aviso de reconstrucción retrospectiva y recuperación de versiones anteriores mediante Git. No se inventa un archivo de publicaciones. |
| Media · demostrado | El supuesto de error muestral se presentaba con alcance excesivo. | `acontecimiento.mjs:21–26,84`: fórmula correcta para dos muestras independientes, pero DEFF=1,5 es fijo; las estimaciones publicadas y paneles no garantizan esas condiciones. | «Dentro/fuera del margen» podía parecer un contraste válido de significación para cualquier encuesta. | Referencia teórica, con independencia, muestreo y límites explícitos. Sigue sin ser una estimación causal. |
| Media · demostrado | Dos mensajes de acontecimientos no reflejaban las reglas reales. | El texto general prometía igualdad exacta de método/escenario; la lectura principal empareja por instituto y advierte diferencias. La disponibilidad a 14 días dependía solo de PP. | Comparabilidad exagerada o disponibilidad incorrecta para otros partidos. | `events.mjs`: separar regla del detalle y lectura principal. `acontecimiento.mjs`: disponibilidad a 14 días por partido. |
| Media · demostrado | Una ficha sin ID podía romper el informe después de rechazarse. | `integrate_each([…])` conservaba ID null y el informe concatenaba ID + texto. | Un rechazo podía impedir informar de otras altas válidas. | `scripts/incorporar_encuestas.py:48`: ID de rechazo textual `sin-id`. Prueba con null, objeto vacío y ficha válida consecutiva. |
| Media · demostrado | Falta de informe de búsqueda no quedaba como error explícito. | `scripts/estado_actualizacion.py`: ausencia de candidates se convertía en objeto vacío; solo se señalaba falta de informe de incorporación. | No se distinguía claramente búsqueda fallida de ausencia de novedades. | Error explícito y contador desconocido, no cero. Regresión con incorporación correcta y búsqueda ausente. |
| Media · riesgo demostrado por orden de pasos | La vigilancia podía chocar con pushes y afirmaba recálculo antes de solicitarlo. | Workflow original: push directo a main sin actualizar, y `recalculo_lanzado=true` antes de `gh workflow run`. | Push rechazado o estado que anunciaba un lanzamiento fallido. | Serializar vigilancia, rebase antes de push sin forzar; registrar lanzamiento solo tras aceptación de GitHub. Un segundo commit confirma la solicitud, no la terminación del despliegue. No ejecutado contra producción. |
| Media · demostrado | Fallo de prueba y de salida del motor en Windows. | Prueba de contribuciones: ruta `data\\microdatos\\…` frente a `/`; ejecución completa del motor: UnicodeEncodeError al imprimir ≥ con cp1252, después de escribir resultados. | Comando devuelve error pese a producir archivos y la batería no pasa en Windows. | `scripts/analizar_contribuciones.py:60` usa `as_posix`; `modelo/__main__.py:33` configura stdout UTF-8. La repetición original con `-X utf8` terminó correctamente. |
| Baja · demostrado | La CI de Pages no ejecutaba las pruebas del motor; npm podía descubrir copias de investigación. | `pages.yml` solo ejecutaba pruebas Python de `tests`; `node --test` descubrió también la copia ignorada y contó 394 en lugar de 198. | Regresiones sin control obligatorio o resultados de pruebas engañosos. | Añadir suite `modelo/tests` a Pages; limitar npm a `tests/*.test.mjs`. Final: 199 pruebas Node reales. |

No se ha demostrado un hallazgo crítico ni un cambio erróneo de escaños en el corte del 3 de noviembre.

## Comprobaciones que pasan

- **Promedios independientes:** `node work/audit-averages.mjs`. Doce casos: ventanas 30/45/90, con/sin CIS, pesos iguales/recencia de 14 días, PP/PSOE/Vox. Diferencia máxima `7.105427357601002e-15` puntos, redondeo numérico. Caso 30 días, CIS y pesos iguales: 30,32 / 27,48 / 19,05. Se elige última fecha de fin; en empate, publicación más reciente; si persiste, ID ascendente. No se demuestra equivalencia política entre coaliciones por coincidir sus etiquetas.
- **Repetibilidad del motor base:** dos ejecuciones `python -m modelo --n 1500 --hoy 2026-11-03`, la segunda con `-X utf8`. JSON idéntico, SHA256 `17598DF470C61E6F5FB19D6312CDC68D6F3B3F8833E29723D06C5CBD895E0F82`. Primera ejecución falló solo al imprimir el informe. La comparación con el JSON versionado conserva los escaños y frecuencias; hay diferencias de coma flotante del orden de 10⁻¹² en algunos porcentajes, no discrepancias visibles.
- **Referencia coherente:** portada, pronóstico, bloques, investidura y trazabilidad usan `principal`. Se inspeccionaron los accesos y las salidas. PP 129, PSOE 112, Vox 68; PP+Vox, mediana conjunta 198, frecuencia ≥176 de 92,67 %. No se obtiene un bloque sumando las medianas de sus partidos.
- **Web pública frente a local:** consulta del JSON público de Pages: corte 2026-11-03, versión 2, PP/PSOE/Vox 129/112/68, coincidentes con la compilación. Las fechas de construcción pueden diferir. Esto no constituye una publicación de los arreglos locales.
- **Sensibilidad solo verificadas:** llama a `PR.principal`, conserva mezcla y parámetros predeterminados; 11 estudios, PP 126, PSOE 113,5 (mostrado 114), Vox 69 y PP+Vox≥176 en 90,22 %. Usa 300 simulaciones por variante frente a 750 y un inicio ajustado a la selección; no es una comparación con idénticas muestras Monte Carlo.
- **Acontecimientos:** recuento independiente, ventana de 30 días alrededor del 28-oct:7 anteriores, 3 coincidentes, 1 posterior. Las entrevistas que tocan el día se excluyen de antes/después. La fórmula usa `1,96√[1,5(p₁(1−p₁)/n₁+p₂(1−p₂)/n₂)]`; no se compara el salto inmediato con el placebo a 14 días. La simulación hipotética usa otra proyección y está rotulada como tal. No se aplica un coeficiente del accidente al pronóstico.
- **Navegador:** cuatro vistas base (#dashboard, #pronostico, #contexto, #encuestas) a 1366×900 y 390×844; sin desbordamiento del documento (anchos 1351 y 375 respectivamente, dentro de la ventana) y sin advertencias/errores de consola capturados. Tab pasa de Encuestas a Promedios. Ancla `#pronostico-cocina` llega a su sección. En la corrección se comprobó el aviso histórico, el escenario UPN/CC abstención (sí 198, abstenciones 3; segunda votación 93,7 %) y la tabla de 52 circunscripciones. El menú y las tablas tienen desplazamiento interno horizontal en móvil.
- **Actualización simulada:** sin altas conserva última incorporación; ficha válida entra una vez; duplicada no se vuelve a incorporar; inválida se rechaza y no bloquea la siguiente; cambio de ficha publicada exige revisión editorial; fallo de búsqueda deja error y cantidades desconocidas. Son pruebas locales, no ejecuciones reales de GitHub Actions.
- **Credenciales del cliente:** no aparecieron tokens con patrones GitHub en los archivos versionados inspeccionados. La autorización se mantiene en memoria, se limpia el campo y se elimina al salir; se envía a la API de GitHub, no se persiste en almacenamiento del navegador. No es una auditoría exhaustiva de seguridad.

### Pruebas finales de la rama corregida

| Comando | Resultado |
|---|---|
| `npm test` | 199/199 |
| `python -m unittest discover -s tests -p 'test_*.py'` | 17/17 |
| `python -m unittest discover -s modelo/tests -t .` | 34/34 |
| `npm run build` | Correcto: 13 encuestas, 10 institutos, 3 referencias, 1 acontecimiento |
| `git diff --check` | Sin errores de espacios |

En este equipo se utilizó Python del runtime instalado de Codex, porque el alias `python` de Windows no abre un intérprete. Las baterías de la base dieron 196 Node, 15 Python de scripts y 32/33 del motor. El resultado 199 no incluye las pruebas de la copia ignorada.

## Ocho registros externos: qué se ha podido verificar

Campo y muestra son los valores registrados, no una certificación renovada de cada ficha. No se ha demostrado duplicación con el archivo verificado por los intervalos de campo disponibles; tampoco se puede descartar reutilización de entrevistas sin documentación del trabajo de campo.

| ID | Campo registrado / n | Enlace y estado de consulta | Limitación |
|---|---|---|---|
| demoscopia-2025-09-08 | 2–5 sep 2025 / 3000 | [Libertad Digital, comitente](https://www.libertaddigital.com/espana/politica/2025-09-08/encuesta-esradio-ld-pp-y-vox-tendrian-205-diputados-y-podemos-se-acerca-peligrosamente-a-sumar-7293066/), accesible | No se ha completado contraste independiente de todos los campos técnicos. |
| gad3-2026-05-28 | 26–28 may 2026 / 1011 | [GAD3](https://www.gad3.com/barometro-abc-estimacion-de-voto-nacional-mayo-2026/), accesible | Enlace del instituto; no certifica por sí solo todos los metadatos importados. |
| ncreport-2026-09-03 | 1–3 sep 2026 / 1000 | [PolitPro](https://politpro.eu/es/espana/intencion-de-voto/nc-report-2026-09-03/elecciones-parlamentarias), accesible | Secundaria; publicación ausente, el motor supone fin+2. |
| sigmados-2026-10-01 | 22 sep–1 oct 2026 / 2116 | [PollingForecast](https://www.pollingforecast.com/es/polls/ 1000205?lang=es), accesible | Secundaria; publicación ausente, el motor supone fin+2. |
| sociometrica-2026-10-01 | 1–3 oct 2026 / 1000 | [Electográfica](https://www.electografica.com/2026/10/encuesta-sociometrica-261004.html), accesible | Secundaria; no se ha recuperado original técnico. |
| ncreport-2026-10-06 | 1–6 oct 2026 / 1000 | [Electográfica](https://www.electografica.com/2026/10/encuesta-nc-report-261008.html), respuesta 429 | No verificada en vivo. No se eludió la restricción. |
| imop-2026-10-05 | 5–7 oct 2026 / 900 | [IMOP](https://www.imop.es/encuesta-pre-electoral-para-el-confidencial-2026/), accesible | Original del instituto; continúa rotulada como importación externa. |
| sociometrica-2026-10-10 | 10–11 oct 2026 / 1000 | [Su Momento](https://sumomento.com/encuestas/sociometrica-2026-10-11), respuesta 403 | Secundaria no consultable; no se eludió la restricción. |

## Riesgos metodológicos que no se resuelven cambiando código

Agrupar Sumar, Sumar/FA y Frente Amplio es una convención explícita, no una equivalencia electoral demostrada. Se conserva la advertencia y las etiquetas originales. La regla de «al menos la mitad» para bloques evita publicar una cobertura ínfima, pero es un umbral convencional y no elimina el sesgo por ausencia de partidos. No se recomienda interpretar esas sumas parciales como una papeleta completa.

La correlación 0,5, el mapa provincial 23J, el error de industria y las casas que fijan el ancla condicionan las simulaciones. Una sola elección usada en calibración no constituye validación independiente. Las diferencias en abstenciones de investidura son aritmética bajo un supuesto político, no probabilidades de pacto.

## Límites y trabajo pendiente

No se ha hecho una comprobación exhaustiva de cada botón, descarga y enlace externo, ni una auditoría completa de accesibilidad. Se verificaron las rutas principales, una ancla representativa, foco de navegación y varios controles del pronóstico. Las capturas documentan las vistas, no sustituyen pruebas de todas las interacciones.

No se han activado los workflows, enviado mensajes, creado Issues ni publicado datos para probar el circuito remoto. La corrección del orden de confirmación y concurrencia necesita una ejecución controlada de Actions después de su revisión. Un rebase conflictivo o un push concurrente todavía puede exigir intervención; nunca se fuerza el push. La aceptación de un recálculo no certifica su éxito ni el de Pages.

La veda corregida actúa al construir y desplegar el artefacto. Si la ejecución programada se retrasa o falla, el sitio anterior puede continuar disponible. El repositorio público, cachés y copias externas tampoco se retiran mediante esta corrección. El alcance jurídico debe revisarse respecto del [artículo 69 LOREG en BOE](https://www.boe.es/buscar/act.php?id=BOE-A-1985-11672#a69); no se afirma cumplimiento jurídico completo.

Se ha comprobado repetibilidad completa del motor base con fecha fija; no se ha repetido toda la simulación histórica pesada después de ampliar la firma de caché. La función modificada y los supuestos de invalidación sí pasan su prueba de regresión; el próximo recálculo reconstruirá el historial. No se han sustituido resultados versionados por salidas de la copia de auditoría.

Queda pendiente completar originales de las entradas secundarias y validar el modelo en otras elecciones sin reutilizar resultados para ajustar sus parámetros. No hay evidencia suficiente para presentar el archivo como censo exhaustivo de encuestas, la actualización como verificación autónoma o un cambio tras Urda como efecto causal.

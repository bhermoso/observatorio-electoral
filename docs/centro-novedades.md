# Buscar novedades

Panorama ofrece un acceso a **Encuestas → Novedades**, sin ampliar las cuatro secciones principales.

- **Buscar novedades en GitHub** abre la tarea autenticada `vigilancia-encuestas.yml`. La persona autorizada confirma `Run workflow` en GitHub. Abrir el enlace no ejecuta por sí solo una búsqueda. No se piden ni guardan tokens en la web.
- **Consultar novedades** carga los informes versionados más recientes, con copia del sitio como alternativa. Volver a la pestaña vuelve a consultarlos. Las fechas de búsqueda y los fallos parciales permanecen visibles.
- Filtros: encuestas, estimaciones, promedios, microdatos, documentación y noticias. Clasificación orientativa de titulares/enlaces: no verifica su contenido.
- **Encontrado** no equivale a incorporado ni a utilizado. El resumen muestra el archivo y las referencias, los estudios preparados para experimentar y las entradas del pronóstico publicado. Esos recuentos proceden de archivos distintos; una ausencia se muestra como «sin confirmar», nunca cero.
- El bloque de microdatos presenta el informe de enlaces nuevos y ya catalogados, su fecha, incidencias y el catálogo. Buscar no descarga matrices, no suma entrevistas y no modifica recetas. La vigilancia revisa hasta tres páginas distintas recientes por productor, además de portales (máximo treinta páginas).
- Los cuestionarios, fichas, ponderaciones, promedios y acontecimientos relevantes amplían el descubrimiento documental. Las noticias no producen ajustes automáticos.

La tarea existente incorpora exclusivamente fichas contrastadas de `data/ingesta/validadas.json`; con cambios en el archivo solicita recálculo y publicación. Promedios y reestimaciones permanecen como referencias; los microdatos requieren integridad, licencia, diccionario, pesos y homologación antes de experimentar. Las recetas nuevas se discutirán antes de promoverlas al motor.

El titular de Panorama identifica expresamente su base en estimaciones publicadas. El laboratorio de entrevistas individuales no alimenta el pronóstico principal.

Verificación: pruebas unitarias de clasificación, fuentes alternativas y estados desconocidos; pruebas Python de descubrimiento documental y varias páginas por productor; navegador móvil/escritorio con cobertura parcial simulada, filtros, microdatos y WCAG AA. Los originales privados no se modifican.

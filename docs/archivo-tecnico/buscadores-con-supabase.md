# Búsquedas del Observatorio: operaciones verificables

## Qué hace cada botón

**Buscar titulares recientes**: ejecuta Supabase `encuestas?action=scan` y consulta RSS de Google News. Devuelve titulares y fechas candidatos. No lee porcentajes, no incorpora encuestas, no procesa matrices individuales y no actualiza por sí solo el pronóstico.

**Buscar enlaces de microdatos ahora**: ejecuta Supabase `microdatos?action=scan`. Examina páginas de productores del catálogo, extrae vínculos HTTPS a ZIP, SAV, DTA, XLSX y CSV y consulta RSS específicamente relacionados con la publicación de microdatos. Presenta recuentos de páginas accesibles, enlaces ya catalogados, enlaces nuevos no auditados, noticias candidatas y errores. No descarga archivos binarios ni agrega entrevistas al motor.

**Recargar encuestas verificadas**: vuelve a consultar el archivo público `data/polls.json` y solo refresca las vistas. No ejecuta una búsqueda de fuentes ni modifica datos.

**Pronóstico Motor 29N**: GitHub Pages recalcula con las encuestas elegibles ya incorporadas a su fuente durante el despliegue. Descubrir un titular o un enlace no justifica revisar los pesos de una casa ni cambiar la estimación.

## Almacenamiento y control

- Archivo de encuestas verificadas: GitHub `data/polls.json`; las fichas editoriales aprobadas pasan por la bandeja Supabase `poll_submissions` y el proceso GitHub Actions de ingesta.
- Catálogo documental de microdatos: GitHub `data/microdatos/catalogo-publico.json`.
- Candidatos de microdatos encontrados en búsquedas: tabla Supabase `public.microdata_scan_cache`, con RLS activo y permisos solo para el servicio. El público no consulta directamente la tabla, sino la función Edge `microdatos`.
- La búsqueda de microdatos está limitada a una nueva ejecución cada cinco minutos por una función de reclamación atómica. Los fallos se muestran. No se persisten entrevistas ni ficheros descargados.

**Regla editorial:** 'enlace encontrado' no significa 'fichero descargado'; 'fichero descargado' no significa 'matriz auditada'; 'matriz auditada' no significa 'receta válida para la predicción'. Las operaciones se mantienen separadas.

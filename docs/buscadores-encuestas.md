# Búsquedas documentales sin backend externo

La web consulta informes versionados generados por GitHub Actions. No utiliza Supabase ni Google News para buscar publicaciones.

- **Novedades de encuestas:** `data/vigilancia/candidatos.json`, con fuentes, estado, errores, fechas y enlaces directos. Un candidato no es una ficha aprobada.
- **Hallazgos de microdatos:** `data/vigilancia/microdatos.json`, obtenido de páginas de productores del catálogo. Un enlace no acredita que el fichero contenga entrevistas ni que pueda incorporarse al motor.
- **Catálogo y descargas:** `data/microdatos/catalogo-publico.json` y `data/microdatos/estado-descargas.json`.
- **Custodia real:** repositorio privado `bhermoso/observatorio-electoral-custodia`. La web solo recibe `data/microdatos/custodia.json`, con commit, fecha de verificación, tamaños y hashes; no contiene entrevistas.

Los botones de consulta recuperan el informe existente; el enlace «Ejecutar vigilancia en GitHub» abre la tarea para una cuenta autorizada. No se solicitan claves en el navegador. Las fichas se proponen y revisan en GitHub, conservando el historial editorial.

Véase [el circuito completo](actualizacion-observatorio.md). La descripción de la integración retirada está conservada en [el archivo técnico](archivo-tecnico/buscadores-con-supabase.md).

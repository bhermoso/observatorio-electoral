# Actualización del Observatorio · fuentes directas y revisión editorial

Actualizado el 11 de noviembre de 2026. La integración anterior se conserva en [el archivo técnico](archivo-tecnico/actualizacion-con-supabase.md).

## Qué ejecuta la vigilancia

`.github/workflows/vigilancia-encuestas.yml` consulta los RSS de EL PAÍS, EL MUNDO y EL ESPAÑOL, y los índices de CIS, GAD3 y More in Common. No usa agregadores ni backend externo. Se ejecuta a las 01:40, 07:40, 13:40 y 19:40 UTC (una hora más en Madrid durante noviembre); también admite ejecución manual por usuarios autorizados de GitHub.

Los tiempos de espera, límites de tamaño y errores de cada fuente quedan en `data/vigilancia/candidatos.json`. Un RSS vacío válido es distinto de una página de bloqueo o XML inválido. Los fallos transitorios tienen un reintento. Si todas fallan, se conservan los candidatos anteriores y su fecha de última búsqueda útil. Un resultado parcial se etiqueta como parcial.

**Consultar novedades** lee el último informe versionado, con una copia de respaldo dentro del sitio. No dispara una nueva búsqueda, no pide tokens ni anuncia haber actualizado el pronóstico. El enlace a GitHub permite iniciar una búsqueda nueva con la cuenta del propietario. El cliente no depende de Supabase.

## De la ficha al pronóstico

1. Revisar publicación original, fechas, universo, muestra, categorías, cifras y denominador.
2. Proponer la ficha en `data/ingesta/validadas.json` mediante revisión en GitHub. La bandeja migrada está en `data/ingesta/bandeja-migrada.json`; no había fichas pendientes en el servicio anterior.
3. Las pruebas validan la ficha, rechazan registros incompletos y deduplican. Las correcciones de fichas ya publicadas requieren revisión explícita.
4. Solo un cambio efectivo en `data/polls.json` justifica solicitar el recálculo y publicación de Pages desde la vigilancia. Los informes de búsqueda y los CSV derivados no disparan otro pronóstico por sí solos.
5. La fecha del informe, la incorporación, la solicitud de recálculo y el corte publicado son etapas distintas. El circuito muestra las fechas disponibles y deja como desconocidas las que no puede acreditar.

La búsqueda de microdatos usa páginas directas de productores (`scripts/vigilar_microdatos.py`), publica solo enlaces en `data/vigilancia/microdatos.json` y mantiene descarga, custodia, homologación y entrada al modelo como decisiones separadas.

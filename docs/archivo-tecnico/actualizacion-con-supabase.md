# Actualizar desde el Observatorio

En Encuestas, «Actualizar encuestas» consulta publicaciones recientes y recarga el archivo publicado. No requiere cuenta ni token de GitHub. La búsqueda pública se limita a una ejecución cada cinco minutos para todo el sitio. Los titulares son candidatos, nunca cifras aceptadas automáticamente.

La revisión diaria de las 07:40 UTC actualiza también esta bandeja. Las fuentes pueden fallar; la página muestra los errores y conserva el archivo anterior. El alcance no es exhaustivo.

## Incorporación editorial

«Incorporar una encuesta verificada» permite al editor introducir fuente original, ficha técnica, fechas, muestra, ámbito nacional, escenario y porcentajes. Requiere una clave privada de edición entregada fuera del repositorio. No se infieren cifras ni escaños ausentes.

El servicio valida la ficha, rechaza muestras duplicadas y la guarda en una bandeja de aprobadas. La web muestra las fichas pendientes de publicación. En la siguiente revisión diaria, el proceso existente las audita, incorpora al archivo, regenera los CSV y lanza el cálculo y publicación del modelo. **Guardar una ficha no recalcula inmediatamente el pronóstico.** La fecha de publicación y el estado del circuito siguen visibles en la página.

## Servicio y permisos

- Proyecto Supabase `gjzihgfzxorpvevrrfkh`, función `encuestas`.
- Código reproducible en `supabase/functions/encuestas/`; esquema inicial en `supabase/schema.sql`. La clave de edición no está incluida.
- GET `?action=status`: última búsqueda; GET `?action=approved`: fichas aprobadas por el editor.
- POST `?action=scan`: búsqueda de RSS con consultas fijas, sin URLs suministradas por clientes.
- POST `?action=submit`: exige `X-Editor-Key`; se compara su SHA-256 con la configuración privada. No se guarda la clave original en la base de datos.
- La función pública usa autenticación propia para escribir; no requiere JWT para lecturas y búsqueda pública. La clave de servicio de Supabase permanece exclusivamente en el servidor.
- Tablas con RLS y sin permisos para `anon` ni `authenticated`. La ausencia de políticas es intencional: solo accede `service_role`. Véase [aviso informativo de RLS sin políticas](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy).
- La clave no se guarda en el almacenamiento del navegador. Se borra del formulario al enviar o salir de la sección. Para revocarla, sustituir `poll_editor_config.key_hash` por el SHA-256 de una nueva clave aleatoria; no publicar ninguno de los dos en el repositorio.
- El servicio aplica la misma veda temporal que `scripts/veda.mjs`. Si cambia la convocatoria, actualizar ambos límites y desplegar de nuevo la función.

La web continúa alojada en GitHub Pages, y la publicación automática sigue usando Actions como infraestructura. El usuario realiza la búsqueda y la incorporación desde el Observatorio.

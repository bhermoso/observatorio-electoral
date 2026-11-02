# Protocolo de validación multielección de recetas CIS (v1)

**Estado: especificación previa; ningún método seleccionado para producción.**  
Fecha de registro: 2026-11-02. Este documento se crea cuando ya se han visto los resultados del 23J; por ello **2023 es exploratorio y no sirve como test independiente** de las 16 recetas actuales.

## Unidad de independencia

Una **convocatoria electoral** es la unidad de validación. Múltiples estudios antes de una misma elección son observaciones correlacionadas y no aumentan el número de elecciones evaluadas.

Candidatos: 28-A 2019 (CIS 3242), 10-N 2019 (CIS 3263), 23-J 2023 (CIS 3411 y 3415). Las dos convocatorias 2019 se incorporarán exclusivamente después de verificar ZIP, cuestionario, pesos, códigos y escrutinio oficial.

## Congelación y ausencia de filtración del resultado

1. Identificar para cada elección el paquete de microdatos, diccionario, variable de voto, variable de participación, peso y fechas de campo.
2. Definir un mapa **por convocatoria** entre códigos de candidatura del estudio y candidaturas oficiales, manteniendo la categoría «otras» cuando no exista equiparación válida.
3. Registrar en GitHub SHA del código, parámetros, mapa y variables **antes** de calcular el error de cualquier elección reservada.
4. No ajustar coeficientes, exclusiones, tratamiento de no respuesta ni criterios de selección después de observar los resultados reservados.
5. Los casos de 2019, aunque se incorporen, **no pueden presentarse como evaluación genuinamente pre-registrada de las recetas ya examinadas contra 2023** sin una limitación explícita: al diseñar reglas actuales ya existía conocimiento histórico de 2019. El backtesting será retrospectivo con protocolo congelado y la validación prospectiva requerirá otra convocatoria.

## Recetas a contrastar

El motor actual admite 4 × 4 tratamientos para los grupos que declaran indecisión y no respuesta: exclusión, imputación proporcional, uso de candidatura identificable en VOTOSIMG y combinación VOTOSIMG más residuo proporcional. Antes de ejecutar 2019, verificar **si existen variables equivalentes**. Si no las hay, registrar «receta no comparable»; queda prohibido sustituirlas silenciosamente.

## Métricas

- **Error firmado** en puntos de porcentaje sobre voto válido oficial por candidatura (estimado menos observado).
- **MAE** por elección, únicamente sobre un conjunto predefinido de candidaturas equiparables.
- Error máximo absoluto, sesgo firmado, dispersión entre estudios de una misma convocatoria y sensibilidad de las recetas.
- Contraste con recetas base (decididos sin imputar y estimación publicada), manteniendo igual universo y corte temporal.
- Si se implementa proyección territorial, añadir error provincial y de escaños **separado** del error de voto nacional.
- La incertidumbre de muestreo, el error predictivo y la dispersión entre recetas no deben fusionarse en un solo intervalo.

## Regla de publicación

Publicar resultados históricos por elección con población objetivo, fuente, código congelado, numeradores, denominadores y exclusiones. **No asignar una receta ganadora con cero pruebas independientes.** Un ranking de error retrospectivo puede mostrarse para investigación, identificado como descriptivo y sin extrapolación.

## Puertas de control y ficheros

- `data/microdatos/registro_validacion_elecciones.json`: estado por elección y requisitos pendientes.
- `scripts/preparar_validacion_2019.py`: inspección de encabezados y variables candidatas; no calcula votos.
- `validacion-cobertura.mjs`: rechaza declaraciones de independencia sin evidencias, protocolo y versiones.
- `validacion-imputaciones.mjs`: 16 recetas evaluadas exclusivamente contra 23J, sin atribución prospectiva.

Las decisiones o cambios futuros del protocolo deben quedar versionados y los cambios posteriores a examinar resultados no serán tratados como evidencia independiente.

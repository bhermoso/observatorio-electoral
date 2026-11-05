# Taller electoral: entrevistas, receta y pronóstico conectados

Corte congelado: 5 de noviembre de 2026. Desarrollo experimental para revisar, sin sustituir el sitio publicado.

## Conexión realizada

Se abren tres matrices originales: CIS 3582 (5.024 filas), flash 40dB de octubre (800) y More in Common de octubre (2.210). Son 8.034 entrevistas de tres trabajos de campo distintos, no una muestra común. SHA-256 contrastados; solo salen agregados.

Se conserva el peso publicado por el productor y se aplica una receta común:

1. Intención declarada sobre candidaturas y blanco, con peso original.
2. Para NS, simpatía válida; Ninguno no se convierte en voto blanco.
3. Para los NS restantes, imputación fraccionaria con donantes del mismo recuerdo. Contracción hacia distribución global con masa previa de 50 entrevistas efectivas. Sin soporte comparable, distribución global. NC queda sin imputar.
4. Participación declarada / 10, con faltantes sustituidos por media ponderada observada. La matriz CIS tiene doce faltantes, que ahora se identifican antes de la imputación del lector anterior.
5. Opcional y experimental: ajuste de pesos por recuerdo entre PP, PSOE, Vox y Sumar. Referencia 23J normalizada dentro de ese subconjunto; factores completos limitados a 0,5–2; intensidad 50 %. Los demás recuerdos conservan su peso.

El recuerdo se utiliza como grupo de donantes incluso sin calibrar los pesos por recuerdo. Son operaciones distintas.

## Dos universos

- **Desde las entrevistas:** tres estimaciones producidas por nuestra receta alimentan el ajuste temporal y el traslado a escaños.
- **Integrada:** las tres estimaciones propias sustituyen a las publicadas de sus muestras y se añaden otras dieciocho estimaciones agregadas. Total: veintiuna entradas únicas. No se trata la muestra publicada y su cocina como dos encuestas.

More in Common se añade una sola vez. En ambos lados de cada contraste se conservan los mismos partidos observados en la referencia publicada; no se completa artificialmente SALF o regionales en una referencia que no los aporta. La muestra del CIS se fija en 5.024 en todos los escenarios para aislar la receta de la diferencia de una fila respecto a la ficha de 5.025.

Diez escenarios: cuatro recetas y una referencia publicada, en cada universo. El escenario publicado permite comparar exclusivamente la sustitución de estimaciones dentro del mismo circuito.

## Pronóstico

Dos referencias de consenso del motor: privadas y todas, con igual número de simulaciones y semillas comunes por variante. Cada escenario contiene 1.500 simulaciones (750 por referencia). No se aplica la variante calibrada por los errores de 2023 del productor ni la corrección histórica direccional: una receta nueva no hereda automáticamente el error del algoritmo publicado por su casa.

Se conserva la incertidumbre de industria de 2,2 como supuesto, el movimiento temporal, la correlación de bloques y la dispersión provincial del motor. No se han calibrado esos parámetros con estas tres matrices. La geografía de 2023 y el reparto Sumar/Podemos siguen siendo hipótesis del traslado territorial. La incertidumbre de receta no está plenamente incorporada.

Las variantes de consenso no son una calibración frente a resultados reales. Con tres casas y una oleada por casa no hay suficiente repetición para separar de forma empírica todos los cambios temporales y efectos de casa: los supuestos del modelo importan.

## Interfaz y explicación

- La cifra principal procede del escenario elegido, conectado a las recetas individuales.
- Selectores de universo, receta, partido, muestra inspeccionada, voto/escaños y orden ascendente/descendente.
- Cada muestra muestra sus pasos, cambios en puntos, denominador ponderado y recuentos de NS/NC e imputaciones.
- La distancia respecto a una casa se divide en dos tramos aritméticos: su publicación → nuestra receta sobre esa misma muestra → pronóstico seleccionado. No se presenta como atribución causal.
- Descarga del escenario, fuentes, receta y supuestos en JSON.
- El corte anterior completo se conserva como archivo, con las 870 encuestas de Wikipedia y la cronología de eventos. Sus curvas históricas se identifican como pertenecientes al motor anterior, no como un histórico nuevo de estas recetas.

## Qué se ha comprobado

Reproducción desde originales, categorías documentadas, ausencia de duplicación de estudios, conservación de porcentajes y del tratamiento NS/NC/Ninguno/Blanco, recuentos de las matrices y escenarios. Pruebas del motor y del taller; comprobación de interacciones en navegador. Esto no acredita precisión predictiva.

Los ensayos de 40dB en 2023 se muestran con su alcance original: tres oleadas de una elección y recetas diferentes de esta receta común. No son validación de los diez escenarios actuales.

## Reproducción

Dependencias de análisis: numpy, pandas y pyreadstat==1.3.2. Originales conservados fuera del repositorio.

```bash
OPENBLAS_NUM_THREADS=1 python -m scripts.construir_taller /ruta/a/los/zip
python -m unittest discover -s modelo/tests -t .
python scripts/actualizar_propuesta_taller.py propuesta_base.html Propuesta_Observatorio_Electoral_01.html
node --check taller-integrado-ui.mjs
```

More in Common se descarga desde la URL autorizada y se verifica contra el hash conservado. Se usan cinco columnas brutas; no se usan su intención final imputada ni su peso electoral final.

## Próximo contraste científico

Aplicar exactamente esta receta común, con parámetros congelados, a microdatos preelectorales de convocatorias históricas comparables. Seleccionar y evaluar parámetros en elecciones distintas. No elegir una receta por acercarse al promedio de las casas ni por producir una sorpresa.

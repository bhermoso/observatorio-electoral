# Mismos datos, distintas recetas

`misma-muestra.html` compara tratamientos A/B y estimación oficial de **un único estudio**, sin combinarlos con otras encuestas ni introducir la receta experimental en el pronóstico.

## CIS 3584: contraste agregado disponible

45.074 entrevistas, campo del 7 al 30 de octubre de 2026, publicación del 12 de noviembre. La aplicación utiliza las 18 categorías literales de `data/sources/cis-3584.json`.

- Directa original sobre la base «censo» declarada por el CIS.
- R0 proporcional: divide cada porcentaje de candidatura, otros y blanco por la suma de esas 18 categorías (79,3 puntos) y multiplica por cien. No adjudica NS/NC ni presume que votarán igual; es una referencia descriptiva condicional entre respuestas válidas. El redondeo de las tablas impide considerarla un recuento individual exacto.
- Estimación oficial sobre voto válido del mismo estudio.

No se restan cifras de bases distintas. El cambio R0–oficial es descriptivo: no identifica qué ingrediente produjo la diferencia en la cocina oficial. No hay etapas ficticias de recuerdo, simpatía o participación para 3584: **no se ha incorporado su matriz individual**. Las comprobaciones de las páginas públicas y anuncios consultados no han proporcionado un ZIP utilizable; esto no afirma que no pueda publicarse o existir por otro canal.

## Estudios con receta individual calculada

CIS 3582, 3411 y 3415 ofrecen las seis etapas heredadas de `scripts/cocina_cis.py`: directa entre respuestas válidas; PESO; VOTOSIMG; calibración por recuerdo con recortes [0,2;5]; imputación de NS/NC mediante transferencias del recuerdo; y probabilidad de votar (NS/NC = 0,5). La interfaz permite recorrer y comparar esas etapas **acumulativas ya calculadas**, no combinarlas arbitrariamente ni atribuir a un ingrediente un efecto causal aislado.

Se comprueba identidad del estudio, muestra original y orden de etapas. En 3582 se expone una discrepancia documental preexistente: 5.024 registros en el agregado de microdatos frente a 5.025 en el archivo de encuestas. No se oculta ni se afirma coincidencia completa del tamaño; su conciliación queda pendiente. El porcentaje final coincide con el agregado reproducible ya existente. Las candidaturas sin cifra oficial transcrita quedan ausentes; Podemos y SALF no se presentan como candidaturas autónomas en 2023. Las etiquetas territoriales de 3584 no se homologan a espacios de otros estudios.

La página muestra regla, denominador, factores de recuerdo cuando existen, procedencia y ZIP SHA-256. Solo recibe y exporta agregados. Se conserva la diferencia entre origen común y universo aportante, que puede variar entre etapas.

Estas son recetas experimentales heredadas, no una receta definitiva acordada. Los ingredientes, coeficientes y nuevas combinaciones se discutirán antes de promoverlos. Ningún selector modifica el Motor 29N ni crea una encuesta adicional.

## Descubribilidad del preelectoral

El comparador de casas incluye una tarjeta permanente del CIS 3584 con publicación, campo, muestra, acceso a ficha y selección directa de sus tres candidaturas comunes. Explica que el gráfico lo sitúa por el fin de campo (30 de octubre), aunque se publicase el 12 de noviembre. El enlace a este laboratorio conserva la identidad 3584.

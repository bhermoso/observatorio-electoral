# Exploración interactiva — 12 de noviembre de 2026

El panorama, pronóstico, archivo y cocina se organizan en vistas seleccionables: una pregunta visible a la vez. La navegación conserva los nodos originales, identificadores, datos y escuchadores; no duplica gráficos ni descarta documentación. Los enlaces directos siguen abriendo el capítulo pertinente.

- Panorama: escaños/promedio, evolución, microdatos, últimas encuestas, herramientas y referencias.
- Pronóstico: resultado, evolución, territorio, método, fuentes, validación y otros modelos. Dentro del resultado se eligen voto/escaños, bloques o investidura.
- Cocina: línea base inicial, ingredientes, caso 40dB., microdatos, contraste de recetas, motor actual y fuentes. La despensa de intención, recuerdo, simpatía y participación tiene explicación interactiva; ningún clic activa reglas en el pronóstico.
- Encuestas: gráfico o tabla; las fichas se abren en un diálogo nativo y devuelven el foco al cerrarse. No se selecciona PP por defecto.
- Las instrucciones extensas están en una guía plegable. La lectura completa sigue siendo una opción explícita.

Se conservan los controles de recarga, búsqueda, filtros y simulación. La recarga vuelve a montar las vistas sin rescatar contenido obsoleto, conserva la selección de sección y reconfigura los controles sobre las fichas actualizadas. Escape cierra la ficha antes de cerrar la sección. Los tabs admiten flechas, Inicio y Fin; los paneles y botones tienen relaciones ARIA e identificadores únicos.

Comprobación: 24 combinaciones de ruta/anchura, 28 de documento/anchura y 7 revisiones WCAG de la batería existente; búsqueda, filtros, teclado, recarga con una corrección y simulación completados. Además, 8 comprobaciones de las nuevas vistas a 390/1440 px verifican un único panel visible, navegación por teclado, ingredientes, diálogo y ausencia de errores JS e incidencias axe. Informes y capturas en `docs/presentacion-interactiva/`. Las páginas de línea base y validación científica también se comprobaron a ambas anchuras.

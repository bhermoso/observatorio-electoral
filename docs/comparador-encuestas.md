# Comparador de encuestas

Acceso: `comparador-encuestas.html`, enlazado desde la portada, el menú, el archivo y el directorio. Consume exclusivamente `data/polls.json`; no calcula ni modifica el pronóstico.

- Permite seleccionar varias casas y hasta cuatro candidaturas. La vista inicial muestra las tres etiquetas con más estudios registrados, todas las casas y el año de publicación más reciente. Los controles muestran el periodo aplicado.
- Filtra por **fin de campo**, incluyendo los dos extremos. «Última de cada casa» conserva el estudio con fin de campo más reciente dentro del periodo; desempata por publicación y después por identificador. No obtiene la última cifra de cada partido de estudios diferentes.
- Los gráficos mantienen la misma escala vertical y el mismo intervalo horizontal. Cada punto conserva su estudio, cifra, fechas y fuente. No une ni interpola puntos, ni produce una media.
- Las etiquetas de candidatura se comparan literalmente. El Frente Amplio desglosado del CIS 3584 no se homologa al de otros estudios. No se suman candidaturas territoriales ni se transforman ausencias en ceros.
- El contraste entre estudios muestra **B − A** en puntos porcentuales, junto a fechas, método, denominador y acceso a las fichas completas. Una diferencia no demuestra un cambio electoral ni un efecto de casa.
- El enlace compartido conserva filtros y dos estudios. El CSV incluye todos los estudios filtrados y las candidaturas elegidas, con fuentes y celdas vacías cuando no hay cifra transcrita.
- Las fichas se abren desde los puntos con ratón o teclado. En móvil los filtros empiezan plegados y muestran su selección para dejar espacio a los gráficos; el archivo general y el directorio permanecen accesibles.

Validación: pruebas numéricas y de conservación de etiquetas, enlaces y CSV; pruebas con Chromium a 390, 768 y 1440 px que cubren filtros, selección máxima, ausencia de datos, diferencias, fichas, teclado, exportación, recarga y WCAG. Se integran en la revisión automática de cada PR.

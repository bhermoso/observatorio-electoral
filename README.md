# Observatorio Electoral Español

Proyecto independiente en **bhermoso/observatorio-electoral**, sin dependencias de Aula de Salud Comunitaria ni Compás NG.

Dashboard estático en español: resultados oficiales del 23J de 2023, archivo de nueve estudios de siete institutos con escaños publicados y filtros, atlas navegable de las 52 circunscripciones, repositorio documental de métodos y enlaces a microdatos, simulador provincial y nacional D’Hondt con ponderaciones por candidatura y exportación JSON.

## Ejecutar

Node.js 22 o posterior. No requiere instalar paquetes.

```sh
npm test
npm run build
npm run dev
```

Abrir http://127.0.0.1:4173. El sitio usa rutas hash y recursos relativos para funcionar en `/observatorio-electoral/`. Google Fonts es opcional; existen fuentes de sistema de respaldo. No hay cookies, analítica, credenciales ni backend.

## Fuentes y límites

- [JEC / BOE: resultados definitivos](https://www.boe.es/diario_boe/txt.php?id=BOE-A-2023-18907).
- [RD 400/2023: magnitudes provinciales](https://www.boe.es/buscar/doc.php?id=BOE-A-2023-12663).
- [LOREG, artículo 163](https://www.boe.es/buscar/act.php?id=BOE-A-1985-11672#a163).
- CIS, 40dB., GAD3, IMOP, DYM, Ateneo del Dato y Sigma Dos: originales y fichas en `data/polls.json`; [verificación y límites](docs/poll-archive.md).
- Metroscopia, IESA-CSIC, CADPEA/UGR, ICPS, GESOP y CENTRA: directorio documentado y pendientes de incorporación por estudio en `data/references.json`.
- Promedio de Llaneras / EL PAÍS: referencia externa fechada, separada de las encuestas.
- [Catálogo multifuente de microdatos (9 fuentes; 76 entradas documentales)](data/microdatos/catalogo-publico.json) y [guía de acceso, cobertura y validación](docs/archivo-microdatos.md). Aparece en Encuestas y Cocina, separado de las estimaciones publicadas; las entradas documentales no son 76 encuestas distintas y los XLSX/ZIP no se alojan en este repositorio.

Resultados históricos verificados el 28 de octubre y encuestas ampliadas el 30 de octubre y método de IMOP completado el 31 de octubre de 2026. Incluye siete publicaciones de octubre de 2026, además de dos estudios históricos de 2023. El pronóstico propio procede del Motor 29N (`modelo/`) y se distingue de los promedios de encuestas según el [contrato de capas](docs/capas.md). Cada ficha conserva porcentajes, puntos y horquillas publicados; los datos ausentes no se inventan. Los microdatos se consultan en origen; el repositorio contiene agregados y catálogo de acceso, no entrevistas ni registros sintéticos.

`data/sources/` conserva el HTML del BOE y la extracción textual del cuadro I de su PDF, con SHA-256 en `data/source-hashes.json`. Regenerar: `node scripts/import-boe.mjs`, `node scripts/export-csv.mjs`, `npm test`, `npm run build`. La extracción del cuadro I procede de la página 2 del [PDF del BOE](https://www.boe.es/boe/dias/2023/09/01/pdfs/BOE-A-2023-18907.pdf), usando `pypdf.PdfReader(...).pages[1].extract_text()`. El total estatal se verifica mediante la suma provincial; el PDF altera el orden de sus dos primeras columnas en esa fila.

## Publicación

El workflow `.github/workflows/pages.yml` ejecuta las pruebas y genera `dist`. Solo despliega la rama `main`; los PR ejecutan pruebas sin desplegar. En Settings → Pages debe seleccionarse **GitHub Actions**. El destino previsto es https://bhermoso.github.io/observatorio-electoral/. No se debe considerar publicado hasta que la ejecución de Actions y la respuesta HTTP del sitio se hayan verificado.

## Microdatos públicos de 40dB (experimental)

El catálogo incluye los ZIP de tres encuestas 40dB. Tras recibir los originales, **4.800 entrevistas fueron auditadas y tabuladas localmente**, con variables originales, ponderador `ponde`, reconstrucción del voto directo y recetas exploratorias; solo se publican [agregados auditados](data/microdatos/40db-auditoria-2026.json) y documentación en [alta cocina 40dB](docs/alta-cocina-40db.md). La vista de Cocina permite contrastar las cifras y recordar sus límites. La utilidad predictiva no está validada: no se ha incorporado ninguna receta al Motor 29N.

## Documentación

- [Metodología y supuestos](docs/methodology.md)
- [Diccionario y acceso a microdatos](docs/data-dictionary.md)
- [Verificación de fuentes](docs/sources.md)

Código MIT. Los documentos y datos originales conservan sus condiciones de reutilización y atribución; la licencia MIT no los sustituye.

## Cartografía

El atlas usa geometría generalizada oficial Eurostat/GISCO NUTS 2024 agrupada en 52 circunscripciones, con Canarias en recuadro. © EuroGeographics para los límites administrativos. Uso no comercial y atribución según [condiciones GISCO](https://ec.europa.eu/eurostat/web/gisco/geodata/statistical-units); esta capa conserva sus condiciones y no está bajo MIT. Fuente y transformación en [registro de fuentes](docs/sources.md).

## Estructura de la web

- **Panorama** (`#dashboard`): corte temporal, las cuatro capas ([contrato](docs/capas.md)) en una matriz comparable por voto, escaños y cambio desde el corte anterior; bloques; qué añade la cocina.
- **Pronóstico completo** (`#pronostico`): salida del Motor 29N, con variantes, cadena de cálculo, bloques, evolución, 52 circunscripciones, estudios usados y excluidos, evaluación 23J y modelos externos. Informe técnico íntegro en `pronostico.html`.
- **Promedios** (`#analisis`): promedio con pesos configurables y proyección territorial experimental. No es el pronóstico.
- **Acontecimientos** (`#contexto`): lectura en seis niveles (hecho, cambios observados, mismo instituto, estadística, simulación hipotética, conclusión). Ver [criterios](docs/events.md) y [capas](docs/capas.md#acontecimientos).

## Actualización

Circuito: buscar → identificar novedades → verificar → incorporar → recalcular → publicar. `vigilancia-encuestas.yml` (diario y manual) detecta titulares por RSS, que **no** son encuestas; incorpora solo las fichas ya verificadas de `data/ingesta/validadas.json` (una ficha inválida se rechaza con su motivo sin bloquear a las demás); registra el resultado en `data/ingesta/estado.json`; si hay altas, lanza `pages.yml`, que ejecuta el Motor 29N y publica. La pantalla de Encuestas muestra última búsqueda, incorporación, recálculo, publicación, rechazos y errores. La verificación de cada ficha sigue siendo humana. En veda electoral no se publican ni `pronostico.html` ni los JSON del modelo.

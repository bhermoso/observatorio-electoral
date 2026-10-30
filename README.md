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

Resultados históricos verificados el 28 de octubre y encuestas ampliadas el 30 de octubre de 2026. Incluye siete publicaciones de octubre de 2026, además de dos estudios históricos de 2023. **No es un seguimiento en tiempo real ni un pronóstico propio**. Cada ficha conserva porcentajes, puntos y horquillas publicados; los datos ausentes no se inventan. Los microdatos se consultan en origen; el repositorio contiene agregados y catálogo de acceso, no entrevistas ni registros sintéticos.

`data/sources/` conserva el HTML del BOE y la extracción textual del cuadro I de su PDF, con SHA-256 en `data/source-hashes.json`. Regenerar: `node scripts/import-boe.mjs`, `node scripts/export-csv.mjs`, `npm test`, `npm run build`. La extracción del cuadro I procede de la página 2 del [PDF del BOE](https://www.boe.es/boe/dias/2023/09/01/pdfs/BOE-A-2023-18907.pdf), usando `pypdf.PdfReader(...).pages[1].extract_text()`. El total estatal se verifica mediante la suma provincial; el PDF altera el orden de sus dos primeras columnas en esa fila.

## Publicación

El workflow `.github/workflows/pages.yml` ejecuta las pruebas y genera `dist`. Solo despliega la rama `main`; los PR ejecutan pruebas sin desplegar. En Settings → Pages debe seleccionarse **GitHub Actions**. El destino previsto es https://bhermoso.github.io/observatorio-electoral/. No se debe considerar publicado hasta que la ejecución de Actions y la respuesta HTTP del sitio se hayan verificado.

## Documentación

- [Metodología y supuestos](docs/methodology.md)
- [Diccionario y acceso a microdatos](docs/data-dictionary.md)
- [Verificación de fuentes](docs/sources.md)

Código MIT. Los documentos y datos originales conservan sus condiciones de reutilización y atribución; la licencia MIT no los sustituye.

## Cartografía

El atlas usa geometría generalizada oficial Eurostat/GISCO NUTS 2024 agrupada en 52 circunscripciones, con Canarias en recuadro. © EuroGeographics para los límites administrativos. Uso no comercial y atribución según [condiciones GISCO](https://ec.europa.eu/eurostat/web/gisco/geodata/statistical-units); esta capa conserva sus condiciones y no está bajo MIT. Fuente y transformación en [registro de fuentes](docs/sources.md).

## Actualización continua

La vista **Acontecimientos** (`#contexto`) cruza hechos documentados con intervalos de trabajo de campo, ofrece ventanas de 14, 30 y 90 días y exporta el análisis. Los posibles pares antes/después se seleccionan con criterios conservadores y sus diferencias son descriptivas. El registro inicial del accidente de Urda no tiene todavía encuestas posteriores en el archivo. No se trasladan efectos supuestos a los pesos del laboratorio. Ver [criterios y datos](docs/events.md).

Una tarea de este chat revisa diariamente las fuentes a las 09:00 (Europe/Madrid), incorpora únicamente novedades verificables y publica tras pruebas y validación de Pages. Su ejecución depende de la app, herramientas, permisos y límites de cuenta. No hay un scraper que transforme automáticamente noticias en cifras electorales. Ver [política de mantenimiento](docs/maintenance.md).

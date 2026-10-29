# Observatorio Electoral Español

Proyecto independiente en **bhermoso/observatorio-electoral**, sin dependencias de Aula de Salud Comunitaria ni Compás NG.

Dashboard estático en español: resultados oficiales del 23J de 2023, archivo inicial de dos estudios CIS, atlas navegable de las 52 circunscripciones, repositorio documental de métodos y enlaces a microdatos, simulador provincial y nacional D’Hondt con ponderaciones por candidatura y exportación JSON.

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
- CIS 3411 y 3415: estimaciones originales y fichas enlazadas desde `data/polls.json`, contrastadas con el catálogo datos.gob.es.

Verificación: 28 de octubre de 2026. Edición histórica: **no es seguimiento en tiempo real ni pronóstico actual**. Solo se transcriben cuatro formaciones de cada encuesta, sin calcular promedios. Los microdatos se consultan en origen; el repositorio contiene agregados y catálogo de acceso, no entrevistas ni registros sintéticos.

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

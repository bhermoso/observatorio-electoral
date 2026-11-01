# Datos de terceros (no verificados contra fuente primaria)

Estos ficheros alimentan **solo** la evaluación histórica y las series de contexto del motor.
No se mezclan con `data/polls.json` (registro verificado del observatorio).

| Fichero | Origen | Commit | Licencia | Fuente declarada |
|---|---|---|---|---|
| wikipedia_2019_2023.csv (filtrado: ámbito España, generales; columnas reducidas) | github.com/endikasatu/encuestas_esp | 5c8ab44d4984ba5c17db4cb9dc75203e7f7bb0c5 | MIT | Tablas de Wikipedia (EN) de encuestas, nov-2019 a ene-2023 |
| 29n_encuestadores.jsonl | github.com/elCanosail/29N | ae699dd4534438bdb3545d09f33056b6aef9edba | MIT (código; los datos pertenecen a sus fuentes) | Cada fila enlaza la publicación original (`fuente_url`) |

Cada encuesta derivada de estos ficheros lleva `origen` = `terceros-wikipedia` o `terceros-29n` en todas las salidas.
SHA-256 en `modelo/externos/sha256.txt`.

## Encuestas citadas en prensa (`prensa_2026.csv`)

Encuestas recientes cuyas cifras se conocen por resúmenes de prensa, sin haber podido consultar el original del instituto o del medio. Entran en el modelo con `origen` = `prensa-sin-verificar`, se señalan en todas las salidas y se sustituyen en cuanto el registro verificado (`data/polls.json`) incorpore el original. Sin fecha de campo publicada, se supone que terminó tres días antes de la publicación.

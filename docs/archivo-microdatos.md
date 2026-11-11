# Archivo de microdatos de encuestas españolas

**Actualizado el 5 de noviembre de 2026.** Inventario **parcial y ampliable**: [fuentes y fichas en JSON](../data/microdatos/catalogo-publico.json). Se presenta en las pestañas **Encuestas** y **Cocina**. Contiene **9 fuentes y 76 entradas documentales**, pero no 62 encuestas distintas: algunas entradas agrupan varios estudios o describen repositorios y series acumuladas.

## Qué se considera microdato

- **Respuesta individual anonimizada**: una fila por entrevistado, variables codificadas, documentación de cuestionario y ponderación. Es el formato buscado para entender la cocina.
- **Ficha técnica, informe PDF, tablas de cruces o estimación publicada**: materiales útiles, pero **no sustituyen microdatos**.
- **ZIP/XLSX enlazado**: la web del productor lo anuncia como microdatos, pero **no lo consideramos auditado** hasta comprobar físicamente filas, variables, n, pesos y códigos.
- **Repositorios de acceso condicionado**: registro del ICPS, formulario del CIS o solicitud a GAD3. No se eluden restricciones de uso ni se asume autorización de redistribución.

## Fuentes identificadas

| Institución o productor | Acceso | Ámbito | Utilidad |
|---|---|---|---|
| 40dB / EL PAÍS | ZIP directo | España, autonómicas y municipales | Continuidad de entrevistas 2023–2026; auditorías reales de seis ZIP ya completadas |
| GAD3 | XLSX enlazados y ficheros bajo solicitud | Aragón, Andalucía y series históricas | Tres hojas de 2026 documentadas y tracking del 10N de 2019 bajo solicitud |
| SocioMétrica / EL ESPAÑOL | SAV enlazados | España | Nueve publicaciones 2024–2025, incluidas series acumulativas y aplicaciones de ajuste por recuerdo |
| More in Common España | ZIP + codebook | España | Cuatro olas de 2026 anunciadas en el portal; otros trabajos 2024–2025 bajo solicitud |
| CEMOP (Universidad de Murcia) | Microdatos desde ficha oficial | Murcia | Preelectorales 10N-2019 y 23J-2023, autonómicas 2019 y 2023, paneles, barómetros y encuestas nacionales de polarización política |
| CIS | Formulario y FID | Nacional y autonómico | Serie larga, datos individuales y reconstrucción por estudios |
| CEO | CSV/SAV | Cataluña | Barómetros y serie histórica |
| ICPS (con campo GESOP) | Registro de usuario | Cataluña | Sondeos anuales y base acumulada; GESOP no es una muestra extra |
| Sociómetro Vasco | CSV/SAV | País Vasco | Olas regionales históricas, ponderación y cruces |

Fuentes originales destacadas: [GAD3 Aragón 2026](https://www.gad3.com/rindiendo-cuentas-precision-de-escanos-en-las-elecciones-de-aragon/), [GAD3 Andalucía 2026](https://www.gad3.com/barometro-abc-estimacion-de-voto-autonomico-en-andalucia-mayo/), [tracking 10N de GAD3 por solicitud](https://www.gad3.com/gad3-ofrece-los-microdatos-del-tracking-de-las-elecciones-del-10n-d51/), [CEMOP 10N](https://www.cemopmurcia.es/estudios/encuesta-preelectoral-generales-10n-2019/), [CEMOP 23J](https://www.cemopmurcia.es/estudios/encuesta-preelectoral-elecciones-generales-2023-region-de-murcia/), [More in Common](https://moreincommon.es/pulso-electoral.html), [CIS](https://www.cis.es/es/estudios/catalogo), [CEO](https://web.gencat.cat/es/generalitat/dades-indicadors/centre-estudis-opinio/microdades), [ICPS](https://www.icps.cat/recerca/sondeigs-i-dades/sondeigs/sondeigs-d-opinio-catalunya) y [Sociómetro Vasco](https://www.euskadi.eus/sociometros-vascos/web01-s1lehike/es/).

## De las fuentes al motor

1. Comprobar el archivo original, licencia, hash SHA-256, estructura y número de entrevistas sin publicar identificadores.
2. Documentar pregunta de voto, recuerdo, simpatía, indecisión, probabilidad de voto, ponderación, ámbito, trabajo de campo, universo y comitente.
3. Reproducir voto directo ponderado con el denominador publicado. Separar representatividad territorial de ajustes de cocina; registrar incertidumbre del muestreo y ponderación.
4. Ensayar hipótesis de imputación y calibración en **elecciones distintas**. Una encuesta de Murcia no es una muestra nacional y un panel postelectoral reutiliza entrevistados.
5. Usar el escrutinio de elecciones históricas como referencia. No ajustar coeficientes con una elección y declarar esa misma elección prueba fuera de muestra.
6. Publicar **solo agregados** que respeten condiciones de reutilización; mostrar cuándo un resultado está verificado, calculado, inferido o pendiente.

**Embargo:** la encuesta nacional de polarización de CEMOP de 2025 declara los microdatos **embargados hasta enero de 2027**. El catálogo marca esa condición y no la presenta como archivo descargable.

**Prioridad de investigación:** GAD3 Aragón 2026 y Andalucía 2026, SocioMétrica 2024–2025, CEMOP 10N-2019 y 23J-2023, More in Common 2026, serie 40dB 2024–2025 y luego CEO/ICPS/Sociómetro para contrastes autonómicos. Las empresas comerciales del bloque de pendientes **no se clasifican como carentes de microdatos**: falta localizarlos o solicitar acceso.

**Importante:** este catálogo no modifica el pronóstico operativo del Motor 29N ni inserta sus registros como encuestas de intención de voto. Un mismo estudio no puede añadirse por duplicado al aparecer en portal del productor y en el de su contratante.


## Depósito privado de originales · 5 de noviembre de 2026

Los cuatro ZIP autorizados de More in Common se conservan en el repositorio **privado** `bhermoso/observatorio-electoral-custodia`. Se recuperaron de nuevo desde GitHub y se comprobaron contra las cuatro huellas y tamaños originales; la migración no implica permiso de redistribución ni homologación metodológica.

`data/microdatos/custodia.json` publica únicamente el certificado: proveedor, commit, fecha de recuperación comprobada, tamaño y SHA-256. La web coteja este certificado con la auditoría de descargas. No consulta un servicio externo de almacenamiento ni publica entrevistas. El repositorio privado verifica su integridad en cada push y mensualmente; la actualización del certificado público requiere recuperar y volver a comprobar los originales con `scripts/guardar_microdatos_privados.py`.

La búsqueda documental directa produce `data/vigilancia/microdatos.json`; no descarga matrices. La descarga auditada conserva solo metadatos públicos y mantiene las condiciones de cada productor. El [archivo técnico anterior](archivo-tecnico/microdatos-con-supabase.md) conserva el detalle del depósito retirado y de la migración histórica.

## Cómo saber si un microdato está cargado (estado real, independiente de las encuestas)

En **Encuestas → Archivo de microdatos** cada entrada muestra **Estado real de microdatos**, **Original guardado** y **Motor 29N**. Se puede filtrar entre localizados, descargados alguna vez, almacenados, analizados y pendientes.

| Término | Comprobación exigida | ¿Tenemos una copia recuperable? | ¿Afecta al 29N? |
| --- | --- | --- | --- |
| Localizado | Se conoce URL o página original | No | No |
| Descargado | Descarga temporal real verificada, huella SHA-256 | No necesariamente | No |
| Almacenado | Copia íntegra recuperable en depósito privado autorizado y referencia verificable | Sí | No, salvo decisión explícita |
| Analizado | Estimaciones o agregados calculados a partir de una matriz auténtica | No necesariamente | No, salvo receta aprobada |

**Situación verificada el 5/11/2026:** 11 descargas originales auditadas, de las que 7 contienen matrices detectadas; **4 ZIP de More in Common conservados permanentemente** y recuperados del depósito privado con SHA-256 coincidente. Además, seis estudios 40dB tienen análisis agregado y cuatro SocioMétrica análisis parcial. Estos recuentos describen etapas diferentes y no se suman como si fueran el mismo conjunto. La conservación se acredita con el certificado de recuperación y su fecha, no con el valor inicial del catálogo JSON.

La nueva auditoría de descargas se ejecuta sobre URLs de productores preaprobados (ZIP/SAV/DTA/CSV/XLSX) y genera exclusivamente `data/microdatos/estado-descargas.json`: huella, estado, tamaño, estructura y error. También prueba enlaces nuevos detectados por la vigilancia directa. La auditoría técnica sigue leyendo las matrices en un directorio temporal y descartándolas; **solo los cuatro originales autorizados de More in Common se han conservado aparte en un repositorio privado**, con huella de recuperación. No se ha otorgado permiso de redistribución. El fichero público contiene metadatos, nunca entrevistas.

**En GitHub:** [ejecutar/comprobar auditoría](https://github.com/bhermoso/observatorio-electoral/actions/workflows/auditar-catalogo-microdatos.yml). Se ejecuta tras cambiar el catálogo y en comprobaciones programadas. Un resultado `matriz_detectada_pendiente_homologacion` no es una cocina validada.

## Primera auditoría SocioMétrica: 4.383 registros SAV de mayo–septiembre de 2025

Los originales fueron descargados desde enlaces oficiales de EL ESPAÑOL y analizados en una ejecución de GitHub Actions de solo lectura, sin publicar entrevistas. [Agregados comprobables en JSON](../data/microdatos/sociometrica-2025-agregados.json).

| Ola | n anunciado | Filas SAV | Variables | PP directo | PSOE directo | Vox directo | Sumar directo |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Mayo | 1.000 | 1.034 | 47 | 23,11 % | 22,05 % | 10,54 % | 5,51 % |
| Junio | 1.150 | 1.150 | 37 | 23,48 % | 21,30 % | 12,96 % | 6,35 % |
| Julio | 1.100 | 1.100 | 45 | 22,18 % | 19,00 % | 19,82 % | 4,82 % |
| Septiembre | 1.100 | 1.099 | 38 | 21,29 % | 18,84 % | 15,20 % | 7,28 % |

Son **frecuencias simples de las preguntas cerradas**: `IV_GEN` (mayo, junio, septiembre) e `INTENCION_DE_VOTO` (julio). El denominador es el total de registros de cada fichero, incluidos indecisos, abstencionistas y respuestas en blanco. **No representan votos válidos ni estimación final; no se ajustó por ponderación, participación o recuerdo.** Solo se publican categorías con 20 o más respuestas. Las bases declaran variables de recuerdo, pero ningún campo se identifica inequívocamente como peso desde los nombres o etiquetas.

**Incidencias:** mayo contiene 34 registros más que las 1.000 entrevistas anunciadas por EL ESPAÑOL, mientras septiembre presenta un registro menos que los 1.100 comunicados; se conserva cada cifra tal como procede del original hasta aclarar si se debe a redondeo, depuración o edición del fichero. Estas cuatro olas no constituyen cuatro elecciones independientes ni una evaluación histórica fuera de muestra.

**Acceso GAD3:** los tres XLSX públicos de Aragón y Andalucía están localizados en el catálogo, pero el servidor cerró las conexiones de descarga tanto en el entorno local como en GitHub Actions. Permanecen **documentados, no analizados**. Una copia descargada por el usuario permitirá completar su homologación sin omitir las comprobaciones de SHA-256, n, preguntas y pesos.


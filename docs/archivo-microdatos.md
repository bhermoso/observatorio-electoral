# Archivo de microdatos de encuestas españolas

**Actualizado el 5 de noviembre de 2026.** Inventario **parcial y ampliable**: [fuentes y fichas en JSON](../data/microdatos/catalogo-publico.json). Se presenta en las pestañas **Encuestas** y **Cocina**. Contiene **8 fuentes y 62 entradas documentales**, pero no 62 encuestas distintas: algunas entradas agrupan varios estudios o describen repositorios y series acumuladas.

## Qué se considera microdato

- **Respuesta individual anonimizada**: una fila por entrevistado, variables codificadas, documentación de cuestionario y ponderación. Es el formato buscado para entender la cocina.
- **Ficha técnica, informe PDF, tablas de cruces o estimación publicada**: materiales útiles, pero **no sustituyen microdatos**.
- **ZIP/XLSX enlazado**: la web del productor lo anuncia como microdatos, pero **no lo consideramos auditado** hasta comprobar físicamente filas, variables, n, pesos y códigos.
- **Repositorios de acceso condicionado**: registro del ICPS, formulario del CIS o solicitud a GAD3. No se eluden restricciones de uso ni se asume autorización de redistribución.

## Fuentes identificadas

| Institución o productor | Acceso | Ámbito | Utilidad |
|---|---|---|---|
| 40dB / EL PAÍS | ZIP directo | España, autonómicas y municipales | Continuidad de entrevistas 2023–2026; auditorías reales de seis ZIP ya completadas |
| GAD3 | XLSX enlazados y algunos ficheros bajo solicitud | Aragón, Andalucía y series históricas | Tres hojas de 2026 documentadas y tracking del 10N de 2019 bajo solicitud |
| More in Common España | ZIP + codebook | España | Cuatro olas de 2026 anunciadas en el portal; otros trabajos 2024–2025 bajo solicitud |
| CEMOP (Universidad de Murcia) | Microdatos desde ficha oficial | Murcia | Preelectorales 10N-2019 y 23J-2023, autonómicas 2023, panel posterior, barómetros |
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

**Prioridad de investigación:** GAD3 Aragón 2026 y Andalucía 2026, CEMOP 10N-2019 y 23J-2023, More in Common 2026, serie 40dB 2024–2025 y luego CEO/ICPS/Sociómetro para contrastes autonómicos. Las empresas comerciales del bloque de pendientes **no se clasifican como carentes de microdatos**: falta localizarlos o solicitar acceso.

**Importante:** este catálogo no modifica el pronóstico operativo del Motor 29N ni inserta sus registros como encuestas de intención de voto. Un mismo estudio no puede añadirse por duplicado al aparecer en portal del productor y en el de su contratante.

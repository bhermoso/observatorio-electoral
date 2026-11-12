# Línea base para diseñar la cocina contigo

La línea base ordena referencias de casas reconocidas, prácticas documentadas y cálculos reproducibles. **No decide la receta propia ni adopta automáticamente el método con menor error histórico.** Sus ingredientes, objetivos y coeficientes se discutirán contigo antes de incorporarlos al pronóstico.

Se han leído directamente documentos de 40dB., GAD3, Sigma Dos, IMOP Insights y Metroscopia; también se han consultado DYM y GESOP/ICPS como contraste. La selección inicial responde a presencia en el archivo y documentación accesible, no a una clasificación de prestigio. Puede revisarse contigo. `data/microdatos/base-cocina.json` contiene los documentos, su huella, el alcance de cada afirmación y lo que no permiten reconstruir.

## Referencia de trabajo R0

1. Conservar respuestas, códigos, población y pesos originales del productor.
2. Mostrar intención directa con el peso publicado, comprobando qué corrige ese peso. Es el escenario `directa_peso` ya reproducido desde los originales; no se añaden factores nuevos.
3. Separar porcentajes sobre todas las entrevistas y sobre voto válido; identificar blanco, nulo, abstención, NS/NC, aportantes y tamaño efectivo.
4. Mantener las estimaciones publicadas de cada casa como referencia externa. No llamar «receta reconstruida de GAD3» a un algoritmo propio que solo reproduzca algunas herramientas habituales.

R0 es una base técnica para comparar y conversar. No equivale a la cocina completa de ninguna casa y no se convierte en pronóstico operativo por estar implementada.

## Prácticas que sí están documentadas

| Casa/documento | Evidencia útil para la base | Límite |
|---|---|---|
| 40dB., barómetro octubre 2026 | Cuotas por sexo/edad, CCAA, hábitat, clase social; preestratificación/ponderación por clase social | El uso de recuerdo para segmentar no demuestra calibración de pesos por recuerdo |
| GAD3, ficha octubre 2026 | CATI; cuotas de sexo, edad y territorio | No publica la fórmula completa de cocina ni todos sus factores |
| Sigma Dos, 26 octubre 2026 | CATI/CAWI, reglas de selección/cuotas y distribución territorial | La ficha no permite reconstruir todos los coeficientes de estimación |
| IMOP, preelectoral 2026 | CATI/CAWI; estratos por CCAA/hábitat y cuotas de sexo-edad/estudios | El propio documento distingue el panel no probabilístico del muestreo aleatorio |
| Metroscopia, «Cómo medimos» | CATI propio, panel y seguimiento continuo | Una página institucional no sustituye a la receta electoral completa |

Se ha corregido el catálogo anterior: atribuía a 40dB. ponderación por recuerdo a partir de un extracto. El original consultado acredita segmentación por recuerdo y ponderación por clase social, sin publicar aquella regla. También se corrige la referencia de GAD3 mayo 2026 a CATI, que es lo que documenta la ficha leída.

## Recetas que ya existían y deben ponerse sobre la mesa

En el laboratorio individual: PESO; intención/voto+simpatía; ajuste por recuerdo con factores recortados [0,2;5]; indecisos mediante donantes del recuerdo; participación PROBVOTO/10 y tratamiento de NS/NC. Son decisiones heredadas y experimentales, no criterios acordados ahora contigo.

En el agregador operativo: anclas de casas, tres variantes con peso igual, corrección parcial del error 23J, incertidumbre de industria/bloque y geografía 23J. Estos parámetros pertenecen a una capa distinta de la cocina de respuestas individuales. Tampoco se sustituyen por el ganador de un ensayo retrospectivo.

La discusión debe fijar qué ingredientes entran, sus variables observables, población elegible, denominador, objetivos de calibración, recortes, tratamiento de respuestas desconocidas, interacciones, incertidumbre y criterio de evaluación. También podrá incluir los ingredientes nuevos que propongas. Primero se formula la regla contigo; después se implementa y contrasta como variante identificada. Los ensayos realizados sirven para esa conversación, no para darla por resuelta.

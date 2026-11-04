/**
 * Evidencia histórica EXTERNA sobre encuestadoras (EL PAÍS, 19-10-2026).
 * Es información documental: no es un ranking calculado por el Observatorio,
 * no cambia los pesos de las casas; la auditoría de ZIP 2026 figura por separado.
 */
export const EVIDENCIA_40DB={
  publicado:'2026-10-19',
  autores:'Kiko Llaneras y Borja Andrino',
  fuente:'https://elpais.com/espana/elecciones-generales/2026-10-18/que-encuestas-aciertan-mas-compara-los-errores-y-los-sesgos-de-cada-encuestadora.html',
  archivo:'https://ep00.epimg.net/infografias/encuestas40db/2026/10-08-barometro-flash/2026_10_08_barometro_flash_descargables.zip',
  metodologia:'docs/alta-cocina-40db.md'
};

export function renderEvidencia40db(){
  return `<section class="pollster-evidence" id="evidencia-encuestadoras" aria-labelledby="pollster-evidence-title">
    <header class="pollster-evidence-heading">
      <div>
        <span class="eyebrow">Contraste independiente publicado · 19 oct 2026</span>
        <h2 id="pollster-evidence-title">40dB: acierto en generales, con matices</h2>
      </div>
      <a class="pollster-evidence-source" href="${EVIDENCIA_40DB.fuente}" target="_blank" rel="noopener noreferrer">Ver análisis de Llaneras y Andrino ↗</a>
    </header>
    <div class="pollster-evidence-facts">
      <div><b>3 de 3 generales</b><p>Según el análisis, 40dB fue la encuestadora con <strong>menor error en cada una de las tres elecciones generales</strong> evaluadas.</p></div>
      <div><b>44 elecciones examinadas</b><p>Al incluir autonómicas y europeas, su error fue <strong>aproximadamente el de la media</strong>. No todas las casas participaron en las 44.</p></div>
      <div><b>Microdatos públicos</b><p>40dB publica respuestas individuales de sus estudios. <strong>Tres ZIP de 2026 analizados: 4.800 entrevistas; la receta final sigue sin identificarse</strong> en el Observatorio.</p></div>
    </div>
    <p class="pollster-evidence-foot">
      <span><strong>Interpretación:</strong> comparación histórica de terceros; no es una evaluación nueva del Observatorio ni autoriza a dar automáticamente más peso a 40dB.</span>
      <span><a href="${EVIDENCIA_40DB.archivo}" target="_blank" rel="noopener noreferrer">Microdatos 40dB (ZIP) ↗</a> · <a href="${EVIDENCIA_40DB.metodologia}">Cómo los evaluaremos ↗</a></span>
    </p>
  </section>`;
}

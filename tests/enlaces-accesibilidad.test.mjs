import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
// Regresiones del rastreo de enlaces y del análisis axe (WCAG A/AA) del 3-nov-2026.
test('el tutorial enlaza la auditoría histórica donde ahora vive (#pronostico-evaluacion)',()=>{
 const t=fs.readFileSync('tutorial-estimacion.html','utf8');
 assert.doesNotMatch(t,/href="\.\/#auditoria"/);
 assert.match(t,/href="\.\/#pronostico-evaluacion"/);
 assert.match(fs.readFileSync('pronostico-vista.mjs','utf8'),/id="pronostico-evaluacion"/);
});
test('el glosario no inserta elementos enfocables dentro de <summary>',()=>{
 assert.match(fs.readFileSync('glosario.mjs','utf8'),/const SKIP='[^']*\bsummary\b/);
});
test('las barras de auditoría con etiqueta tienen rol de imagen',()=>{
 const s=fs.readFileSync('dashboard-validacion.mjs','utf8');
 assert.doesNotMatch(s,/class="audit-track" aria-label=/);
});
test('las cifras clave de portada son una lista de definición válida',()=>{
 const s=fs.readFileSync('home-impact.mjs','utf8');
 assert.doesNotMatch(s,/<\/dd><small>/);
});

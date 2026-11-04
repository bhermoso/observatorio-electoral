import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {EVIDENCIA_40DB,renderEvidencia40db} from '../evidencia-40db.mjs';

test('40dB: distinguir tres generales de la evaluación global',()=>{
  const html=renderEvidencia40db();
  assert.match(html,/3 de 3 generales/);
  assert.match(html,/menor error en cada una de las tres elecciones generales/);
  assert.match(html,/44 elecciones examinadas/);
  assert.match(html,/aproximadamente el de la media/);
  assert.match(html,/No todas las casas participaron en las 44/);
  assert.match(html,/no es una evaluación nueva del Observatorio/);
  assert.match(html,/más peso a 40dB/);
});

test('40dB: fuente original y microdatos separados, con estado pendiente',()=>{
  const html=renderEvidencia40db();
  assert.equal(EVIDENCIA_40DB.publicado,'2026-10-19');
  assert.match(EVIDENCIA_40DB.fuente,/elpais\.com\/espana\/elecciones-generales\/2026-10-18\/que-encuestas-aciertan-mas/);
  assert.match(EVIDENCIA_40DB.archivo,/\.zip$/);
  assert.match(html,/aún no analizado/);
  assert.match(html,/aria-labelledby="pollster-evidence-title"/);
  assert.match(html,/rel="noopener noreferrer"/);
});

test('La evidencia es visible al inicio de Promedios y Cocina y se empaqueta',()=>{
  const analysis=fs.readFileSync(new URL('../analysis.mjs',import.meta.url),'utf8');
  const cocina=fs.readFileSync(new URL('../cocina.mjs',import.meta.url),'utf8');
  const build=fs.readFileSync(new URL('../scripts/build.mjs',import.meta.url),'utf8');
  assert.match(analysis,/<\/div>\$\{renderEvidencia40db\(\)\}<div class="toolbar">/);
  assert.match(cocina,/\$\{renderEvidencia40db\(\)\}\s*\$\{renderResultadosCocina\(\)\}/);
  assert.match(build,/'evidencia-40db\.mjs'/);
});

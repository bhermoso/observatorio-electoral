import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
// Los accesos que estaban plegados en Panorama viven ahora en Pronóstico (contraste) y Cocina (casos).
const app=['home-impact.mjs','contraste-capas.mjs','casos-cocina.mjs'].map(f=>fs.readFileSync(f,'utf8')).join('\n');
const cocina=fs.readFileSync('cocina.mjs','utf8');
const nav=fs.readFileSync('index.html','utf8');
const method=fs.readFileSync('como-estimamos.html','utf8');
test('La portada distingue cálculo real y cocina experimental con accesos separados',()=>{
 assert.match(app,/Cómo se calcula/);
 assert.match(app,/Cocina electoral/);
 assert.match(app,/href="flujograma.html"/);
 assert.match(app,/href="construye-estimacion.html#cocina-secuencia"/);
 assert.match(app,/Método y validación/);
});
test('Cocina identifica su alcance experimental',()=>{
 assert.match(cocina,/laboratorio de experimentación/);
 assert.match(cocina,/no cambian automáticamente el Motor 29N/);
 assert.match(cocina,/href="flujograma.html"/);
});
test('Menú y metodología usan destinos comprensibles',()=>{
 assert.match(nav,/href="#pronostico">Pronóstico completo/);
 assert.match(nav,/href="#encuestas">Encuestas y promedios/);
 assert.match(nav,/href="#metodologia">Método y herramientas/);
 assert.equal((nav.match(/<nav aria-label="Principal">([\s\S]*?)<\/nav>/)[1].match(/<a /g)||[]).length,6);
 assert.match(nav,/href="#cocina">Cocina/);
 assert.doesNotMatch(nav,/Simulación alternativa/);
 assert.match(method,/Ver las ocho fases del algoritmo/);
 assert.match(method,/Abrir laboratorio de cocina/);
});
test('Las pestañas fusionadas siguen respondiendo a sus enlaces antiguos',async()=>{
 const src=fs.readFileSync('app.mjs','utf8');
 assert.match(src,/ALIAS_RUTA=\{analisis:\['encuestas','encuestas-promedios'\]\}/);
 assert.match(src,/function pollPage\(\)\{return '<div id="poll-archive-content">'\+renderPollArchive\(polls\)/);
});

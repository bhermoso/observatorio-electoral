import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const html=fs.readFileSync('flujograma.html','utf8');
const source=fs.readFileSync('flujograma.mjs','utf8');
const build=fs.readFileSync('scripts/build.mjs','utf8');
test('flujograma se publica, se enlaza y tiene ocho fases',()=>{
 assert.match(build,/flujograma.html/);
 assert.match(build,/flujograma.mjs/);
 assert.match(fs.readFileSync('index.html','utf8'),/href="flujograma.html"/);
 assert.match(html,/src="flujograma.mjs"/);
 const names=['Fuentes y control','Normalización','Tres anclajes','Tendencia de voto','Simulación electoral','Traslado provincial','D’Hondt y diputados','Pronóstico y bloques'];
 for(const name of names)assert.ok(source.includes(name),name);
});
test('cifras reales solo del pronóstico y sin valores inferidos de recetas ocultas',()=>{
 assert.match(source,/fetch\('data\/modelo\/pronostico.json'/);
 assert.match(source,/model\?\.trazabilidad/);
 assert.match(source,/No disponible/);
 assert.match(source,/estimaciones publicadas/);
});
test('cada etapa permite auditar operaciones y se usa selección dinámica de partido',()=>{
 assert.match(source,/data-step/);
 assert.match(source,/party.addEventListener\('change'/);
 assert.match(source,/item.code.map/);
 assert.match(html,/aria-live="polite"/);
});

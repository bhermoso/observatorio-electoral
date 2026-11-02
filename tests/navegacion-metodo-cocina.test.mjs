import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const app=fs.readFileSync('app.mjs','utf8');
const cocina=fs.readFileSync('cocina.mjs','utf8');
const nav=fs.readFileSync('index.html','utf8');
const method=fs.readFileSync('como-estimamos.html','utf8');
test('La portada distingue cálculo real y cocina experimental con accesos separados',()=>{
 assert.match(app,/¿Cómo calculamos los escaños\?/);
 assert.match(app,/¿Cómo podemos mejorar la estimación\?/);
 assert.match(app,/href="flujograma.html"/);
 assert.match(app,/href="#cocina"/);
 assert.match(app,/no cambian automáticamente el pronóstico/);
});
test('Cocina identifica su alcance experimental',()=>{
 assert.match(cocina,/laboratorio de experimentación/);
 assert.match(cocina,/no cambian automáticamente el Motor 29N/);
 assert.match(cocina,/href="flujograma.html"/);
});
test('Menú y metodología usan destinos comprensibles',()=>{
 assert.match(nav,/Cómo calculamos · Algoritmo/);
 assert.match(nav,/Cocina · Experimentos/);
 assert.match(nav,/Simulación alternativa/);
 assert.match(method,/Ver las ocho fases del algoritmo/);
 assert.match(method,/Abrir laboratorio de cocina/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const app=fs.readFileSync('app.mjs','utf8');
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
 assert.match(nav,/href="#analisis">Promedios/);
 assert.match(nav,/href="#cocina">Cocina/);
 assert.doesNotMatch(nav,/Simulación alternativa/);
 assert.match(method,/Ver las ocho fases del algoritmo/);
 assert.match(method,/Abrir laboratorio de cocina/);
});

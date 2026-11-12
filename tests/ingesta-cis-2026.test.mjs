import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validarIngestaCis,renderIngestaCis,tablaIngestaCis} from '../ingesta-cis-2026.mjs';
const data=JSON.parse(fs.readFileSync('data/microdatos/ingesta-cis-2026.json','utf8'));
test('registradas cuatro oleadas sin inventar resultados propios',()=>{
 const r=validarIngestaCis(data);
 assert.deepEqual(r.map(x=>x.id),['3567','3571','3577','3582']);
 assert.equal(r.filter(x=>x.microdatos_procesados).length,1);
 assert.equal(r.filter(x=>x.estimacion_propia===null).length,3);
 assert.equal(r[3].sha256_original,JSON.parse(fs.readFileSync('data/microdatos/cocina_cis_3582.json')).sha256_zip);
});
test('impide inventar sha, procesado o estimación de originales aún pendientes',()=>{
 const a=structuredClone(data);a.estudios[1].sha256_original='a'.repeat(64);
 assert.throws(()=>validarIngestaCis(a),/No atribuir/);
 const b=structuredClone(data);b.estudios[2].microdatos_procesados=true;
 assert.throws(()=>validarIngestaCis(b),/sin trazabilidad/);
 const c=structuredClone(data);c.estudios.push(structuredClone(c.estudios[2]));
 assert.throws(()=>validarIngestaCis(c),/incompleto/);
});
test('la tabla diferencia enlace y original calculado y no altera las tres gráficas',()=>{
 const html=tablaIngestaCis(data);
 assert.match(html,/Sin estimación propia/);
 assert.match(html,/Receta experimental no validada/);
 assert.match(html,/Motor 29N/);
 assert.match(renderIngestaCis(),/cocina-ingesta-cis-tabla/);
 const home=fs.readFileSync('home-impact.mjs','utf8');
 for(const id of ['hub-hemiciclo','hub-promedio','hub-micro-resultado'])
  assert.match(home,new RegExp('id="'+id+'"'));
 const kitchen=fs.readFileSync('cocina.mjs','utf8');
 assert.match(kitchen,/renderIngestaCis\(\)/);
 assert.match(kitchen,/bindIngestaCis\(\)/);
 const build=fs.readFileSync('scripts/build.mjs','utf8');
 assert.match(build,/ingesta-cis-2026\.mjs/);
});

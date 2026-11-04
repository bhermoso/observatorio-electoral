import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {OLAS_40DB,comparar40db,renderContraste40db} from '../contraste-40db.mjs';

test('40dB octubre: normalización transparente con voto blanco incluido',()=>{
  assert.equal(OLAS_40DB.length,2);
  const a=comparar40db(OLAS_40DB[0]);
  const b=comparar40db(OLAS_40DB[1]);
  assert.ok(Math.abs(a.denominador-81.2)<1e-9);
  assert.ok(Math.abs(b.denominador-83.1)<1e-9);
  assert.equal(Math.round(a.partidos.PP.normalizada*100)/100,24.14);
  assert.equal(Math.round(a.partidos.PP.residuo*100)/100,7.46);
  assert.equal(Math.round(b.partidos.PP.residuo*100)/100,7.23);
  assert.equal(Math.round(a.partidos.VOX.residuo*100)/100,-5.12);
  assert.equal(Math.round(b.partidos.VOX.residuo*100)/100,-5.29);
  assert.equal(Math.round(a.partidos.PSOE.residuo*100)/100,-0.19);
  assert.equal(Math.round(b.partidos.PSOE.residuo*100)/100,0.42);
});

test('40dB: no declarar una receta reproducida con los microdatos sin procesar',()=>{
  const html=renderContraste40db();
  assert.match(html,/Microdatos individuales: pendientes/);
  assert.match(html,/no identifica el coeficiente ni la técnica privada/);
  assert.match(html,/voto blanco incluido/);
  assert.match(html,/7,46/);
  assert.match(html,/-5,29/);
  assert.match(html,/pp\. 8 y 13/);
  assert.match(html,/pp\. 5 y 16/);
  assert.match(html,/rel="noopener noreferrer"/);
});

test('40dB: contrastes visibles en Cocina y empaquetados sin modificar el Motor 29N',()=>{
  const cocina=fs.readFileSync(new URL('../cocina.mjs',import.meta.url),'utf8');
  const build=fs.readFileSync(new URL('../scripts/build.mjs',import.meta.url),'utf8');
  assert.match(cocina,/\$\{renderContraste40db\(\)\}\s*\$\{renderResultadosCocina\(\)\}/);
  assert.match(build,/'contraste-40db\.mjs'/);
});

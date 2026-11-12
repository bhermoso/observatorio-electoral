import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {calcularDirecta2019N,renderDirecta2019N,tablaDirecta2019N} from '../directa-2019n-retrospectiva.mjs';
const load=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const a=load('data/microdatos/diagnostico_2019_original.json');
const r=load('data/sources/resultados_2019N.json');
const c=load('data/microdatos/cotejo_originales_2019.json');
test('CIS 3263 reconstruye bases y MAE solo para intención directa',()=>{
 const x=calcularDirecta2019N(a,r,c);
 assert.equal(x.admisible_recuerdo,false);
 assert.equal(x.base_entrevistas,9562);
 assert.ok(Math.abs(x.base_peso-9681.302)<0.002);
 assert.ok(Math.abs(x.mae_directa-4.3561)<0.002);
 assert.ok(Math.abs(x.mae_ponderada-4.7025)<0.002);
 assert.equal(x.filas.length,5);
});
test('fuentes inconsistentes impiden presentar comparación',()=>{
 const bad=structuredClone(a);bad.studies['3263'].sha256='0'.repeat(64);
 assert.throws(()=>calcularDirecta2019N(bad,r,c),/sin cotejar/);
 const badRes=structuredClone(r);badRes.eleccion='2019-04-28';
 assert.throws(()=>calcularDirecta2019N(a,badRes,c),/incorrectas/);
});
test('la tabla identifica muestra válida y no declara recuerdo validado',()=>{
 const html=tablaDirecta2019N(calcularDirecta2019N(a,r,c));
 assert.match(html,/NO ADMITIR en el Motor 29N/);
 assert.match(html,/no podemos calcular ni validar el efecto del recuerdo/);
 assert.match(renderDirecta2019N(),/cocina-directa-2019n-contenido/);
 const cocina=fs.readFileSync('cocina.mjs','utf8');
 const build=fs.readFileSync('scripts/build.mjs','utf8');
 assert.match(cocina,/renderDirecta2019N\(\)/);
 assert.match(cocina,/bindDirecta2019N\(\)/);
 assert.match(build,/directa-2019n-retrospectiva\.mjs/);
});

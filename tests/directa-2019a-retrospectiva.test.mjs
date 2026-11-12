import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {calcularDirecta2019A,renderDirecta2019A,tablaDirecta2019A} from '../directa-2019a-retrospectiva.mjs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const a=read('data/microdatos/diagnostico_2019_original.json');
const r=read('data/sources/resultados_2019A_parcial.json');
const c=read('data/microdatos/cotejo_originales_2019.json');
test('abril 2019 solo cuatro partidos inequívocos sobre originales cotejados',()=>{
 const x=calcularDirecta2019A(a,r,c);
 assert.equal(x.base_entrevistas,8661);
 assert.ok(Math.abs(x.base_ponderada-8782.461)<0.002);
 assert.ok(Math.abs(x.mae_directa-3.192465)<0.002);
 assert.ok(Math.abs(x.mae_ponderada-3.322833)<0.002);
 assert.equal(x.validacion_recuerdo,false);
 assert.deepEqual(x.filas.map(v=>v.partido),['PP','PSOE','Vox','Ciudadanos']);
});
test('no permite original o referencia no cotejados',()=>{
 const bad=structuredClone(a);bad.studies['3242'].sha256='0'.repeat(64);
 assert.throws(()=>calcularDirecta2019A(bad,r,c),/no cotejado/);
 const wrong=structuredClone(r);wrong.election='2019-11-10';
 assert.throws(()=>calcularDirecta2019A(a,wrong,c),/incompletas/);
});
test('la publicación no presenta el recuerdo como validado',()=>{
 const html=tablaDirecta2019A(calcularDirecta2019A(a,r,c));
 assert.match(html,/No constituye prueba de admisión al Motor 29N/);
 assert.match(html,/Unidas Podemos\/En Comú Podem/);
 assert.match(renderDirecta2019A(),/cocina-directa-2019a-contenido/);
 const cocina=fs.readFileSync('cocina.mjs','utf8');
 const build=fs.readFileSync('scripts/build.mjs','utf8');
 assert.match(cocina,/renderDirecta2019A\(\)/);
 assert.match(cocina,/bindDirecta2019A\(\)/);
 assert.match(build,/directa-2019a-retrospectiva\.mjs/);
});

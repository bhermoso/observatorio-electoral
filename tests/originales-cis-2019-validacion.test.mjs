import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validarOriginalesCis2019,renderOriginalesCis2019,tablaOriginalesCis2019} from '../originales-cis-2019-validacion.mjs';
const data=JSON.parse(fs.readFileSync('data/microdatos/validacion_2019_seis_etapas_experimental.json','utf8'));
test('originales 2019 tienen seis etapas, hashes y muestran mejora de recuerdo',()=>{
 const e=validarOriginalesCis2019(data);
 assert.deepEqual(e.map(x=>x.id),['3242','3263']);
 assert.equal(e[0].n,16194);assert.equal(e[1].n,17650);
 assert.equal(e[0].pasos.directa.mae_pp,3.1925);
 assert.equal(e[1].pasos.directa.mae_pp,4.8057);
 assert.equal(e[0].pasos.recuerdo.mae_pp,1.8666);
 assert.equal(e[1].pasos.recuerdo.mae_pp,2.9553);
 for(const x of e)assert.ok(x.pasos.recuerdo.mae_pp<x.pasos.simpatia.mae_pp);
});
test('la entrada al Motor 29N sigue bloqueada y no se publican entrevistas',()=>{
 const html=tablaOriginalesCis2019(data);
 assert.match(html,/NO ADMITIR/);
 assert.match(html,/no constituye validación prospectiva/);
 assert.match(renderOriginalesCis2019(),/cocina-originales-2019-tabla/);
 assert.doesNotMatch(JSON.stringify(data),/entrevista_individual/);
 const kitchen=fs.readFileSync('cocina.mjs','utf8');
 const build=fs.readFileSync('scripts/build.mjs','utf8');
 assert.match(kitchen,/renderOriginalesCis2019\(\)/);
 assert.match(kitchen,/bindOriginalesCis2019\(\)/);
 assert.match(build,/originales-cis-2019-validacion\.mjs/);
});
test('datos incompletos o condición de admisión adulterada se rechazan',()=>{
 const bad=structuredClone(data);bad.estado='ADMITIR';
 assert.throws(()=>validarOriginalesCis2019(bad),/Puerta histórica/);
 const missing=structuredClone(data);delete missing.estudios[0].pasos.indecisos;
 assert.throws(()=>validarOriginalesCis2019(missing),/trazabilidad/);
});

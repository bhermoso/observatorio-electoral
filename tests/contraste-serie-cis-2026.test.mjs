import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {contrastarSerieCis2026,renderContrasteSerieCis2026,tablaContrasteSerieCis2026} from '../contraste-serie-cis-2026.mjs';
const load=p=>JSON.parse(fs.readFileSync('data/microdatos/'+p,'utf8'));
const serie=load('serie-cis-2026-experimental.json');
const official=load('cis-oficiales-2026-referencia.json');
test('cuatro oleadas coinciden y se comparan seis pasos sin crear encuestas',()=>{
 const r=contrastarSerieCis2026(serie,official);
 assert.deepEqual(r.map(x=>x.id),['3567','3571','3577','3582']);
 assert.equal(r[3].pasos.participacion.PP.cis,22.2);
 assert.equal(r[3].pasos.participacion.PP.propio,27.735);
 assert.equal(r[3].pasos.participacion.PP.diferencia_pp,5.535);
 assert.equal(r[0].pasos.participacion.PP.diferencia_pp,2.482);
 assert.equal(Object.keys(r[0].pasos).length,6);
});
test('no acepta estudios desalineados, respuestas ausentes ni estimaciones imposibles',()=>{
 const a=structuredClone(official);a.estudios[0].id='no-es-el-estudio';
 assert.throws(()=>contrastarSerieCis2026(serie,a),/desalineados/);
 const b=structuredClone(serie);b.estudios[2].pasos.directa.PSOE=NaN;
 assert.throws(()=>contrastarSerieCis2026(b,official),/inválido/);
});
test('tabla etiqueta cifras como tratamientos no predictivos y preserva tres gráficos',()=>{
 const html=tablaContrasteSerieCis2026(contrastarSerieCis2026(serie,official));
 assert.match(html,/Diferencia = Observatorio experimental/);
 assert.match(html,/pendientes de cotejo/);
 assert.match(html,/no autorizan incluir la receta en el Motor 29N/);
 assert.match(renderContrasteSerieCis2026(),/cocina-cis-serie-contraste-tabla/);
 const home=fs.readFileSync('home-impact.mjs','utf8');
 for(const id of ['hub-hemiciclo','hub-promedio','hub-micro-resultado'])
  assert.match(home,new RegExp('id="'+id+'"'));
 const c=fs.readFileSync('cocina.mjs','utf8');
 const b=fs.readFileSync('scripts/build.mjs','utf8');
 assert.match(c,/renderContrasteSerieCis2026\(\)/);
 assert.match(c,/bindContrasteSerieCis2026\(\)/);
 assert.match(b,/contraste-serie-cis-2026\.mjs/);
});

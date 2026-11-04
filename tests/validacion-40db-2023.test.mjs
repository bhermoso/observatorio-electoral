import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {renderRetrospectiva40db} from '../validacion-40db-2023.mjs';
const raw=fs.readFileSync(new URL('../data/microdatos/40db-retrospectiva-2023.json',import.meta.url),'utf8');
const d=JSON.parse(raw);
test('40dB histórico: tamaños, variables, hashes y marco de una elección',()=>{
 assert.equal(d.schema,1);
 assert.equal(d.tipo,'evaluacion_retrospectiva_exploratoria');
 assert.equal(d.eleccion,'2023-07-23');
 assert.equal(d.estudios.length,3);
 assert.equal(d.estudios.reduce((n,s)=>n+s.n,0),4800);
 assert.equal(Object.keys(d.metodos).length,8);
 assert.match(d.advertencia,/única elección/);
 for(const study of d.estudios){
  assert.match(study.sha256_zip,/^[a-f0-9]{64}$/);
  assert.equal(study.mae_metodos.length,8);
  assert.ok(study.n_efectivo<=study.n&&study.n_efectivo>0);
  for(const k of ['voto','recuerdo_2019','simpatia','participacion'])assert.match(study.preguntas[k],/^p\d+$/);
 }
});
test('40dB publicó una estimación más cercana que el directo ponderado en las tres olas',()=>{
 for(const study of d.estudios)assert.ok(study.mae_publicado<study.mae_metodos[1]);
 assert.ok(d.estudios.every(s=>s.mae_metodos[4]>s.mae_metodos[1]),'recuerdo en el ensayo debe mostrar aumento de error');
 const mean=values=>values.reduce((a,b)=>a+b,0)/values.length;
 assert.ok(Math.abs(mean(d.estudios.map(s=>s.mae_publicado))-2.021)<0.001);
 assert.ok(Math.abs(mean(d.estudios.map(s=>s.mae_metodos[1]))-2.992)<0.001);
});
test('Solo datos agregados; el módulo es visible y empaquetado sin tocar Motor 29N',()=>{
 const html=renderRetrospectiva40db();
 assert.match(html,/4.800 entrevistas/);
 assert.match(html,/resultado real/);
 assert.match(html,/40db-retrospectiva-2023\.json/);
 const cocina=fs.readFileSync(new URL('../cocina.mjs',import.meta.url),'utf8');
 const build=fs.readFileSync(new URL('../scripts/build.mjs',import.meta.url),'utf8');
 assert.match(cocina,/\$\{renderRetrospectiva40db\(\)\}/);
 assert.match(cocina,/bindRetrospectiva40db\(\)/);
 assert.match(build,/'validacion-40db-2023\.mjs'/);
 for(const forbidden of ['entrevistas_individuales','respondent_rows','record_level_data','identificador_persona'])assert.ok(!raw.includes('"'+forbidden+'"'));
});

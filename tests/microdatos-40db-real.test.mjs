import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {renderMicrodatos40db} from '../microdatos-40db.mjs';
const D=JSON.parse(fs.readFileSync(new URL('../data/microdatos/40db-auditoria-2026.json',import.meta.url),'utf8'));

test('Las tres matrices reales suman 4800 registros y hashes 64 hex',()=>{
 assert.equal(D.esquema,1);
 assert.equal(D.olas.length,3);
 assert.equal(D.olas.reduce((n,x)=>n+x.entrevistas,0),4800);
 for(const o of D.olas){
  assert.match(o.sha256,/^[a-f0-9]{64}$/);
  assert.equal(o.ponderador,'ponde');
  assert.ok(o.efectivo_kish>0&&o.efectivo_kish<=o.entrevistas);
  assert.ok(o.zip.endsWith('.zip'));
 }
});
test('Se conserva la diferencia PP y Vox entre directa y estimación, sin atribuir causalidad',()=>{
 const oct=D.olas.find(x=>x.id==='octubre');
 const flash=D.olas.find(x=>x.id==='flash');
 assert.equal(oct.estimacion_publicada.PP,31.6);
 assert.equal(flash.estimacion_publicada.VOX,18.9);
 assert.ok(oct.estimacion_publicada.PP-oct.directa.PP>7);
 assert.ok(oct.directa.VOX-oct.estimacion_publicada.VOX>5);
 assert.ok(oct.recuerdo_calibrado.PP>oct.directa.PP);
 assert.ok(oct.recuerdo_calibrado.PSOE<oct.directa.PSOE);
 assert.match(D.nota,/no equivale a la receta de 40dB/);
});
test('Datos publicables solo contienen agregados explícitos',()=>{
 const raw=JSON.stringify(D);
 for(const bad of ['filas_entrevista','respondents','individual_answers','respuestas_individuales','edad_entrevistado','sexo_entrevistado','identificador'])assert.ok(!raw.includes('"'+bad+'"'));
 assert.ok(D.olas.every(x=>x.entrevistas>500));
 assert.ok(D.olas.every(x=>Object.keys(x.directa).length===4));
});
test('Cocina enlaza componente y build publica su módulo',()=>{
 const cocina=fs.readFileSync(new URL('../cocina.mjs',import.meta.url),'utf8');
 const build=fs.readFileSync(new URL('../scripts/build.mjs',import.meta.url),'utf8');
 assert.match(cocina,/\$\{renderMicrodatos40db\(\)\}/);
 assert.match(cocina,/bindMicrodatos40db\(\)/);
 assert.match(build,/'microdatos-40db\.mjs'/);
 assert.match(renderMicrodatos40db(),/4.800 entrevistas/);
});

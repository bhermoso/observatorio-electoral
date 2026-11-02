import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const data=JSON.parse(fs.readFileSync('data/microdatos/diagnostico_2019_original.json','utf8'));
const registry=JSON.parse(fs.readFileSync('data/microdatos/registro_validacion_elecciones.json','utf8'));
test('2019: dos convocatorias con DA/ES original y cuentas cerradas',()=>{
 for(const [sid,n] of [['3242',16194],['3263',17650]]){
  const s=data.studies[sid];
  assert.equal(s.n,n);
  assert.equal(Object.values(s.intention).reduce((a,x)=>a+x.n,0),n);
  for(const [group,g] of Object.entries(s.groups)){
   assert.equal(g.n,s.intention[group].n);
   assert.ok(Math.abs(g.w-s.intention[group].w)<0.002);
   assert.ok(g.observable_candidate_weight<=g.w);
   assert.ok(g.not_candidate_weight>=0);
  }
  assert.ok(s.kish_n>0&&s.kish_n<n);
  assert.match(s.sha256,/^[a-f0-9]{64}$/);
 }
});
test('2019 procesado descriptivamente NO equivale a prueba independiente',()=>{
 for(const study of ['3242','3263']){
  const e=registry.elections.find(e=>e.cis?.[0]?.study===study);
  assert.equal(e.status,'microdata_descriptive_processed');
  assert.equal(e.independent_election_test,false);
  assert.equal(e.comparable,false);
 }
});
test('Visualización integrada sin confundir 2019 con validación',()=>{
 const html=fs.readFileSync('validacion-recetas.html','utf8');
 const js=fs.readFileSync('validacion-imputaciones-ui.mjs','utf8');
 assert.match(html,/id="vh-2019-diagnostics"/);
 assert.match(js,/render2019/);
 assert.match(js,/diagnostico_2019_original.json/);
 assert.match(html,/sin imputar/i);
});

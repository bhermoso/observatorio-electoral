import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const raw=JSON.parse(fs.readFileSync('data/microdatos/diagnostico_muestra_cis.json','utf8'));
test('Diagnóstico por estudio suma exactamente las entrevistas originales',()=>{
 const expected={3411:29201,3415:8798,3582:5024};
 for(const [id,n] of Object.entries(expected)){
  const study=raw.studies[id];
  assert.equal(study.n,n);
  assert.equal(Object.values(study.direct).reduce((a,c)=>a+c.n,0),n);
  assert.equal(Object.values(study.turnout).reduce((a,c)=>a+c,0),n);
  const ind=study.direct.INDECISION.n;
  assert.equal(Object.values(study.indecision_recall).reduce((a,c)=>a+(c??0),0),ind);
  assert.ok(study.effective_n>0&&study.effective_n<=n);
 }
});
test('La incertidumbre se identifica como Kish y no un pronóstico',()=>{
 const html=fs.readFileSync('diagnostico-cis.html','utf8');
 const js=fs.readFileSync('diagnostico-cis.mjs','utf8');
 const build=fs.readFileSync('scripts/build.mjs','utf8');
 assert.match(html,/antes de diseñar reglas de imputación/);
 assert.match(html,/sin imputar ningún voto/i);
 assert.match(html,/no puede deducirse/i);
 assert.match(js,/1\.96\*Math\.sqrt/);
 assert.match(js,/no es un intervalo oficial/i);
 assert.match(build,/diagnostico-cis.html/);
 assert.match(build,/diagnostico-cis.mjs/);
 assert.match(fs.readFileSync('construye-estimacion.html','utf8'),/diagnostico-cis.html/);
});

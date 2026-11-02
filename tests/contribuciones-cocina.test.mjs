import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const originals=JSON.parse(fs.readFileSync('data/microdatos/validacion_23j.json','utf8'));
const report=JSON.parse(fs.readFileSync('data/microdatos/contribuciones_cocina_23j.json','utf8'));
test('Cada variación se reconstruye con porcentajes documentados del mismo estudio',()=>{
 for(const c of report.comparaciones)for(const study of c.estudios){
  const src=originals.studies[study.estudio].scenarios;
  for(const row of study.partidos){
   const p=row.partido, target=originals.official_vote_valid_percent[p];
   assert.equal(row.base,src[c.base][p]);
   assert.equal(row.alternativa,src[c.alternativa][p]);
   assert.ok(Math.abs(row.cambio_estimacion_pp-(row.alternativa-row.base))<1e-5);
   assert.ok(Math.abs(row.cambio_error_absoluto_pp-(Math.abs(row.alternativa-target)-Math.abs(row.base-target)))<1e-5);
  }
  const delta=study.partidos.reduce((sum,p)=>sum+p.cambio_error_absoluto_pp,0)/study.partidos.length;
  assert.ok(Math.abs(study.diferencia_mae_pp-delta)<1e-5);
 }
});
test('Las pruebas no declaran efectos causales ni contribuciones acumulables',()=>{
 assert.ok(report.comparaciones.every(c=>c.identificacion_causal===false));
 assert.ok(report.advertencias.some(s=>s.includes('NO pasos acumulativos')));
 assert.ok(report.ausencias.recuerdo.includes('2019'));
 assert.ok(report.ausencias.escanos.includes('no se atribuyen'));
});
test('Simpatía empeora MAE en ambos estudios; participación es inconsistente',()=>{
 const sympa=report.comparaciones.find(c=>c.codigo==='simpatia');
 const turnout=report.comparaciones.find(c=>c.codigo==='participacion');
 assert.ok(sympa.estudios.every(e=>e.diferencia_mae_pp>0));
 assert.ok(turnout.estudios.some(e=>e.diferencia_mae_pp<0));
 assert.ok(turnout.estudios.some(e=>e.diferencia_mae_pp>0));
});

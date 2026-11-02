import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const source=JSON.parse(fs.readFileSync('data/microdatos/validacion_23j.json','utf8'));
const report=JSON.parse(fs.readFileSync('data/microdatos/auditoria_cocina_23j.json','utf8'));
const methods=['decided','sympathy_decided','turnout_decided','published_cis'];
test('Auditoría no confunde intención directa con cuota de voto válido',()=>{
 assert.equal(report.excluido_como_estimacion.metodo,'direct_all');
 assert.ok(!Object.keys(report.resultados_por_estudio['3411']).includes('direct_all'));
});
test('El error se recalcula únicamente de cifras y escrutinio previamente archivados',()=>{
 for(const [id,s] of Object.entries(source.studies)){
  for(const method of methods){
   const mae=source.party_order.reduce((a,p)=>a+Math.abs(s.scenarios[method][p]-source.official_vote_valid_percent[p]),0)/4;
   assert.ok(Math.abs(report.resultados_por_estudio[id][method].mae_pp-mae)<1e-5);
  }
 }
});
test('El ganador de cada estudio se selecciona sin mirar el estudio de contraste',()=>{
 for(const trial of report.pruebas_seleccion_y_traslado){
  const selection=report.resultados_por_estudio[trial.seleccion_estudio];
  const expected=methods.slice().sort((a,b)=>selection[a].mae_pp-selection[b].mae_pp||a.localeCompare(b))[0];
  assert.equal(trial.metodo_seleccionado,expected);
  assert.equal(trial.error_prueba_mae_pp,report.resultados_por_estudio[trial.evaluacion_estudio][expected].mae_pp);
  assert.notEqual(trial.seleccion_estudio,trial.evaluacion_estudio);
 }
});
test('Recuerdo de 2019 no se trata como si fuese referencia de 2023',()=>{
 for(const v of Object.values(source.studies))assert.equal(v.recall_election,'2019-11-10');
 assert.match(report.limitaciones.join(' '),/2019/);
});
test('No se habilitan correcciones automáticas a partir de dos estudios de una elección',()=>{
 assert.match(report.decision_operativa,/No adoptar automáticamente/);
 assert.ok(report.limitaciones.some(x=>x.includes('NO es validación fuera de muestra')));
});

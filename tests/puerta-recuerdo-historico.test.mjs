import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {evaluarRecuerdoHistorico,tablaPuertaRecuerdoHistorico,renderPuertaRecuerdoHistorico} from '../puerta-recuerdo-historico.mjs';
const v=JSON.parse(fs.readFileSync('data/microdatos/validacion_cocina_cis.json','utf8'));
const p=JSON.parse(fs.readFileSync('data/microdatos/puerta-historica-recuerdo-2019-2023.json','utf8'));
test('La receta de recuerdo empeora MAE 23J y hay solo una elección independiente',()=>{
 const r=evaluarRecuerdoHistorico(v,p);
 assert.equal(r.elecciones_independientes_ensayadas,1);
 assert.ok(r.media.recuerdo>r.media.simpatia);
 assert.ok(r.media.participacion>r.media.directa);
 assert.equal(r.puerta.condicion_entrada_motor,'NO_ADMITIR');
 assert.deepEqual(r.estudios.map(x=>x.id),['3411','3415']);
 assert.ok(Math.abs(r.media.recuerdo-3.17)<0.02);
 assert.ok(Math.abs(r.media.participacion-3.07)<0.02);
});
test('2019 no simula falsas validaciones y se bloquean referencias incompletas',()=>{
 const r=evaluarRecuerdoHistorico(v,p);
 const html=tablaPuertaRecuerdoHistorico(r);
 assert.match(html,/homologación electoral pendiente/);
 assert.match(html,/NO ADMITIR/);
 assert.match(html,/una sola elección contrastada/);
 assert.match(renderPuertaRecuerdoHistorico(),/cocina-puerta-recuerdo-contenido/);
 const bad=structuredClone(p);bad.ensayos_2019[0].estado='validado';
 assert.throws(()=>evaluarRecuerdoHistorico(v,bad),/2019 no habilitado/);
 const bad2=structuredClone(v);bad2.estudios['3415'][1].mae=9;
 assert.throws(()=>evaluarRecuerdoHistorico(bad2,p),/incongruente/);
});
test('La auditoría no modifica el motor ni las visualizaciones existentes',()=>{
 const kitchen=fs.readFileSync('cocina.mjs','utf8');
 const build=fs.readFileSync('scripts/build.mjs','utf8');
 const plan=fs.readFileSync('scripts/plan-publicacion.mjs','utf8');
 const home=fs.readFileSync('home-impact.mjs','utf8');
 assert.match(kitchen,/renderPuertaRecuerdoHistorico\(\)/);
 assert.match(kitchen,/bindPuertaRecuerdoHistorico\(\)/);
 assert.match(build,/puerta-recuerdo-historico\.mjs/);
 assert.match(plan,/puerta-recuerdo-historico/);
 for(const id of ['hub-hemiciclo','hub-promedio','hub-micro-resultado'])
  assert.match(home,new RegExp('id="'+id+'"'));
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {metricasCientificas} from '../validacion-cientifica-metricas.mjs';
import {renderPollArchive} from '../polls.mjs';
import {renderPollScatter} from '../encuestas-visual.mjs';
test('métricas visibles coinciden con artefacto Python, mismo soporte',()=>{
 const d=JSON.parse(fs.readFileSync('modelo/validacion/multieleccion.json'));
 for(const [v,x] of Object.entries(d.resumen)){const m=metricasCientificas(d.errores.filter(r=>r.variante===v));for(const k of ['mae','rmse','sesgo','cobertura90','anchura90','interval_score90'])assert.ok(Math.abs(m[k]-x[k])<1e-10,`${v} ${k}`)}
});
test('ninguna candidatura se selecciona implícitamente en el archivo',()=>{
 const source=fs.readFileSync('polls.mjs','utf8');assert.ok(source.includes('<option value="">Selecciona candidatura</option>'));assert.ok(!source.includes("k==='PP'?'selected'"));assert.match(renderPollScatter([],''),/Selecciona una candidatura/);
});
test('la base documental separa recetas heredadas y decisión pendiente del usuario',()=>{
 const d=JSON.parse(fs.readFileSync('data/microdatos/base-cocina.json'));
 assert.equal(d.entrada_motor,false);assert.equal(d.decision_receta_propia,'pendiente_de_discusion_con_el_usuario');assert.deepEqual(d.base_R0.parametros_nuevos_de_cocina_aprobados,[]);
 assert.ok(d.referentes.length>=5);for(const x of d.referentes){assert.equal(x.evidencia,'lectura_directa_documento_original');assert.match(x.sha256,/^[0-9a-f]{64}$/);assert.ok(x.no_publicado.length)}
 assert.match(d.referentes.find(x=>x.instituto==='40dB.').observaciones.recuerdo,/no prueba calibración/);
});

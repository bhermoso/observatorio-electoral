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

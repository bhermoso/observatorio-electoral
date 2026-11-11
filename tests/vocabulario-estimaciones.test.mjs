import test from 'node:test';
import assert from 'node:assert/strict';
import {TIPOS_ESTIMACION,renderTiposEstimacion} from '../tipos-estimacion.mjs';
import {renderHomeImpact} from '../home-impact.mjs';
import {renderPronostico} from '../pronostico-vista.mjs';

test('un único catálogo tiene cuatro clases con estatutos distintos',()=>{
 assert.equal(TIPOS_ESTIMACION.length,4);
 assert.deepEqual(TIPOS_ESTIMACION.map(t=>t.codigo),['instituto','promedio','modelo','microdatos']);
 assert.match(TIPOS_ESTIMACION[2].estado,/Pronóstico operativo/);
 assert.match(TIPOS_ESTIMACION[3].estado,/todavía no alimentan/);
 assert.match(TIPOS_ESTIMACION[1].estado,/no se añade otra vez al motor/);
});
test('portada y pronóstico remiten al mismo vocabulario sin duplicar cifras',()=>{
 const home=renderHomeImpact();
 const p=renderPronostico();
 assert.equal((home.match(/class="tipo-n"/g)||[]).length,4);
 for(const t of TIPOS_ESTIMACION)assert.ok(home.includes(t.titulo),t.titulo);
 assert.match(p,/render|Distinguir las cuatro clases de estimación/);
 assert.ok(p.includes('tipos-resumen'));
 assert.equal((renderTiposEstimacion({compacto:true}).match(/tipos-resumen-item/g)||[]).length,4);
});

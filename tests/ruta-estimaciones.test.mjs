import test from 'node:test';
import assert from 'node:assert/strict';
import {vistaCuatroEstimaciones} from '../ruta-estimaciones.mjs';
test('cuatro pasos y diferencias calculadas, sin estimación inventada de microdatos',()=>{
 const html=vistaCuatroEstimaciones({partido:'PP',casas:[{name:'A',value:29.5},{name:'B',value:32}],promedio:30.2,modelo:31.1,corte:'2026-11-12'});
 assert.equal((html.match(/class="ruta-paso(?: |")/g)||[]).length,4);
 assert.match(html,/29,5 % – 32,0 %/);
 assert.match(html,/30,2 %/);
 assert.match(html,/31,1 %/);
 assert.match(html,/\+0,9 pp frente al promedio/);
 assert.match(html,/No existe una estimación operativa comparable/);
 assert.match(html,/href="#cocina-cap4"/);
});
test('no se infiere un valor cuando falta la referencia o la muestra',()=>{
 const html=vistaCuatroEstimaciones({partido:'Vox',casas:[],promedio:null,modelo:null});
 assert.match(html,/Sin cifras/);
 assert.match(html,/Sin comparación disponible/);
 assert.doesNotMatch(html,/NaN|undefined/);
});
test('escapa el nombre del partido',()=>{
 const html=vistaCuatroEstimaciones({partido:'<b>test</b>',casas:[]});
 assert.doesNotMatch(html,/<b>test<\/b>/);
});

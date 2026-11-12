import test from 'node:test';
import assert from 'node:assert/strict';
import {renderHomeImpact} from '../home-impact.mjs';
import {renderPronostico} from '../pronostico-vista.mjs';

test('la portada distingue cuatro tipos sin atribuir microdatos al motor',()=>{
 const page=renderHomeImpact();
 assert.equal((page.match(/class="tipo-n"/g)||[]).length,4);
 for(const label of ['Estimación de una encuesta','Promedio de encuestas','Nuestra estimación a partir de otras estimaciones','Nuestra estimación a partir de microdatos']){
  assert.ok(page.includes(label),label);
 }
 assert.match(page,/todavía no alimentan el pronóstico operativo/);
 assert.match(page,/los promedios externos sirven de contraste|promedios externos sirven de contraste|no se vuelven a incorporar como entradas/);
});
test('el pronóstico identifica su origen y conserva las secciones de auditoría',()=>{
 const page=renderPronostico();
 assert.match(page,/estimación propia del Observatorio basada en estimaciones publicadas/);
 for(const id of ['pronostico-principal','pronostico-variantes','pronostico-fuentes','pronostico-evaluacion','pronostico-externos','pronostico-capas']){
  assert.ok(page.includes(id),id);
 }
 assert.equal((page.match(/class="pr-reading-group(?: |")/g)||[]).length,3);
});

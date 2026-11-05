import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {compareCodes} from '../scripts/comparar-codigos-more-in-common.mjs';

const input=JSON.parse(fs.readFileSync(new URL('../data/microdatos/homologacion-more-in-common-2026.json',import.meta.url),'utf8'));

test('La etiqueta del código 4 de intención cambia de Sumar a Frente Amplio',()=>{
 const out=compareCodes(input);
 for(const variable of ['intencion_voto_raw','intencion_voto_simpatia','intencion_voto_final']){
  const c=out.cambios_de_significado.find(x=>x.variable===variable&&x.codigo==='4.0');
  assert.ok(c,variable);
  assert.ok(c.diferencias.some(x=>x.ola==='05'&&x.etiqueta==='Sumar'));
  assert.ok(c.diferencias.some(x=>x.ola==='10'&&x.etiqueta==='Frente Amplio'));
 }
 assert.equal(out.homologacion_automatica,false);
 assert.equal(out.participa_motor_29n,false);
 assert.equal(out.calculos_electorales,false);
});
test('El recuerdo de voto 2023 NO cambia el significado del código 4',()=>{
 const c=compareCodes(input).cambios_de_significado;
 assert.ok(!c.some(x=>x.variable==='voto_2023_raw'&&x.codigo==='4.0'));
 assert.ok(!c.some(x=>x.variable==='voto_2023_final'&&x.codigo==='4.0'));
});
test('Nunca se comparan códigos de variables diferentes ni se presupone cero en códigos ausentes',()=>{
 const x={
  esquema:1,
  estudios:[{id:'x-2026-05-01',sha256:'a',matrices:[{variables_relevantes:[{nombre:'voto',categorias_documentadas:[{codigo:'4.0',etiqueta:'Sumar'}]}]}]},
   {id:'x-2026-07-01',sha256:'b',matrices:[{variables_relevantes:[{nombre:'recuerdo',categorias_documentadas:[{codigo:'4.0',etiqueta:'Frente Amplio'}]}]}]},
   {id:'x-2026-09-01',sha256:'c',matrices:[{variables_relevantes:[{nombre:'voto',categorias_documentadas:[{codigo:'4.0',etiqueta:'Sumar'}]}]}]},
   {id:'x-2026-10-01',sha256:'d',matrices:[{variables_relevantes:[{nombre:'voto',categorias_documentadas:[{codigo:'4.0',etiqueta:'Frente Amplio'},{codigo:'32.0',etiqueta:'Adelante Andalucía'}]}]}]}]
 };
 const c=compareCodes(x);
 assert.equal(c.cambios_de_significado.length,1);
 assert.equal(c.cambios_de_significado[0].variable,'voto');
 assert.ok(c.codigos_en_una_sola_ola.some(v=>v.variable==='voto'&&v.codigo==='32.0'));
});
test('El reporte sólo ofrece etiqueta de categorías y trazabilidad, no matrices de entrevistas',()=>{
 const c=compareCodes(input);
 assert.equal(c.olas.length,4);
 assert.equal(c.variables_comunes.includes('intencion_voto_final'),true);
 assert.ok(c.cambios_de_significado.every(x=>x.diferencias.every(v=>typeof v.etiqueta==='string')));
 assert.ok(!JSON.stringify(c).includes('entrevistas_individuales'));
});

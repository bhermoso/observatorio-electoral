import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {renderCatalogoMicrodatos} from '../catalogo-microdatos.mjs';

const read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');
const d=JSON.parse(read('../data/microdatos/catalogo-publico.json'));

test('Catálogo inicial identifica nueve productores y 76 entradas sin duplicados',()=>{
 assert.equal(d.esquema,1);
 assert.equal(d.fuentes.length,9);
 assert.equal(d.estudios.length,76);
 assert.equal(new Set(d.fuentes.map(x=>x.id)).size,9);
 assert.equal(new Set(d.estudios.map(x=>x.id)).size,d.estudios.length);
 assert.ok(d.casas_pendientes.length>=15);
 assert.match(d.descripcion,/parcial|ampliaci/i);
});
test('El catálogo conserva área, originales, estado y formatos sin anunciar cifras inexistentes',()=>{
 const ids=new Set(d.fuentes.map(x=>x.id));
 const estados=new Set(['original_auditado','enlace_documentado','formulario_requerido','registro_requerido','solicitud_requerida','embargado','estructura_sav_verificada']);
 for(const s of d.estudios){
  assert.ok(ids.has(s.productor),s.id+' carece de productor');
  assert.ok(estados.has(s.estado),s.id+' carece de estado reconocido');
  assert.ok(s.pagina.startsWith('https://'),s.id+' URL inválida');
  assert.ok(s.ambito.length>0);
  assert.match(s.fecha,/^\d{4}-\d\d-\d\d$/);
  if(s.archivo)assert.ok(s.archivo.startsWith('https://'));
 }
 assert.equal(d.estudios.filter(s=>s.estado==='original_auditado').length,6);
 assert.ok(d.estudios.some(s=>s.id==='gad3-2019-11-10'&&s.estado==='solicitud_requerida'));
 assert.ok(d.estudios.some(s=>s.id==='gad3-2026-05-11'&&s.archivo.endsWith('.xlsx')));
 assert.ok(d.estudios.some(s=>s.id==='cemop-2019-10-31'));
 assert.ok(d.estudios.some(s=>s.id==='sociometrica-2025-07-28'&&s.archivo.endsWith('linksinline')));
 assert.ok(d.estudios.some(s=>s.id==='cemop-2025-06-17'&&s.estado==='embargado'));
 assert.ok(d.estudios.some(s=>s.id==='cemop-2019-05-10'));
 assert.ok(d.estudios.some(s=>s.id==='more-in-common-2026-10-01'));
 assert.ok(d.estudios.some(s=>s.productor==='icps'&&s.estado==='registro_requerido'));
 assert.ok(d.estudios.some(s=>s.productor==='cis'&&s.estado==='formulario_requerido'));
});
test('La vista está integrada en Cocina, Encuestas y la compilación, y no muestra filas individuales',()=>{
 const html=renderCatalogoMicrodatos();
 assert.match(html,/archivo-microdatos/);
 assert.match(html,/en ampliación/);
 const cocina=read('../cocina.mjs');
 const app=read('../app.mjs');
 const build=read('../scripts/build.mjs');
 assert.ok(cocina.includes('renderCatalogoMicrodatos()'));
 assert.ok(cocina.includes('bindCatalogoMicrodatos()'));
 assert.ok(app.includes('renderCatalogoMicrodatos()'));
 assert.ok(app.includes('bindCatalogoMicrodatos()'));
 assert.ok(build.includes("'catalogo-microdatos.mjs'"));
 assert.ok(build.includes("fs.cpSync('data'"));
 for(const forbidden of ['id_entrevistado','record_level','entregas_personales','respuestas_por_persona'])assert.ok(!JSON.stringify(d).includes('"'+forbidden+'"'));
});

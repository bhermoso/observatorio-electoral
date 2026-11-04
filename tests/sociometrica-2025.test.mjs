import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {renderSocioMetrica} from '../microdatos-sociometrica.mjs';
const read=path=>fs.readFileSync(new URL(path,import.meta.url),'utf8');
const d=JSON.parse(read('../data/microdatos/sociometrica-2025-agregados.json'));

test('Cuatro SAV reales, total de 4383 registros y 0 entrevistas publicadas',()=>{
 assert.equal(d.esquema,1);
 assert.equal(d.tipo,'microdatos_originales_sav_inspeccionados');
 assert.equal(d.estudios.length,4);
 assert.equal(d.estudios.reduce((n,s)=>n+s.n_filas_sav,0),4383);
 assert.equal(d.estudios.reduce((n,s)=>n+s.n_publicado,0),4350);
 assert.equal(d.estudios.find(x=>x.id==='sociometrica-2025-05-27').diferencia_n,34);
 assert.equal(d.estudios.find(x=>x.id==='sociometrica-2025-09-02').diferencia_n,-1);
 assert.ok(d.estudios.every(x=>/^[a-f0-9]{64}$/.test(x.sha256_original)));
 assert.ok(d.estudios.every(x=>x.ponderador_identificado===false));
 for(const x of d.estudios){
   assert.ok(x.n_respuestas<=x.n_base);
   assert.ok(x.partidos_y_categorias_n_20.every(y=>y.n>=20));
   assert.ok(x.partidos_y_categorias_n_20.every(y=>y.pct_muestra>=0&&y.pct_muestra<=100));
 }
});

test('Directa sin ponderar: patrón descriptivo visible, no validación predictiva',()=>{
 const pp=d.estudios.find(x=>x.id==='sociometrica-2025-07-28');
 const may=d.estudios.find(x=>x.id==='sociometrica-2025-05-27');
 const vox=s=>s.partidos_y_categorias_n_20.find(x=>x.etiqueta==='VOX').pct_muestra;
 assert.equal(vox(may),10.54);
 assert.equal(vox(pp),19.82);
 assert.match(d.nota,/no reproduce la estimación publicada/);
 assert.match(d.metodo,/SIN ponderar/);
 assert.match(d.precauciones.join(' '),/2025/);
});
test('Página Cocina, build y catálogo muestran nivel de auditoría correcto',()=>{
 const html=renderSocioMetrica();
 assert.match(html,/SocioMétrica/);
 assert.match(html,/sin confundir respuesta y estimación/);
 const cocina=read('../cocina.mjs'), build=read('../scripts/build.mjs');
 const catalogo=JSON.parse(read('../data/microdatos/catalogo-publico.json'));
 assert.match(cocina,/renderSocioMetrica\(\)/);
 assert.match(cocina,/bindSocioMetrica\(\)/);
 assert.match(build,/'microdatos-sociometrica\.mjs'/);
 assert.ok(catalogo.estudios.filter(x=>x.estado==='estructura_sav_verificada').length===4);
 assert.ok(catalogo.estudios.some(x=>x.id==='sociometrica-2025-05-27'&&x.n_detectado===1034));
 assert.ok(!JSON.stringify(d).includes('datos_personales'));
});

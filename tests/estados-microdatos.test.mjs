import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {microdataState,matchMicrodataFilter,mergeAuditStatuses,renderCatalogoMicrodatos} from '../catalogo-microdatos.mjs';
import {renderEstadoDescargas,renderAuditData} from '../auditoria-microdatos.mjs';
const read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');
const catalog=JSON.parse(read('../data/microdatos/catalogo-publico.json'));
test('Estado real distingue 10 examinados de 0 originales almacenados',()=>{
 const all=catalog.estudios;
 assert.equal(all.length,76);
 assert.equal(all.filter(s=>s.microdatos.original_descargado_alguna_vez).length,10);
 assert.equal(all.filter(s=>s.microdatos.original_almacenado).length,0);
 assert.equal(all.filter(s=>s.microdatos.analisis==='analizado').length,6);
 assert.equal(all.filter(s=>s.microdatos.analisis==='parcial').length,4);
 assert.equal(all.filter(s=>s.microdatos.usado_en_motor_29n).length,0);
 assert.ok(all.every(s=>typeof s.microdatos.enlace_localizado==='boolean'));
 assert.ok(all.every(s=>s.microdatos.original_almacenado!==true));
});
test('Cada estudio comunica si está descargado, almacenado y analizado',()=>{
 const original=catalog.estudios.find(x=>x.id==='40db-2026-10-05');
 const social=catalog.estudios.find(x=>x.id==='sociometrica-2025-07-28');
 const link=catalog.estudios.find(x=>x.id==='more-in-common-2026-10-01');
 assert.match(microdataState(original),/Analizado; original NO guardado/);
 assert.match(microdataState(social),/Análisis parcial; original NO guardado/);
 assert.match(microdataState(link),/Enlace localizado; sin descargar/);
 assert.equal(matchMicrodataFilter(original,'analizados'),true);
 assert.equal(matchMicrodataFilter(original,'almacenados'),false);
 assert.equal(matchMicrodataFilter(link,'descargados'),false);
 assert.equal(matchMicrodataFilter(link,'localizados'),true);
 assert.equal(matchMicrodataFilter(social,'pendientes'),false);
});
test('La descarga temporal observada en manifiesto nunca se finge guardada o analizada',()=>{
 const d={estudios:[{id:'x',microdatos:{original_descargado_alguna_vez:false,original_almacenado:false,analisis:'pendiente',usado_en_motor_29n:false}}]};
 mergeAuditStatuses(d,{archivos:[{id:'x',estado:'matriz_detectada_pendiente_homologacion',sha256:'f'.repeat(64),verificado_en:'2026-11-05T05:00:00Z'}]});
 assert.equal(d.estudios[0].microdatos.original_descargado_alguna_vez,true);
 assert.equal(d.estudios[0].microdatos.original_almacenado,false);
 assert.equal(d.estudios[0].microdatos.analisis,'pendiente');
 assert.match(microdataState(d.estudios[0]),/Descargado temporalmente/);
});
test('El archivo vacío no anuncia descargas ficticias y se integra en Cocina',()=>{
 const seed=JSON.parse(read('../data/microdatos/estado-descargas.json'));
 const html=renderAuditData(seed);
 if(seed.archivos.length){
  assert.match(html,/archivos intentados/);
  assert.match(html,/Archivo origen/);
 }else{assert.match(html,/No hay todavía descargas verificadas/);}
 const ui=renderCatalogoMicrodatos();
 assert.match(ui,/analizado|almacenado/i);
 const app=read('../app.mjs'),build=read('../scripts/build.mjs');
 assert.match(read('../cocina.mjs'),/renderEstadoDescargas\(\)/);
 assert.match(app,/bindEstadoDescargas\(\)/);
 assert.match(build,/'auditoria-microdatos\.mjs'/);
 assert.match(renderEstadoDescargas(),/Almacén de microdatos/);
});

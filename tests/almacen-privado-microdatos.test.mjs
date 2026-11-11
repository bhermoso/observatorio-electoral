import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {mergeAuditStatuses,mergeStoredStatuses,microdataState,matchMicrodataFilter} from '../catalogo-microdatos.mjs';
import {renderAuditData} from '../auditoria-microdatos.mjs';

const load=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url),'utf8'));
const hash='813f5a4f7b8cad45bb4f184b7744e4937d8651b34a09bee93b149513c9ff106f';
const original=load('../data/microdatos/catalogo-publico.json');
const audit=load('../data/microdatos/estado-descargas.json');

test('El original More in Common octubre 2026 se documentó con SHA-256 completo',()=>{
 const row=audit.archivos.find(x=>x.id==='more-in-common-2026-10-01');
 assert.equal(row.sha256,hash);
 assert.equal(row.bytes,615299);
 assert.equal(row.estado,'matriz_detectada_pendiente_homologacion');
});

test('Un certificado real y coincidente acredita original almacenado, no cocina aprobada',()=>{
 const d=structuredClone(original);
 mergeAuditStatuses(d,audit);
 mergeStoredStatuses(d,{stored:[{
   study_id:'more-in-common-2026-10-01',sha256:hash,bytes:615299,
   stored_at:'2026-11-05T09:00:00Z',verified_at:'2026-11-05T09:02:00Z',
   status:'conservado_pendiente_homologacion'
 }]});
 const x=d.estudios.find(x=>x.id==='more-in-common-2026-10-01');
 assert.equal(x.microdatos.original_almacenado,true);
 assert.equal(x.microdatos.analisis,'pendiente');
 assert.equal(x.microdatos.usado_en_motor_29n,false);
 assert.match(microdataState(x),/Almacenado; análisis pendiente/);
 assert.equal(matchMicrodataFilter(x,'almacenados'),true);
 assert.equal(d.estudios.filter(x=>x.microdatos.original_almacenado).length,1);
});

test('No se inventa custodia sin manifiesto o con SHA incorrecto',()=>{
 for(const scenario of [
   {stored:[{study_id:'more-in-common-2026-10-01',sha256:'a'.repeat(64),status:'conservado_pendiente_homologacion'}]},
   {stored:[{study_id:'more-in-common-2026-10-01',sha256:hash,status:'pending'}]},
   {stored:[]},
   {}
 ]){
  const d=structuredClone(original);
  mergeAuditStatuses(d,audit);
  mergeStoredStatuses(d,scenario);
  const x=d.estudios.find(x=>x.id==='more-in-common-2026-10-01');
  assert.equal(x.microdatos.original_almacenado,false);
 }
 const d=structuredClone(original);
 mergeStoredStatuses(d,{stored:[{study_id:'more-in-common-2026-10-01',sha256:hash,status:'conservado_pendiente_homologacion'}]});
 assert.equal(d.estudios.find(x=>x.id==='more-in-common-2026-10-01').microdatos.original_almacenado,false);
});

test('La pantalla presenta custodia separada de descargas y nunca publica acceso binario',()=>{
 const text=renderAuditData(audit,{stored:[{study_id:'more-in-common-2026-10-01',sha256:hash}]});
 assert.ok(text.includes('Depósito privado recuperable: 1 de '+audit.archivos.length+' originales'));
 assert.match(text,/Sí · depósito privado/);
 assert.doesNotMatch(text,/storage\/v1\/object/);
 assert.match(renderAuditData(audit),/sin comprobar/);
});

test('La función privada prohíbe URL arbitraria y exige repositorio, rama y OIDC verificados',()=>{
 const src=fs.readFileSync(new URL('../docs/archivo-tecnico/supabase/functions/almacen-microdatos/index.ts',import.meta.url),'utf8');
 assert.match(src,/createRemoteJWKSet/);
 assert.match(src,/payload\.repository/);
 assert.match(src,/payload\.workflow_ref/);
 assert.match(src,/payload\.ref/);
 assert.match(src,/verifyGitHub\(/);
 assert.match(src,/integridad_verificada:true/);
 assert.doesNotMatch(src,/createSignedUrl|object\/public/);
 assert.match(src,/original_privado_no_coincide_con_auditoria/);
});

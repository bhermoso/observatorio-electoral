import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {calculateMeta} from '../metapromedio.mjs';
const references=JSON.parse(readFileSync('data/references.json','utf8'));
test('Media de instantáneas verificadas, con contribuciones y aproximación trazables',()=>{
 const r=calculateMeta(references,{cutoff:'2026-11-19'});
 assert.equal(r.rows.filter(x=>x.weight>0).length,3);
 assert.ok(Math.abs(r.results.PP.value-(31.1+31.4+31.5)/3)<1e-10);
 assert.equal(r.results.PP.contributors.length,3);
 assert.equal(r.results.PP.contributors[0].approximate,true);
 assert.ok(Math.abs(r.results.PP.contributors.reduce((s,x)=>s+x.share,0)-1)<1e-10);
});
test('Corte, caducidad, semivida y exclusión cambian los pesos sin anticipar publicaciones',()=>{
 const r=calculateMeta(references,{cutoff:'2026-11-14',windowDays:1,halfLife:1,weights:{'Demócrata':0}});
 assert.equal(r.rows[2].reason,'Excluida por el usuario');
 assert.equal(r.rows[0].weight,1);
 assert.equal(r.rows[1].weight,.5);
 assert.ok(Math.abs(r.results.PP.value-(31.1+31.4*.5)/1.5)<1e-10);
 const prior=calculateMeta(references,{cutoff:'2026-11-12'});
 assert.equal(prior.results.PP.value,null);
 assert.ok(prior.rows.every(x=>x.reason==='Posterior al corte'));
});
test('Se rechazan parámetros inválidos y no se dan por cero candidaturas incompatibles',()=>{
 assert.throws(()=>calculateMeta(references,{cutoff:'2026-02-30'}),/Fecha/);
 assert.throws(()=>calculateMeta(references,{cutoff:'2026-11-19',weights:{'EL PAÍS':-1}}),/Peso/);
 assert.equal(calculateMeta(references,{cutoff:'2026-11-19'}).results['Frente Amplio'],undefined);
 assert.throws(()=>calculateMeta([],{cutoff:'2026-11-19'}),/fuente homologada/);
});

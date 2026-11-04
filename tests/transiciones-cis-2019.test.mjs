import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {renderTransiciones2019} from '../homologacion-2019.mjs';

const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const report=read('data/microdatos/transiciones_2019.json');
const sources=read('data/microdatos/cotejo_originales_2019.json');

test('Recodificaciones originales: cada clave observada de código + provincia es unívoca',()=>{
 assert.equal(report.schema_version,1);
 assert.equal(report.studies['3242'].n,16194);
 assert.equal(report.studies['3263'].n,17650);
 for(const sid of ['3242','3263']){
  const d=report.studies[sid],src=sources.studies[sid];
  assert.equal(d.source_zip_sha256,src.archive_sha256);
  assert.equal(d.n,src.n);
  assert.equal(d.fully_explained_observed_records,d.n);
  assert.equal(d.direct_vote_retained_in_votosimg.n,d.direct_vote_retained_in_votosimg.total);
  assert.equal(d.direct_vote_retained_in_votosimg.n+d.requires_sympathy_or_special_recode.n,d.n);
  for(const field of ['raw_vote_to_recoded_by_province','raw_sympathy_to_recoded_by_province','non_candidate_raw_sympathy_to_combined_by_province']){
   assert.ok(d[field].observed_keys>0);
   assert.equal(d[field].ambiguous_keys,0);
   assert.equal(d[field].minimum_disagreements,0);
  }
  assert.ok(d.examples_vote_recode_min_cell_20.every(v=>
   Object.values(v.destinations).reduce((a,b)=>a+b,0)===v.n));
 }
 assert.equal(report.studies['3242'].raw_vote_to_recoded_by_province.observed_keys,764);
 assert.equal(report.studies['3263'].raw_vote_to_recoded_by_province.observed_keys,832);
});
test('Las candidaturas territoriales se separan en lugar de fusionarlas',()=>{
 const april=report.studies['3242'].examples_vote_recode_min_cell_20.find(x=>x.code_from==='3');
 const november=report.studies['3263'].examples_vote_recode_min_cell_20.find(x=>x.code_from==='21');
 const masPais=report.studies['3263'].examples_vote_recode_min_cell_20.find(x=>x.code_from==='50');
 assert.deepEqual(april.destinations,{'3':592,'6':65});
 assert.deepEqual(november.destinations,{'6':52,'21':632,'67':61});
 assert.equal(masPais.destinations['50'],69);
 assert.equal(masPais.destinations['95'],88);
 assert.ok(!Object.keys(masPais.destinations).includes('SUMAR'));
});
test('El informe visual comunica datos, límites y protección de originales',()=>{
 const html=renderTransiciones2019(report,sources);
 assert.match(html,/CIS 3242/);
 assert.match(html,/CIS 3263/);
 assert.match(html,/33\.844/);
 assert.match(html,/En Común–Unidas Podemos/);
 assert.match(html,/Más País/);
 assert.match(html,/Claves ambiguas/);
 assert.match(html,/No se ha modificado el Motor 29N/);
 assert.match(html,/transformaciones agrupadas/i);
 assert.doesNotMatch(html,/entrevistados individuales/);
 assert.throws(()=>renderTransiciones2019({},sources),/Falta el cotejo/);
 const corrupted=structuredClone(report);
 corrupted.studies['3242'].source_zip_sha256='0'.repeat(64);
 assert.throws(()=>renderTransiciones2019(corrupted,sources),/no coincide/);
});
test('La generación pública incorpora fuente agregada, no los ZIP individuales',()=>{
 const build=fs.readFileSync('scripts/build.mjs','utf8');
 const ui=fs.readFileSync('homologacion-2019.mjs','utf8');
 const script=fs.readFileSync('scripts/auditar_transiciones_cis_2019.py','utf8');
 assert.match(build,/fs\.cpSync\('data','dist\/data'/);
 assert.match(ui,/transiciones_2019\.json/);
 assert.match(ui,/renderTransiciones2019/);
 assert.match(script,/minimum_disagreements/);
 assert.match(script,/hashlib\.sha256/);
 assert.match(script,/OTRAS_TRANSFORMACIONES_AGRUPADAS/);
 const manifest=fs.readFileSync('data/microdatos/transiciones_2019.json','utf8');
 assert.ok(!manifest.includes('numero_entrevista'));
});

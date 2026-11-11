import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';
test('El grafo de módulos del cliente no depende del backend retirado',()=>{
 const seen=new Set();function visit(file){if(seen.has(file))return;seen.add(file);const s=fs.readFileSync(file,'utf8');
  assert.doesNotMatch(s,/https:\/\/[^'"\s]*supabase\.co|SUPABASE_SERVICE_ROLE_KEY/,file);
  for(const m of s.matchAll(/from\s*['"](\.\.?\/[^'"]+\.mjs)['"]/g))visit(path.normalize(path.join(path.dirname(file),m[1])));
 }visit('app.mjs');assert.ok(seen.size>25);
 for(const file of fs.readdirSync('.github/workflows'))assert.doesNotMatch(fs.readFileSync('.github/workflows/'+file,'utf8'),/supabase\.co|SUPABASE_SERVICE_ROLE_KEY/,file);
});
test('La custodia pública es solo un certificado de los cuatro originales del depósito privado',()=>{
 const d=JSON.parse(fs.readFileSync('data/microdatos/custodia.json')),m=JSON.parse(fs.readFileSync('data/microdatos/custodia-manifiesto.json'));
 assert.equal(d.provider,'github_private');assert.match(d.commit,/^[a-f0-9]{40}$/);assert.equal(d.stored.length,4);
 for(const x of m.files){const row=d.stored.find(r=>r.study_id===x.study_id);assert.equal(row.sha256,x.sha256);assert.equal(row.bytes,x.bytes);assert.equal(row.status,'conservado_pendiente_homologacion');}
 assert.doesNotMatch(JSON.stringify(d),/base64|data:application|storage\/v1\/object/);
});

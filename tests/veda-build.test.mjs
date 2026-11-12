import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
test('Una compilación en veda no copia datos ni conserva artefactos anteriores',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'oee-veda-'));
 fs.mkdirSync(path.join(root,'scripts'));fs.mkdirSync(path.join(root,'dist','data','modelo'),{recursive:true});
 for(const file of ['build.mjs','veda.mjs'])fs.copyFileSync('scripts/'+file,path.join(root,'scripts',file));
 for(const file of fs.readdirSync('.').filter(f=>f.endsWith('.mjs')))fs.copyFileSync(file,path.join(root,file));
 fs.writeFileSync(path.join(root,'dist','data','modelo','pronostico.json'),'SINTETICO');
 const code="const D=Date;globalThis.Date=class extends D{constructor(...a){super(...(a.length?a:['2026-11-25T12:00:00Z']))}};await import('./scripts/build.mjs');";
 const r=spawnSync(process.execPath,['--input-type=module','-e',code],{cwd:root,encoding:'utf8'});
 assert.equal(r.status,0,r.stderr);assert.deepEqual(fs.readdirSync(path.join(root,'dist')).sort(),['.nojekyll','index.html','pronostico.html','version-publica.json']);
 const metadata=JSON.parse(fs.readFileSync(path.join(root,'dist','version-publica.json'),'utf8'));
 assert.equal(metadata.veda,true);assert.equal(metadata.commit,null);assert.doesNotMatch(JSON.stringify(metadata),/partidos|escanos|pronostico/);
 assert.match(fs.readFileSync(path.join(root,'dist','index.html'),'utf8'),/publicación suspendida/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
test('La publicación bloquea un pronóstico calculado con otro archivo de encuestas',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'oee-sincronia-'));
 try{
  for(const dir of ['scripts','data','modelo/salida'])fs.mkdirSync(path.join(root,dir),{recursive:true});
  for(const name of ['build.mjs','veda.mjs'])fs.copyFileSync('scripts/'+name,path.join(root,'scripts',name));
  for(const name of fs.readdirSync('.').filter(f=>f.endsWith('.mjs')))fs.copyFileSync(name,path.join(root,name));
  fs.writeFileSync(path.join(root,'data/polls.json'),'[]');
  fs.writeFileSync(path.join(root,'modelo/salida/pronostico.json'),JSON.stringify({actualizacion:{archivo_sha256:'antiguo'}}));
  const code="const D=Date;globalThis.Date=class extends D{constructor(...a){super(...(a.length?a:['2026-11-11T12:00:00Z']))}};await import('./scripts/build.mjs');";
  const r=spawnSync(process.execPath,['--input-type=module','-e',code],{cwd:root,encoding:'utf8'});
  assert.notEqual(r.status,0);assert.match(r.stderr,/Pronóstico desactualizado/);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});

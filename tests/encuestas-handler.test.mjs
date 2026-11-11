import test,{before,after,mock} from 'node:test';
before(()=>mock.timers.enable({apis:['Date'],now:Date.parse('2026-11-11T10:00:00Z')}));
after(()=>mock.timers.reset());
import assert from 'node:assert/strict';
let handler;
globalThis.Deno={env:{get:name=>name==='SUPABASE_URL'?'https://database.test':'test-service-role'},serve:fn=>{handler=fn;}};
await import('../docs/archivo-tecnico/supabase/functions/encuestas/index.ts');
const req=(action,method='GET',extra={})=>new Request('https://edge.test/?action='+action,{method,...extra});
const response=value=>new Response(JSON.stringify(value),{headers:{'Content-Type':'application/json'}});
test('Contratos del servicio: status, approved, caché, fallos RSS y edición sin credencial',async()=>{
 const original=globalThis.fetch;let claimed=false,patches=[];
 globalThis.fetch=async(url,options={})=>{
  if(url.includes('rpc/claim_poll_scan'))return response(claimed);
  if(url.includes('poll_update_cache')){
   if(options.method==='PATCH'){patches.push(JSON.parse(options.body));return response([]);}
   return response([{checked_at:'2026-11-10T10:00:00Z',candidates:[{title:'Anterior'}],errors:[]}]);
  }
  if(url.includes('poll_submissions'))return response([{record:{id:'verified'}}]);
  return new Response('upstream failed',{status:502});
 };
 try{
  assert.equal((await (await handler(req('approved'))).json())[0].id,'verified');
  assert.equal((await handler(req('status'))).status,200);
  assert.equal((await (await handler(req('scan','POST'))).json()).cached,true);
  claimed=true;
  const failed=await handler(req('scan','POST'));assert.equal(failed.status,502);
  const detail=await failed.json();assert.equal(detail.sources.length,5);assert.match(detail.errors[0],/HTTP 502/);
  assert.equal(patches.length,1);assert.equal(patches[0].candidates,undefined);assert.equal(patches[0].checked_at,undefined);
  assert.equal(patches[0].locked_until,'1970-01-01T00:00:00Z');
  assert.equal((await handler(req('submit','POST'))).status,401);
  assert.equal((await handler(req('status','GET',{headers:{Origin:'https://malicious.test'}}))).status,403);
 }finally{globalThis.fetch=original;}
});

test('Submit guarda una ficha contrastada, rechaza duplicados y falla cerrado sin archivo',async()=>{
 const fs=await import('node:fs');
 const p={...JSON.parse(fs.readFileSync(new URL('../data/polls.json',import.meta.url)))[0],id:'prueba-editor',seats:null};
 const key='x'.repeat(40),digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(key)))).map(b=>b.toString(16).padStart(2,'0')).join('');
 const original=globalThis.fetch;let archive=[],available=true,saved=[];
 globalThis.fetch=async(url,options={})=>{
  if(url.includes('poll_editor_config'))return response([{key_hash:digest}]);
  if(url.includes('raw.githubusercontent'))return available?response(archive):new Response('',{status:503});
  if(url.includes('poll_submissions')){if(options.method==='POST'){saved.push(JSON.parse(options.body));return response([]);}return response([]);}
  throw Error('Unexpected URL');
 };
 const submit=()=>handler(req('submit','POST',{headers:{'X-Editor-Key':key,'Content-Type':'application/json'},body:JSON.stringify(p)}));
 try{
  assert.equal((await submit()).status,201);assert.equal(saved.length,1);assert.equal(saved[0].record.id,p.id);
  archive=[p];assert.equal((await submit()).status,409);assert.equal(saved.length,1);
  available=false;assert.equal((await submit()).status,503);assert.equal(saved.length,1);
 }finally{globalThis.fetch=original;}
});

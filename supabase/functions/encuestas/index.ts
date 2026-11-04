import {fingerprint,validateSubmission,parseFeed,inBlackout} from './core.mjs';
const origin='https://bhermoso.github.io';
const base=Deno.env.get('SUPABASE_URL')!;
const service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
async function db(path:string,method='GET',body?:unknown) {
 const r=await fetch(base+'/rest/v1/'+path,{method,headers:{apikey:service,Authorization:'Bearer '+service,'Content-Type':'application/json',Prefer:'return=representation'},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(12000)});
 if(!r.ok)throw Error('No se pudo guardar o consultar el servicio.');
 const t=await r.text();return t?JSON.parse(t):null;
}
const hash=async(s:string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))).map(b=>b.toString(16).padStart(2,'0')).join('');
Deno.serve(async(req:Request)=>{
 const cors={'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type, X-Editor-Key','Vary':'Origin','Cache-Control':'no-store','Content-Type':'application/json; charset=utf-8'};
 const reply=(value:unknown,status=200)=>new Response(JSON.stringify(value),{status,headers:cors});
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
 if(req.headers.get('origin')&&req.headers.get('origin')!==origin)return reply({error:'Origen no autorizado.'},403);
 if(inBlackout())return reply({error:'Publicación suspendida durante la veda electoral.',veda:true},451);
 const action=new URL(req.url).searchParams.get('action')||'status';
 try {
  if(req.method==='GET'&&action==='approved')return reply((await db('poll_submissions?select=record&order=created_at.asc&limit=1000')).map((x:any)=>x.record));
  if(req.method==='GET'&&action==='status')return reply((await db('poll_update_cache?id=eq.1&select=checked_at,candidates,errors,locked_until'))[0]);
  if(req.method!=='POST')return reply({error:'Método no permitido.'},405);
  if(action==='scan') {
   const claimed=await db('rpc/claim_poll_scan','POST',{});
   if(!claimed)return reply({...((await db('poll_update_cache?id=eq.1&select=checked_at,candidates,errors,locked_until'))[0]),cached:true});
   const queries=['encuesta elecciones generales (CIS OR 40dB) when:14d','encuesta elecciones generales (GAD3 OR "Sigma Dos") when:14d','encuesta elecciones generales (Sociométrica OR IMOP) when:14d','encuesta elecciones generales (Sondaxe OR "Target Point" OR Hamalgama) when:14d'];
   const results=await Promise.all(queries.map(async q=>{
    try {const u='https://news.google.com/rss/search?'+new URLSearchParams({q,hl:'es',gl:'ES',ceid:'ES:es'});
     const r=await fetch(u,{signal:AbortSignal.timeout(12000)});if(!r.ok)throw Error('HTTP '+r.status);
     const xml=await r.text();if(xml.length>2000000)throw Error('Respuesta demasiado grande');
     return {items:parseFeed(xml),error:null};
    }catch{return {items:[],error:'Búsqueda no disponible: '+q};}
   }));
   const unique=new Map();for(const x of results)for(const item of x.items)unique.set(item.url,item);
   const data={checked_at:new Date().toISOString(),candidates:[...unique.values()].slice(0,80),errors:results.flatMap(x=>x.error?[x.error]:[])};
   // Retain previous candidates if every source failed; never report an empty success.
   if(results.every(x=>x.error)) {
    await db('poll_update_cache?id=eq.1','PATCH',{errors:data.errors});
    return reply({error:'No se pudieron consultar las fuentes. Se conserva la búsqueda anterior.'},502);
   }
   await db('poll_update_cache?id=eq.1','PATCH',data);return reply(data);
  }
  if(action==='submit') {
   const key=req.headers.get('x-editor-key')||'';
   if(key.length<40||key.length>100)return reply({error:'Clave de edición incorrecta.'},401);
   const conf=(await db('poll_editor_config?id=eq.1&select=key_hash'))[0];
   if(!conf||await hash(key)!==conf.key_hash)return reply({error:'Clave de edición incorrecta.'},401);
   if(Number(req.headers.get('content-length')||0)>24000)return reply({error:'Ficha demasiado grande.'},413);
   // Stream limit also applies when Content-Length is absent.
   const reader=req.body?.getReader();if(!reader)return reply({error:'Falta la ficha.'},400);
   let size=0,text='';const decoder=new TextDecoder();
   while(true){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>24000){await reader.cancel();return reply({error:'Ficha demasiado grande.'},413);}text+=decoder.decode(value,{stream:true});}text+=decoder.decode();
   let p;try{p=validateSubmission(JSON.parse(text));}catch(e){return reply({error:e.message||'Ficha inválida.'},400);}
   // Check the current source archive; fail closed if it is unavailable.
   const r=await fetch('https://raw.githubusercontent.com/bhermoso/observatorio-electoral/main/data/polls.json',{signal:AbortSignal.timeout(12000)});
   if(!r.ok)return reply({error:'No se pudo comprobar el archivo actual. Inténtalo después.'},503);
   const existing=await r.json();
   const queued=(await db('poll_submissions?select=record&limit=1000')).map((x:any)=>x.record);
   const fp=fingerprint(p);
   if([...existing,...queued].some(x=>x.id===p.id||fingerprint(x)===fp))return reply({error:'Esa encuesta o muestra ya está registrada. No se ha duplicado.'},409);
   await db('poll_submissions','POST',{id:p.id,fingerprint:fp,record:p});
   return reply({saved:true,id:p.id,message:'Ficha guardada. La incorporación al archivo y el recálculo se realizarán en la revisión automática diaria (07:40 UTC).'},201);
  }
  return reply({error:'Acción desconocida.'},404);
 }catch{ return reply({error:'El servicio no pudo completar la operación. Inténtalo de nuevo.'},503); }
});

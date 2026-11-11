/** OEE: guardado privado y verificable de microdatos públicos para análisis propio.
 * No permite subir bytes arbitrarios ni descargar originales desde la web.
 * POST solo con identidad GitHub Actions OIDC firmada y vinculada a este workflow.
 */
import { createRemoteJWKSet, jwtVerify } from 'npm:jose@5.9.6';

const PROJECT='https://gjzihgfzxorpvevrrfkh.supabase.co';
const AUDIENCE=PROJECT+'/functions/v1/almacen-microdatos';
const GH_ISSUER='https://token.actions.githubusercontent.com';
const JWKS=createRemoteJWKSet(new URL(GH_ISSUER+'/.well-known/jwks'));
const BUCKET='oee-microdatos-originales';
const GH_WORKFLOW='bhermoso/observatorio-electoral/.github/workflows/guardar-microdatos.yml@refs/heads/main';
const SERVICE=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const DB_URL=Deno.env.get('SUPABASE_URL') || PROJECT;
const ORIGIN='https://bhermoso.github.io';

/** Lista de archivos publicados explícitamente por More in Common para análisis propios.
 * Huellas de primera auditoría OEE de 05/11/2026; no se aceptan cambios silenciosos.
 */
const STUDIES:Record<string,{url:string;sha256:string;bytes:number;permission:string}>={
 'more-in-common-2026-05-01':{
  url:'https://moreincommon.es/data/microdatos-2026-05.zip',
  sha256:'3a65823bcbd3b94df84f77650755f8bdf47b22e0ab4a4c252136d986a2b5b3f8',
  bytes:286799,permission:'More in Common España ofrece estos microdatos para análisis propios en su página Pulso electoral.'
 },
 'more-in-common-2026-07-01':{
  url:'https://moreincommon.es/data/microdatos-2026-07.zip',
  sha256:'6d369d9d91ccda486cddc64ba7cb80af265b263e12e413696c5c42fb843b0a71',
  bytes:270287,permission:'More in Common España ofrece estos microdatos para análisis propios en su página Pulso electoral.'
 },
 'more-in-common-2026-09-01':{
  url:'https://moreincommon.es/data/microdatos-2026-09.zip',
  sha256:'8f31b4042f7219903ba698d2955bf868ceee2c3ae4a86eea1939ece3c0821b27',
  bytes:293998,permission:'More in Common España ofrece estos microdatos para análisis propios en su página Pulso electoral.'
 },
 'more-in-common-2026-10-01':{
  url:'https://moreincommon.es/data/microdatos-2026-10.zip',
  sha256:'813f5a4f7b8cad45bb4f184b7744e4937d8651b34a09bee93b149513c9ff106f',
  bytes:615299,permission:'More in Common España ofrece estos microdatos para análisis propios en su página Pulso electoral.'
 }
};

const safeReply=(obj:unknown,status=200)=>{
 const h={'Access-Control-Allow-Origin':ORIGIN,
 'Access-Control-Allow-Methods':'GET,POST,OPTIONS',
 'Access-Control-Allow-Headers':'Authorization,Content-Type',
 'Cache-Control':'no-store','Content-Type':'application/json; charset=utf-8','Vary':'Origin'};
 return new Response(JSON.stringify(obj),{status,headers:h});
};
async function db(path:string,method='GET',body?:unknown){
 if(!SERVICE)throw Error('servicio_no_configurado');
 const res=await fetch(DB_URL+'/rest/v1/'+path,{
  method,headers:{'apikey':SERVICE,'Authorization':'Bearer '+SERVICE,'Content-Type':'application/json',
   'Prefer':'resolution=merge-duplicates,return=representation'},
  body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(12000)});
 if(!res.ok)throw Error('registro_privado_error_'+res.status);
 return res.json();
}
const storageUrl=(path:string)=>DB_URL+'/storage/v1/object/authenticated/'+BUCKET+'/'+path;
const putUrl=(path:string)=>DB_URL+'/storage/v1/object/'+BUCKET+'/'+path;
async function sha256(data:ArrayBuffer){
 const digest=new Uint8Array(await crypto.subtle.digest('SHA-256',data));
 return Array.from(digest,x=>x.toString(16).padStart(2,'0')).join('');
}
async function verifyGitHub(token:string){
 if(!token||token.length>8000)throw Error('identidad_no_autorizada');
 const {payload}=await jwtVerify(token,JWKS,{issuer:GH_ISSUER,audience:AUDIENCE,
  algorithms:['RS256'],clockTolerance:'5s'});
 if(payload.repository!=='bhermoso/observatorio-electoral'||
    payload.workflow_ref!==GH_WORKFLOW||
    payload.ref!=='refs/heads/main'||
    !['push','workflow_dispatch'].includes(String(payload.event_name))){
   throw Error('identidad_no_autorizada');
 }
}
async function readStorage(path:string):Promise<ArrayBuffer|null>{
 const r=await fetch(storageUrl(path),{headers:{'apikey':SERVICE,'Authorization':'Bearer '+SERVICE},
  signal:AbortSignal.timeout(20000),cache:'no-store'});
 if(r.status===404||r.status===400)return null;
 if(!r.ok)throw Error('lectura_privada_error_'+r.status);
 return r.arrayBuffer();
}
async function putStorage(path:string,bytes:ArrayBuffer){
 const resp=await fetch(putUrl(path),{method:'POST',headers:{
  'apikey':SERVICE,'Authorization':'Bearer '+SERVICE,'Content-Type':'application/zip',
  'Cache-Control':'no-store','x-upsert':'false'},
  body:bytes,signal:AbortSignal.timeout(30000)});
 if(!resp.ok)throw Error('guardado_privado_error_'+resp.status);
}
async function store(studyId:string){
 const approved=STUDIES[studyId];
 if(!approved)return safeReply({error:'Estudio no autorizado para conservación.'},422);
 const path=studyId+'/'+approved.sha256+'.zip';
 let recovered=await readStorage(path);
 let alreadyStored=Boolean(recovered);
 if(recovered){
  if(recovered.byteLength!==approved.bytes||await sha256(recovered)!==approved.sha256)
   throw Error('original_privado_no_coincide_con_auditoria');
 }else{
  const response=await fetch(approved.url,{headers:{Accept:'application/zip,application/octet-stream'},
   signal:AbortSignal.timeout(25000),redirect:'error'});
  if(!response.ok)throw Error('fuente_no_descargable_'+response.status);
  if(Number(response.headers.get('content-length')||0)>1500000)
   throw Error('fuente_excede_limite_estudio');
  const bytes=await response.arrayBuffer();
  const zipStart=new Uint8Array(bytes,0,4);
  if(bytes.byteLength!==approved.bytes||zipStart[0]!==80||zipStart[1]!==75)
    throw Error('formato_o_tamano_no_coincidente');
  if(await sha256(bytes)!==approved.sha256)throw Error('huella_original_cambiada');
  await putStorage(path,bytes);
  recovered=await readStorage(path);
  alreadyStored=false;
 }
 if(!recovered||recovered.byteLength!==approved.bytes||
     await sha256(recovered)!==approved.sha256){
  throw Error('no_se_puede_recuperar_el_original_guardado');
 }
 const now=new Date().toISOString();
 await db('microdata_originals?on_conflict=study_id,sha256','POST',{
  study_id:studyId,sha256:approved.sha256,size_bytes:approved.bytes,
  storage_path:path,source_url:approved.url,permission_basis:approved.permission,
  reviewed_source:'https://moreincommon.es/pulso-electoral.html',
  status:'conservado_pendiente_homologacion',integrity_verified_at:now
 });
 return safeReply({
  ok:true,study_id:studyId,original_conservado:true,
  integridad_verificada:true,sha256:approved.sha256,bytes:approved.bytes,
  ya_existia:alreadyStored,uso_en_motor_29n:false
 });
}
Deno.serve(async(req:Request)=>{
 if(req.method==='OPTIONS')return new Response(null,{status:204,
  headers:{'Access-Control-Allow-Origin':ORIGIN,'Access-Control-Allow-Methods':'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers':'Authorization,Content-Type'}});
 if(req.headers.get('origin')&&req.headers.get('origin')!==ORIGIN)
  return safeReply({error:'Origen no autorizado'},403);
 const action=new URL(req.url).searchParams.get('action')||'status';
 if(req.method==='GET'&&action==='status'){
  try{
   const rows=await db('microdata_originals?select=study_id,sha256,size_bytes,stored_at,integrity_verified_at,status&order=stored_at.desc');
   const safe=(Array.isArray(rows)?rows:[]).map(x=>({study_id:x.study_id,sha256:x.sha256,
     bytes:x.size_bytes,stored_at:x.stored_at,verified_at:x.integrity_verified_at,status:x.status}));
   return safeReply({stored:safe,total:safe.length,note:'Solo metadatos. Los originales están en Storage privado y no tienen URLs públicas.'});
  }catch{return safeReply({error:'No se puede leer el inventario privado.'},503)}
 }
 if(req.method!=='POST'||action!=='store')return safeReply({error:'Operación no disponible'},405);
 try{
  const header=req.headers.get('authorization')||'';
  if(!header.startsWith('Bearer '))return safeReply({error:'Solo trabajo autorizado.'},401);
  await verifyGitHub(header.slice(7));
 }catch{return safeReply({error:'Identidad GitHub Actions no verificada.'},403)}
 let id:string;
 try{const data=await req.json();id=String(data?.study_id||'');}
 catch{return safeReply({error:'Petición inválida.'},400)}
 try{return await store(id)}
 catch(err){
  const error=err instanceof Error?err.message:'fallo_no_identificado';
  return safeReply({error:'No se ha certificado la conservación.',detalle:error.slice(0,90)},502)
 }
});

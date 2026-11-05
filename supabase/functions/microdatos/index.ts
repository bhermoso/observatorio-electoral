import {fileLinks,microNews,choosePages,knownLinks,makeCandidates} from './core.mjs';
const origin='https://bhermoso.github.io';
const base=Deno.env.get('SUPABASE_URL')!;
const service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const catalogUrl='https://raw.githubusercontent.com/bhermoso/observatorio-electoral/main/data/microdatos/catalogo-publico.json';
const fetchTimeout=8500;
const queries=[
  ['EL PAÍS / 40dB','"microdatos" "40dB" "encuesta" when:90d'],
  ['EL ESPAÑOL / SocioMétrica','"microdatos" "SocioMétrica" when:90d'],
  ['GAD3','"microdatos" "GAD3" encuesta when:180d'],
  ['CIS / otras casas','"microdatos" "encuesta" elecciones when:60d'],
  ['Publicación de bases','"respuestas individuales" "encuesta" when:90d']
];
async function db(path:string,method='GET',body?:unknown){
 const r=await fetch(base+'/rest/v1/'+path,{method,
  headers:{apikey:service,Authorization:'Bearer '+service,'Content-Type':'application/json',Prefer:'return=representation'},
  body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(12000)});
 if(!r.ok)throw Error('No se pudo consultar el almacén de búsquedas.');
 const t=await r.text();return t?JSON.parse(t):null;
}
const fetchText=async(url:string)=>{
 const r=await fetch(url,{headers:{Accept:'text/html,application/json,application/rss+xml'},signal:AbortSignal.timeout(fetchTimeout)});
 if(!r.ok)throw Error('HTTP '+r.status);
 const type=r.headers.get('content-type')||'';
 if(!/text|json|xml|html/i.test(type))throw Error('Tipo de contenido inesperado');
 const body=await r.text();
 if(body.length>2000000)throw Error('Respuesta excesiva');
 return body;
};
const status=()=>db('microdata_scan_cache?id=eq.1&select=checked_at,candidates,errors,summary,locked_until,last_attempt_at');
const blackout=()=>{const now=Date.now();return now>=Date.parse('2026-11-23T23:00:00Z')&&now<Date.parse('2026-11-29T19:00:00Z')};
Deno.serve(async(req:Request)=>{
 const headers={'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Vary':'Origin','Cache-Control':'no-store','Content-Type':'application/json; charset=utf-8'};
 const reply=(obj:unknown,status=200)=>new Response(JSON.stringify(obj),{status,headers});
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(req.headers.get('origin')&&req.headers.get('origin')!==origin)return reply({error:'Origen no autorizado'},403);
 if(blackout())return reply({error:'Publicación suspendida durante la veda electoral',veda:true},451);
 const action=new URL(req.url).searchParams.get('action')||'status';
 try{
  if(action==='status'&&req.method==='GET')return reply((await status())[0]||{checked_at:null,candidates:[],errors:[]});
  if(action!=='scan'||req.method!=='POST')return reply({error:'Operación no disponible'},405);
  const claimed=await db('rpc/claim_microdata_scan','POST',{});
  if(!claimed)return reply({...((await status())[0]||{}),cached:true});
  const attempt=new Date().toISOString();
  const catalog=JSON.parse(await fetchText(catalogUrl));
  const known=knownLinks(catalog),pages=choosePages(catalog,16);
  const checks=await Promise.all(pages.map(async x=>{
    try{const html=await fetchText(x.pagina);
      return {productor:x.productor,titulo:x.titulo,pagina:x.pagina,files:fileLinks(html,x.pagina),error:null};
    }catch(e){return {productor:x.productor,titulo:x.titulo,pagina:x.pagina,files:[],error:String(e).slice(0,110)}}
  }));
  const news=await Promise.all(queries.map(async([name,q])=>{
   try{
    const url='https://news.google.com/rss/search?'+new URLSearchParams({q,hl:'es',gl:'ES',ceid:'ES:es'});
    return {items:microNews(await fetchText(url),name),error:null};
   }catch(e){return {items:[],error:name+': '+String(e).slice(0,105)}}
  }));
  const unique=new Map<string,any>();
  for(const c of makeCandidates(checks,known))unique.set(c.url.split('?')[0],c);
  for(const group of news)for(const c of group.items)if(!unique.has(c.url))unique.set(c.url,c);
  const found=[...unique.values()].slice(0,100);
  const errors=[...checks.filter(x=>x.error).map(x=>x.productor+': '+x.error),
    ...news.filter(x=>x.error).map(x=>x.error)];
  const summary={paginas_consultadas:checks.length,paginas_accesibles:checks.filter(x=>!x.error).length,
    fuentes_rss:queries.length,fuentes_rss_accesibles:news.filter(x=>!x.error).length,
    archivos_localizados:found.filter(x=>x.tipo==='enlace_a_archivo').length,
    enlaces_nuevos_sin_auditar:found.filter(x=>x.estado==='nuevo_enlace_sin_auditar').length,
    noticias_sobre_microdatos:found.filter(x=>x.tipo==='noticia_sobre_microdatos').length,
    ficheros_descargados:0,matrices_analizadas:0,
    nota:'Descubrimiento documental: detectar un enlace no acredita que el fichero contenga entrevistas individuales.'};
  if(!checks.some(x=>!x.error)&&news.every(x=>x.error)){
   await db('microdata_scan_cache?id=eq.1','PATCH',{errors,last_attempt_at:attempt,locked_until:'1970-01-01T00:00:00Z'});
   return reply({error:'Todas las fuentes de microdatos fallaron; los resultados anteriores se conservan.',attempted_at:attempt},502);
  }
  const data={checked_at:attempt,last_attempt_at:attempt,candidates:found,errors,summary};
  await db('microdata_scan_cache?id=eq.1','PATCH',data);
  return reply(data);
 }catch(err){
  // Release the cooldown on an infrastructure error; do not manufacture an empty success.
  try{await db('microdata_scan_cache?id=eq.1','PATCH',{last_attempt_at:new Date().toISOString(),locked_until:'1970-01-01T00:00:00Z'});}catch{}
  return reply({error:'No se pudo completar la búsqueda de microdatos; no se modificó el catálogo.'},503);
 }
});
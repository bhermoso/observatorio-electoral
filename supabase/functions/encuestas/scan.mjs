import {parseFeed} from './core.mjs';
export const QUERIES=[
 'elecciones generales España ("promedio de encuestas" OR "media de sondeos" OR agregador) when:7d',
 'elecciones generales España ("estimación de voto" OR "proyección de escaños") when:7d',
 'encuesta elecciones generales España (CIS OR 40dB OR GAD3 OR "Sigma Dos") when:7d',
 'encuesta elecciones generales España (Sociométrica OR IMOP OR Sondaxe OR "Target Point" OR Hamalgama) when:7d',
 'encuesta elecciones generales España ("Celeste Tel" OR "SW Demoscopia" OR "More in Common") when:7d'
];
async function readLimited(response,limit=2000000){
 const reader=response.body.getReader(),chunks=[];let size=0;
 try{while(true){const {value,done}=await reader.read();if(done)break;size+=value.length;
  if(size>limit){await reader.cancel();throw Error('Respuesta demasiado grande');}chunks.push(value);
 }}finally{reader.releaseLock();}
 const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
 return new TextDecoder().decode(bytes);
}
/** Each attempt bounds headers AND body. Retry only transient network/HTTP failures. */
export async function scanSources({fetcher=fetch,queries=QUERIES,timeout=8000,now=()=>new Date().toISOString()}={}){
 const results=await Promise.all(queries.map(async(q,index)=>{
  let reason='';
  for(let attempt=1;attempt<=2;attempt++){
   try{
    const url='https://news.google.com/rss/search?'+new URLSearchParams({q,hl:'es',gl:'ES',ceid:'ES:es'});
    const r=await fetcher(url,{headers:{Accept:'application/rss+xml, application/xml;q=0.9'},signal:AbortSignal.timeout(timeout)});
    if(!r.ok){await r.body?.cancel();reason='HTTP '+r.status;
     if(attempt===1&&(r.status===408||r.status>=500))continue;
     throw Error(reason);
    }
    const items=parseFeed(await readLimited(r));
    return {source:index+1,query:q,ok:true,attempts:attempt,count:items.length,items,checked_at:now()};
   }catch(error){
    reason=error?.name==='TimeoutError'?'Tiempo de espera agotado':error?.name==='TypeError'?'Error de red':error.message||'Error desconocido';
    if(attempt===1&&['TimeoutError','AbortError','TypeError'].includes(error?.name))continue;
    return {source:index+1,query:q,ok:false,attempts:attempt,count:0,items:[],error:reason,checked_at:now()};
   }
  }
 }));
 const unique=new Map();for(const r of results)for(const item of r.items)if(Number.isFinite(Date.parse(item.published)))unique.set(item.url,item);
 return {checked_at:now(),candidates:[...unique.values()].sort((a,b)=>Date.parse(b.published)-Date.parse(a.published)).slice(0,120),
  errors:results.filter(r=>!r.ok).map(r=>`Fuente ${r.source}: ${r.error} · ${r.query}`),
  sources:results.map(({items,...meta})=>meta),failed:results.every(r=>!r.ok),partial:results.some(r=>!r.ok)&&results.some(r=>r.ok)};
}

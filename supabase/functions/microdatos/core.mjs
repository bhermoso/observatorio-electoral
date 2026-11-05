/** Descubrimiento de fuentes de microdatos. Nunca supone que un enlace es una matriz auditada. */
const exts=/\.(?:zip|sav|dta|por|xlsx|csv|sps|rds)(?:[?#]|$)/i;
const titleHit=/microdatos|micro-datos|respuestas individuales|datos internos|datos completos|fichero(?:s)? de datos|base(?:s)? de datos.*encuesta|encuesta.*base(?:s)? de datos/i;
const entityDecode=s=>s.replace(/&amp;/gi,'&').replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'").replace(/&lt;/gi,'<').replace(/&gt;/gi,'>');
export function safeHttp(value,base){
 try{
  const u=new URL(entityDecode(value),base);
  if(!['https:'].includes(u.protocol)||u.username||u.password)return null;
  if(/^(?:localhost|127\.|10\.|192\.168\.|169\.254\.|172\.(?:1[6-9]|2\d|3[01])\.)/i.test(u.hostname))return null;
  return u.href;
 }catch{return null}
}
export function fileLinks(html,pageUrl,max=35){
 if(typeof html!=='string')return [];
 const out=new Set();
 for(const m of html.matchAll(/href\s*=\s*["']([^"']{1,1500})["']/gi)){
  const uri=safeHttp(m[1],pageUrl);
  if(uri&&exts.test(new URL(uri).pathname))out.add(uri);
  if(out.size>=max)break;
 }
 return [...out];
}
export function microNews(xml,topic){
 if(typeof xml!=='string'||!/<rss\b/i.test(xml))throw Error('No es un RSS');
 const out=[];
 for(const m of xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)){
  const get=k=>entityDecode(m[1].match(new RegExp('<'+k+'[^>]*>([\\s\\S]*?)</'+k+'>','i'))?.[1]?.trim()||'');
  const title=get('title'),link=safeHttp(get('link')),date=get('pubDate');
  if(!titleHit.test(title)||!link||new URL(link).hostname!=='news.google.com')continue;
  out.push({tipo:'noticia_sobre_microdatos',titulo:title.slice(0,240),url:link,fecha:date.slice(0,100),fuente:topic,estado:'pendiente_de_verificacion'});
  if(out.length>=20)break;
 }
 return out;
}
export function choosePages(catalog,max=16){
 if(!Array.isArray(catalog?.estudios))throw Error('Catálogo de microdatos no válido');
 const allowed=new Set(['40db','gad3','sociometrica','more-in-common','cemop']);
 const seen=new Set();
 return catalog.estudios
 .filter(x=>allowed.has(x.productor)&&typeof x.pagina==='string'&&x.fecha>='2025-01-01')
 .sort((a,b)=>b.fecha.localeCompare(a.fecha))
 .filter(x=>{const url=safeHttp(x.pagina);if(!url||seen.has(url))return false;seen.add(url);return true})
 .slice(0,max);
}
export function knownLinks(catalog){
 const links=new Set();
 for(const x of catalog?.estudios||[])for(const k of ['archivo','pagina']){
  const v=safeHttp(x[k]);if(v)links.add(v.split('?')[0]);
 }
 return links;
}
export function makeCandidates(pages,known){
 const seen=new Set(),rows=[];
 for(const x of pages)for(const url of x.files||[]){
  const id=url.split('?')[0];
  if(seen.has(id))continue;seen.add(id);
  rows.push({tipo:'enlace_a_archivo',titulo:x.titulo||x.productor,url,pagina:x.pagina,fuente:x.productor,estado:known.has(id)?'ya_catalogado':'nuevo_enlace_sin_auditar'});
 }
 return rows.slice(0,90);
}

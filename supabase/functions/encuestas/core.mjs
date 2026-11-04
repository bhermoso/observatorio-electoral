export function inBlackout(now=new Date()) {
 return now>=new Date('2026-11-23T23:00:00Z') && now<new Date('2026-11-29T19:00:00Z');
}
const norm=s=>String(s).trim().toLocaleLowerCase('es').replace(/\s+/g,' ');
export const fingerprint=p=>[p.institute,p.fieldStart,p.fieldEnd,p.scope,p.publisher].map(norm).join('|');
export function validateSubmission(p,now=new Date()) {
 if(!p||typeof p!=='object'||Array.isArray(p))throw Error('Ficha inválida.');
 const required=['id','institute','publisher','title','fieldStart','fieldEnd','published','scope','universe','scenario','denominator','source','technical','verification','sourcePages','verified'];
 for(const k of required)if(typeof p[k]!=='string'||!p[k].trim()||p[k].length>2000||/[<>]/.test(p[k]))throw Error('Revisa el campo '+k+'.');
 if(!/^[a-z0-9][a-z0-9-]{2,99}$/.test(p.id))throw Error('Identificador inválido.');
 if(!['España','España, excepto Ceuta y Melilla'].includes(p.scope))throw Error('Solo se incorporan encuestas nacionales.');
 if(p.kind!=='poll-estimate'||!Number.isInteger(p.sample)||p.sample<1||p.sample>1000000)throw Error('Revisa el tamaño de muestra.');
 for(const k of ['fieldStart','fieldEnd','published','verified']) {
  const d=new Date(p[k]+'T12:00:00Z');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(p[k])||!Number.isFinite(+d)||d.toISOString().slice(0,10)!==p[k])throw Error('Fecha inválida: '+k);
 }
 if(!(p.fieldStart<=p.fieldEnd&&p.fieldEnd<=p.published&&p.published<=p.verified&&p.verified<=now.toISOString().slice(0,10)))throw Error('Las fechas no están en orden o son futuras.');
 for(const k of ['source','technical']) {
  const u=new URL(p[k]);if(u.protocol!=='https:'||u.username||u.password)throw Error('La fuente debe ser un enlace HTTPS público.');
 }
 if(!p.values||Array.isArray(p.values)||!Object.keys(p.values).length||Object.keys(p.values).length>50)throw Error('Faltan los porcentajes.');
 for(const [k,v] of Object.entries(p.values))if(!k.trim()||k.length>100||/[<>]/.test(k)||!Number.isFinite(v)||v<0||v>100)throw Error('Porcentaje inválido: '+k);
 if(Object.values(p.values).reduce((a,b)=>a+b,0)>101)throw Error('Los porcentajes superan el 100 % (con tolerancia de redondeo).');
 // The form records votes only; never invent seat estimates.
 if(p.seats!==null)throw Error('Esta ficha incorpora porcentajes; los escaños requieren revisión adicional.');
 return Object.fromEntries([...required,'kind','sample','values','seats'].map(k=>[k,p[k]]).concat([
  ['coverage','partial'],['mode',String(p.mode||'No consta').slice(0,100).replace(/[<>]/g,'')],
  ['notes','Incorporada por el editor desde el Observatorio. Solo cifras contrastadas en la fuente.'],
  ['seatNotes','Escaños no transcritos en este formulario.']
 ]));
}
const decode=s=>s.replace(/^<!\[CDATA\[([\s\S]*)\]\]>$/,'$1').replace(/&#(x[0-9a-f]+|\d+);/gi,(_,n)=>{const v=n[0].toLowerCase()==='x'?parseInt(n.slice(1),16):Number(n);return v>0&&v<=0x10ffff?String.fromCodePoint(v):'';}).replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&amp;/g,'&');
export function parseFeed(xml) {
 if(!/<rss\b/i.test(xml))throw Error('La fuente no devolvió RSS.');
 return [...xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)].slice(0,30).flatMap(m=>{
  const get=k=>decode(m[1].match(new RegExp('<'+k+'[^>]*>([\\s\\S]*?)</'+k+'>','i'))?.[1]?.trim()||'');
  const title=get('title'),url=get('link'),date=get('pubDate');
  try {const u=new URL(url);if(u.protocol!=='https:'||u.hostname!=='news.google.com')return [];}catch{return [];}
  return title?[{title:title.slice(0,500),url,published:date.slice(0,100),verified:false}]:[];
 });
}

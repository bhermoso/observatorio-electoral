export function validatePolls(polls,references){
 if(!Array.isArray(polls)||!Array.isArray(references))throw Error('Los registros deben ser listas');
 const ids=new Set();
 for(const p of polls){
  if(!p.id||ids.has(p.id))throw Error('Identificador de encuesta ausente o duplicado');ids.add(p.id);
  for(const key of ['institute','publisher','scope','universe','scenario','verification','sourcePages','verified'])if(!p[key])throw Error(`${p.id}: falta ${key}`);
  if(p.kind!=='poll-estimate'||!Number.isInteger(p.sample)||p.sample<1)throw Error(`${p.id}: tipo o muestra inválidos`);
  for(const key of ['fieldStart','fieldEnd','published','verified'])if(!/^\d{4}-\d{2}-\d{2}$/.test(p[key]))throw Error(`${p.id}: fecha inválida`);
  if(!(p.fieldStart<=p.fieldEnd&&p.fieldEnd<=p.published&&p.published<=p.verified))throw Error(`${p.id}: fechas incoherentes`);
  for(const key of ['source','technical'])if(new URL(p[key]).protocol!=='https:')throw Error(`${p.id}: fuente insegura`);
  if(!p.values||!Object.keys(p.values).length)throw Error(`${p.id}: sin estimaciones verificadas`);
  for(const v of Object.values(p.values))if(!Number.isFinite(v)||v<0||v>100)throw Error(`${p.id}: voto inválido`);
  if(p.seats!==null){
   if(!p.seats||!Object.keys(p.seats).length)throw Error(`${p.id}: escaños vacíos; usar null si no se publican`);
   for(const s of Object.values(p.seats)){
    if(!s||s.point===undefined&&s.min===undefined)throw Error(`${p.id}: escaños sin punto ni intervalo`);
    if(s.point!==undefined&&(!Number.isInteger(s.point)||s.point<0||s.point>350))throw Error(`${p.id}: escaños inválidos`);
    if(s.min!==undefined&&(!Number.isInteger(s.min)||!Number.isInteger(s.max)||s.min<0||s.min>s.max||s.max>350))throw Error(`${p.id}: horquilla inválida`);
    if(s.min===undefined&&s.max!==undefined)throw Error(`${p.id}: horquilla incompleta`);
    if(s.point!==undefined&&s.min!==undefined&&(s.point<s.min||s.point>s.max))throw Error(`${p.id}: punto fuera de horquilla`);
   }
  }
 }
 const rids=new Set();
 for(const r of references){
  if(!r.id||rids.has(r.id)||ids.has(r.id))throw Error('Referencia duplicada o confundida con encuesta');rids.add(r.id);
  if(!['institute-reference','aggregate-model'].includes(r.kind))throw Error('Tipo de referencia inválido');
  if(!r.name||!r.notes||!r.status||!r.verified||new URL(r.source).protocol!=='https:')throw Error('Referencia sin documentación suficiente');
 }
 return {polls:polls.length,institutes:new Set(polls.map(p=>p.institute)).size,references:references.length};
}

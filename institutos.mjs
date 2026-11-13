const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const link=(url,label)=>/^https:\/\//.test(url||'')?`<a href="${esc(url)}" target="_blank" rel="noopener">${esc(label)} ↗</a>`:'';
export function directoryRecords(polls,book){
 const names=[...new Set([...polls.map(p=>p.institute),...book.institutos.map(p=>p.instituto)])].sort((a,b)=>a.localeCompare(b,'es'));
 return names.map(name=>({name,polls:polls.filter(p=>p.institute===name).sort((a,b)=>b.published.localeCompare(a.published)),reference:book.institutos.find(p=>p.instituto===name)}));
}
export function directoryCard(row,book){
 const p=row.polls[0],r=row.reference;
 const methods=Object.entries(r?.recetas||{}).filter(([,claims])=>claims.length).map(([key,claims])=>`<h3>${esc(book.apartados[key]||key)}</h3><ul>${claims.map(c=>`<li>${esc(c.texto)}<small>${esc(c.origen)}</small>${link(c.fuente,'Documento citado')}</li>`).join('')}</ul>`).join('');
 return `<article><h2>${esc(row.name)}</h2><p><b>${row.polls.length?row.polls.length+' encuestas en el archivo':'Referencia documental · sin encuesta incorporada'}</b></p>${p?`<p>Última publicación: <b>${esc(p.published)}</b><br>${esc(p.title)}</p><p>Campo: ${esc(p.fieldStart)}–${esc(p.fieldEnd)}<br>${esc(p.sample.toLocaleString('es-ES'))} entrevistas · ${esc(p.mode||'Método no transcrito')}</p><div class="directory-links"><a href="./?instituto=${encodeURIComponent(row.name)}#encuestas">Ver encuestas y fichas →</a>${link(p.source,'Último original')}${link(p.technical,'Ficha técnica')}</div>`:'<p>Conservamos sus referencias metodológicas para documentar el archivo. No se cuenta como una encuesta ni se añade al promedio.</p>'}${methods?`<details><summary>Método documentado y fuentes</summary>${methods}</details>`:'<p>Documentación metodológica ampliada pendiente. Consulta la ficha original de cada estudio.</p>'}</article>`;
}
if(typeof document!=='undefined'){
 try{
  const [polls,book]=await Promise.all(['data/polls.json','data/institutos.json'].map(async url=>{const r=await fetch(url);if(!r.ok)throw Error('No se ha podido cargar '+url);return r.json();}));
  const rows=directoryRecords(polls,book),input=document.querySelector('#directory-search');
  const render=()=>{const q=norm(input.value),filtered=rows.filter(r=>norm(r.name+' '+JSON.stringify(r.reference?.recetas||{})).includes(q));document.querySelector('#directory').innerHTML=filtered.map(r=>directoryCard(r,book)).join('');document.querySelector('#directory-count').textContent=`${filtered.length} de ${rows.length} instituciones · ${new Set(polls.map(p=>p.institute)).size} con encuestas registradas · ${polls.length} estudios en total`;};
  input.addEventListener('input',render);render();
 }catch(e){document.querySelector('#directory-count').textContent=e.message;}
}

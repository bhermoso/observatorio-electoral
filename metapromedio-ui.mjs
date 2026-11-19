import {CATALOG,PARTIES,calculateMeta} from './metapromedio.mjs';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=x=>Number(x).toLocaleString('es-ES',{maximumFractionDigits:2});
const localDate=()=>new Date().toLocaleDateString('sv-SE',{timeZone:'Europe/Madrid'});
let references=[],last=null;
$('cutoff').value=localDate();
$('weights').innerHTML=CATALOG.map((r,i)=>`<label>Peso de ${esc(r.group)} <input type="number" id="weight-${i}" min="0" max="5" step="0.1" value="1"></label>`).join('');
function render(){
 try{
  const weights=Object.fromEntries(CATALOG.map((r,i)=>[r.group,Number($('weight-'+i).value)]));
  last=calculateMeta(references,{cutoff:$('cutoff').value,windowDays:Number($('window').value),halfLife:Number($('half-life').value),weights});
  const active=last.rows.filter(r=>r.weight>0).length;
  $('status').textContent=`Corte ${last.cutoff} · ${active} promedios incluidos de ${last.rows.length} instantáneas homologadas. No son encuestas nuevas.`;
  $('results').innerHTML='<div class="table-wrap"><table><thead><tr><th>Partido</th><th>Promedio calculado</th><th>Fuentes que aportan</th></tr></thead><tbody>'+PARTIES.map(p=>{const a=last.results[p];return `<tr><th>${p}</th><td>${a.value===null?'Sin datos':fmt(a.value)+' %'}</td><td>${a.contributors.length}</td></tr>`}).join('')+'</tbody></table></div>';
  $('sources').innerHTML=last.rows.map(r=>`<article class="source-card"><h3>${esc(r.name)}</h3><p>Publicación: ${esc(r.published)} · verificado: ${esc(r.verified)} · ${r.age} días respecto al corte · ${r.reason?esc(r.reason):'peso efectivo '+fmt(r.weight)}${r.approximate?' · cifras aproximadas':''}</p><p>${PARTIES.map(p=>{const c=last.results[p].contributors.find(x=>x.id===r.id);return `${p}: ${Number.isFinite(r.values?.[p])?fmt(r.values[p])+' %':'sin dato'}${c?' (contribución '+fmt(c.share*100)+' % del peso)':''}`}).join(' · ')}</p><p>${esc(r.methodology)}</p><p>${esc(r.notes)}</p><a href="${esc(r.source)}" target="_blank" rel="noopener">Consultar fuente original ↗</a></article>`).join('');
  $('export').disabled=false;
 }catch(e){last=null;$('status').textContent=e.message;$('results').textContent='';$('sources').textContent='';$('export').disabled=true}
}
document.addEventListener('input',e=>{if(e.target.matches('input'))render()});
$('export').addEventListener('click',()=>{if(!last)return;const a=document.createElement('a'),url=URL.createObjectURL(new Blob([JSON.stringify({schema:1,method:'media ponderada de instantáneas externas',...last},null,2)],{type:'application/json'}));a.href=url;a.download='promedio-de-promedios.json';a.click();URL.revokeObjectURL(url)});
fetch('data/references.json',{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('No se han podido cargar las fuentes');return r.json()}).then(data=>{references=data;render()}).catch(e=>{$('status').textContent=e.message});

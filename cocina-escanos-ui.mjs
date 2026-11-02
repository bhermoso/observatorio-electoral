import {projection,GROUPS} from './cocina-escanos.mjs';
const $=id=>document.getElementById(id);
const fmt=(v,dec=2)=>Number(v).toLocaleString('es-ES',{minimumFractionDigits:dec,maximumFractionDigits:dec});
const h=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const groups=['PSOE','PP','VOX','SUMAR'];
let election,history,current,aggregate,manual=null;
function source(){return $('craft-seat-source').value}
function getRecipe(){
 const study=$('craft-study').value;
 const selected=document.querySelector('input[name="craft-recipe"]:checked')?.value||'direct_all';
 const recipe=selected==='recall_experiment'?'recall':selected;
 const key=study==='3582'?{direct_all:'direct',decided:'decided',turnout_decided:'turnout',sympathy_decided:'sympathy',published_cis:'official',recall_experiment:'recall'}[selected]:selected;
 if(study==='3582')return Object.fromEntries(groups.map(p=>[p,current.comparison.find(x=>x.party===p)?.[key]??null]));
 return Object.fromEntries(groups.map(p=>[p,history.studies[study].scenarios[key]?.[p]??null]));
}
function getRaw(){
 const study=$('craft-study').value,question=$('raw-reweight-question')?.value||'directa';
 const alpha=Number($('raw-reweight-slider')?.value||0)/100;
 const d=aggregate?.study?.[study]?.methods?.[question];
 if(!d)return null;
 const rows=d.slice(0,5),den=rows.reduce((a,row)=>a+(1-alpha)*row[1]+alpha*row[5],0);
 if(den<=0)return null;
 const order=aggregate.groups;
 return Object.fromEntries(groups.map(p=>{const r=d[order.indexOf(p)];return [p,100*((1-alpha)*r[1]+alpha*r[5])/den]}));
}
function getValues(){
 if(source()==='manual')return manual||getRecipe();
 if(source()==='raw')return getRaw();
 const vals=getRecipe();
 // Intención directa sobre todos no tiene denominador de votos válidos.
 const selected=document.querySelector('input[name="craft-recipe"]:checked')?.value||'direct_all';
 if(selected==='direct_all'){
  const study=$('craft-study').value;
  const dec=study==='3582'?Object.fromEntries(groups.map(p=>[p,current.comparison.find(x=>x.party===p)?.decided])):history.studies[study].scenarios.decided;
  return dec;
 }
 return vals;
}
function currentExplanation(){
 const selected=document.querySelector('input[name="craft-recipe"]:checked')?.value||'direct_all';
 if(source()==='manual')return 'Porcentajes introducidos manualmente: el resto se atribuye a otras candidaturas conservando su geografía 2023.';
 if(source()==='raw')return 'Escenario recalculado desde sumas de microdatos originales para la pregunta y el peso de participación seleccionados.';
 if(selected==='direct_all')return 'La intención directa usa todas las entrevistas. Para proyectar diputados se utiliza automáticamente la versión entre decididos, con denominador más comparable a votos válidos.';
 return 'Cocina «'+selected+'» del estudio CIS elegido. Porcentajes nacionales derivados de agregados documentados.';
}
function renderInputs(values){
 $('craft-seat-inputs').innerHTML=groups.map(p=>'<label class="craft-option" style="display:block"><b>'+p+'</b><input type="number" min="0" max="99.99" step="0.1" inputmode="decimal" data-party="'+p+'" value="'+(Number(values[p])||0).toFixed(3)+'" style="width:100%;padding:9px;border:1px solid #bdd0bf;border-radius:7px;margin-top:5px" '+(source()==='manual'?'':'readonly')+'></label>').join('');
}
function renderSeats(){
 const result=$('craft-seat-result'),error=$('craft-seat-error');
 if(!election||!history||!current||!aggregate){result.textContent='Cargando datos verificados…';return}
 const values=getValues();
 if(!values){result.textContent='Escenario sin datos suficientes';return}
 renderInputs(values);
 let out;
 try{out=projection(election,values);error.hidden=true}
 catch(e){error.hidden=false;error.textContent=e.message;result.textContent='No se puede repartir este escenario.';return}
 const summary=[...groups,'OTROS'];
 const rows=summary.map(p=>{
  const before=out.referenceSeats[p]||0,after=out.seats[p]||0,delta=after-before;
  return '<tr><td><strong>'+h(p)+'</strong></td><td>'+fmt(out.targets[p],1)+' %</td><td>'+fmt(out.projectedShares[p],1)+' %</td><td>'+before+'</td><td><strong>'+after+'</strong></td><td>'+(delta>0?'+':'')+delta+'</td></tr>';
 }).join('');
 const ppvox=out.seats.PP+out.seats.VOX;
 const changed=out.districts.filter(d=>d.changes.length);
 result.innerHTML='<p class="craft-mini">'+h(currentExplanation())+'</p>'
 +'<div class="craft-figures"><div><small>Escaños calculados</small><strong>'+out.diagnostics.totalSeats+'</strong><em>52 circunscripciones</em></div><div><small>PP + Vox</small><strong>'+ppvox+'</strong><em>'+(ppvox>=176?'Supera 176 en este escenario':'No alcanza 176 en este escenario')+'</em></div><div><small>Provincias con cambio</small><strong>'+changed.length+'</strong><em>Frente al reparto oficial 23J</em></div></div>'
 +'<div class="craft-tbl"><table><caption>Cuotas nacionales de entrada frente a cuotas efectivamente proyectadas; diputados comparados con 2023.</caption><thead><tr><th>Partido</th><th>Objetivo nacional</th><th>Real proyectado</th><th>Escaños 2023</th><th>Escaños escenario</th><th>Cambio</th></tr></thead><tbody>'+rows+'</tbody></table></div>'
 +'<details style="margin-top:15px"><summary>Ver los 52 repartos provinciales ('+changed.length+' con diferencias)</summary><div class="craft-tbl"><table><thead><tr><th>Provincia</th><th>Diputados</th><th>PP</th><th>PSOE</th><th>Vox</th><th>Sumar</th><th>Otros</th><th>Qué cambió</th></tr></thead><tbody>'
 +out.districts.map(d=>'<tr><td>'+h(d.province)+'</td><td>'+d.seats+'</td>'+summary.slice(0,5).map(p=>'<td>'+ (d.result[p]||0)+'</td>').join('')+'<td>'+h(d.changes.map(c=>c.party+' '+(c.delta>0?'+':'')+c.delta).join(' · ')||'Sin cambios')+'</td></tr>').join('')
 +'</tbody></table></div></details>'
 +'<p class="craft-mini">Método: '+h(out.diagnostics.method)+'. Desviación máxima respecto a cuotas nacionales objetivo: '+fmt(out.diagnostics.maxTargetErrorPP,3)+' pp. Escenario determinista sin intervalos de confianza.</p>';
}
function sync(refreshManual=false){
 if(source()==='manual'&&refreshManual)manual={...getRecipe()};
 renderSeats();
}
$('craft-seat-source')?.addEventListener('change',()=>{
 if(source()==='manual')manual={...getRecipe()};
 sync();
});
$('craft-seat-reset')?.addEventListener('click',()=>{manual={...getRecipe()};sync()});
$('craft-seat-inputs')?.addEventListener('input',event=>{
 if(source()!=='manual'||!event.target.matches('[data-party]'))return;
 manual={...(manual||getRecipe()),[event.target.dataset.party]:Number(event.target.value)};
 // Avoid replacing input during typing: calculate when value changes.
});
$('craft-seat-inputs')?.addEventListener('change',()=>renderSeats());
['craft-study','craft-party','raw-reweight-question','raw-reweight-slider'].forEach(id=>{
 $(id)?.addEventListener(id==='raw-reweight-slider'?'input':'change',()=>{
  if(id==='craft-study'){manual=null}
  if(source()!=='manual')sync();
 });
});
document.addEventListener('change',e=>{if(e.target?.name==='craft-recipe'&&source()!=='manual')sync()});
Promise.all(['data/election.json','data/microdatos/validacion_23j.json','data/microdatos/analisis_3582.json','data/microdatos/agregados_originales_cis.json'].map(async url=>{const r=await fetch(url);if(!r.ok)throw Error(url+': '+r.status);return r.json()}))
.then(([e,h,c,a])=>{election=e;history=h;current=c;aggregate=a;renderSeats()})
.catch(err=>{$('craft-seat-result').textContent='No se puede abrir la base para calcular escaños: '+err.message});

import {pipeline,PARTIES,DEFAULTS} from './cocina-secuencial.mjs';
import {projection} from './cocina-escanos.mjs';
const get=id=>document.getElementById(id);
const n=(v,d=2)=>Number(v).toLocaleString('es-ES',{minimumFractionDigits:d,maximumFractionDigits:d});
const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pp=v=>(v>=0?'+':'')+n(v)+' pp';
const instructions=[
 'Cada respuesta cuenta una vez. El denominador es toda la muestra y se incluyen las no candidaturas.',
 'La entrevista se multiplica por su PESO original. Se corrige composición muestral: no se adjudican votos nuevos.',
 'Al activar decididos se excluyen abstención, blanco, indecisión y no respuesta del denominador. 8995 permanece como Otro partido.',
 'No se suma simpatía a intención. Se sustituye INTENCIONGR por la variable combinada VOTOSIMG, con una regla ya codificada en el estudio.',
 'Para participación activada se usan PROBVOTO válido (0–10) y PESO × [(1−α)+α×PROBVOTO/10]. Los valores inválidos se excluyen y cambia el universo.',
 'Filtrar por recuerdo mantiene únicamente entrevistas que mencionan una candidatura pasada. NO es una calibración histórica ni una transferencia de votos.'
];
let cube=null,election=null,historical=null,selected=5,rows=[],lastProjection=null;
function settings(){
 return {study:get('seq-study').value,weighted:get('seq-weight').checked,decided:get('seq-decided').checked,
 sympathy:get('seq-sympathy').checked,recallOnly:get('seq-recall').checked,participation:Number(get('seq-alpha').value)/100};
}
function render(){
 if(!cube)return;
 const cfg=settings();
 const slider=get('seq-alpha');
 slider.disabled=!cfg.weighted;
 get('seq-alpha-value').textContent=cfg.weighted?Math.round(cfg.participation*100)+' %':'Activa PESO antes';
 get('seq-status').textContent='CIS '+cfg.study+' · '+cube.studies[cfg.study].n.toLocaleString('es-ES')+' entrevistas procesadas · cifras nacionales derivadas de microdatos';
 try{rows=pipeline(cube,cfg)}catch(e){get('seq-inspector').textContent=e.message;return}
 get('seq-steps').innerHTML=rows.map((step,i)=>'<button type="button" class="craft-step" data-choose="'+i+'" aria-current="'+(i===selected?'step':'false')+'"><i>'+String(i+1).padStart(2,'0')+'</i><span><strong>'+safe(step.name)+'</strong><small>'+n(step.outcome.shares.PSOE)+' % PSOE · '+n(step.outcome.shares.PP)+' % PP</small></span></button>').join('');
 detail();
 seats();
}
function detail(){
 const stage=rows[selected];if(!stage)return;
 const outcome=stage.outcome,prev=selected>0?rows[selected-1].outcome:null;
 const table=PARTIES.map(p=>{
  const v=outcome.shares[p];
  return '<tr><td><b>'+safe(p)+'</b></td><td>'+(prev&&prev.shares[p]!=null?n(prev.shares[p])+' %':'—')+'</td><td>'+(v==null?'No candidatura':n(v)+' %')+'</td><td>'+(stage.delta_pp[p]!=null?pp(stage.delta_pp[p]):'—')+'</td><td>'+outcome.counts[p].toLocaleString('es-ES')+'</td></tr>';
 }).join('');
 const t='<h3>'+safe(stage.name)+'</h3><p>'+safe(instructions[selected])+'</p><div class="craft-figures"><div><small>Entrevistas en categorías del denominador</small><strong>'+outcome.total_interviews.toLocaleString('es-ES')+'</strong><em>Antes de excluir PROBVOTO inválido cuando proceda</em></div><div><small>Denominador estadístico</small><strong>'+n(outcome.denominator,0)+'</strong><em>'+ (stage.config.weighted?'Suma de pesos':'Recuento simple')+'</em></div><div><small>Voto PSOE</small><strong>'+n(outcome.shares.PSOE)+' %</strong><em>Porcentaje de este paso</em></div></div>'
 +'<div class="craft-tbl"><table><thead><tr><th>Categoría</th><th>Anterior</th><th>Actual</th><th>Variación</th><th>Respuestas declaradas</th></tr></thead><tbody>'+table+'</tbody></table></div>'
 +'<p class="craft-mini">Operaciones aplicadas hasta esta fase: '+safe(JSON.stringify(stage.config))+'. Los conteos son respuestas clasificadas, no votos efectivos observados. El tamaño efectivo del escenario ponderado no se infiere de este cubo.</p>';
 get('seq-inspector').innerHTML=t;
}
function seats(){
 const el=get('seq-seats'),stage=rows[rows.length-1];
 if(!election||!stage){el.textContent='Cargando resultados provinciales…';return}
 const shares=stage.outcome.shares;
 if(!stage.config.decided){
  lastProjection=null;
  el.innerHTML='<div class="craft-note"><b>Conversión a escaños desactivada:</b> primero activa «Calcular sobre quienes eligen candidatura». La intención sobre todos los entrevistados no es directamente una distribución de votos válidos.</div>';
  return;
 }
 try{
  const out=projection(election,Object.fromEntries(['PP','PSOE','VOX','SUMAR'].map(p=>[p,shares[p]])));
  lastProjection=out;
  const cols=['PP','PSOE','VOX','SUMAR','OTROS'];
  const table=cols.map(p=>{const d=out.seats[p]-out.referenceSeats[p];return '<tr><td>'+p+'</td><td>'+n(out.targets[p])+' %</td><td>'+out.referenceSeats[p]+'</td><td><b>'+out.seats[p]+'</b></td><td>'+(d>=0?'+':'')+d+'</td></tr>'}).join('');
  el.innerHTML='<h3>7. Transformación del resultado en escaños</h3><p>Se mantienen las 52 circunscripciones y la distribución territorial de candidaturas del 23J; se ajustan las cuotas mediante IPF y se aplica D’Hondt. Esto <b>NO</b> equivale al pronóstico probabilístico del Motor 29N.</p>'
  +'<div class="craft-figures"><div><small>Escaños distribuidos</small><strong>'+out.diagnostics.totalSeats+'</strong><em>52 distritos</em></div><div><small>PP + Vox</small><strong>'+(out.seats.PP+out.seats.VOX)+'</strong><em>Umbral 176</em></div><div><small>Provincias modificadas</small><strong>'+out.districts.filter(x=>x.changes.length).length+'</strong><em>Respecto al reparto real 23J</em></div></div>'
  +'<div class="craft-tbl"><table><thead><tr><th>Partido</th><th>Voto nacional</th><th>Escaños 2023</th><th>Escaños receta</th><th>Diferencia</th></tr></thead><tbody>'+table+'</tbody></table></div>'
  +'<details><summary>Comprobar los 52 repartos provinciales</summary><div class="craft-tbl"><table><thead><tr><th>Provincia</th><th>Diputados</th><th>Cambios frente a 2023</th></tr></thead><tbody>'+out.districts.map(x=>'<tr><td>'+safe(x.province)+'</td><td>'+x.seats+'</td><td>'+safe(x.changes.map(y=>y.party+' '+(y.delta>0?'+':'')+y.delta).join(', ')||'Sin cambios')+'</td></tr>').join('')+'</tbody></table></div></details>'
  +'<p class="craft-mini">Desajuste nacional máximo de IPF: '+n(out.diagnostics.maxTargetErrorPP,3)+' pp. Sin simulación de incertidumbre, sin calibración provincial independiente y sin predicción de pactos.</p>';
 }catch(e){lastProjection=null;el.textContent='No puede proyectarse el escenario: '+e.message}
}
function download(){
 const cfg=settings();
 const payload={schema_version:1,source:'data/microdatos/cubo_decisiones_cis.json',config:cfg,stages:rows,projection:lastProjection,limitations:['Agregados nacionales, no fichero de entrevistas individuales','VOTOSIMG es una variable alternativa, no una corrección aditiva','El filtro por recuerdo es descriptivo, no corrige sesgo electoral','No hay validación independiente entre elecciones','Escaños: proyección 23J IPF y D’Hondt, no pronóstico Motor 29N']};
 const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='cocina-reproducible-CIS-'+cfg.study+'.json';a.click();URL.revokeObjectURL(url);
}
get('seq-steps').addEventListener('click',e=>{const b=e.target.closest('[data-choose]');if(b){selected=Number(b.dataset.choose);render()}});
['seq-study','seq-weight','seq-decided','seq-sympathy','seq-recall','seq-alpha'].forEach(id=>get(id).addEventListener(id==='seq-alpha'?'input':'change',render));
get('seq-reset').addEventListener('click',()=>{for(const id of ['seq-weight','seq-decided','seq-sympathy','seq-recall'])get(id).checked=false;get('seq-alpha').value=0;selected=0;render()});
get('seq-download').addEventListener('click',download);
Promise.all(['data/microdatos/cubo_decisiones_cis.json','data/election.json'].map(async url=>{const r=await fetch(url);if(!r.ok)throw Error(url+' '+r.status);return r.json()})).then(([c,e])=>{cube=c;election=e;render()}).catch(e=>{get('seq-status').textContent='No se pueden cargar los microdatos agregados: '+e.message});

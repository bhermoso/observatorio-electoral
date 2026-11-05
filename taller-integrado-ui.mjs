(()=>{
'use strict';
const node=document.getElementById('taller-data');
if(!node)return;
const T=JSON.parse(node.textContent),$=id=>document.getElementById(id);
const snapshot=JSON.parse($('snapshot-data').textContent);
const names={PP:'PP',PSOE:'PSOE',VOX:'Vox',SUMAR:'Sumar / FA',PODEMOS:'Podemos'};
const f=(v,d=1)=>Number.isFinite(v)?v.toLocaleString('es-ES',{minimumFractionDigits:d,maximumFractionDigits:d}):'—';
const safe=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const signed=v=>(v>0?'+':'')+f(Math.abs(v)<.00001?0:v,2);
let mode='microdatos',profile='participacion',party='PP',sourceId='cis',unit='voto',order='asc';
const scenario=()=>T.escenarios[mode+'_'+profile];
const published=()=>T.escenarios[mode+'_publicada'];
const source=()=>T.fuentes.find(s=>s.id===sourceId);
function renderResult(){
 const s=scenario(),base=published(),st=T.recetas[profile];
 $('tl-result-title').textContent=mode==='microdatos'?'Desde las entrevistas':'Toda la evidencia, integrada';
 $('tl-result-meta').textContent=`${s.encuestas} encuestas · ${s.cocinadas} elaboradas desde microdatos${mode==='integrada'?' · '+(s.encuestas-s.cocinadas)+' estimaciones externas':''} · Proyección al 29N`;
 $('tl-estimates').innerHTML=['PP','PSOE','VOX','SUMAR','PODEMOS'].map(p=>{
  const q=s.partidos[p][unit],max=unit==='voto'?45:175;
  return `<div class="tl-forecast-row"><div class="tl-party-name">${names[p]}</div><div><div class="tl-forecast-value">${f(q[0],unit==='voto'?1:0)}${unit==='voto'?' %':''}</div><div class="tl-track"><span class="tl-range" style="left:${Math.max(0,q[1]/max*100)}%;width:${Math.min(100,(q[2]-q[1])/max*100)}%"></span><i class="tl-dot" style="left:${Math.min(99,q[0]/max*100)}%"></i></div></div><div class="tl-forecast-interval">${f(q[1],unit==='voto'?1:0)}–${f(q[2],unit==='voto'?1:0)}<br>${unit==='voto'?'% de voto':'escaños'}</div></div>`;
 }).join('');
 const block=s.bloques['PP+VOX'];
 const left=s.bloques['PSOE+SUMAR+PODEMOS'];
 const allBlocks=Object.entries(s.bloques).map(([label,v])=>`<p>${safe(label.replaceAll('+',' + '))}: <strong>${f(v.mediana,0)}</strong> escaños de mediana (${f(v.p5,0)}–${f(v.p95,0)}); mayoría en el ${f(100*v.p_mayoria)} % de las simulaciones.</p>`).join('');
 $('tl-majority').innerHTML=`<strong>PP + Vox:</strong> ${f(block.mediana,0)} escaños de mediana · Mayoría en el ${f(100*block.p_mayoria)} % de las simulaciones.<br><strong>PSOE + Sumar + Podemos:</strong> ${f(left.mediana,0)} escaños de mediana.<details style="margin-top:10px"><summary style="cursor:pointer">Examinar bloques y alianzas hipotéticas</summary>${allBlocks}</details><small>Sumas condicionadas a esta receta y al modelo; no acreditan pactos políticos.</small>`;
 const active=profile==='directa'?0:profile==='indecisos'?2:3;
 const steps=[['Peso original','CIS: PESO · 40dB: ponde · More: peso demográfico'],['Simpatía','Solo para quienes responden NS y nombran una opción válida'],['Indecisos por recuerdo','Donantes del mismo recuerdo, contracción 50; NC excluido'],['Participación declarada','Probabilidad declarada / 10; supuesto sin calibrar']];
 $('tl-path').innerHTML=steps.map(([label,detail],i)=>`<li class="${i>active?'tl-inactive':''}"><div>${label}<small>${detail}${i>active?' · No aplicado':''}</small></div></li>`).join('');
 if(profile==='recuerdo')$('tl-path').innerHTML+='<li><div>Ajuste parcial del recuerdo<small>50 % del ajuste entre cuatro grandes recuerdos · Factores completos limitados a 0,5–2</small></div></li>';
 const delta=s.partidos[party].voto[0]-base.partidos[party].voto[0];
 const otherMode=mode==='microdatos'?'integrada':'microdatos',other=T.escenarios[otherMode+'_'+profile];
 $('tl-impact').innerHTML=`<strong>${safe(names[party])}: ${signed(delta)} puntos</strong> frente a introducir las estimaciones publicadas de estas mismas muestras, con el mismo circuito de pronóstico.<br><span class="tl-subtle">La diferencia mide el efecto conjunto de sustituir las cifras publicadas por esta receta.</span><br><br><strong>El otro circuito:</strong> ${safe(names[party])} ${f(other.partidos[party].voto[0])} % ${otherMode==='integrada'?'integrando también las otras 18 estimaciones':'utilizando solo las tres muestras con microdatos'}.`;
 document.querySelectorAll('[data-tl-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.tlMode===mode)));
 document.querySelectorAll('[data-tl-unit]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.tlUnit===unit)));
 $('tl-profile').value=profile;
}
function renderSources(){
 $('tl-sources').innerHTML=T.fuentes.map(s=>{
  const own=s.recetas[profile].estimacion[party],pub=s.publicada[party];
  return `<button class="tl-source" data-tl-source="${safe(s.id)}" aria-pressed="${s.id===sourceId}"><strong>${safe(s.casa)}</strong><span>${f(s.n,0)} entrevistas · ${safe(s.campo_ini.slice(8))}–${safe(s.campo_fin.slice(8))} oct.<br>Publicada: ${f(pub)} %</span><span><b>${f(own)} %</b><em>Nuestra receta · ${safe(names[party])}</em></span></button>`;
 }).join('');
 const s=source(),r=s.recetas[profile],st=r.pasos;
 $('tl-source-kicker').textContent=s.casa+' · '+s.estudio;
 $('tl-source-title').textContent=names[party]+': seguir las operaciones';
 const stageRows=[['directa_sin_peso','Respuestas válidas, sin ponderar'],['peso_demografico',profile==='recuerdo'?'Peso + ajuste parcial del recuerdo':'Peso original del productor'],['simpatia','Añadir simpatía a NS'],['indecisos_transferencias','Repartir los NS restantes'],['participacion','Aplicar participación declarada']];
 const selected=stageRows.findIndex(x=>x[0]===r.paso);
 $('tl-steps').innerHTML=stageRows.map(([id,label],i)=>{
  const value=st[id].estimacion[party],delta=i?value-st[stageRows[i-1][0]].estimacion[party]:null;
  return `<div class="tl-step-row ${i===selected?'tl-used':i>selected?'tl-not-used':''}"><span>${label}${i>selected?' <small>(no aplicado)</small>':''}</span><b>${f(value,2)} %</b><small>${delta===null?'Base':signed(delta)+' pp'}</small></div>`;
 }).join('');
 const chosen=st[r.paso],den=chosen.denominador_ponderado,num=den*chosen.estimacion[party]/100;
 $('tl-denominator').innerHTML=`<strong>El denominador también importa.</strong><br>${f(num,2)} de masa asignada a ${safe(names[party])} ÷ ${f(den,2)} de masa asignada a candidaturas y blanco × 100 = <strong>${f(chosen.estimacion[party],2)} %</strong>.<br><span class="tl-subtle">Son sumas de pesos, no un recuento de personas. La receta conserva cada respuesta decidida; reponderarla sí cambia su contribución.</span>`;
 const d=r.diagnostico,impute=profile!=='directa';
 const cells=[[d.ns_iniciales,'personas que responden NS'],[d.nc_iniciales,'responden NC; quedan sin imputar'],[impute?d.asignadas_por_simpatia:0,'NS asignados por simpatía'],[impute?d.asignadas_por_transferencias:0,'NS repartidos por donantes']];
 $('tl-counts').innerHTML=cells.map(([n,label])=>`<div><strong>${f(n,0)}</strong><span>${label}</span></div>`).join('');
 $('tl-recipe-explanation').innerHTML=`${impute?`${f(d.imputadas_con_distribucion_global,0)} imputaciones usan la distribución global por falta de donantes comparables o de recuerdo. La contracción de 50 también acerca los grupos pequeños a esa distribución.`:'En esta selección no se imputa simpatía ni se reparte la indecisión.'}<br><br>${['participacion','recuerdo'].includes(profile)?`La participación multiplica los pesos por la respuesta 0–10 dividida entre diez. ${f(d.participacion_faltante,0)} faltantes usan la media ponderada observada.`:'La participación no se aplica en esta selección.'}`;
 $('tl-source-notes').textContent=s.nota;
 $('tl-source-link').href=s.url;
 $('tl-recall-factors').innerHTML='<p>Referencia de recuerdo: resultado registrado del 23J, normalizado dentro de PP, PSOE, Vox y Sumar. Fuera de esos recuerdos se conserva el peso. Se limita el factor completo a 0,5–2 y se aplica la mitad del cambio solo en el ensayo 4.</p>'+Object.entries(r.factores_recuerdo_completo).map(([p,v])=>`${safe(names[p])}: factor completo ${f(v,3)}; aplicado ${f(1+r.intensidad_recuerdo*(v-1),3)}`).join('<br>');
 document.querySelectorAll('[data-tl-source]').forEach(b=>b.addEventListener('click',()=>{sourceId=b.dataset.tlSource;renderSources();renderDistance();}));
}
function renderDistance(){
 const src=source(),pub=src.publicada[party],cooked=src.recetas[profile].estimacion[party],own=scenario().partidos[party].voto[0];
 const a=cooked-pub,b=own-cooked,total=own-pub;
 $('tl-distance-caption').textContent=`${names[party]} · Comparación con ${src.casa}. Diferencia total: ${signed(total)} puntos porcentuales. Receta: ${T.recetas[profile].nombre}.`;
 $('tl-decomposition').innerHTML=`<div>${safe(src.casa)} publicado<strong>${f(pub,2)} %</strong>El punto de comparación</div><b>→</b><div>La misma muestra, nuestra receta<strong>${f(cooked,2)} %</strong>${signed(a)} pp · Operaciones individuales</div><b>→</b><div>Pronóstico seleccionado<strong>${f(own,2)} %</strong>${signed(b)} pp · Integración y modelo</div>`;
}
function renderComparison(){
 const rows=snapshot.polls.map(s=>({name:s.institute,field:s.fieldEnd,value:s.values[party==='SUMAR'?'Sumar/FA':party==='PODEMOS'?'Podemos':party],kind:'Estimación publicada'}));
 const more=T.fuentes.find(s=>s.id==='more');
 if(!rows.some(s=>s.name==='More in Common'))rows.push({name:'More in Common',field:more.campo_fin,value:more.publicada[party],kind:'Estimación publicada'});
 rows.push({name:'Observatorio · '+(mode==='microdatos'?'microdatos':'integrada'),field:'Proyección 29N',value:scenario().partidos[party].voto[0],kind:T.recetas[profile].nombre,own:true});
 rows.sort((a,b)=>Number.isFinite(a.value)&&Number.isFinite(b.value)?(order==='asc'?a.value-b.value:b.value-a.value):Number.isFinite(a.value)?-1:Number.isFinite(b.value)?1:0);
 $('tl-compare-party').textContent=names[party];
 $('tl-compare-body').innerHTML=rows.map(r=>`<tr class="${r.own?'tl-own':''}"><td>${safe(r.name)}</td><td>${safe(r.field)}</td><td>${safe(r.kind)}</td><td>${f(r.value,2)} %</td></tr>`).join('');
}
function renderLedger(){
 const s=scenario();
 $('tl-ledger').innerHTML=`<p class="tl-subtle">${s.encuestas} entradas únicas; una estimación por muestra, publicada o cocinada. Cada escenario conserva los mismos partidos observados en su referencia. ${f(s.n,0)} simulaciones; dos variantes de consenso, sin corrección histórica direccional.</p><table><thead><tr><th>Casa</th><th>Encuesta identificada</th><th>Entrada</th><th>${safe(names[party])}</th></tr></thead><tbody>${s.entradas.map(e=>`<tr><td>${safe(e.casa)}</td><td>${safe(e.estudio)}</td><td>${e.tipo==='microdatos'?'Nuestra receta':'Publicada'}</td><td>${f(e.voto[party],2)} %</td></tr>`).join('')}</tbody></table>`;
}
function render(){renderResult();renderSources();renderDistance();renderComparison();renderLedger();}
document.querySelectorAll('[data-tl-mode]').forEach(b=>b.addEventListener('click',()=>{mode=b.dataset.tlMode;render();}));
document.querySelectorAll('[data-tl-unit]').forEach(b=>b.addEventListener('click',()=>{unit=b.dataset.tlUnit;renderResult();}));
$('tl-profile').addEventListener('change',e=>{profile=e.target.value;render();});
$('tl-party').addEventListener('change',e=>{party=e.target.value;render();});
$('tl-order').addEventListener('change',e=>{order=e.target.value;renderComparison();});
$('tl-reset').addEventListener('click',()=>{mode='microdatos';profile='participacion';party='PP';sourceId='cis';unit='voto';order='asc';$('tl-party').value=party;$('tl-order').value=order;render();});
$('tl-download').addEventListener('click',()=>{
 const out={corte:T.corte,eleccion:T.eleccion,modo:mode,receta:profile,parametros:T.parametros,fuentes:T.fuentes,escenario:scenario(),limites:T.limites};
 const blob=new Blob([JSON.stringify(out,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download='observatorio-'+mode+'-'+profile+'-'+T.corte+'.json';a.click();URL.revokeObjectURL(url);
});
const histNames={junio_flash:'Flash · junio',junio_barometro:'Barómetro · junio',julio_preelectoral:'Preelectoral · julio'};
$('tl-historical').innerHTML=T.historica.estudios.map(s=>{
 const get=name=>s.recetas.find(r=>r.nombre===name).mae_pp;
 const previous={junio_flash:2.430,junio_barometro:1.628,julio_preelectoral:2.005}[s.estudio];
 return `<tr><td>${safe(histNames[s.estudio])}</td><td>${f(get('directa_ponderada_ponde'),3)}</td><td>${f(get('simpatia_mas_participacion_sin_recuerdo'),3)}</td><td>${f(previous,3)}</td></tr>`;
}).join('');
$('tl-limits').innerHTML=T.limites.map(x=>'<li>'+safe(x)+'</li>').join('');
document.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener('click',()=>{
 const id=a.getAttribute('href').slice(1),target=document.getElementById(id),archive=$('tl-archive');
 if(target&&archive?.contains(target))archive.open=true;
}));
render();
})();

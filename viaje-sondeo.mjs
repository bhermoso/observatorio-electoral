import {journey,INGREDIENTS,scenarioKey,seatScenario} from './viaje-sondeo-motor.mjs';
import {explainStep,accountHTML,diagnosticRows} from './viaje-sondeo-explicaciones.mjs';
const $=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const f=(x,d=2)=>Number(x).toLocaleString('es-ES',{useGrouping:'always',minimumFractionDigits:d,maximumFractionDigits:d}),delta=x=>{const v=Math.abs(x)<.005?0:x;return (v>0?'+':'')+f(v)};
const colors={FA:'#cf6d9c',PP:'#3986c9',PSOE:'#de5a63',VOX:'#72a942',SUMAR:'#cf6d9c',OTRAS:'#6b8990',OTROS:'#6b8990',BLANCO:'#c4ccbf',SIN_VOTO:'#d7b67a'};
const labels={FA:'Frente Amplio',NS:'No sabe',NC:'No contesta',NO_VOTARIA:'No votaría',NULO:'Nulo',PP:'PP',PSOE:'PSOE',VOX:'Vox',SUMAR:'Sumar/FA',PODEMOS:'Podemos',SALF:'SALF',BILDU:'EH Bildu',OTRAS:'Otras',BLANCO:'Blanco',SIN_VOTO:'Resto',OTROS:'Otros'};
const ingredients=[['Peso de la casa','Representación original de cada entrevista'],['Simpatía','Completa indecisión con simpatía'],['Recuerdo','Ajusta al resultado electoral anterior'],['Indecisos','Imputa por grupo de recuerdo'],['Participación','Multiplica por probabilidad de votar']];
const names=['IDV · muestra','Voto válido','Peso','Simpatía','Recuerdo','Indecisos','Participación','Votos','Escaños'];
const titles=['Primero, las respuestas.','Definir qué cuenta como voto.','Una entrevista no siempre pesa uno.','Completar con la simpatía declarada.','Ajustar por el voto que se recuerda.','Asignar parte de los NS/NC.','Estimar quién acudirá a votar.','El porcentaje se convierte en votos.','Los votos compiten por cada escaño.'];
const descriptions=[
 'Cada registro cuenta una vez. Aquí se ve toda la muestra, incluidas la indecisión, la no respuesta y la abstención declarada.',
 'La intención directa de voto (IDV) conserva candidaturas y blanco. Nulo, abstención y NS/NC salen del denominador; no reciben votos.',
 'Se usa PESO, publicado por el CIS. Ponderar compensa desequilibrios de la muestra: cada entrevista representa una cantidad distinta.',
 'Se usa la variable combinada VOTOSIMG en lugar de INTENCIONGR. No se suma simpatía a quien ya declaró voto.',
 'Se compara el recuerdo ponderado con el resultado de 2023. El factor se aplica al grupo de recuerdo, también si hoy elige otro partido.',
 'Quienes siguen sin declarar voto y tienen recuerdo utilizable se distribuyen como los decididos de su grupo. Los demás quedan sin asignar.',
 'El peso acumulado se multiplica por PROBVOTO/10. La receta supone 0,5 cuando falta una respuesta válida; no es una participación observada.',
 'Se excluye el blanco de las cuotas de candidatura. Se ajusta una matriz de 52 circunscripciones manteniendo los volúmenes de voto de 2023.',
 'En cada provincia se aplica el umbral sobre voto válido y se ordenan los cocientes. Ceuta y Melilla adjudican su único escaño al más votado.'
];
let data,election,registry,stages,projected,loadToken=0,step=2,flags=Object.fromEntries(INGREDIENTS.map(k=>[k,true])),playing=null,awarding=null,seatCount=0,party='PSOE';
const fourth=()=>data.meta.fourth;
const allParties=()=>Object.keys(data.scenarios['00000'].shares);
const value=(o,p)=>p==='OTRAS'?Object.entries(o.shares).reduce((s,[k,v])=>s+(!['PP','PSOE','VOX',fourth(),'BLANCO'].includes(k)?v:0),0):o.shares[p]||0;
const stop=()=>{clearInterval(playing);playing=null;$('play').textContent='▶ Reproducir'};
const stopSeats=()=>{clearInterval(awarding);awarding=null;$('award').textContent='▶ Repartir'};
function metric(label,v,note){return `<div class="metric"><span>${label}</span><strong>${v}</strong><small>${note}</small></div>`}
function table(head,rows,caption=''){return `<table>${caption?`<caption>${caption}</caption>`:''}<thead><tr>${head.map(h=>`<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>'<tr>'+row.map((v,i)=>i===0?`<th scope="row">${v}</th>`:`<td>${v}</td>`).join('')+'</tr>').join('')}</tbody></table>`}
function formula(label,expression,note=''){return `<div class="formula"><span class="formula-label">${label}</span><strong>${expression}</strong>${note?`<small>${note}</small>`:''}</div>`}
function redraw(){
 stopSeats();stages=journey(data,flags);const current=stages[step],o=current.outcome,prev=step>1?stages[step-1].outcome:null;
 $('steps').innerHTML=names.map((n,i)=>`<button class="step ${i===step?'active':''} ${i>=2&&i<=6&&!stages[i].applied?'skipped':''}" data-step="${i}" aria-current="${i===step?'step':'false'}"><b>${String(i+1).padStart(2,'0')}</b>${n}${i>=2&&i<=6&&!stages[i].applied?' ○':''}</button>`).join('');
 $('timeline').value=step;$('back').disabled=step===0;$('next').disabled=step===8;
 $('stage-kicker').textContent=`PASO ${String(step+1).padStart(2,'0')} DE 09`;$('stage-title').textContent=titles[step];
 descriptions[2]='Cada entrevista se multiplica por '+data.meta.variables.weight+', el peso original de '+data.meta.house.replace(/\.$/,'')+'. La suma de esos pesos sustituye al recuento de personas.';
 descriptions[3]=data.meta.sympathyMode==='combined'?'Se utiliza '+data.meta.variables.sympathy+', la variable combinada original. Se conservan los pesos anteriores.':'Solo NS/NC con simpatía de candidatura en '+data.meta.variables.sympathy+' se completan; no se sustituyen los votos ya declarados.';
 descriptions[4]='Se compara el recuerdo ponderado con el resultado de '+data.meta.recallElection+'. El factor depende del grupo de recuerdo, aunque hoy se elija otro partido.';
 descriptions[6]='Se aplica '+data.meta.variables.participation+'/10 al peso acumulado. Ausentes o inválidos reciben 0,5; es un supuesto de esta receta.';
 $('stage-desc').textContent=step>=2&&step<=6&&!current.applied?'Operación desactivada: se conserva el resultado anterior. '+descriptions[step]:descriptions[step];
 $('stage-type').textContent=step>=7?'ESCENARIO · GEOGRAFÍA 2023':step===0?'RESPUESTAS OBSERVADAS':step>=2&&!current.applied?'SIN APLICAR':step>=4?'SUPUESTO EXPERIMENTAL':'TRATAMIENTO DE RESPUESTAS';
 const n=o.contributors;
 if(step===0)$('metrics').innerHTML=metric('Registros procesados',f(data.n,0),'Cada respuesta cuenta una vez')+metric('Nombran candidatura o blanco',f(n,0),f(100*n/data.n)+' % de la muestra')+metric('Fuera de voto válido',f(data.n-n,0),'Sin asignación a una candidatura');
 else $('metrics').innerHTML=metric('Respuestas con asignación',f(n,0),'Candidatura/blanco; pueden tener peso cero')+metric('Denominador de voto válido',f(o.denominator),'Masa ponderada: candidaturas + blanco')+metric('Tamaño efectivo de Kish',f(o.neff,1),'(Σ pesos)² / Σ pesos² · aportantes');
 $('chart-title').textContent=step===0?'Lo que contesta la muestra':step>=7?'Cuota nacional de candidaturas':'Resultado en este paso';
 $('base-label').textContent=step===0?'BASE: TODAS LAS ENTREVISTAS':step>=7?'BASE: CANDIDATURAS, SIN BLANCO':'BASE: CANDIDATURAS + BLANCO';
 const keys=['PSOE','PP','VOX',fourth(),'OTRAS',...(step>=7?[]:[step===0?'SIN_VOTO':'BLANCO'])];
 const cv=p=>step===0?(p==='SIN_VOTO'?100*(data.n-n+(data.categories.BLANCO||0))/data.n:100*(p==='OTRAS'?allParties().filter(k=>!['PP','PSOE','VOX',fourth(),'BLANCO'].includes(k)).reduce((s,k)=>s+(data.categories[k]||0),0):data.categories[p]||0)/data.n):step>=7?(p==='BLANCO'?0:100*value(o,p)/(100-o.shares.BLANCO)):value(o,p);
 const pv=p=>prev?step>=7?(p==='BLANCO'?0:100*value(prev,p)/(100-prev.shares.BLANCO)):value(prev,p):0;
 const max=Math.max(40,...keys.map(cv),...keys.map(pv))*1.05;
 $('chart').innerHTML=keys.map(p=>`<div class="bar-row"><strong>${labels[p]||p}</strong><div class="bar-track" style="--party:${colors[p]}"><span class="bar-before" style="width:${100*pv(p)/max}%"></span><span class="bar-now" data-width="${100*cv(p)/max}" style="width:0%"></span></div><span class="bar-number">${f(cv(p))} %</span><span class="delta">${prev&&step!==7?delta(cv(p)-pv(p))+' pp':'—'}</span></div>`).join('');
 requestAnimationFrame(()=>requestAnimationFrame(()=>document.querySelectorAll('[data-width]').forEach(el=>el.style.width=el.dataset.width+'%')));
 renderOperation();renderTables();
 $('territorial').hidden=step===0;
 if(step>0){projected=seatScenario(election,o,{fourth:fourth()});renderTerritory();}
 document.querySelectorAll('[data-preset]').forEach(b=>b.classList.toggle('chosen',b.dataset.preset===scenarioKey(flags)));
 const q=new URLSearchParams({sondeo:data.study,receta:scenarioKey(flags),paso:String(step)});history.replaceState(null,'','?'+q);
}
function renderOperation(){
 const r=explainStep(data,stages,step,party);
 $('op-tag').textContent=step>=2&&step<=6?INGREDIENTS[step-2].toUpperCase():'CUENTA ABIERTA';
 $('account-caption').innerHTML=`<label class="account-party">Seguir candidatura <select id="follow-party">${allParties().map(k=>`<option value="${k}" ${k===party?'selected':''}>${esc(labels[k]||k)}</option>`).join('')}</select></label>`;
 $('step-account').innerHTML=accountHTML(r);
 $('operation').innerHTML=`<p class="account-explain">${esc(r.why)}</p><div class="applied-row">Operaciones conservadas hasta aquí:</div><div class="chain"><span>IDV</span>${INGREDIENTS.map((id,i)=>`<span class="${i+2>step||!stages[i+2].applied?'off':''}">${esc(ingredients[i][0])}</span>`).join('')}</div>${r.details}${step===8?'<button id="go-district">Animar el reparto provincial ↓</button>':''}`;
 $('follow-party').onchange=e=>{party=e.target.value;renderOperation()};
 if($('go-district'))$('go-district').onclick=()=>$('district').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'center'});
}
function renderTables(){
 const o=stages[step].outcome,prev=step>1?stages[step-1].outcome:null;
 $('calculation-table').innerHTML=step===0?table(['Respuesta','Recuento','% de toda la muestra'],Object.entries(data.categories).map(([k,n])=>[labels[k]||k,f(n,0),f(100*n/data.n,4)])):
 table(['Candidatura','Casos declarados¹','Masa observada','Masa imputada','Masa total','Denominador','Cuenta: masa ÷ base × 100','Anterior %','Δ pp'],allParties().map(p=>[labels[p]||p,f(o.counts[p],0),f(o.observed[p],4),f(o.imputed[p],4),f(o.masses[p],4),f(o.denominator,4),f(o.shares[p],4)+' %',prev?f(prev.shares[p],4):'—',prev?delta(o.shares[p]-prev.shares[p]):'—']),'¹ Casos clasificados como voto válido con la variable de esta etapa; no incluye entrevistas imputadas. Todas las cuotas de esta tabla incluyen blanco.');
 $('stage-table').innerHTML=table(['Etapa','Aplicación','Aportantes','Masa válida',...allParties().map(p=>labels[p]||p)],stages.slice(1,7).map((s,i)=>[names[i+1],s.applied?'Sí':'Omitida',f(s.outcome.contributors,0),f(s.outcome.denominator,4),...allParties().map(p=>f(s.outcome.shares[p],3)+' %')]),'Etapas acumulativas sobre candidaturas y blanco. Una diferencia de tratamiento no es un efecto causal ni un error de predicción.');
}
function renderTerritory(){
 const out=projected;const groupLabel=p=>p==='SUMAR'?data.meta.fourthLabel:(labels[p]||p);
 const seatKeys=['SUMAR','PSOE','OTROS','PP','VOX'];let dots=[],assigned=0;
 const counts=[36,42,46,50,54,58,64];
 for(let row=0;row<counts.length;row++){const count=counts[row],r=85+row*20;for(let j=0;j<count;j++){let cursor=0,key=seatKeys.at(-1);for(const p of seatKeys){cursor+=out.seats[p];if(assigned<cursor){key=p;break;}}const angle=Math.PI-(j/(count-1))*Math.PI;dots.push(`<circle cx="${240+r*Math.cos(angle)}" cy="${233-r*Math.sin(angle)}" r="4.1" fill="${colors[key]}"><title>${groupLabel(key)} · escaño ${assigned+1}</title></circle>`);assigned++;}}
 $('hemicycle').innerHTML=`<svg viewBox="0 0 480 270" role="img" aria-label="Escenario de 350 escaños: ${Object.entries(out.seats).map(([p,n])=>p+' '+n).join(', ')}">${dots.join('')}<text x="240" y="200" text-anchor="middle" fill="#142c39" font-size="34" font-family="system-ui" font-weight="600">350</text><text x="240" y="222" text-anchor="middle" fill="#647982" font-size="10" font-family="system-ui">ESCAÑOS · PASO ACTUAL</text></svg>`;
 $('seat-legend').innerHTML=['PSOE','PP','VOX','SUMAR','OTROS'].map(p=>`<div class="seat-item"><i style="background:${colors[p]}"></i><span>${groupLabel(p)}</span><small>${f(out.targets[p])} % · ${f(out.nationalVotes[p],0)} votos de escenario</small><b>${out.seats[p]}</b></div>`).join('');
 $('territory-audit').innerHTML=table(['Grupo','Cuota objetivo %','Cuota obtenida %','Votos de escenario','Escaños'],Object.keys(out.seats).map(p=>[p,f(out.targets[p],4),f(out.projectedShares[p],4),f(out.nationalVotes[p],0),out.seats[p]]),`IPF: error máximo ${f(out.diagnostics.maxTargetErrorPP,6)} pp. Volúmenes provinciales de 2023; no se estima aquí una nueva participación.`)+table(['Circunscripción','Escaños','PSOE','PP','Vox',esc(data.meta.fourthLabel),'Otras'],out.districts.map(d=>[d.province,d.seats,...['PSOE','PP','VOX','SUMAR','OTROS'].map(p=>d.result[p]||0)]));
 seatCount=0;renderDistrict();
}
function renderDistrict(){
 const d=projected.districts.find(d=>d.id===$('district').value)||projected.districts[0];
 const label=id=>election.parties.find(p=>p.id===id)?.label||id;
 $('seat-progress').max=d.seats;$('seat-progress').value=seatCount;$('seat-progress-value').textContent=`${seatCount} / ${d.seats}`;
 $('district-metrics').innerHTML=`<div class="district-stats"><span>Escaños<strong>${d.seats}</strong></span><span>Voto válido escenario<strong>${f(d.valid,0)}</strong></span><span>${d.singleMember?'Regla':'Umbral 3 %'}<strong>${d.singleMember?'Mayoría simple':f(d.valid*.03,2)}</strong></span></div>`;
 const awarded=d.trace.slice(0,seatCount),last=awarded.at(-1);
 $('quotient-focus').innerHTML=last?`<strong>Escaño ${last.seat} → ${esc(label(last.party))}</strong><br>${f(last.votes,0)} votos ÷ ${last.divisor} = <b>${f(last.quotient,3)}</b>${d.ties.some(t=>t.seat===last.seat)?'<br>Empate exacto: sorteo didáctico reproducible.':''}`:`Pulsa «Repartir» o mueve el deslizador. ${d.singleMember?'Aquí gana la candidatura con más votos.':'Se iluminarán los cocientes ganadores, uno a uno.'}`;
 const eligible=d.eligible.sort((a,b)=>d.votes[b]-d.votes[a]);
 $('quotients').innerHTML=table(['Candidatura',...Array.from({length:d.seats},(_,i)=>'÷ '+(i+1))],eligible.map(id=>[esc(label(id)),...Array.from({length:d.seats},(_,i)=>{const win=awarded.find(t=>t.party===id&&t.divisor===i+1),next=d.trace[seatCount];return `<span class="${win?'won':''} ${next?.party===id&&next.divisor===i+1?'next-seat':''}" style="display:block;padding:4px">${f(d.votes[id]/(i+1),2)}${win?' · #'+win.seat:''}</span>`;})]),d.singleMember?'Circunscripción uninominal: se compara el voto sin división.':'Cocientes de candidaturas que superan el umbral; resaltados los escaños ya adjudicados.');
 $('district-votes').innerHTML=table(['Candidatura','Votos 2023','Votos escenario','% válido','Supera umbral','Escaños'],Object.keys(d.votes).sort((a,b)=>d.votes[b]-d.votes[a]).map(id=>[esc(label(id)),f(d.originalVotes[id],0),f(d.votes[id],0),f(100*d.votes[id]/d.valid,3),d.eligible.includes(id)?'Sí':'No',awarded.filter(x=>x.party===id).length]),`Blanco mantenido: ${f(d.blank,0)}. Votos válidos = candidaturas + blanco. Los votos de escenario se redondean a enteros antes de repartir.`);
}
function bind(){
 $('ingredients').innerHTML=INGREDIENTS.map((id,i)=>`<label class="ingredient"><span class="number">${String(i+1).padStart(2,'0')}</span><input type="checkbox" data-ingredient="${id}" ${flags[id]?'checked':''}><strong>${ingredients[i][0]}</strong><small>${ingredients[i][1]}</small></label>`).join('');
 $('ingredients').onchange=e=>{if(!e.target.dataset.ingredient)return;stop();flags[e.target.dataset.ingredient]=e.target.checked;redraw()};
 document.querySelectorAll('[data-preset]').forEach(b=>b.onclick=()=>{stop();INGREDIENTS.forEach((k,i)=>flags[k]=b.dataset.preset[i]==='1');document.querySelectorAll('[data-ingredient]').forEach(i=>i.checked=flags[i.dataset.ingredient]);redraw()});
 $('steps').onclick=e=>{const b=e.target.closest('[data-step]');if(b){stop();step=Number(b.dataset.step);redraw()}};
 $('timeline').oninput=()=>{stop();step=Number($('timeline').value);redraw()};
 $('back').onclick=()=>{stop();step=Math.max(0,step-1);redraw()};$('next').onclick=()=>{stop();step=Math.min(8,step+1);redraw()};
 $('play').onclick=()=>{if(playing){stop();return}if(step===8)step=0;redraw();$('play').textContent='Ⅱ Pausar';playing=setInterval(()=>{step++;redraw();if(step>=8)stop()},Number($('speed').value))};
 $('speed').onchange=()=>{if(playing){stop();$('play').click()}};
 $('district').innerHTML=election.districts.map(d=>`<option value="${d.id}" ${d.name==='Granada'?'selected':''}>${esc(d.name)} · ${d.seats} escaños</option>`).join('');
 $('district').onchange=()=>{stopSeats();seatCount=0;renderDistrict()};
 $('seat-progress').oninput=()=>{stopSeats();seatCount=Number($('seat-progress').value);renderDistrict()};
 $('award').onclick=()=>{if(awarding){stopSeats();return}const max=Number($('seat-progress').max);if(seatCount===max)seatCount=0;$('award').textContent='Ⅱ Pausar';awarding=setInterval(()=>{seatCount++;renderDistrict();if(seatCount>=max)stopSeats()},950)};
 $('download').onclick=()=>{const payload={study:data.study,sha256_zip:data.sha256_zip,flags,step,stages,projection:projected,limits:data.limits,territorial_limits:projected?.diagnostics.limitations};const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='del-sondeo-al-escano-'+data.study+'-'+scenarioKey(flags)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
 document.addEventListener('visibilitychange',()=>{if(document.hidden){stop();stopSeats()}});
}
const cache=new Map();
async function loadJSON(path){if(!cache.has(path))cache.set(path,fetch(path).then(r=>{if(!r.ok)throw Error(path+' · HTTP '+r.status);return r.json()}));return cache.get(path)}
async function selectStudy(id){
 stop();stopSeats();const token=++loadToken,meta=registry.studies.find(x=>x.id===id);if(!meta)throw Error('Sondeo no incorporado');
 $('status').textContent='Cargando '+meta.house+' · '+meta.title+'…';$('app').setAttribute('aria-busy','true');
 try{const next=await loadJSON(meta.file);if(token!==loadToken)return;data=next;projected=null;
  Object.assign(labels,next.labels||{}, {PP:'PP',PSOE:'PSOE',VOX:'Vox',FA:'Frente Amplio',SUMAR:'Sumar',BLANCO:'Blanco',OTROS:'Otros',NS:'No sabe',NC:'No contesta',NO_VOTARIA:'No votaría',NULO:'Nulo'});
  if(!allParties().includes(party))party='PSOE';
  $('study-select').value=id;$('source-house').textContent=meta.house+' · '+meta.title;$('source-n').innerHTML=f(meta.n,0)+' <small>entrevistas</small>';
  $('source-field').textContent='Campo: '+meta.fieldStart+' → '+meta.fieldEnd;$('source-link').href=meta.source;
  $('source-note').textContent='Publicado: '+meta.published+(id==='cis-3582'?' · Ficha: 5.025; fichero: 5.024.':'');
  $('study-context').textContent=(meta.historical?'EXAMEN HISTÓRICO · ':'')+'Cada receta usa exclusivamente esta matriz. '+(meta.overlap||'No se suman sus entrevistas a las de otros sondeos.');
  renderDiagnostic();renderProvenance();redraw();$('status').textContent='';$('app').hidden=false;
 }catch(e){if(token===loadToken)$('status').textContent='No se puede cargar el sondeo: '+e.message;}finally{if(token===loadToken)$('app').removeAttribute('aria-busy');}
}
function renderDiagnostic(){
 const rows=diagnosticRows(data),main=rows.filter(r=>['PP','PSOE','VOX',data.meta.recallElection==='23J 2023'?'SUMAR':'UP'].includes(r.group));
 $('bias-chart').innerHTML='<div class="bias-grid">'+main.map(r=>`<article class="bias-party" style="--party:${colors[r.group]||colors.SUMAR}"><h3>${r.group==='SUMAR'?'Sumar · 2023':esc(r.group)}</h3><div class="bias-line"><span>Recuerdo sin peso</span><strong>${f(r.raw)} %</strong></div><div class="bias-line"><span>Con peso de la casa</span><strong>${f(r.weighted)} %</strong></div><div class="mini-track"><b style="width:${Math.min(100,r.weighted/60*100)}%"></b></div><div class="bias-line target"><span>Resultado anterior</span><strong>${f(r.target)} %</strong></div><div class="bias-line"><span>Diferencia</span><strong>${delta(r.delta)} pp</strong></div><div class="bias-line"><span>Factor de corrección</span><strong>× ${f(r.factor,4)}</strong></div><div class="bias-result">Tras calibrar: <b>${f(r.after)} %</b> · desfase ${delta(r.after-r.target)} pp</div></article>`).join('')+'</div><a class="primary-jump" href="#recorrido">Ver cómo se aplica este diagnóstico a los votos ↓</a>';
 $('bias-table').innerHTML=table(['Recuerdo','Sin peso %','Peso de la casa %','Objetivo %','Desfase pp','Factor','Tras calibrar %'],rows.map(r=>[r.group,f(r.raw,3),f(r.weighted,3),f(r.target,3),delta(r.delta),f(r.factor,4),f(r.after,3)]),'Base: quienes recuerdan un voto emitido en '+data.meta.recallElection+'; incluye blanco/nulo agrupados. Abstención, nuevos electores y no recuerdo quedan fuera de esta calibración. El factor no se aplica a quienes no recuerdan.');
 const profiles=data.diagnostic?.profiles||[];
 $('profile-table').innerHTML=profiles.length?table(['Perfil','Categoría','Personas','% sin peso','Σ peso de la casa','% ponderado'],profiles.map(x=>[x.dimension,esc(x.category),f(x.n,0),f(100*x.n/data.n,3),f(x.weight,4),f(100*x.weight/data.weight_total,3)]),'Distribuciones demográficas antes y después del peso original. Los objetivos poblacionales no se han reconstruido: estas diferencias no bastan para medir todo el sesgo de selección.'):'<p class="micro">Los pesos originales están incorporados; los objetivos demográficos de su calibración no se han reconstruido. No se afirma que la representatividad de la muestra quede garantizada.</p>';
}
function renderProvenance(){
 const meta=data.meta;
 $('provenance').innerHTML=`<p><b>${esc(meta.house)} · ${esc(meta.title)} · ${f(data.n,0)} registros.</b> Campo: ${esc(meta.fieldStart)}–${esc(meta.fieldEnd)}. Publicación: ${esc(meta.published)}.</p><p>SHA-256 original: ${esc(data.sha256_zip)}. Se publican exclusivamente agregados nacionales. Variables: ${Object.entries(meta.variables).map(([k,v])=>esc(k)+': '+esc(v)).join(' · ')}.</p><p>${data.limits.map(esc).join(' ')}</p>${meta.discrepancies?.length?'<p>Discrepancias documentales: '+meta.discrepancies.map(esc).join(' ')+'</p>':''}<p>La matriz de transferencias se calcula con los pesos ya elegidos y queda fijada antes de participación. El tamaño efectivo de Kish se refiere a los pesos de las entrevistas aportantes, antes de fraccionar una imputación.</p><p>Territorio: volúmenes, candidaturas y escaños de 2023. ${esc(meta.fourthLabel)} se proyecta utilizando la base histórica de Sumar como supuesto ilustrativo; las candidaturas nuevas sin base propia quedan en Otras. No se reconstruyen listas actuales ni se presenta como pronóstico. Blanco provincial: volumen observado en 2023. En los sondeos anteriores al 23J se utiliza aquí su resultado territorial posterior: es un ejercicio retrospectivo, no una predicción histórica.</p><p>Reproducir: scripts/generar_maquina_multisondeo.py. <a href="${esc(meta.file)}">Todas las cifras de esta matriz · JSON</a></p>`;
}
function renderRegistry(catalog){
 $('coverage').innerHTML='<strong>'+registry.studies.length+' sondeos</strong><span>'+new Set(registry.studies.map(x=>x.house)).size+' casas · '+registry.studies.length*32+' combinaciones</span><span>Microdatos originales procesados</span>';
 $('study-select').innerHTML=registry.studies.map(s=>`<option value="${s.id}">${esc(s.house)} · ${esc(s.title)} · ${s.published} · n=${f(s.n,0)}${s.historical?' · histórico':''}</option>`).join('');
 $('study-select').onchange=e=>void selectStudy(e.target.value);
 $('study-register').innerHTML=table(['Casa','Sondeo','Publicado','Fin de campo','Registros','Recetas'],registry.studies.map(s=>[esc(s.house),esc(s.title),s.published,s.fieldEnd,f(s.n,0),'32 calculadas']),'Una matriz por sondeo. Se conservan por separado los tracking solapados; no se suman como muestras independientes.')+ (registry.pending.length?'<p class="pending-note">'+registry.pending.map(x=>esc(x.title)+': '+esc(x.reason)).join('<br>')+'</p>':'');
 $('catalog-register').innerHTML='<p class="micro">El catálogo documental contiene '+catalog.estudios.length+' referencias de acceso y estudios de distintos ámbitos. Una referencia no equivale a un fichero ya procesado. Las fuentes siguientes no se cuentan como sondeos incorporados a esta máquina.</p>'+table(['Productor','Referencia','Ámbito','Estado documental'],catalog.estudios.filter(x=>!registry.studies.some(s=>s.id===x.id)).map(x=>[esc(x.productor),`<a href="${esc(x.pagina)}" target="_blank" rel="noopener">${esc(x.titulo)}</a>`,esc(x.ambito),esc(x.estado)]),'Pendiente: obtener o verificar originales y homologar variables. Los estudios regionales no se convierten automáticamente en estimaciones nacionales.');
}
Promise.all(['data/microdatos/maquina/index.json','data/election.json','data/microdatos/catalogo-publico.json'].map(loadJSON)).then(async([index,e,catalog])=>{
 registry=index;election=e;const q=new URLSearchParams(location.search),key=q.get('receta');
 if(/^[01]{5}$/.test(key))INGREDIENTS.forEach((k,i)=>flags[k]=key[i]==='1');
 const s=q.has('paso')?Number(q.get('paso')):2;if(Number.isInteger(s)&&s>=0&&s<=8)step=s;
 bind();renderRegistry(catalog);await selectStudy(registry.studies.some(s=>s.id===q.get('sondeo'))?q.get('sondeo'):registry.default);
}).catch(e=>{$('status').textContent='No se puede cargar la máquina: '+e.message});

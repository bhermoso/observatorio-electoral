// Navegación explicativa: únicamente muestra escenarios construidos previamente
// desde los microdatos. No crea respuestas ficticias ni interpola correcciones.
const names={
 direct_all:'Intención directa · toda la muestra',
 decided:'Voto declarado · solo decididos',
 turnout_decided:'Decididos ponderados por participación',
 sympathy_decided:'Voto + simpatía',
 published_cis:'Estimación oficial publicada por CIS',
 recall_experiment:'Corrección parcial de recuerdo (2026)'
};
const STAGES=[
 ['Origen y muestra','¿Qué personas fueron entrevistadas?'],
 ['Pregunta original','¿Qué partido dicen que votarían?'],
 ['Decisión de denominador','¿Contamos a los indecisos en el porcentaje?'],
 ['Prueba de correcciones','¿Qué cambia con simpatía, participación o recuerdo?'],
 ['Contraste y error','¿Cuál se acercó más a las urnas?'],
 ['Receta documentada','¿Con qué datos, reglas y límites se obtuvo la cifra?']
];
const sourceLinks={ '3411':'data/microdatos/validacion_23j.json','3415':'data/microdatos/validacion_23j.json','3582':'data/microdatos/analisis_3582.json'};
const map2026={direct_all:'direct',decided:'decided',turnout_decided:'turnout',sympathy_decided:'sympathy',published_cis:'official',recall_experiment:'recall'};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=(n,d=2)=>Number(n).toLocaleString('es-ES',{minimumFractionDigits:d,maximumFractionDigits:d});
const stepRoot=document.querySelector('#craft-steps'),root=document.querySelector('#craft-stage'),studySel=document.querySelector('#craft-study'),partySel=document.querySelector('#craft-party'),meta=document.querySelector('#craft-meta');
let historical=null,current=null,step=0,recipe='direct_all';
const parties=['PSOE','PP','VOX','SUMAR'];
const choices=id=>id==='3582'?Object.keys(map2026):Object.keys(names).filter(key=>key!=='recall_experiment');
function record(id){return id==='3582'?current:historical?.studies?.[id]}
function value(id,code,party){
 const rec=record(id);
 if(!rec)return null;
 const v=id==='3582'?rec.comparison.find(x=>x.party===party)?.[map2026[code]]:rec.scenarios?.[code]?.[party];
 return typeof v==='number'&&Number.isFinite(v)?v:null;
}
function actual(id,p){return id==='3582'?null:historical?.official_vote_valid_percent?.[p]??null}
function mae(id,code){
 if(id==='3582'||code==='direct_all')return null; // Distinto universo / denominador
 const errors=parties.map(p=>[value(id,code,p),actual(id,p)]).filter(([v,t])=>v!==null&&t!==null);
 return errors.length===parties.length?errors.reduce((a,[v,t])=>a+Math.abs(v-t),0)/errors.length:null;
}
function renderNav(){stepRoot.innerHTML=STAGES.map(([title,desc],i)=>'<button class="craft-step" type="button" data-i="'+i+'" '+(i===step?'aria-current="step"':'')+'><i>'+String(i+1).padStart(2,'0')+'</i><span><strong>'+esc(title)+'</strong><small>'+esc(desc)+'</small></span></button>').join('')}
function panel(title,lead,body){return '<div class="craft-kicker">PASO '+(step+1)+' / '+STAGES.length+'</div><h2>'+title+'</h2><p>'+lead+'</p>'+body}
function figures(rows){return '<div class="craft-figures">'+rows.map(([label,n,sub])=>'<div><small>'+esc(label)+'</small><strong>'+esc(n??'No disponible')+'</strong><em>'+esc(sub||'')+'</em></div>').join('')+'</div>'}
function tip(s){return '<div class="craft-note">'+s+'</div>'}
function htmlTable(head,rows){return '<div class="craft-tbl"><table><thead><tr>'+head.map(h=>'<th>'+esc(h)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(row=>'<tr>'+row.map(col=>'<td>'+col+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>'}
function bars(id,code){
 const max=Math.max(36,...parties.map(p=>value(id,code,p)??0));
 return '<div class="craft-bars" role="img" aria-label="Porcentajes calculados por partido">'+parties.map(p=>{let n=value(id,code,p);return '<div class="craft-bar-row"><b>'+p+'</b><div class="craft-track"><i style="width:'+Math.max(0,Math.min(100,(n??0)/max*100))+'%"></i></div><span>'+ (n===null?'—':fmt(n,1)+' %')+'</span></div>'}).join('')+'</div>';
}
function compareBar(id,party,base,alt){
 const a=value(id,base,party),b=value(id,alt,party);if(a===null||b===null)return '';
 const max=Math.max(a,b,1)*1.08;
 return '<div class="craft-bars"><div class="craft-bar-row"><span>Antes</span><div class="craft-track"><i style="width:'+Math.min(100,a/max*100)+'%"></i></div><span>'+fmt(a,1)+' %</span></div><div class="craft-bar-row"><span>Después</span><div class="craft-track"><i class="alt" style="width:'+Math.min(100,b/max*100)+'%"></i></div><span>'+fmt(b,1)+' %</span></div><div class="craft-vizlegend"><span><b></b>Base</span><span><b class="alt"></b>Alternativa</span></div></div>';
}
function alternatives(id){return choices(id).map(key=>'<label class="craft-option"><input type="radio" name="craft-recipe" value="'+esc(key)+'" '+(recipe===key?'checked':'')+'><span><b>'+esc(names[key])+'</b><small>'+ (value(id,key,partySel.value)===null?'No disponible para el partido':fmt(value(id,key,partySel.value))+' % · '+(key==='published_cis'?'CIS':'Agregado del laboratorio'))+'</small></span></label>').join('')}
function stageContent(){
 const id=studySel.value,p=partySel.value,r=record(id),n=value(id,recipe,p),vDirect=value(id,'direct_all',p),vDec=value(id,'decided',p),nSample=id==='3582'?r?.n:r?.sample_size,eff=r?.effective_n;
 if(!r)return panel('Sin datos','No ha sido posible cargar el conjunto seleccionado.','');
 let body='';
 if(step===0){
  body=figures([['Estudio CIS',id,'Identificador oficial'],['Entrevistas',nSample?.toLocaleString('es-ES'),'Tamaño declarado'],['Tamaño efectivo',eff?fmt(eff,0):'No disponible','Después del diseño y pesos']])
   +'<h3>Qué datos entran</h3><p>Los resultados se calcularon sobre los ficheros de respuestas del estudio, usando la variable de peso <b>PESO</b>. En esta página se conservan las <b>tabulaciones agregadas</b>, no una copia de las entrevistas individuales.</p>'
   +tip('El tamaño efectivo representa información estadística equivalente; no significa que se hayan eliminado entrevistas. No podemos volver a ponderar cada respuesta aquí sin disponer de los registros.')
   +'<p><a href="'+sourceLinks[id]+'">Examinar los datos agregados de este estudio ↗</a></p>';
 }else if(step===1){
  body=figures([['Intención directa de '+p,vDirect===null?'—':fmt(vDirect)+' %','Denominador: todas las entrevistas'],['Voto entre decididos',vDec===null?'—':fmt(vDec)+' %','Denominador: quienes señalan candidatura'],['Ponderación aplicada','PESO','Pesos originales del estudio']])
   +'<h3>Operación 1: tabular respuestas</h3><div class="craft-code">intención directa ponderada = 100 × suma(PESO de quienes mencionan '+p+') / suma(PESO de todas las entrevistas)</div>'+bars(id,'direct_all')
   +tip('Estos porcentajes proceden de la tabulación ya calculada. No indican qué peso concreto tenía cada persona ni permiten reconstruir los casos individuales.');
 }else if(step===2){
  body=figures([['Todas las entrevistas',vDirect===null?'—':fmt(vDirect)+' %','Incluye la no declaración de partido'],['Solo decididos',vDec===null?'—':fmt(vDec)+' %','Universo distinto'],['Diferencia',vDirect===null||vDec===null?'—':(vDec-vDirect>=0?'+':'')+fmt(vDec-vDirect)+' pp','No son votos nuevos']])
   +'<h3>Operación 2: elegir el denominador</h3><div class="craft-code">porcentaje entre decididos = 100 × suma(PESO del partido) / suma(PESO de quienes mencionan alguna candidatura)</div>'+compareBar(id,p,'direct_all','decided')
   +'<p><button class="craft-export" type="button" id="craft-use-decided">Usar «solo decididos» como receta activa</button></p>'
   +tip('El salto no significa que un partido haya ganado votos: al retirar del denominador a personas indecisas, abstencionistas o sin candidatura declarada, aumenta su porcentaje relativo.');
 }else if(step===3){
  body='<h3>Elige una receta documentada</h3><p>Selecciona una alternativa para visualizar el resultado agregado que realmente se calculó. Las alternativas <b>no se aplican una tras otra</b>; faltan los cruces de microdatos necesarios para componerlas sin inventar información.</p><div class="craft-options">'+alternatives(id)+'</div>'
   +figures([['Receta seleccionada',n===null?'—':fmt(n)+' %',names[recipe]],['Diferencia respecto a decididos',n===null||vDec===null?'—':(n-vDec>=0?'+':'')+fmt(n-vDec)+' pp','Cambio de criterio, no efecto causal'],['Receta de referencia',vDec===null?'—':fmt(vDec)+' %','Entre quienes declaran partido']])
   +compareBar(id,p,'decided',recipe)
   +'<h3>Qué decisión se ha tomado</h3><div class="craft-code">'+esc(description(id,recipe))+'</div>'
   +tip(id==='3582'&&recipe==='recall_experiment'?'El recuerdo solo se ajustó parcialmente entre cuatro partidos. No está validado fuera de muestra ni permite reconstruir la receta oficial del CIS.':recipe==='published_cis'?'La cifra publicada por el CIS no viene acompañada aquí de la secuencia completa de sus correcciones; no afirmamos reproducirla.':'Cambian las reglas y a veces el denominador; por eso la diferencia no identifica el efecto aislado de una sola variable.');
 }else if(step===4){
  if(id==='3582'){
   body=figures([['Receta seleccionada',n===null?'—':fmt(n)+' %',names[recipe]],['Resultado electoral futuro','Desconocido','No hay validación para la elección futura'],['Error predictivo','No calculable','No confundir con estimación publicada']])
    +'<p>El estudio de octubre de 2026 sirve para explorar la sensibilidad de las respuestas, pero no conocemos el resultado de una elección futura. La columna «estimación CIS» es otra estimación, <b>no una verdad electoral</b>.</p>';
  }else{
   const truth=actual(id,p),err=n===null?null:n-truth,errMa=mae(id,recipe);
   body=figures([['Tu receta · '+p,n===null?'—':fmt(n)+' %',names[recipe]],['Voto real 23J · '+p,fmt(truth)+' %','Resultado oficial, votos válidos'],['Error del partido',err===null?'—':(err>=0?'+':'')+fmt(err)+' pp','Estimación menos resultado']])
    +'<h3>Comparación con la elección</h3>'
    +htmlTable(['Partido','Tu receta','Resultado 23J','Error firmado'],parties.map(q=>{const v=value(id,recipe,q),t=actual(id,q);return [q,v===null?'—':fmt(v)+' %',fmt(t)+' %',v===null?'—':(v-t>=0?'+':'')+fmt(v-t)+' pp']}))
    +'<p><b>Error absoluto medio de cuatro partidos:</b> '+(errMa===null?'No comparable con esta base':fmt(errMa)+' puntos')+'.</p>'
    +tip(recipe==='direct_all'?'La intención sobre todas las entrevistas y el voto oficial entre votos válidos tienen denominadores distintos. Su error aritmético no debe utilizarse para elegir la mejor receta.':'El resultado de 2023 solo sirve para evaluar retrospectivamente. Estos dos estudios pertenecen a la misma elección: no prueban capacidad de pronóstico en otras convocatorias.');
  }
 }else{
  const d=[['Estudio de origen',id],['Entrevistas',nSample],['Variable de ponderación','PESO'],['Universo',recipe==='direct_all'?'Todas las entrevistas':recipe==='published_cis'?'Según método publicado CIS':recipe==='recall_experiment'?'Cuatro partidos con ajuste parcial': 'Personas que señalan candidatura (según variable)'],['Procedimiento',names[recipe]],['Partido',p],['Resultado agregado',n===null?'No disponible':fmt(n)+' %'],['Error fuera de muestra','No validado independientemente']];
  body=htmlTable(['Elemento','Valor / decisión'],d.map(([k,v])=>[esc(k),esc(v)]))
   +'<h3>Algoritmo aplicado y procedencia</h3><div class="craft-code">'+esc(description(id,recipe))+'</div>'
   +'<h3>Guardar los parámetros de tu recorrido</h3><p>Se exportan la selección, los valores y las advertencias; <b>no contiene microdatos individuales</b>.</p><button class="craft-export" id="craft-download">Descargar ficha de esta estimación (JSON) ↓</button>'
   +tip('La cocina de este laboratorio no es el pronóstico principal del Motor 29N. El Motor 29N agrega estimaciones publicadas, proyecta tendencias, simula incertidumbre y asigna escaños provincialmente.');
 }
 return panel(esc(STAGES[step][0]),'Encuesta '+id+' · '+p+' · '+esc(names[recipe])+'.',body);
}
function description(id,code){
 if(id==='3582'){
  return current?.methods?.[map2026[code]]||'Procedimiento no documentado';
 }
 return historical?.methodology?.[code]||'Procedimiento no documentado';
}
function draw(){
 const id=studySel.value;
 if(!choices(id).includes(recipe))recipe='direct_all';
 renderNav();root.innerHTML=stageContent()+'<div class="craft-controls"><button id="craft-prev" '+(step===0?'disabled':'')+'>← Anterior</button><button id="craft-next" '+(step===STAGES.length-1?'disabled':'')+'>Siguiente →</button></div>';
 root.querySelector('#craft-prev').addEventListener('click',()=>{step--;draw()});
 root.querySelector('#craft-next').addEventListener('click',()=>{step++;draw()});
 root.querySelector('#craft-use-decided')?.addEventListener('click',()=>{recipe='decided';draw()});
 root.querySelectorAll('input[name=craft-recipe]').forEach(i=>i.addEventListener('change',()=>{recipe=i.value;draw()}));
 root.querySelector('#craft-download')?.addEventListener('click',download);
}
function download(){
 const id=studySel.value,p=partySel.value,v=value(id,recipe,p),t=actual(id,p);
 const file={study:id,party:p,recipe,description:description(id,recipe),weighted_by:'PESO',computed_value_pct:v,historical_election_result_pct:t,historical_signed_error_pp:t===null||v===null?null:v-t,mae_four_parties_pp:mae(id,recipe),source:sourceLinks[id],limitations:['Agregados derivados de microdatos, sin entrevistas individuales descargables en esta web','Alternativas no secuenciales ni aditivas','Recuerdo, simpatía y participación no entran automáticamente en el Motor 29N','Los dos estudios históricos corresponden a una sola convocatoria','La estimación del CIS no se reproduce con una receta completa']};
 const blob=new Blob([JSON.stringify(file,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='receta-CIS-'+id+'-'+p+'.json';a.click();URL.revokeObjectURL(url);
}
stepRoot.addEventListener('click',e=>{const b=e.target.closest('button[data-i]');if(b){step=Number(b.dataset.i);draw()}});
studySel.addEventListener('change',()=>{recipe='direct_all';draw();updateMeta()});
partySel.addEventListener('change',draw);
function updateMeta(){const r=record(studySel.value);meta.textContent=r?'n = '+(r.sample_size||r.n).toLocaleString('es-ES')+' · PESO · escenarios agregados documentados':'Estudio no disponible'}
try{
 const [h,c]=await Promise.all(['data/microdatos/validacion_23j.json','data/microdatos/analisis_3582.json'].map(async url=>{let r=await fetch(url);if(!r.ok)throw Error('No se pudo cargar '+url);return r.json()}));
 historical=h;current=c;updateMeta();draw();
}catch(e){meta.textContent='Error cargando fuentes';root.textContent='No se pudieron cargar los datos reales: '+e.message}

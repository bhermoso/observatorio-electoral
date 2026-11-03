// Lectura principal de un acontecimiento: hechos, cambios observados, comparabilidad,
// estadística del Motor 29N, simulación hipotética y conclusión metodológica.
// Nunca estima ni afirma un efecto causal.
import {contextPolls} from './events.mjs';
import {canonicalValues,BLOCKS,BLOCK_NOTE} from './capas.mjs';
import {projection} from './cocina-escanos.mjs';

export const EVENT_PARTIES=[['PP','PP'],['PSOE','PSOE'],['VOX','Vox'],['SUMAR','Sumar / FA'],['PODEMOS','Podemos']];
export const SIM_LABEL='SIMULACIÓN HIPOTÉTICA, NO EFECTO OBSERVADO NI CAUSAL ESTIMADO';
const EVENT_BLOCKS=BLOCKS.filter(b=>['PP+VOX','PSOE+SUMAR+PODEMOS'].includes(b.id));
const mean=v=>v.length?v.reduce((a,b)=>a+b,0)/v.length:null;
const span=p=>(Date.parse(p.fieldEnd)-Date.parse(p.fieldStart))/86400000+1;

function lastPer(records,dir){
 const m=new Map();
 const sorted=[...records].sort((a,b)=>dir==='before'?(b.fieldEnd.localeCompare(a.fieldEnd)||String(b.published).localeCompare(String(a.published))):(a.fieldStart.localeCompare(b.fieldStart)||String(a.published).localeCompare(String(b.published))));
 for(const p of sorted)if(!m.has(p.institute))m.set(p.institute,p);
 return m;
}
export const DEFF=1.5;// mismo efecto de diseño que modelo/motor/tendencia.py
/** Margen de error al 95 % de la diferencia entre dos encuestas independientes (pp). */
export function margenDiferencia(p1,n1,p2,n2,deff=DEFF){
 if(!(n1>0&&n2>0))return null;
 const a=p1/100,b=p2/100;
 return 1.96*Math.sqrt(deff*(a*(1-a)/n1+b*(1-b)/n2))*100;
}
function blockValue(values,b){return b.parties.every(p=>p in values)?b.parties.reduce((s,p)=>s+values[p],0):null;}

/** Comparabilidad de dos oleadas del mismo instituto: lista de diferencias que la limitan. */
export function comparabilidad(a,b){
 const motivos=[];
 for(const [k,n] of [['mode','modo de entrevista'],['scope','ámbito'],['universe','universo'],['scenario','escenario']]){
  if(!a[k]||!b[k])motivos.push(`${n} no consta en alguna oleada`);
  else if(a[k]!==b[k])motivos.push(`${n} distinto (${a[k]} / ${b[k]})`);
 }
 const da=span(a),db=span(b);
 if(Math.max(da,db)>=3*Math.min(da,db))motivos.push(`duración del campo muy distinta (${da} y ${db} días)`);
 if(a.sample&&b.sample&&Math.max(a.sample,b.sample)>=2*Math.min(a.sample,b.sample))motivos.push(`muestras muy distintas (${a.sample} y ${b.sample})`);
 const la=canonicalValues(a.values).labels.SUMAR,lb=canonicalValues(b.values).labels.SUMAR;
 if(la&&lb&&la!==lb)motivos.push(`etiqueta del espacio de Sumar distinta («${la}» / «${lb}»)`);
 return {nivel:motivos.length===0?'alta':motivos.some(m=>/modo|ámbito|universo|escenario/.test(m))?'baja':'limitada',motivos};
}

export function analizarAcontecimiento(event,polls,{ventana=30,eventoModelo=null}={}){
 const records=contextPolls(polls,event.date,ventana);
 const counts={before:0,overlap:0,after:0};records.forEach(p=>counts[p.relation]++);
 const prior=lastPer(records.filter(p=>p.relation==='before'),'before');
 const later=lastPer(records.filter(p=>p.relation==='after'),'after');
 const both=[...later.keys()].filter(k=>prior.has(k)).sort();
 const val=p=>canonicalValues(p.values).values;
 const partidos=EVENT_PARTIES.map(([id,label])=>{
  const pre=[...prior.values()].filter(p=>id in val(p)),post=[...later.values()].filter(p=>id in val(p));
  const a=mean(pre.map(p=>val(p)[id])),b=mean(post.map(p=>val(p)[id]));
  const paired=both.filter(k=>id in val(prior.get(k))&&id in val(later.get(k)));
  const pa=paired.map(k=>val(later.get(k))[id]-val(prior.get(k))[id]);
  const sameSet=pre.length===post.length&&pre.every(p=>post.some(q=>q.institute===p.institute));
  return {id,label,antes:a,despues:b,diferencia:a!=null&&b!=null?b-a:null,nAntes:pre.length,nDespues:post.length,
   estudiosAntes:pre.map(p=>p.id),estudiosDespues:post.map(p=>p.id),
   comparabilidad:!post.length?'Sin encuestas posteriores':sameSet?'Mismos institutos a ambos lados':'Institutos distintos antes y después: la diferencia mezcla casas',
   mismoInstituto:{n:pa.length,media:mean(pa),institutos:paired}};
 });
 const bloques=EVENT_BLOCKS.map(b=>{
  const pre=[...prior.values()].map(p=>blockValue(val(p),b)).filter(v=>v!=null),post=[...later.values()].map(p=>blockValue(val(p),b)).filter(v=>v!=null);
  const a=mean(pre),c=mean(post);
  return {id:b.id,label:b.label,antes:a,despues:c,diferencia:a!=null&&c!=null?c-a:null,nAntes:pre.length,nDespues:post.length,
   cobertura:`${pre.length} de ${prior.size} institutos anteriores y ${post.length} de ${later.size} posteriores publican todos los partidos del bloque`};
 });
 const parejas=both.map(k=>{const a=prior.get(k),b=later.get(k),va=val(a),vb=val(b);
  return {institute:k,antes:{id:a.id,fieldStart:a.fieldStart,fieldEnd:a.fieldEnd,sample:a.sample,mode:a.mode},despues:{id:b.id,fieldStart:b.fieldStart,fieldEnd:b.fieldEnd,sample:b.sample,mode:b.mode},
   cambios:EVENT_PARTIES.filter(([id])=>id in va&&id in vb).map(([id,label])=>({id,label,antes:va[id],despues:vb[id],diferencia:Math.round((vb[id]-va[id])*100)/100,margen:margenDiferencia(va[id],a.sample,vb[id],b.sample)})),
   comparabilidad:comparabilidad(a,b)};});
 const umbral=eventoModelo?.umbral_placebo||{};
 const conclusiones=[];
 if(!counts.after)conclusiones.push('No hay ninguna encuesta con todo su campo posterior al suceso: todavía no puede medirse ningún cambio.');
 else conclusiones.push(`${counts.after} encuesta${counts.after>1?'s':''} con campo íntegramente posterior, de ${later.size} instituto${later.size>1?'s':''}; ${counts.overlap} incluye${counts.overlap===1?'':'n'} el día del suceso y no se usa${counts.overlap===1?'':'n'} en la comparación.`);
 if(parejas.length){
  for(const id of ['PP','PSOE','VOX']){
   const cs=parejas.map(p=>p.cambios.find(c=>c.id===id)).filter(Boolean);
   if(!cs.length)continue;
   const ds=cs.map(c=>c.diferencia);
   const agree=ds.every(d=>d>0)||ds.every(d=>d<0);
   const fuera=cs.filter(c=>c.margen!=null&&Math.abs(c.diferencia)>c.margen).length;
   const mtxt=cs.map(c=>c.margen==null?'margen no calculable':'±'+c.margen.toLocaleString('es-ES',{maximumFractionDigits:1})).join(', ');
   conclusiones.push(`${id}: ${cs.length===1?'un solo instituto con dos oleadas':cs.length+' institutos con dos oleadas'} (${ds.map(d=>(d>0?'+':'')+d.toLocaleString('es-ES',{maximumFractionDigits:1})).join(', ')} pp)${cs.length>1?(agree?', mismo signo':', signos distintos'):''}. Margen de error muestral de la diferencia al 95 % (efecto de diseño ${String(DEFF).replace(".",",")}): ${mtxt}; ${fuera?`la supera${cs.length>1?' en '+fuera+' de '+cs.length:''}`:'queda dentro del margen'}.`);
  }
  const ms=eventoModelo?.modelo_salto||{};
  const saltos=['PP','PSOE','VOX'].filter(p=>ms[p]?.h0).map(p=>`${p} ${(ms[p].h0.cambio>0?'+':'')+ms[p].h0.cambio.toLocaleString('es-ES',{maximumFractionDigits:1})} ± ${ms[p].h0.sd.toLocaleString('es-ES',{maximumFractionDigits:1})}`);
  if(saltos.length)conclusiones.push(`Motor 29N, salto estimado el día del suceso (± error típico): ${saltos.join('; ')} pp. Ningún salto supera dos errores típicos${['PP','PSOE','VOX'].some(p=>ms[p]?.h0&&Math.abs(ms[p].h0.cambio)>2*ms[p].h0.sd)?' salvo alguno: revisar la tabla del nivel 4':''}.`.replace(/Ningún salto supera dos errores típicos salvo alguno/,'Algún salto supera dos errores típicos'));
  if(Object.keys(umbral).length)conclusiones.push(`El cambio a 14 días, el que se compara con el umbral placebo (${['PP','PSOE','VOX'].filter(p=>umbral[p]!=null).map(p=>p+' ±'+umbral[p].toLocaleString('es-ES',{maximumFractionDigits:1})).join(', ')} pp), aún no puede calcularse: no hay encuestas 14 días después del suceso.`.replace(/aún no puede calcularse: no hay encuestas 14 días después del suceso\./,ms.PP?.h14?'ya puede calcularse: ver nivel 4.':'aún no puede calcularse: no hay encuestas 14 días después del suceso.'));
  if(parejas.length<2)conclusiones.push('Con un único instituto no puede saberse si el cambio coincide entre casas.');
 }else if(counts.after)conclusiones.push('Ningún instituto tiene oleadas comparables antes y después: las diferencias de medias mezclan casas distintas.');
 conclusiones.push('Se han observado oscilaciones de tamaño parecido en fechas sin acontecimientos (pruebas placebo del Motor 29N, ciclo 2019-23). Coincidencia temporal no es causalidad.');
 conclusiones.push(`Ninguna cifra de esta pantalla es un efecto causal estimado. El pronóstico ${eventoModelo?.aplicado_al_pronostico===false?'no incorpora':'no consta que incorpore'} ningún efecto del suceso.`);
 const faltan=['más encuestas con campo íntegramente posterior','segundas oleadas de los mismos institutos con igual método y escenario','microdatos con recuerdo de voto para analizar transferencias'];
 return {schemaVersion:1,kind:'event-reading',event:{id:event.id,date:event.date,title:event.title},ventana,causalEffectEstimated:false,counts,
  institutosAntes:prior.size,institutosDespues:later.size,institutosAmbos:both,partidos,bloques,parejas,modelo:eventoModelo,conclusiones,faltan};
}

/** Simulación hipotética: desplaza puntos sobre la estimación de referencia y proyecta escaños (ilustrativo). */
export function simularDesplazamiento(election,base,shifts){
 const ids=['PP','PSOE','VOX','SUMAR'];
 const b=Object.fromEntries(ids.map(k=>[k,Number(base[k])]));
 if(ids.some(k=>!Number.isFinite(b[k])))throw Error('Falta la estimación de referencia de algún partido');
 const s=Object.fromEntries(ids.map(k=>[k,Math.max(0,b[k]+(Number(shifts[k])||0))]));
 const p0=projection(election,b),p1=projection(election,s);
 return {etiqueta:SIM_LABEL,base:b,simulado:s,escanosBase:p0.seats,escanosSimulados:p1.seats,
  diferencia:Object.fromEntries(ids.map(k=>[k,p1.seats[k]-p0.seats[k]]))};
}

const h=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const f=(v,d=1)=>Number.isFinite(v)?v.toLocaleString('es-ES',{minimumFractionDigits:d,maximumFractionDigits:d}):'—';
const sg=(v,d=1)=>Number.isFinite(v)?(v>0?'+':v<0?'−':'±')+f(Math.abs(v),d):'—';
const fd=s=>s?new Date(String(s).slice(0,10)+'T12:00:00Z').toLocaleDateString('es-ES',{day:'numeric',month:'short',timeZone:'Europe/Madrid'}):'—';

export function renderLectura(a,event){
 const m=a.modelo;
 const sources=(event.sources||[]).map(s=>`<a href="${h(s.url)}" target="_blank" rel="noopener">${h(s.publisher)} · ${h(fd(s.published))} ↗</a>`).join(' · ');
 const pt=a.partidos.map(r=>`<tr><th scope="row">${h(r.label)}</th><td>${f(r.antes)} %<small>${r.nAntes} inst.</small></td><td>${r.despues==null?'—':f(r.despues)+' %'}<small>${r.nDespues} inst.</small></td><td>${sg(r.diferencia)}</td><td>${r.mismoInstituto.n?sg(r.mismoInstituto.media)+' pp<small>'+h(r.mismoInstituto.institutos.join(', '))+'</small>':'—'}</td><td><small>${h(r.comparabilidad)}</small></td></tr>`).join('');
 const bt=a.bloques.map(r=>`<tr><th scope="row">${h(r.label)}</th><td>${f(r.antes)} %</td><td>${r.despues==null?'—':f(r.despues)+' %'}</td><td>${sg(r.diferencia)}</td><td><small>${h(r.cobertura)}</small></td></tr>`).join('');
 const pairs=a.parejas.length?a.parejas.map(p=>`<article class="pair-card"><h4>${h(p.institute)}</h4><p class="muted">Antes: campo ${h(fd(p.antes.fieldStart))}–${h(fd(p.antes.fieldEnd))}${p.antes.sample?', n='+p.antes.sample:''} · Después: ${h(fd(p.despues.fieldStart))}–${h(fd(p.despues.fieldEnd))}${p.despues.sample?', n='+p.despues.sample:''}</p><table><thead><tr><th>Partido</th><th>Antes</th><th>Después</th><th>Diferencia</th></tr></thead><tbody>${p.cambios.map(c=>`<tr><th scope="row">${h(c.label)}</th><td>${f(c.antes)}</td><td>${f(c.despues)}</td><td><b>${sg(c.diferencia)}</b><small>${c.margen!=null?'margen ±'+f(c.margen):''}</small></td></tr>`).join('')}</tbody></table><p class="cmp cmp-${p.comparabilidad.nivel}">Comparabilidad ${h(p.comparabilidad.nivel)}${p.comparabilidad.motivos.length?': '+h(p.comparabilidad.motivos.join('; ')):''}.</p></article>`).join(''):'<p class="empty">Ningún instituto tiene una oleada anterior y otra íntegramente posterior en la ventana.</p>';
 const ms=m?.modelo_salto||{};
 const stat=m?`<div class="table-wrap"><table><caption>Motor 29N, entradas del pronóstico (incluye registros de terceros). Salto = cambio del estado latente entre el día anterior y el del suceso.</caption><thead><tr><th>Partido</th><th>Pares por casa (media)</th><th>Salto inmediato ± error típico</th><th>Cambio a 7 días</th><th>Umbral placebo (p95)</th></tr></thead><tbody>${['PP','PSOE','VOX','SUMAR'].map(p=>{const mp=m.media_pares?.[p],x=ms[p];return `<tr><th scope="row">${h(p)}</th><td>${mp?sg(mp.cambio)+' pp (n='+mp.n+')':'—'}</td><td>${x?.h0?sg(x.h0.cambio)+' ± '+f(x.h0.sd):'—'}</td><td>${x?.h7?sg(x.h7.cambio)+' ± '+f(x.h7.sd):'<small>sin datos tras 7 días</small>'}</td><td>${m.umbral_placebo?.[p]!=null?'±'+f(m.umbral_placebo[p]):'—'}</td></tr>`;}).join('')}</tbody></table></div><p class="muted">${h(m.nota||'')} Regla: ${h(m.regla_solape||'')}. Con una sola encuesta posterior el error típico es grande y el salto depende de esa encuesta.</p>`:'<p class="empty">La salida del Motor 29N no incluye el análisis de este acontecimiento.</p>';
 return `<section class="panel event-reading" aria-labelledby="er-h"><span class="eyebrow">Lectura principal</span><h2 id="er-h">${h(event.title)} · ${h(fd(event.date))}</h2>
 <ol class="er-levels">
 <li><h3>1. Hecho y cronología</h3><p>${h(event.summary)}</p><p class="muted">Fuentes: ${sources}. Revisado el ${h(fd(event.verified))}.</p>
  <div class="event-evidence-kpis"><div><span>Campo anterior</span><strong>${a.counts.before}</strong></div><div><span>Incluyen el día del suceso</span><strong>${a.counts.overlap}</strong></div><div><span>Campo íntegramente posterior</span><strong>${a.counts.after}</strong></div></div><p class="muted">Ventana de ${a.ventana} días a cada lado, recalculada con el archivo actual. Las encuestas que entrevistan el mismo día del suceso se excluyen de la comparación.</p></li>
 <li><h3>2. Cambios observados</h3><p class="muted">Última encuesta de cada instituto antes del suceso frente a la primera posterior. «Mismo instituto» compara solo casas con oleadas a ambos lados.</p><div class="table-wrap"><table><thead><tr><th>Partido</th><th>Media anterior</th><th>Media posterior</th><th>Diferencia</th><th>Mismo instituto</th><th>Comparabilidad</th></tr></thead><tbody>${pt}</tbody></table></div>
  <div class="table-wrap"><table><caption>Bloques: suma de voto solo en encuestas que publican todos sus partidos. ${h(BLOCK_NOTE)} Escaños: no hay modelo de evento adecuado; no se calculan.</caption><thead><tr><th>Bloque</th><th>Antes</th><th>Después</th><th>Diferencia</th><th>Cobertura</th></tr></thead><tbody>${bt}</tbody></table></div></li>
 <li><h3>3. Dentro del mismo instituto</h3><div class="pairs">${pairs}</div></li>
 <li><h3>4. Análisis estadístico</h3>${stat}</li>
 <li><h3>5. Escenario de sensibilidad</h3><div class="notice sim"><b>${SIM_LABEL}</b></div><p class="muted">Mueve puntos sobre la estimación de referencia y observa la traducción a escaños con una proyección ilustrativa (ajuste proporcional sobre 2023 y D’Hondt; no es el Motor 29N).</p><div class="toolbar" id="er-sim-controls">${['PP','PSOE','VOX','SUMAR'].map(p=>`<label>${p} (pp)<input type="number" step="0.1" min="-5" max="5" value="0" data-shift="${p}"></label>`).join('')}</div><div id="er-sim-out" aria-live="polite"></div></li>
 <li><h3>6. Conclusión metodológica</h3><ul class="conclusions">${a.conclusiones.map(c=>`<li>${h(c)}</li>`).join('')}</ul><p><b>Datos que faltan:</b> ${h(a.faltan.join('; '))}.</p></li>
 </ol></section>`;
}

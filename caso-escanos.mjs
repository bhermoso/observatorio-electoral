// Caso completo de la portada: de las respuestas de una encuesta de 40dB a los escaños.
// Cada cifra lleva su estatuto: dato publicado por 40dB, cálculo nuestro sobre sus microdatos
// o supuesto declarado para pasar del voto nacional al voto por provincia.
import {OLAS_40DB} from './contraste-40db.mjs';
import {allocate} from './engine.mjs';

export const CASO_ENCUESTA='40db-2026-10-flash';
const SEED={p0:'PP',p1:'PSOE',p4:'PSOE',p2:'VOX',p3:'SUMAR'};
export const GRUPOS=['PP','PSOE','VOX','SUMAR','PODEMOS','SALF','OTROS'];
const OBJETIVO_CLAVES={PP:'PP',PSOE:'PSOE',VOX:'VOX','Sumar/FA':'SUMAR',Podemos:'PODEMOS',SALF:'SALF','Otros + blanco':'OTROS'};

/** Pasa una estimación nacional por partido a votos por provincia y reparte escaños.
 * Supuestos: cada candidatura conserva la distribución territorial de su voto del 23J;
 * Podemos toma la de Sumar (en 2023 concurrió dentro de Sumar); SALF, sin elecciones
 * generales previas, se reparte en proporción al voto válido de cada provincia; las demás
 * candidaturas y el voto en blanco se escalan juntos. Ajuste proporcional iterativo para que
 * cada provincia conserve su voto válido de 2023 y cada partido alcance su cuota nacional. */
export function proyectarPorPartido(election,objetivo,{iteraciones=300}={}){
 const dists=election?.districts;
 if(!Array.isArray(dists)||dists.length!==52)throw Error('Geografía oficial incompleta');
 const metas=GRUPOS.map(g=>Number(objetivo[g]));
 if(metas.some(v=>!Number.isFinite(v)||v<0))throw Error('Estimación incompleta');
 const suma=metas.reduce((a,b)=>a+b,0);
 if(Math.abs(suma-100)>0.05)throw Error('La estimación no suma 100 (suma '+suma.toFixed(2)+')');
 const totales=dists.map(d=>Object.values(d.votes).reduce((a,b)=>a+b,0)+d.blank);
 const total=totales.reduce((a,b)=>a+b,0);
 const semilla=dists.map((d,i)=>{
  const fila=Object.fromEntries(GRUPOS.map(g=>[g,0]));
  for(const [id,v] of Object.entries(d.votes)){const g=SEED[id]||'OTROS';fila[g]+=v;}
  fila.OTROS+=d.blank;fila.PODEMOS=fila.SUMAR;fila.SALF=totales[i];
  return GRUPOS.map(g=>fila[g]);
 });
 const m=semilla.map(f=>[...f]);
 for(let it=0;it<iteraciones;it++){
  for(let j=0;j<GRUPOS.length;j++){
   const col=m.reduce((a,f)=>a+f[j],0);
   const k=col>0?metas[j]/100*total/col:0;
   for(const f of m)f[j]*=k;
  }
  for(let i=0;i<m.length;i++){const s=m[i].reduce((a,b)=>a+b,0);for(let j=0;j<GRUPOS.length;j++)m[i][j]*=totales[i]/s;}
 }
 const etiqueta=Object.fromEntries(election.parties.map(p=>[p.id,p.label]));
 const provincias=dists.map((d,i)=>{
  const fac=GRUPOS.map((g,j)=>semilla[i][j]>0?m[i][j]/semilla[i][j]:0);
  const f=g=>fac[GRUPOS.indexOf(g)];
  const votos={};
  for(const [id,v] of Object.entries(d.votes)){const g=SEED[id]||'OTROS';votos[id]=Math.round(v*f(g));}
  votos.podemos=Math.round(m[i][GRUPOS.indexOf('PODEMOS')]);
  votos.salf=Math.round(m[i][GRUPOS.indexOf('SALF')]);
  const blanco=Math.round(d.blank*f('OTROS'));
  const especial=d.name==='Ceuta'||d.name==='Melilla';
  const r=allocate(votos,d.seats,{blank:blanco,threshold:3,singleMember:especial});
  return {nombre:d.name,escanos:d.seats,votos,blanco,validos:Object.values(votos).reduce((a,b)=>a+b,0)+blanco,reparto:r.seats,traza:r.trace,admitidas:r.eligible};
 });
 const nombre=id=>({podemos:'Podemos',salf:'SALF',p4:'PSOE',p1:'PSOE',p0:'PP',p2:'Vox',p3:'Sumar'}[id]||etiqueta[id]||id);
 const escanos={};
 for(const p of provincias)for(const [id,n] of Object.entries(p.reparto))if(n)escanos[nombre(id)]=(escanos[nombre(id)]||0)+n;
 return {provincias,escanos,nombre,etiqueta,total};
}

/** Reúne las cifras del caso a partir del archivo de encuestas, la auditoría de microdatos y el 23J. */
export function construirCaso({poll,audit,election}){
 if(!poll||poll.id!==CASO_ENCUESTA)throw Error('Falta la ficha de la encuesta del caso');
 const informe=OLAS_40DB.find(o=>o.fecha===poll.published);
 const micro=audit?.olas?.find(o=>o.id==='flash');
 if(!informe||!micro)throw Error('Faltan los datos del informe o de los microdatos');
 const directa=[
  ['PP',informe.directa.PP],['PSOE',informe.directa.PSOE],['Vox',informe.directa.VOX],['Sumar / Frente Amplio',informe.directa.Sumar]];
 const noValidos=[['No sabe',informe.no_validos.no_sabe],['No contesta',informe.no_validos.no_contesta],['No votaría',informe.no_validos.no_votaria],['Voto nulo',informe.no_validos.nulo]];
 const conocidos=[...directa,...noValidos].reduce((a,[,v])=>a+v,0);
 const resto=Math.round((100-conocidos)*10)/10;
 const excluidos=noValidos.reduce((a,[,v])=>a+v,0);
 const validos=100-excluidos;
 const objetivo={};
 for(const [k,v] of Object.entries(poll.values))if(OBJETIVO_CLAVES[k])objetivo[OBJETIVO_CLAVES[k]]=v;
 const proy=proyectarPorPartido(election,objetivo);
 const publicados=Object.fromEntries(Object.entries(poll.seats||{}).map(([k,v])=>[k==='Sumar/FA'?'Sumar':k==='VOX'?'Vox':k,v.point]));
 return {poll,informe,micro,directa,noValidos,resto,excluidos,validos,objetivo,proy,publicados};
}

const h=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pc=(v,d=1)=>Number(v).toLocaleString('es-ES',{minimumFractionDigits:d,maximumFractionDigits:d})+' %';
const n0=v=>Math.round(v).toLocaleString('es-ES');
const COLOR={PP:'#1f5da6',PSOE:'#c9303d',Vox:'#4f9a2c',Sumar:'#cc3f86','Sumar / Frente Amplio':'#cc3f86',Podemos:'#6a3d9e',SALF:'#7d8590',ERC:'#d99a0b',Junts:'#13a0a0','EH Bildu':'#87b23a',PNV:'#2d7a4c',BNG:'#5fb0dc',CC:'#e0bd15',UPN:'#24375c'};
const color=n=>COLOR[n]||'#9aa5a1';
const fecha=s=>new Date(s+'T12:00:00Z').toLocaleDateString('es-ES',{day:'numeric',month:'long',timeZone:'Europe/Madrid'});

function barra(filas){
 return `<div class="caso-barra" role="img" aria-label="${h(filas.map(([n,v])=>`${n} ${pc(v)}`).join(', '))}">${filas.map(([n,v,cls])=>`<span class="${cls||''}" style="flex:${v} 0 0;--c:${color(n)}" title="${h(n)} · ${pc(v)}">${v>=6?h(pc(v,1)):''}</span>`).join('')}</div>`;
}

function provincia(c,nombre){
 const p=c.proy.provincias.find(x=>x.nombre===nombre);
 const nm=c.proy.nombre;
 const barrera=Math.ceil(p.validos*0.03);
 const filas=Object.entries(p.votos).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]);
 const visibles=filas.filter(([,v])=>v/p.validos>=0.01);
 const debajo=filas.filter(([id,v])=>v<barrera&&v/p.validos>=0.015);
 const reparto=Object.entries(p.reparto).filter(([,n])=>n>0).sort((a,b)=>b[1]-a[1]);
 // Siguiente cociente que habría entrado y votos que le faltaron.
 const ultimo=p.traza.at(-1);
 const siguiente=p.admitidas.map(id=>({id,q:p.votos[id]/((p.reparto[id]||0)+1),div:(p.reparto[id]||0)+1})).sort((a,b)=>b.q-a.q)[0];
 const faltan=siguiente?Math.floor(ultimo.quotient*siguiente.div-p.votos[siguiente.id])+1:null;
 const tablaVotos=`<div class="table-wrap"><table class="caso-tabla"><caption>${h(nombre)}: votos proyectados con la estimación de 40dB (sobre ${n0(p.validos)} votos válidos, como en 2023)</caption>
  <thead><tr><th scope="col">Candidatura</th><th scope="col" class="num">Votos</th><th scope="col" class="num">%</th><th scope="col">¿Supera el 3 %?</th><th scope="col" class="num">Escaños</th></tr></thead>
  <tbody>${visibles.map(([id,v])=>`<tr><th scope="row"><i class="caso-punto" style="--c:${color(nm(id))}"></i>${h(nm(id))}</th><td class="num">${n0(v)}</td><td class="num">${pc(v/p.validos*100,2)}</td><td>${v>=barrera?'Sí':'<span class="caso-fuera">No</span>'}</td><td class="num"><b>${p.reparto[id]||0}</b></td></tr>`).join('')}
  <tr class="caso-menor"><th scope="row">Voto en blanco</th><td class="num">${n0(p.blanco)}</td><td class="num">${pc(p.blanco/p.validos*100,2)}</td><td>—</td><td class="num">—</td></tr></tbody></table></div><p class="caso-nota">El voto en blanco cuenta para calcular la barrera, pero no recibe escaños.</p>`;
 return {p,barrera,reparto,ultimo,siguiente,faltan,debajo,tablaVotos};
}

export function renderCaso(c){
 const {poll,informe,micro}=c;
 const fuente=`<a href="${h(informe.fuente)}" target="_blank" rel="noopener">informe de 40dB</a>`;
 const pasos2=[['PP',informe.directa.PP],['PSOE',informe.directa.PSOE],['Vox',informe.directa.VOX],['Sumar / Frente Amplio',informe.directa.Sumar]].map(([n,v])=>[n,v*100/c.validos]);
 const micro4=[['PP',micro.directa.PP],['PSOE',micro.directa.PSOE],['Vox',micro.directa.VOX],['Sumar / Frente Amplio',micro.directa.SUMAR]];
 const rec=[['PP',micro.recuerdo_calibrado.PP],['PSOE',micro.recuerdo_calibrado.PSOE],['Vox',micro.recuerdo_calibrado.VOX],['Sumar / Frente Amplio',micro.recuerdo_calibrado.SUMAR]];
 const pub=[['PP',poll.values.PP],['PSOE',poll.values.PSOE],['Vox',poll.values.VOX],['Sumar / Frente Amplio',poll.values['Sumar/FA']]];
  const nacional=[...new Set([...Object.keys(c.proy.escanos),...Object.keys(c.publicados)])]
  .map(n=>[n,c.proy.escanos[n]||0,c.publicados[n]??0]).sort((a,b)=>b[1]-a[1]||b[2]-a[2]);
 const madrid=provincia(c,'Madrid'),jaen=provincia(c,'Jaén');
 const nm=c.proy.nombre;
 const fichas=madrid.p.traza.map(t=>`<li style="--c:${color(nm(t.party))}" title="Escaño ${t.seat}: ${h(nm(t.party))}, ${n0(t.votes)} ÷ ${t.divisor} = ${n0(t.quotient)}"><b>${t.seat}</b>${h(nm(t.party))}</li>`).join('');
 const jaenIds=jaen.p.admitidas.slice().sort((a,b)=>jaen.p.votos[b]-jaen.p.votos[a]);
 const ganadores=new Set(jaen.p.traza.map(t=>t.party+'/'+t.divisor));
 const cocientes=`<div class="table-wrap"><table class="caso-tabla caso-cocientes"><caption>Jaén: cocientes de D'Hondt. Los cinco mayores, marcados, son los cinco escaños.</caption>
  <thead><tr><th scope="col">Candidatura</th>${[1,2,3,4,5].map(d=>`<th scope="col" class="num">÷ ${d}</th>`).join('')}</tr></thead>
  <tbody>${jaenIds.map(id=>`<tr><th scope="row"><i class="caso-punto" style="--c:${color(nm(id))}"></i>${h(nm(id))}</th>${[1,2,3,4,5].map(d=>{const q=jaen.p.votos[id]/d,g=ganadores.has(id+'/'+d);return `<td class="num${g?' caso-gana':''}">${n0(q)}${g?`<small>escaño ${jaen.p.traza.find(t=>t.party===id&&t.divisor===d).seat}</small>`:''}</td>`}).join('')}</tr>`).join('')}</tbody></table></div>`;
 const podemosMadrid=madrid.p.votos.podemos;
 return `<p class="caso-intro">Seguimos una encuesta real de principio a fin: la <a href="${h(poll.source)}" target="_blank" rel="noopener">encuesta flash de 40dB</a> para ${h(poll.publisher)}, con ${n0(poll.sample)} entrevistas por internet el 7 y el 8 de octubre, publicada el ${h(fecha(poll.published))}. Cada paso dice de dónde sale la cifra: <span class="caso-tag dato">dato de 40dB</span>, <span class="caso-tag nuestro">cálculo nuestro</span> o <span class="caso-tag supuesto">supuesto</span>.</p>
 <ol class="caso-pasos">
 <li><h3>Lo que responde la gente</h3>
  <p><span class="caso-tag dato">dato de 40dB</span> A la pregunta de a quién votaría, sobre el total de entrevistados (${fuente}, p. ${informe.paginas.directa}):</p>
  ${barra([...c.directa,['Otras candidaturas y voto en blanco',c.resto,'caso-otros'],...c.noValidos.map(([n,v])=>[n,v,'caso-nv'])])}
  <div class="table-wrap"><table class="caso-tabla caso-compacta"><tbody>
   ${c.directa.map(([n,v])=>`<tr><th scope="row"><i class="caso-punto" style="--c:${color(n)}"></i>${h(n)}</th><td class="num">${pc(v)}</td></tr>`).join('')}
   <tr><th scope="row"><i class="caso-punto" style="--c:#c9d1cd"></i>Otras candidaturas y voto en blanco</th><td class="num">${pc(c.resto)}</td></tr>
   ${c.noValidos.map(([n,v])=>`<tr class="caso-menor"><th scope="row"><i class="caso-punto caso-hueco"></i>${h(n)}</th><td class="num">${pc(v)}</td></tr>`).join('')}
  </tbody></table></div>
  <p class="caso-nota">«Otras candidaturas y voto en blanco» es la diferencia hasta 100 que calculamos nosotros: el informe no la desglosa en esa página.</p></li>

 <li><h3>Quitar lo que no es un voto válido</h3>
  <p><span class="caso-tag nuestro">cálculo nuestro</span> No sabe, no contesta, no votaría y voto nulo suman ${pc(c.excluidos)}. Queda un ${pc(c.validos)} de voto válido declarado, en el que el voto en blanco sí cuenta. Repartido sobre esa base:</p>
  ${barra(pasos2)}
  <p class="caso-cifras">${pasos2.map(([n,v])=>`<span><i class="caso-punto" style="--c:${color(n)}"></i>${h(n)} ${pc(v)}</span>`).join('')}</p>
  <p class="caso-nota"><span class="caso-tag supuesto">supuesto</span> Dividir solo entre quienes contestan equivale a suponer que los indecisos votarán como los decididos. Es el supuesto más débil de la cadena: quienes no saben o no contestan son el ${pc(micro.indecisos_mas_no_respuesta_pct)} de la muestra.</p></li>

 <li><h3>Ponderar la muestra</h3>
  <p><span class="caso-tag nuestro">cálculo nuestro</span> Las ${n0(poll.sample)} entrevistas no pesan igual: 40dB publica un ponderador (<code>${h(micro.ponderador)}</code>) para corregir los desajustes de la muestra respecto a la población. Con sus microdatos y ese ponderador obtenemos ${micro4.map(([n,v])=>`${h(n)} ${pc(v)}`).join(', ')}: lo mismo que en el paso anterior, porque el informe ya publica la intención ponderada. Ponderar tiene un coste: las ${n0(poll.sample)} entrevistas valen como ${n0(micro.efectivo_kish)} (tamaño efectivo de Kish).</p></li>

 <li><h3>Corregir con el recuerdo de voto</h3>
  <p><span class="caso-tag nuestro">cálculo nuestro</span> <span class="caso-tag supuesto">supuesto</span> Entre quienes dicen haber votado en 2023 a PP, PSOE, Vox o Sumar, el ${pc(micro.recuerdo_cuatro.PSOE)} recuerda haber votado al PSOE, cuando el PSOE obtuvo el ${pc(35.419)} de los votos de esos cuatro partidos. Si se reponderan las respuestas para que el recuerdo coincida con el resultado de 2023:</p>
  <p class="caso-cifras">${rec.map(([n,v])=>`<span><i class="caso-punto" style="--c:${color(n)}"></i>${h(n)} ${pc(v)}</span>`).join('')}</p>
  <p class="caso-nota">Es un experimento nuestro, no la receta de 40dB, y no está validado: en 2023 la calibración por recuerdo empeoró el acierto en los estudios que pudimos comprobar.</p></li>

 <li><h3>La estimación que publica 40dB</h3>
  <p><span class="caso-tag dato">dato de 40dB</span> ${pub.map(([n,v])=>`${h(n)} ${pc(v)}`).join(', ')}; Podemos ${pc(poll.values.Podemos)}, SALF ${pc(poll.values.SALF)} y otras candidaturas con voto en blanco ${pc(poll.values['Otros + blanco'])}.</p>
  <div class="table-wrap"><table class="caso-tabla"><caption>Del voto declarado a la estimación publicada (sobre voto válido)</caption>
   <thead><tr><th scope="col">Partido</th><th scope="col" class="num">Paso 2–3: declarado</th><th scope="col" class="num">Paso 4: con recuerdo</th><th scope="col" class="num">Paso 5: 40dB publica</th></tr></thead>
   <tbody>${pub.map(([n,v],i)=>`<tr><th scope="row"><i class="caso-punto" style="--c:${color(n)}"></i>${h(n)}</th><td class="num">${pc(micro4[i][1])}</td><td class="num">${pc(rec[i][1])}</td><td class="num"><b>${pc(v)}</b></td></tr>`).join('')}</tbody></table></div>
  <p class="caso-nota">La distancia entre el paso 4 y la cifra publicada es la parte de la cocina de 40dB que no se publica (probabilidad de votar, reparto de indecisos, modelos propios). No la reproducimos ni la suponemos.</p></li>

 <li><h3>De porcentajes nacionales a votos en cada provincia</h3>
  <p><span class="caso-tag supuesto">supuesto</span> Una encuesta nacional no dice cuántos votos tendrá cada partido en Jaén o en Madrid. Para repartir escaños suponemos que cada candidatura conserva el reparto territorial de su voto del 23J. Podemos toma el de Sumar, en cuya lista concurrió en 2023. SALF, sin elecciones generales previas, se reparte según el voto válido de cada provincia. Un ajuste proporcional iterativo hace que cada provincia mantenga su voto válido de 2023 y que cada partido sume en España su porcentaje de 40dB.</p></li>

 <li><h3>Escaños en toda España</h3>
  <p><span class="caso-tag nuestro">cálculo nuestro</span> En cada una de las 52 circunscripciones se aplica la ley electoral: barrera del 3 % del voto válido de la provincia y método D'Hondt. Sumando las 52:</p>
  <div class="table-wrap"><table class="caso-tabla"><caption>Escaños: reparto propio frente a los que publica 40dB</caption>
   <thead><tr><th scope="col">Candidatura</th><th scope="col" class="num">Nuestro reparto</th><th scope="col" class="num">40dB publica</th></tr></thead>
   <tbody>${nacional.map(([n,a,b])=>`<tr><th scope="row"><i class="caso-punto" style="--c:${color(n)}"></i>${h(n)}</th><td class="num"><b>${a}</b></td><td class="num">${b}</td></tr>`).join('')}</tbody></table></div>
  <p class="caso-nota">Las diferencias salen de los supuestos territoriales. Podemos no obtiene escaño en nuestro reparto porque en Madrid se queda en el ${pc(podemosMadrid/madrid.p.validos*100,2)}, por debajo de la barrera; 40dB le asigna ${c.publicados.Podemos??0}. Adelante Andalucía no concurrió en 2023 y nuestro método no puede darle voto propio; NC-bc conserva el escaño que obtuvo entonces, que 40dB no asigna.</p></li>

 <li><h3>Madrid: 37 escaños</h3>
  ${madrid.tablaVotos}
  <p>La barrera está en ${n0(madrid.barrera)} votos (3 % de ${n0(madrid.p.validos)}). ${madrid.debajo.map(([id,v])=>`${h(nm(id))} se queda a ${n0(madrid.barrera-v)} votos de superarla.`).join(' ')} Con D'Hondt, los votos de cada candidatura se dividen entre 1, 2, 3…, y los 37 cocientes más altos son los 37 escaños, en este orden:</p>
  <ol class="caso-secuencia" aria-label="Orden de asignación de los escaños de Madrid">${fichas}</ol>
  <p>El escaño 37 es para ${h(nm(madrid.ultimo.party))}: ${n0(madrid.ultimo.votes)} ÷ ${madrid.ultimo.divisor} = ${n0(madrid.ultimo.quotient)}. El siguiente cociente era el de ${h(nm(madrid.siguiente.id))} (${n0(madrid.p.votos[madrid.siguiente.id])} ÷ ${madrid.siguiente.div} = ${n0(madrid.siguiente.q)}): le habrían hecho falta ${n0(madrid.faltan)} votos más para quedarse ese escaño.</p></li>

 <li><h3>Jaén: 5 escaños</h3>
  ${jaen.tablaVotos}
  <p>La barrera está en ${n0(jaen.barrera)} votos. Con solo cinco escaños, la barrera legal no es la que decide: ${h(nm(jaenIds.at(-1)))} la supera, pero su mejor cociente (${n0(jaen.p.votos[jaenIds.at(-1)])}) queda muy lejos del quinto escaño.</p>
  ${cocientes}
  <p>El quinto escaño es para ${h(nm(jaen.ultimo.party))} (${n0(jaen.ultimo.quotient)}). El siguiente cociente era el de ${h(nm(jaen.siguiente.id))} (${n0(jaen.siguiente.q)}): le habrían hecho falta ${n0(jaen.faltan)} votos más.</p>
  <p>Las dos provincias muestran los dos efectos del sistema. En Jaén el último escaño se consigue con menos votos que en Madrid (${n0(jaen.ultimo.quotient)} frente a ${n0(madrid.ultimo.quotient)}), porque las provincias pequeñas tienen más diputados por votante. Pero para entrar en el reparto hace falta mucho más porcentaje: en Jaén, el último cociente equivale al ${pc(jaen.ultimo.quotient/jaen.p.validos*100)} del voto válido de la provincia; en Madrid, al ${pc(madrid.ultimo.quotient/madrid.p.validos*100)}, por debajo de la barrera legal del 3 %.</p></li>
 </ol>
 <p class="caso-nota caso-cierre">Es un ejemplo con una sola encuesta y sin incertidumbre. El pronóstico del Observatorio combina todos los estudios admitidos, corrige los sesgos de cada casa y simula miles de resultados posibles. <a href="#laboratorio">Prueba otros repartos en el laboratorio D'Hondt →</a></p>`;
}

/** Carga y dibuja el caso la primera vez que se abre el plegable. */
export function bindCaso(details,polls){
 if(!details)return;
 const out=details.querySelector('#caso-contenido');
 let cargado=false;
 const cargar=async()=>{
  if(cargado||!details.open)return;cargado=true;
  try{
   const [audit,election]=await Promise.all(['data/microdatos/40db-auditoria-2026.json','data/election.json'].map(async u=>{const r=await fetch(u);if(!r.ok)throw Error(u+': HTTP '+r.status);return r.json();}));
   const poll=polls.find(p=>p.id===CASO_ENCUESTA);
   out.innerHTML=renderCaso(construirCaso({poll,audit,election}));
  }catch(e){out.innerHTML=`<p role="alert">No se puede construir el caso: ${h(e.message)}</p>`;cargado=false;}
 };
 details.addEventListener('toggle',cargar);cargar();
}

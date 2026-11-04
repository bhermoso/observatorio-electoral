// «La cocina del Observatorio»: qué hemos aprendido y cómo entra en el pronóstico.
// Todas las cifras se leen de los datos publicados; el texto no contiene números fijos del corte.
const h=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const f=(v,d=1)=>Number.isFinite(v)?v.toLocaleString('es-ES',{minimumFractionDigits:d,maximumFractionDigits:d}):'—';
const sg=(v,d=1)=>Number.isFinite(v)?(v>0?'+':v<0?'−':'±')+f(Math.abs(v),d):'—';

export function renderLeccion(){
 return `<section class="panel leccion" id="cocina-observatorio" aria-labelledby="lc-h"><span class="eyebrow">Lo que hemos aprendido · y cómo entra en el pronóstico</span>
 <h2 id="lc-h">La cocina del Observatorio</h2><div id="lc-cuerpo">Cargando…</div></section>`;
}

/** Datos que necesita la lección, extraídos de las tres fuentes publicadas. Lanza si falta alguno. */
export function datosLeccion(forecast,receta,validacion){
 const rec=receta?.pasos?.find(p=>p.id==='recuerdo');
 const corr=forecast?.principal?.correccion_industria;
 if(!rec||!corr?.puntos||!validacion?.resumen)throw Error('Faltan datos de la receta, la validación o la corrección');
 const casas=Object.entries(forecast.error_23j||{}).filter(([,e])=>Number.isFinite(e.PSOE)).map(([c,e])=>({casa:c,psoe:e.PSOE,pp:e.PP})).sort((a,b)=>a.psoe-b.psoe);
 const privadas=casas.filter(c=>c.casa!=='CIS');
 const sin=forecast.variantes?.[forecast.capas?.sin_cocina?.variante||'consenso_todas'];
 return {recuerdo:{muestra:rec.recuerdo_muestra_pct,oficial:rec.resultado_oficial_pct,factores:rec.factores},
  pasos:receta.pasos.map(p=>({id:p.id,titulo:p.titulo,e:p.estimacion})),cis:receta.estudio,
  mae:validacion.resumen,casas,mismaDireccion:privadas.length>0&&privadas.every(c=>c.psoe<0),
  correccion:corr,sin,con:forecast.principal};
}

export function textoLeccion(d){
 const m=d.recuerdo.muestra,o=d.recuerdo.oficial,c=d.correccion.puntos;
 const peso=d.pasos.find(p=>p.id==='peso')?.e,fin=d.pasos.at(-1)?.e;
 const diff=(x,p)=>x?.partidos?.[p]?.voto?.[0];
 const filasCasas=d.casas.map(x=>`<tr${x.casa==='CIS'?' class="ref"':''}><th scope="row">${h(x.casa)}</th><td>${sg(x.psoe)}</td><td>${sg(x.pp)}</td></tr>`).join('');
 const fila=(p,l)=>`<tr><th scope="row">${l}</th><td>${f(diff(d.sin,p))} % · ${f(d.sin?.partidos?.[p]?.escanos?.[0],0)}</td><td>${f(diff(d.con,p))} % · ${f(d.con?.partidos?.[p]?.escanos?.[0],0)}</td><td>${sg(diff(d.con,p)-diff(d.sin,p))}</td></tr>`;
 return `
 <h3>1. Una encuesta no mide votos, mide respuestas</h3>
 <p>Entre lo que la gente contesta y lo que votará hay tres distancias: quién responde (la muestra nunca se parece del todo al electorado), qué responde (hay quien no sabe, quien no lo dice y quien lo dice a medias) y quién irá a votar. La cocina es el conjunto de decisiones con que cada instituto salva esas distancias. Cada decisión descansa en un supuesto sobre la gente que solo se comprueba el día de la elección.</p>

 <h3>2. El ingrediente decisivo: el recuerdo de voto</h3>
 <p>En el estudio ${h(d.cis)} del CIS, el <b>${f(m.PSOE)} %</b> de quienes dicen haber votado en 2023 recuerda haber votado al PSOE y el <b>${f(m.PP)} %</b> al PP. El resultado real fue ${f(o.PSOE)} % y ${f(o.PP)} %. El desfase admite dos lecturas:</p>
 <ul><li><b>La muestra está desequilibrada.</b> Contestan más votantes de un partido de los que hay. Entonces se rebaja su peso hasta que el recuerdo cuadre con el resultado (factor ${f(d.recuerdo.factores.PSOE,2)} para el PSOE y ${f(d.recuerdo.factores.PP,2)} para el PP). Es una estrategia posible de ponderación, pero no conocemos de forma completa la receta interna de cada encuestadora. Con ese ajuste, el PSOE pasa de ${f(peso?.PSOE)} % a ${f(fin?.PSOE)} %.</li>
 <li><b>El recuerdo puede ser inexacto.</b> La preferencia presente puede influir en lo que se declara haber votado. Por eso tratar ese recuerdo como una verdad exacta también podría introducir sesgos en la estimación.</li></ul>
 <p>Para elegir entre ambas lecturas aplicamos la misma receta a los dos estudios del CIS previos al 23J, con el recuerdo de 2019. El error medio fue de <b>${f(d.mae.peso,2)}</b> puntos con la intención ponderada, <b>${f(d.mae.cis_publicado,2)}</b> en la estimación publicada por el CIS y <b>${f(d.mae.participacion,2)}</b> con la receta completa. La calibración por recuerdo empeoró el acierto. En estos dos estudios, la calibración por recuerdo empeoró el resultado; <b>no permite distinguir por sí sola entre sesgo de muestra y error de recuerdo, ni generalizar a otras elecciones.</b> <a href="#cocina-propia">Ver la receta y el examen →</a></p>

 <h3>3. Errores observados por encuestadora en 2023</h3>
 <div class="table-wrap"><table><caption>Error de cada casa en el 23J: última encuesta − resultado oficial (puntos)</caption><thead><tr><th>Casa</th><th>PSOE</th><th>PP</th></tr></thead><tbody>${filasCasas}</tbody></table></div>
 <p>${d.mismaDireccion?'Todas las privadas se equivocaron con el PSOE en la misma dirección.':'Las privadas no fallaron todas en la misma dirección.'} En la estimación publicada por el CIS, el PSOE ${(d.casas.find(x=>x.casa==='CIS')?.psoe??-1)>=0?'no quedó infravalorado':'también quedó infravalorado'}. Eso no permite identificar los ajustes internos de cada casa. Cuando todas fallan igual, promediarlas no corrige nada: el error no se compensa, se suma. Por eso un agregador que solo promedia hereda el sesgo de todas.</p>

 <h3>4. Nuestra cocina: corregir la mitad del sesgo</h3>
 <p>No tenemos las entrevistas de las privadas y no podemos rehacer su cocina. El motor prueba una corrección histórica contraída: en determinadas variantes del consenso suma a su media la mitad del error de 2023, con el signo contrario. Este coeficiente no está validado entre elecciones y no demuestra una mejora. Son <b>${Object.entries(c).map(([k,v])=>`${h(k==='VOX'?'Vox':k==='SUMAR'?'Sumar':k)} ${sg(v,2)}`).join(' · ')}</b> puntos.</p>
 <p>Corregimos la mitad, y no el error entero ni nada, porque con una sola elección de referencia no sabemos si ese sesgo es estructural (la calibración por recuerdo) o fue cosa de aquella campaña. Cuando una sola observación es todo lo que hay, se acerca la corrección a cero en vez de aplicarla entera: es la contracción. La corrección se aplica a las variantes de consenso; la variante calibrada ya parte del error de cada casa, y así no se corrige dos veces lo mismo.</p>

 <h3>5. Qué cambia</h3>
 <div class="table-wrap"><table><caption>Voto (mediana) y escaños (mediana). Sin cocina: capa 2. Con cocina: estimación de referencia.</caption><thead><tr><th>Partido</th><th>Sin cocina</th><th>Con cocina</th><th>Diferencia de voto</th></tr></thead><tbody>${fila('PP','PP')}${fila('PSOE','PSOE')}${fila('VOX','Vox')}${fila('SUMAR','Sumar')}</tbody></table></div>
 <p>PP + Vox llegan a 176 escaños en el ${f((d.sin?.bloques?.['PP+VOX']?.p_mayoria??NaN)*100,0)} % de las simulaciones sin cocina y en el ${f((d.con?.bloques?.['PP+VOX']?.p_mayoria??NaN)*100,0)} % con ella. La diferencia también recoge otras decisiones de la referencia (variante calibrada y error de industria más amplio): <a href="#pronostico-cocina">descomposición completa</a>.</p>

 <h3>6. Qué podría desmentirla</h3>
 <p>Si el error de 2023 fue de coyuntura, esta corrección sobreestima al PSOE. La forma de saberlo antes del 29N es repetir el examen en las dos elecciones de 2019 y comprobar si las privadas ya entonces infravaloraban al PSOE. Mientras tanto, la corrección queda a la vista, con su parámetro (${f(d.correccion.fraccion,1)}) y su efecto.</p>`;
}

export async function bindLeccion(){
 const el=document.querySelector('#lc-cuerpo');if(!el)return;
 try{
  const [forecast,receta,validacion]=await Promise.all(['data/modelo/pronostico.json','data/microdatos/cocina_cis_3582.json','data/microdatos/validacion_cocina_cis.json']
   .map(u=>fetch(u,{cache:'no-store'}).then(r=>{if(!r.ok)throw Error(u+': HTTP '+r.status);return r.json();})));
  if(!el.isConnected)return;
  el.innerHTML=textoLeccion(datosLeccion(forecast,receta,validacion));
 }catch(e){el.textContent='No se puede mostrar la lección: '+e.message;}
}

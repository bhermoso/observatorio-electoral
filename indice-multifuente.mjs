// Dos escenarios de agregación CIS/40dB; sin alterar el pronóstico del Motor 29N.
// No se presupone un partido de referencia: el panorama está ordenado por las cifras.
const h=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const f=x=>Number(x).toLocaleString('es-ES',{minimumFractionDigits:1,maximumFractionDigits:1});
const TITULOS={PP:'PP',PSOE:'PSOE',VOX:'Vox',SUMAR:'Sumar / FA'};
export function validarIndiceMultifuente(d){
 if(d?.esquema!==1||d.uso!=='INVESTIGACION_NO_MOTOR_29N'||d.partidos?.length!==4)throw Error('Índice no habilitado');
 if(d.fuentes?.length!==2||d.fuentes.map(x=>x.id).join(',')!=='cis,40db')throw Error('Fuentes incompletas o repetidas');
 const studies=new Set(d.fuentes.map(x=>x.sha256_zip));
 if(studies.size!==2||[...studies].some(x=>!/^[a-f0-9]{64}$/.test(x)))throw Error('Huella de origen no trazable');
 for(const key of ['base','recuerdo']){
  const vals=d.escenarios?.[key]?.valores;
  for(const id of ['PP','PSOE','VOX','SUMAR']){
   const v=vals?.[id];
   if(!v||![v.cis,v['40db'],v.conjunta,v.distancia_fuentes_pp].every(n=>Number.isFinite(n)&&n>=0&&n<=100))throw Error('Partido o escenario sin cifra válida: '+key+'/'+id);
   if(Math.abs(v.conjunta-(v.cis+v['40db'])/2)>0.002)throw Error('Media de casas mal calculada: '+key+'/'+id);
   if(Math.abs(v.distancia_fuentes_pp-Math.abs(v.cis-v['40db']))>0.002)throw Error('Distancia entre casas mal calculada: '+key+'/'+id);
  }
 }
 return d;
}
export function renderIndiceMultifuente({compacto=false}={}){
 return '<section class="multi-lab'+(compacto?' multi-lab-compacto':'')+'" id="'+(compacto?'multi-home':'multi-cocina')+'">'+
 '<div class="multi-lab-head"><div><span class="eyebrow">Investigación propia · CIS × 40dB.</span>'+
 '<h2>Un dato compartido. Dos formas de estimarlo.</h2><p>La primera comparación multifuente del Observatorio, construida a partir de tabulaciones de entrevistas. No procede del promedio de las casas.</p></div>'+
 '<a href="#cocina">Abrir laboratorio y fuentes</a></div>'+
 '<div class="multi-controles"><label>Tratamiento<select data-multi-scenario><option value="base">Base ponderada · sin recuerdo</option><option value="recuerdo">Sensibilidad · con recuerdo</option></select></label>'+
 '<label>Qué mostrar<select data-multi-party><option value="todos">Panorama · todos los partidos</option><option value="PSOE">PSOE</option><option value="PP">PP</option><option value="VOX">Vox</option><option value="SUMAR">Sumar / Frente Amplio</option></select></label>'+
 '<label>Orden<select data-multi-order><option value="valor">Por estimación, de mayor a menor</option><option value="nombre">Alfabético</option></select></label></div>'+
 '<div data-multi-output aria-live="polite">Preparando la estimación…</div>'+
 '<details class="multi-metodo"><summary>Cómo se ha calculado y por qué sigue siendo experimental</summary>'+
 '<div data-multi-auditoria></div></details></section>';
}
export function pintarIndiceMultifuente(d,{escenario='base',partido='todos',orden='valor'}={}){
 validarIndiceMultifuente(d);
 if(!['base','recuerdo'].includes(escenario)||!['todos',...d.partidos].includes(partido)||!['valor','nombre'].includes(orden))throw Error('Selección de estimación no válida');
 const valores=d.escenarios[escenario].valores;
 const ids=(partido==='todos'?d.partidos:[partido]).slice().sort((a,b)=>orden==='nombre'?TITULOS[a].localeCompare(TITULOS[b],'es'):valores[b].conjunta-valores[a].conjunta);
 const max=Math.max(...ids.map(id=>valores[id].conjunta),1);
 const filas=ids.map(id=>{
  const v=valores[id],width=(v.conjunta/Math.max(max,35)*100).toFixed(2);
  return '<article class="multi-linea"><div class="multi-linea-cab"><strong>'+h(TITULOS[id])+'</strong><span><b>'+f(v.conjunta)+' %</b><small>índice experimental</small></span></div>'+
  '<div class="multi-track" role="img" aria-label="'+h(TITULOS[id])+': estimación conjunta '+f(v.conjunta)+' por ciento"><i style="width:'+width+'%"></i></div>'+
  '<div class="multi-linea-pie"><span>CIS <b>'+f(v.cis)+' %</b></span><span>40dB. <b>'+f(v['40db'])+' %</b></span><span>Distancia <b>'+f(v.distancia_fuentes_pp)+' pp</b></span></div></article>';
 }).join('');
 const other=d.escenarios[escenario==='base'?'recuerdo':'base'].valores;
 const change=ids.map(id=>'<tr><th scope="row">'+h(TITULOS[id])+'</th><td>'+f(valores[id].conjunta)+' %</td><td>'+f(other[id].conjunta)+' %</td><td>'+(valores[id].conjunta-other[id].conjunta>=0?'+':'')+f(valores[id].conjunta-other[id].conjunta)+' pp</td></tr>').join('');
 return '<div class="multi-resumen"><div><b>2</b><span>institutos con microdatos</span></div><div><b>4</b><span>partidos comparables</span></div><div><b>50/50</b><span>peso de cada instituto</span></div></div>'+
 '<p class="multi-lectura"><b>'+h(d.escenarios[escenario].etiqueta)+'.</b> Cada cifra es la media simple de las dos tabulaciones originales. La distancia entre ellas representa desacuerdo entre fuentes, <b>no un intervalo de confianza</b>.</p>'+
 '<div class="multi-resultados">'+filas+'</div>'+
 '<details class="multi-detalle"><summary>Contrastar ambos tratamientos y sus diferencias</summary><div class="table-wrap"><table><thead><tr><th>Partido</th><th>Seleccionado</th><th>Otro escenario</th><th>Diferencia</th></tr></thead><tbody>'+change+'</tbody></table></div></details>';
}
export function auditarIndiceMultifuente(d){
 validarIndiceMultifuente(d);
 return '<ol class="multi-pasos"><li><b>Dos archivos originales.</b> CIS 3582 (n='+d.fuentes[0].muestra.toLocaleString('es-ES')+') y 40dB. flash de octubre (n='+d.fuentes[1].muestra.toLocaleString('es-ES')+'). No se suman entrevistas de distintos estudios.</li>'+
 '<li><b>Dos recetas comparadas.</b> Base: CIS con PESO y 40dB. con ponde. Sensibilidad: sus calibraciones experimentales por recuerdo, que no son técnicamente equivalentes.</li>'+
 '<li><b>Una regla explícita.</b> Media simple, 50 % por instituto. No se elige el peso por el resultado electoral ni se favorece a ninguna casa.</li>'+
 '<li><b>Cuatro etiquetas comparables.</b> PP, PSOE, Vox y Sumar / FA. Podemos y partidos territoriales quedan fuera por falta de tabulación equiparable, no por ausencia de voto.</li>'+
 '<li><b>Una frontera.</b> Este resultado no alimenta escaños, simulaciones ni el Motor 29N. No existe calibración prospectiva independiente.</li></ol>'+
 '<p class="multi-fuentes"><a href="data/microdatos/indice-multifuente-cis-40db-2026.json" download>Descargar datos y métodos (JSON)</a> · <a href="https://github.com/bhermoso/observatorio-electoral/blob/main/data/microdatos/40db-auditoria-2026.json">40dB. auditado</a> · <a href="https://github.com/bhermoso/observatorio-electoral/blob/main/data/microdatos/serie-cis-2026-experimental.json">CIS auditado</a></p>';
}
export async function bindIndiceMultifuente(root=document){
 const sections=root.querySelectorAll('.multi-lab');
 if(!sections.length)return;
 try{
  const response=await fetch('data/microdatos/indice-multifuente-cis-40db-2026.json',{cache:'no-store'});
  if(!response.ok)throw Error('HTTP '+response.status);
  const data=validarIndiceMultifuente(await response.json());
  for(const section of sections){
   const escenario=section.querySelector('[data-multi-scenario]'),partido=section.querySelector('[data-multi-party]'),orden=section.querySelector('[data-multi-order]');
   const target=section.querySelector('[data-multi-output]'),audit=section.querySelector('[data-multi-auditoria]');
   const draw=()=>{if(section.isConnected)target.innerHTML=pintarIndiceMultifuente(data,{escenario:escenario.value,partido:partido.value,orden:orden.value});};
   audit.innerHTML=auditarIndiceMultifuente(data);
   for(const control of [escenario,partido,orden])control.addEventListener('change',draw);
   draw();
  }
 }catch(error){
  for(const section of sections){
   const target=section.querySelector('[data-multi-output]');
   if(section.isConnected&&target)target.textContent='Índice multifuente no disponible: '+error.message;
  }
 }
}

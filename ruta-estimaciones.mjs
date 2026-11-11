// Navegación por las cuatro naturalezas de estimación para un partido.
// Usa exclusivamente cifras que ya calcula la vista. La investigación de
// microdatos no produce un porcentaje operativo comparable y se deja sin cifra.
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=v=>Number.isFinite(v)?v.toLocaleString('es-ES',{minimumFractionDigits:1,maximumFractionDigits:1})+' %':'—';
export function vistaCuatroEstimaciones({partido,casas=[],promedio=null,modelo=null,corte=null}={}){
 if(typeof partido!=='string'||!partido)throw Error('Partido obligatorio');
 const validas=casas.filter(x=>Number.isFinite(x.value));
 const min=validas.length?Math.min(...validas.map(x=>x.value)):null;
 const max=validas.length?Math.max(...validas.map(x=>x.value)):null;
 const dif=Number.isFinite(promedio)&&Number.isFinite(modelo)?modelo-promedio:null;
 const signo=dif===null?'':dif>0?'+':dif<0?'−':'±';
 const diferencia=dif===null?'Sin comparación disponible':signo+Math.abs(dif).toLocaleString('es-ES',{minimumFractionDigits:1,maximumFractionDigits:1})+' pp frente al promedio';
 return `<section class="ruta-estimacion" aria-label="Recorrido de estimaciones para ${esc(partido)}">
  <div class="ruta-estimacion-titulo"><h3>De las encuestas al pronóstico · ${esc(partido)}</h3><p>${corte?'Corte del motor: '+esc(corte)+'. ':''}Cuatro naturalezas de información; solo la tercera es el pronóstico operativo.</p></div>
  <div class="ruta-estimacion-grid">
   <a href="#encuestas" class="ruta-paso">
    <span class="ruta-paso-num">01 · Casas</span><strong>${validas.length?fmt(min)+' – '+fmt(max):'Sin cifras'}</strong><span>${validas.length} instituto(s) con cifra. Rango observado, no intervalo estadístico.</span><small>Ver fichas originales</small></a>
   <a href="#pronostico-capas" class="ruta-paso">
    <span class="ruta-paso-num">02 · Promedio</span><strong>${fmt(promedio)}</strong><span>Agregado de encuestas con regla documentada; no se cuenta de nuevo.</span><small>Ver reglas del promedio</small></a>
   <a href="#pronostico-principal" class="ruta-paso ruta-paso-activo">
    <span class="ruta-paso-num">03 · Observatorio</span><strong>${fmt(modelo)}</strong><span>${esc(diferencia)}. Modelo vigente basado en estimaciones publicadas.</span><small>Ver modelo y escaños</small></a>
   <a href="#cocina-cap4" class="ruta-paso ruta-paso-experimental">
    <span class="ruta-paso-num">04 · Microdatos</span><strong>Experimental</strong><span>No existe una estimación operativa comparable para este corte y partido.</span><small>Ver las recetas y su validación</small></a>
  </div>
 </section>`;
}

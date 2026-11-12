// Portada: estimación experimental del Observatorio calculada a partir de entrevistas CIS.
// No es el Motor 29N ni un promedio de casas; no proyecta escaños.
import {PARTY_COLORS} from './portada-series.mjs';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=v=>Number(v).toLocaleString('es-ES',{minimumFractionDigits:1,maximumFractionDigits:1});
const PARTIDOS=[['PP','PP'],['PSOE','PSOE'],['VOX','Vox'],['SUMAR','Sumar / Frente Amplio'],['PODEMOS','Podemos'],['ERC','ERC'],['JUNTS','Junts'],['BILDU','EH Bildu'],['PNV','PNV'],['BNG','BNG'],['CC','CC'],['UPN','UPN'],['SALF','SALF']];
export function renderMicrodatosPortada(d){
 if(d?.estudio!=='3582'||!Array.isArray(d?.pasos)||!d?.resultado?.estimacion)throw Error('No hay una receta de microdatos válida para mostrar');
 const last=d.pasos.at(-1);
 if(last?.id!=='participacion')throw Error('La receta completa no está identificada');
 const final=d.resultado.estimacion;
 for(const [id] of PARTIDOS)if(!Number.isFinite(final[id])||final[id]<0||final[id]>100)throw Error('Cifra experimental inválida: '+id);
 const order=PARTIDOS.slice(0,5).sort((a,b)=>final[b[0]]-final[a[0]]);
 const plot=([id,name])=>`<li class="hub-micro-fila"><span>${esc(name)}</span><div class="hub-micro-pista" aria-hidden="true"><i style="width:${Math.min(100,final[id]/40*100).toFixed(2)}%;--c:${PARTY_COLORS[id]||'#687b72'}"></i></div><b>${fmt(final[id])} %</b></li>`;
 const other=PARTIDOS.slice(5).sort((a,b)=>final[b[0]]-final[a[0]]);
 return `<div class="hub-micro-leyenda"><strong>Reestimación propia · CIS 3582</strong><span>Octubre 2026 · voto válido (%)</span></div>
 <ol class="hub-micro-grafico" aria-label="Estimación propia experimental a partir de microdatos">${order.map(plot).join('')}</ol>
 <details class="hub-micro-otros"><summary>Ver las otras ocho candidaturas y los seis pasos de la receta</summary><ol class="hub-micro-grafico">${other.map(plot).join('')}</ol><p>Se aplican, sucesivamente: intención directa, ponderación del CIS, simpatía, calibración por recuerdo del 23J, tratamiento de indecisos y probabilidad de votar.</p><p>Las estimaciones incluyen además «otros» (${fmt(final.OTROS)} %) y voto en blanco (${fmt(final.BLANCO)} %).</p></details>
 <p class="hub-nota"><b>Investigación, no pronóstico electoral vigente.</b> Calculada con las entrevistas del CIS de octubre; no extrapola a noviembre ni asigna escaños. La receta completa no superó las pruebas históricas del 23J y <b>no entra en el Motor 29N</b>. <a href="#cocina-propia">Consultar pasos, cálculos y validación</a>.</p>`;
}

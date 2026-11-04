/**
 * Contraste descriptivo de dos informes públicos 40dB (octubre de 2026).
 * Se han transcrito cifras agregadas redondeadas; NO se han procesado los ZIP
 * de entrevistas ni se conoce la transformación interna final de la casa.
 */
export const OLAS_40DB=[
  {
    fecha:'2026-10-05',nombre:'Barómetro mensual · 5 octubre',muestra:null,
    fuente:'https://ep00.epimg.net/infografias/encuestas40db/2026/10-barometro/2026_10_informe_voto.pdf',
    paginas:{directa:13,estimacion:8},
    directa:{PP:19.6,PSOE:22.4,VOX:19.1,Sumar:4.4},
    estimacion:{PP:31.6,PSOE:27.4,VOX:18.4,Sumar:5.6},
    no_validos:{nulo:2.3,no_votaria:5.5,no_sabe:8.4,no_contesta:2.6}
  },
  {
    fecha:'2026-10-09',nombre:'Encuesta flash · 9 octubre',muestra:800,
    fuente:'https://ep00.epimg.net/infografias/encuestas40db/2026/10-08-barometro-flash/2026_10_informe_voto_barometro_flash.pdf',
    paginas:{directa:16,estimacion:5},
    directa:{PP:20.5,PSOE:23.0,VOX:20.1,Sumar:4.2},
    estimacion:{PP:31.9,PSOE:28.1,VOX:18.9,Sumar:5.3},
    no_validos:{nulo:1.4,no_votaria:4.1,no_sabe:9.1,no_contesta:2.3}
  }
];
export const PARTIDOS_40DB=['PP','PSOE','VOX','Sumar'];
const num=x=>Number(x).toLocaleString('es-ES',{minimumFractionDigits:1,maximumFractionDigits:1});
const signed=x=>(x>0?'+':'')+Number(x).toLocaleString('es-ES',{minimumFractionDigits:2,maximumFractionDigits:2});
export function comparar40db(ola){
 const excluidos=Object.values(ola.no_validos).reduce((a,b)=>a+b,0);
 const denominador=100-excluidos;
 if(!Number.isFinite(denominador)||denominador<=0||denominador>100)throw Error('Denominador inválido');
 const partidos=Object.fromEntries(PARTIDOS_40DB.map(p=>{
   const directa=ola.directa[p],estimacion=ola.estimacion[p];
   if(!Number.isFinite(directa)||!Number.isFinite(estimacion))throw Error('Falta partido: '+p);
   const normalizada=directa*100/denominador;
   return [p,{directa,normalizada,estimacion,residuo:estimacion-normalizada}];
 }));
 return {fecha:ola.fecha,denominador,partidos};
}
export function renderContraste40db(){
 const datos=OLAS_40DB.map(comparar40db);
 return `<section class="k40-comparison" aria-labelledby="k40-comparison-title" id="contraste-40db">
   <div class="k40-heading">
     <div><span class="eyebrow">40dB · Análisis propio de informes publicados · octubre 2026</span>
     <h2 id="k40-comparison-title">De la intención declarada a la estimación: ¿qué falta por explicar?</h2></div>
     <span class="k40-status">Microdatos individuales: pendientes</span>
   </div>
   <p class="k40-intro">Comparamos <strong>respuesta directa</strong>, un cálculo reproducible de <strong>normalización entre votos válidos declarados</strong> y la <strong>estimación publicada</strong>. La diferencia restante es descriptiva: no identifica el coeficiente ni la técnica privada de 40dB.</p>
   <div class="table-wrap"><table class="k40-table">
   <caption>Diferencias en puntos porcentuales. Los informes originales publican porcentajes redondeados.</caption>
   <thead><tr><th>Ola / partido</th><th>Directa (% población)</th><th>Solo denominador (% voto válido declarado)</th><th>Estimación 40dB (% voto válido)</th><th>Resto sin explicar (pp)</th></tr></thead>
   <tbody>${OLAS_40DB.map((ola,i)=>PARTIDOS_40DB.map((p,j)=>{
     const d=datos[i].partidos[p];
     return `<tr${j===0?' class="k40-first-row"':''}><th scope="row">${j===0?`<span class="k40-date">${ola.fecha==='2026-10-05'?'5 octubre':'9 octubre'}</span>`:''}${p}</th>
     <td>${num(d.directa)}</td><td>${num(d.normalizada)}</td><td><strong>${num(d.estimacion)}</strong></td><td><strong>${signed(d.residuo)}</strong></td></tr>`;
   }).join('')).join('')}</tbody></table></div>
   <div class="k40-foot"><p><strong>Patrón observable:</strong> tras normalizar, PP presenta alrededor de +7 puntos de diferencia con la estimación y Vox alrededor de −5, en ambas publicaciones. Esto no prueba una regla ni atribuye causalidad al recuerdo de voto, participación o indecisos.</p>
   <p><strong>Cálculo:</strong> denominador válido declarado = 100 − (nulo + no votaría + no lo sabe + no contesta), con voto blanco incluido; ${num(datos[0].denominador)} % en la primera ola y ${num(datos[1].denominador)} % en la segunda. Los estudios son cercanos y no equivalen a validaciones electorales independientes.</p></div>
   <div class="k40-sources"><a target="_blank" rel="noopener noreferrer" href="${OLAS_40DB[0].fuente}">Informe 5 de octubre · pp. 8 y 13 ↗</a> · <a target="_blank" rel="noopener noreferrer" href="${OLAS_40DB[1].fuente}">Informe 9 de octubre · pp. 5 y 16 ↗</a> · <a href="docs/alta-cocina-40db.md">Protocolo de investigación ↗</a></div>
 </section>`;
}

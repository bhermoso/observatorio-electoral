import fs from 'node:fs';
import {chromium} from 'playwright';
const SITE=process.env.OEE_SITE||'https://bhermoso.github.io/observatorio-electoral/';
const overlays=new Set(['styles.css','home-impact.mjs','portada-series.mjs','analysis.mjs','promedios-comparador.mjs','events.mjs','eventos-visual.mjs','cocina.mjs','cocina-resultados.mjs','acontecimiento.mjs']);
const cases=[
 {route:'dashboard',width:1200,height:700},
 {route:'dashboard',width:1366,height:768},
 {route:'dashboard',width:1440,height:900},
 {route:'dashboard',width:390,height:844},
 {route:'analisis',width:1366,height:768},
 {route:'analisis',width:1440,height:900},
 {route:'contexto',width:1366,height:768},
 {route:'pronostico',width:1366,height:768},
 {route:'encuestas',width:1366,height:768},
 {route:'cocina',width:1366,height:768},
 {route:'atlas',width:1366,height:768}
];
fs.mkdirSync('auditoria-densidad',{recursive:true});
const browser=await chromium.launch({headless:true});
const results=[];
try{
 for(const c of cases){
  const page=await browser.newPage({viewport:{width:c.width,height:c.height},deviceScaleFactor:1});
  await page.route('**/*',async route=>{
   const request=route.request();const uri=request.url();
   const path=new URL(uri).pathname,name=path.split('/').pop();
   if(path.startsWith('/observatorio-electoral/')&&overlays.has(name)){
    await route.fulfill({path:name,contentType:name.endsWith('.css')?'text/css':'text/javascript'});
   }else await route.continue();
  });
  const errors=[];
  const jsErrors=[];
  page.on('pageerror',error=>jsErrors.push(error.message));
  await page.goto(SITE+'?audit=densidad-'+c.route+'#'+c.route,{waitUntil:'domcontentloaded',timeout:60000});
  const primary=c.route==='dashboard'?'#forecast-lead-results':c.route==='analisis'?'#analysis-compare':c.route==='contexto'?'#event-visual-title':'#main';
  try{
   await page.waitForSelector(primary,{state:'visible',timeout:15000});
  }catch(e){
   // En una navegación fría el bootstrap de encuestas puede tardar más que el DOM.
   // Repetir una sola vez antes de declararlo un fallo real; conservar capturas.
   await page.reload({waitUntil:'domcontentloaded',timeout:60000});
   try{await page.waitForSelector(primary,{state:'visible',timeout:20000});}
   catch(err){errors.push('No se encuentra vista '+primary);}
  }
  await page.waitForTimeout(1000);
  const info=await page.evaluate(({route})=>{
   const box=(sel)=>{const el=document.querySelector(sel);if(!el)return null;const r=el.getBoundingClientRect(),cs=getComputedStyle(el);return {x:Math.round(r.left),y:Math.round(r.top),right:Math.round(r.right),bottom:Math.round(r.bottom),width:Math.round(r.width),height:Math.round(r.height),clientHeight:el.clientHeight,scrollHeight:el.scrollHeight,display:cs.display,visible:cs.display!=='none'&&r.height>0};};
   return {viewport:{width:innerWidth,height:innerHeight},docWidth:document.documentElement.scrollWidth,docHeight:document.documentElement.scrollHeight,
    header:box('body>header'),main:box('#main'),hero:box('#main .hero'),forecast:box('.forecast-lead'),forecastResults:box('#forecast-lead-results'),
    titular:box('#portada-titular'),seatBar:box('.portada-barra'),lastParty:box('.portada-tabla tbody tr:last-child'),lastBloc:box('.portada-bloc:last-child'),
    chart:box('.portada-grafico svg'),matrix:box('#matrix-table'),
    compare:box('#analysis-compare'),houseChart:box('.house-chart'),houseMatrix:box('.house-matrix'),weights:box('.analysis-weights-detail'),
    eventVisual:box('.event-visual-summary'),eventReading:box('.event-reading'),kitchen:box('#cocina-resultados'),kitchenTable:box('.kitchen-observed-table tbody tr:first-child'),eventHouse:box('.event-visual-house'),eventDeepOpen:document.querySelector('.event-deep-dive')?.open,eventDeep:box('.event-deep-dive'),
    route:location.hash,bodyOverflow:getComputedStyle(document.body).overflowY};
  },{route:c.route});
  if(info.docWidth>c.width+3)errors.push('Desbordamiento horizontal '+info.docWidth+'>'+c.width);
  if(c.route==='dashboard'){
   // La portada se desplaza con normalidad: se comprueba que lo principal se vea y no se corte.
   for(const k of ['titular','seatBar','lastParty','lastBloc','chart','matrix'])if(!info[k]?.visible)errors.push('No visible en la portada: '+k);
   if(info.titular?.y>c.height)errors.push('El titular queda bajo la primera pantalla');
   if(info.seatBar&&info.seatBar.right>c.width)errors.push('La barra de escaños se sale del ancho');
   if(info.chart&&info.chart.right>c.width)errors.push('El gráfico de evolución se sale del ancho');
   if(info.forecastResults?.scrollHeight>info.forecastResults?.clientHeight+3)errors.push('Pronóstico con contenido recortado');
  }else if(c.route==='analisis'){
   if(!info.houseChart?.visible||!info.houseMatrix?.visible)errors.push('Falta el comparador de casas');
   if(c.width>=1100&&info.houseChart?.right>info.houseMatrix?.x+2)errors.push('El gráfico invade la tabla');
   if(info.houseChart?.y>c.height)errors.push('Gráfico de casas fuera de la primera pantalla');
  }else if(c.route==='cocina'){
   if(!info.kitchen?.visible||!info.kitchenTable?.visible)errors.push('No se ven los datos reales de la cocina');
   if(info.kitchen?.y>c.height)errors.push('Los resultados de la cocina quedan bajo la primera pantalla');
  }else if(c.route==='contexto'){
   if(!info.eventVisual?.visible)errors.push('Faltan datos visuales del acontecimiento');
   if(info.eventVisual?.y>c.height)errors.push('Evidencia no aparece en primera pantalla');
   if(info.eventVisual?.bottom>info.eventReading?.y+2)errors.push('Evidencia invadió el análisis');
   if(info.eventDeepOpen!==false)errors.push('El bloque de metodología detallada debería estar cerrado por defecto');
  }
  if(info.header?.height>145)errors.push('Cabecera desmesurada de '+info.header.height+' px');
  if(jsErrors.length)errors.push(...jsErrors.map(x=>'JS: '+x.slice(0,150)));
  await page.screenshot({path:'auditoria-densidad/'+c.route+'-'+c.width+'x'+c.height+'.png',fullPage:true});
  results.push({...c,ok:errors.length===0,errors,info});
  console.log(JSON.stringify({route:c.route,screen:c.width+'x'+c.height,ok:!errors.length,errors,compare:info.compare,eventVisual:info.eventVisual,titular:info.titular,chart:info.chart}));
  await page.close();
 }
}finally{await browser.close();}
fs.writeFileSync('auditoria-densidad/mediciones.json',JSON.stringify(results,null,2));
if(results.some(r=>!r.ok)){console.error('AUDITORÍA DENSIDAD FALLIDA');process.exitCode=1;}
else console.log('AUDITORÍA DENSIDAD APROBADA');

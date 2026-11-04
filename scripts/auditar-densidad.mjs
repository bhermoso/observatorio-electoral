import fs from 'node:fs';
import {chromium} from 'playwright';
const SITE='https://bhermoso.github.io/observatorio-electoral/';
const overlays=new Set(['styles.css','home-impact.mjs','analysis.mjs','promedios-comparador.mjs','events.mjs','eventos-visual.mjs']);
const cases=[
 {route:'dashboard',width:1200,height:700},
 {route:'dashboard',width:1366,height:768},
 {route:'dashboard',width:1440,height:900},
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
  try{await page.waitForSelector(primary,{state:'visible',timeout:12000});}catch(e){errors.push('No se encuentra vista '+primary);}
  await page.waitForTimeout(1000);
  const info=await page.evaluate(({route})=>{
   const box=(sel)=>{const el=document.querySelector(sel);if(!el)return null;const r=el.getBoundingClientRect(),cs=getComputedStyle(el);return {x:Math.round(r.left),y:Math.round(r.top),right:Math.round(r.right),bottom:Math.round(r.bottom),width:Math.round(r.width),height:Math.round(r.height),clientHeight:el.clientHeight,scrollHeight:el.scrollHeight,display:cs.display,visible:cs.display!=='none'&&r.height>0};};
   return {viewport:{width:innerWidth,height:innerHeight},docWidth:document.documentElement.scrollWidth,docHeight:document.documentElement.scrollHeight,
    header:box('body>header'),main:box('#main'),hero:box('#main .hero'),forecast:box('.forecast-lead'),forecastResults:box('#forecast-lead-results'),
    lastParty:box('.forecast-lead-table tbody tr:last-child'),forecastFoot:box('.forecast-lead-foot'),
    kpis:box('.forecast-lead-kpis'),lastKpi:box('.forecast-mini-kpi:last-child'),
    compare:box('#analysis-compare'),houseChart:box('.house-chart'),houseMatrix:box('.house-matrix'),weights:box('.analysis-weights-detail'),
    eventVisual:box('.event-visual-summary'),eventReading:box('.event-reading'),eventHouse:box('.event-visual-house'),
    route:location.hash,bodyOverflow:getComputedStyle(document.body).overflowY};
  },{route:c.route});
  if(info.docWidth>c.width+3)errors.push('Desbordamiento horizontal '+info.docWidth+'>'+c.width);
  if(c.route==='dashboard'){
   if(info.docHeight>c.height+3)errors.push('Scroll vertical en la portada');
   if(!info.lastKpi?.visible)errors.push('KPI no visible');
   if(info.lastKpi?.bottom>info.forecastFoot?.y+1)errors.push('Los indicadores se superponen al pie');
   if(info.lastParty&&info.kpis&&
      info.lastParty.x<info.kpis.right&&info.lastParty.right>info.kpis.x&&
      info.lastParty.y<info.kpis.bottom&&info.lastParty.bottom>info.kpis.y)
     errors.push('Los indicadores se superponen a la última fila de partidos');
   if(info.forecastResults?.scrollHeight>info.forecastResults?.clientHeight+3)errors.push('Pronóstico con contenido recortado');
  }else if(c.route==='analisis'){
   if(!info.houseChart?.visible||!info.houseMatrix?.visible)errors.push('Falta el comparador de casas');
   if(c.width>=1100&&info.houseChart?.right>info.houseMatrix?.x+2)errors.push('El gráfico invade la tabla');
   if(info.houseChart?.y>c.height)errors.push('Gráfico de casas fuera de la primera pantalla');
  }else if(c.route==='contexto'){
   if(!info.eventVisual?.visible)errors.push('Faltan datos visuales del acontecimiento');
   if(info.eventVisual?.y>c.height)errors.push('Evidencia no aparece en primera pantalla');
   if(info.eventVisual?.bottom>info.eventReading?.y+2)errors.push('Evidencia invadió el análisis');
  }
  if(info.header?.height>145)errors.push('Cabecera desmesurada de '+info.header.height+' px');
  if(jsErrors.length)errors.push(...jsErrors.map(x=>'JS: '+x.slice(0,150)));
  await page.screenshot({path:'auditoria-densidad/'+c.route+'-'+c.width+'x'+c.height+'.png',fullPage:c.route!=='dashboard'});
  results.push({...c,ok:errors.length===0,errors,info});
  console.log(JSON.stringify({route:c.route,screen:c.width+'x'+c.height,ok:!errors.length,errors,compare:info.compare,eventVisual:info.eventVisual,kpis:info.kpis,foot:info.forecastFoot}));
  await page.close();
 }
}finally{await browser.close();}
fs.writeFileSync('auditoria-densidad/mediciones.json',JSON.stringify(results,null,2));
if(results.some(r=>!r.ok)){console.error('AUDITORÍA DENSIDAD FALLIDA');process.exitCode=1;}
else console.log('AUDITORÍA DENSIDAD APROBADA');

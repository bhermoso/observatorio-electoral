import fs from 'node:fs';
import { chromium } from 'playwright';

const SITE_URL='https://bhermoso.github.io/observatorio-electoral/';
const viewports=[
 {width:1200,height:700},
 {width:1280,height:720},
 {width:1366,height:768},
 {width:1440,height:900},
 {width:1920,height:1080},
];
fs.mkdirSync('auditoria-portada',{recursive:true});
const browser=await chromium.launch({headless:true});
const outputs=[];
try{
 for(const size of viewports){
  const page=await browser.newPage({viewport:size,deviceScaleFactor:1});
  // Previsualización exacta de JS/CSS del PR con las mismas encuestas publicadas.
  // Así se valida antes de fusionar, sin tener que publicar un cambio no revisado.
  await page.route('**/*',async route=>{
   const u=new URL(route.request().url()),name=u.pathname.split('/').pop();
   if(['app.mjs','home-impact.mjs','styles.css'].includes(name)&&
      u.pathname.startsWith('/observatorio-electoral/')){
    await route.fulfill({path:name,contentType:name.endsWith('.css')?'text/css':'text/javascript'});
   }else await route.continue();
  });

  const url=SITE_URL+'?audit='+Date.now();
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForTimeout(1500);
  const report=await page.evaluate(()=>{
   const names={
    head:'.impact-head',
    tabs:'.panorama-tabs',
    results:'#panorama-panel-resultados',
    forecast:'.forecast-lead',
    firstParty:'.forecast-lead-table tbody tr:first-child',
    lastParty:'.forecast-lead-table tbody tr:last-child',
    firstBloc:'.forecast-lead-bloc:first-of-type',
    lastBloc:'.forecast-lead-bloc:last-child',
    editor:'#panorama-editorial',
    editorFoot:'.panorama-editorial p:last-child',
    forecastFoot:'.forecast-lead-foot',
   };
   const items={};
   for(const [name,sel] of Object.entries(names)){
    const e=document.querySelector(sel);
    if(!e){items[name]={exists:false};continue;}
    const box=e.getBoundingClientRect(),style=getComputedStyle(e);
    items[name]={color:style.color,background:style.backgroundColor,exists:true,x:Math.round(box.left),y:Math.round(box.top),right:Math.round(box.right),bottom:Math.round(box.bottom),
      w:Math.round(box.width),h:Math.round(box.height),
      visible:style.display!=='none'&&style.visibility!=='hidden'&&box.width>0&&box.height>0};
   }
   const containers={};
   for(const sel of ['html','body','#main','#impact','#panorama-panel-resultados','.forecast-lead','#forecast-lead-results','.forecast-lead-content']){
    const e=sel==='html'?document.documentElement:document.querySelector(sel);
    if(!e)continue;
    const b=e.getBoundingClientRect(),c=getComputedStyle(e);
    containers[sel]={clientHeight:e.clientHeight,scrollHeight:e.scrollHeight,clientWidth:e.clientWidth,scrollWidth:e.scrollWidth,overflowY:c.overflowY,top:Math.round(b.top),bottom:Math.round(b.bottom)};
   }
   return {title:document.title,h1:document.querySelector('#impact-heading')?.textContent.trim(),tabCount:document.querySelectorAll('[role="tab"]').length,
     viewport:{width:innerWidth,height:innerHeight},items,containers,bodyScroll:document.documentElement.scrollHeight>innerHeight+2,route:location.href};
  });
  const errors=[];
  if(!/Panorama/i.test(report.h1||''))errors.push('No se ha cargado la portada nueva');
  if(report.tabCount!==5)errors.push('Faltan pestañas');
  if(report.bodyScroll)errors.push('La página tiene desplazamiento vertical');
  for(const key of ['head','tabs','forecast','firstParty','lastParty','firstBloc','lastBloc','editor','editorFoot','forecastFoot']){
   const r=report.items[key];
   if(!r?.visible){errors.push(key+': no visible');continue;}
   if(r.y<0||r.bottom>size.height-1)errors.push(key+': fuera del viewport '+r.y+'…'+r.bottom);
  }
  for(const [sel,c] of Object.entries(report.containers)){
   if(['#main','#impact','#panorama-panel-resultados','.forecast-lead','#forecast-lead-results'].includes(sel)&&c.scrollHeight>c.clientHeight+3)
    errors.push(sel+': contenido vertical desbordado '+c.scrollHeight+'>'+c.clientHeight);
  }
  if(report.items.editor?.bottom>report.items.results?.bottom+2)errors.push('La lectura editorial se recorta por el panel');
  if(report.items.tabs?.bottom>report.items.results?.y+1)errors.push('Pestañas aparecen después del resultado');
  if(report.items.lastParty?.bottom>report.items.forecastFoot?.y-1)
    errors.push('Última fila solapa el pie del pronóstico');
  if(report.items.lastBloc?.bottom>report.items.forecastFoot?.y-1)
    errors.push('El último bloque solapa el pie del pronóstico');

  report.errors=errors;report.pasa=errors.length===0;
  const image='auditoria-portada/'+size.width+'x'+size.height+'.png';
  await page.screenshot({path:image,fullPage:true});
  outputs.push(report);
  console.log(JSON.stringify({viewport:size,pasa:report.pasa,errors,h1:report.h1,
     main:report.containers['#main'],impact:report.containers['#impact'],
     head:report.items.head,forecast:report.items.forecast,lastParty:report.items.lastParty,
     lastBloc:report.items.lastBloc,editor:report.items.editor,forecastFoot:report.items.forecastFoot}));
  await page.close();
 }
}finally{await browser.close();}
fs.writeFileSync('auditoria-portada/resultados.json',JSON.stringify(outputs,null,2));
if(outputs.some(x=>!x.pasa)){
 console.error('AUDITORÍA VISUAL NO SUPERADA. Consultar medidas y capturas.');
 process.exitCode=1;
}else console.log('AUDITORÍA VISUAL SUPERADA: todas las cifras principales dentro de los cinco tamaños.');

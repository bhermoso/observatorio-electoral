import fs from 'node:fs';
import { chromium } from 'playwright';

// Auditoría visual de Panorama con navegador real. Por defecto mide la web publicada
// sustituyendo el JS y el CSS de la portada por los de la rama (previsualización del PR).
// OEE_SITE permite medir una copia local: OEE_SITE=http://127.0.0.1:4173/ node scripts/auditar-portada.mjs
const SITE_URL=process.env.OEE_SITE||'https://bhermoso.github.io/observatorio-electoral/';
const OVERLAY=['app.mjs','home-impact.mjs','portada-series.mjs','styles.css'];
const viewports=[
 {width:360,height:740},
 {width:390,height:844},
 {width:768,height:1024},
 {width:1280,height:720},
 {width:1440,height:900},
 {width:1920,height:1080},
];
fs.mkdirSync('auditoria-portada',{recursive:true});
const browser=await chromium.launch({headless:true});
const outputs=[];
try{
 for(const size of viewports){
  const page=await browser.newPage({viewport:size,deviceScaleFactor:1});
  const jsErrors=[];
  page.on('pageerror',e=>jsErrors.push(e.message));
  await page.route('**/*',async route=>{
   const u=new URL(route.request().url()),name=u.pathname.split('/').pop();
   if(OVERLAY.includes(name)&&u.pathname.startsWith('/observatorio-electoral/')){
    await route.fulfill({path:name,contentType:name.endsWith('.css')?'text/css':'text/javascript'});
   }else await route.continue();
  });
  await page.goto(SITE_URL+'?audit='+Date.now()+'#dashboard',{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForSelector('.portada-tabla tbody tr',{timeout:30000}).catch(()=>{});
  await page.waitForSelector('.portada-grafico svg',{timeout:15000}).catch(()=>{});
  await page.waitForTimeout(800);
  const report=await page.evaluate(()=>{
   const names={
    titular:'#portada-titular .portada-titular-cifra',
    barra:'.portada-barra',
    primerBloque:'.portada-bloc:first-child',
    tabla:'.portada-tabla',
    ultimaFila:'.portada-tabla tbody tr:last-child',
    grafico:'.portada-grafico svg',
    capas:'#matrix-table',
    menu:'body>header nav',
    ultimoEnlaceMenu:'body>header nav a:last-child',
   };
   const items={};
   for(const [name,sel] of Object.entries(names)){
    const e=document.querySelector(sel);
    if(!e){items[name]={exists:false};continue;}
    const box=e.getBoundingClientRect(),style=getComputedStyle(e);
    items[name]={exists:true,x:Math.round(box.left),y:Math.round(box.top+scrollY),right:Math.round(box.right),bottom:Math.round(box.bottom+scrollY),
     w:Math.round(box.width),h:Math.round(box.height),visible:style.display!=='none'&&style.visibility!=='hidden'&&box.width>0&&box.height>0};
   }
   // Contenedores con scroll interno que recorten contenido (la portada no debe tenerlos).
   const clipped=[...document.querySelectorAll('#impact *')].filter(e=>{
    const c=getComputedStyle(e);return /(hidden|auto|scroll)/.test(c.overflowY)&&e.scrollHeight>e.clientHeight+3&&!e.closest('.table-wrap')&&e.clientHeight>0;
   }).map(e=>e.tagName.toLowerCase()+(e.id?'#'+e.id:'')+'.'+String(e.className).split(' ')[0]);
   return {h1:document.querySelector('#impact-heading')?.textContent.trim(),tabs:document.querySelectorAll('#impact [role="tab"]').length,
    viewport:{width:innerWidth,height:innerHeight},docWidth:document.documentElement.scrollWidth,docHeight:document.documentElement.scrollHeight,
    bodyOverflow:getComputedStyle(document.body).overflowY,menuScroll:(()=>{const n=document.querySelector('body>header nav');return n?{client:n.clientWidth,scroll:n.scrollWidth,overflowX:getComputedStyle(n).overflowX}:null;})(),
    items,clipped};
  });
  const errors=[];
  if(!/Panorama/i.test(report.h1||''))errors.push('No se ha cargado la portada');
  if(report.tabs)errors.push('La portada no debe usar pestañas');
  if(report.bodyOverflow==='hidden')errors.push('El cuerpo de la página no se desplaza');
  if(report.docWidth>size.width+2)errors.push('Desbordamiento horizontal '+report.docWidth+'>'+size.width);
  for(const key of ['titular','barra','primerBloque','tabla','ultimaFila','grafico','capas','menu']){
   const r=report.items[key];
   if(!r?.visible){errors.push(key+': no visible');continue;}
   if(key!=='capas'&&(r.x<-1||r.right>size.width+1))errors.push(key+': se sale del ancho '+r.x+'…'+r.right);
  }
  if(report.items.titular?.y>size.height)errors.push('El titular no aparece en la primera pantalla');
  if(report.items.menu?.visible&&report.items.menu.w<size.width*0.5&&report.menuScroll?.scroll>report.menuScroll?.client+2)
   errors.push('Menú comprimido: '+report.items.menu.w+' px para '+report.menuScroll.scroll+' px de enlaces');
  if(report.clipped.length)errors.push('Contenido recortado por scroll interno: '+report.clipped.join(', '));
  if(jsErrors.length)errors.push(...jsErrors.map(x=>'JS: '+x.slice(0,150)));
  report.errors=errors;report.pasa=errors.length===0;
  await page.screenshot({path:'auditoria-portada/'+size.width+'x'+size.height+'.png',fullPage:true});
  outputs.push({size,...report});
  console.log(JSON.stringify({viewport:size,pasa:report.pasa,errors,docHeight:report.docHeight,titular:report.items.titular,grafico:report.items.grafico}));
  await page.close();
 }
}finally{await browser.close();}
fs.writeFileSync('auditoria-portada/resultados.json',JSON.stringify(outputs,null,2));
if(outputs.some(x=>!x.pasa)){
 console.error('AUDITORÍA VISUAL NO SUPERADA. Consultar medidas y capturas.');
 process.exitCode=1;
}else console.log('AUDITORÍA VISUAL SUPERADA: portada legible y sin recortes en los seis tamaños.');

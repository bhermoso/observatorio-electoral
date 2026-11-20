import {chromium} from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const browser=await chromium.launch({executablePath:fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined,args:['--no-sandbox']});
try{for(const width of [390,1440]){
 let revision=0;
 const context=await browser.newContext({viewport:{width,height:1000},ignoreHTTPSErrors:true}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 // Deterministic partial discovery, with actual archive/model and one failed source.
 await page.route('https://raw.githubusercontent.com/**',async route=>{
  const local=new URL(route.request().url()).pathname.split('/main/')[1];
  if(local==='data/vigilancia/candidatos.json')return route.fulfill({json:{results:[{title:'Microdatos nuevos',source_id:'p1',url:'https://productor.es/base.zip'},{title:'Promedio de encuestas',source_id:'p2',url:'https://productor.es/media'},...(revision?[{title:'Nueva noticia',source_id:'p1',url:'https://productor.es/nueva'}]:[])],sources:[{id:'p1',name:'Productor',ok:true,count:2,attempts:1},{id:'p2',name:'Otro medio',ok:true,count:1,attempts:1},{id:'p3',name:'Fuente fallida',ok:false,error:'HTTP 503',attempts:2}],status:'partial',checked_at:revision?'2026-11-17T09:00:00Z':'2026-11-17T08:00:00Z'}});
  if(local&&fs.existsSync(local))return route.fulfill({contentType:'application/json',body:fs.readFileSync(local,'utf8')});return route.abort();
 });
 await page.goto((process.env.BROWSER_URL||'http://127.0.0.1:4173/')+'#encuestas-actualizar',{waitUntil:'domcontentloaded'});
 await page.getByRole('heading',{name:'Buscar novedades',exact:true}).waitFor();await page.waitForFunction(()=>document.querySelector('#update-summary')?.textContent.includes('registros de entrada'));
 await page.waitForFunction(()=>!document.querySelector('#dispatch-polls').disabled);
 await page.locator('#dispatch-polls').click();await page.waitForFunction(()=>!document.querySelector('#dispatch-polls').disabled);assert.match(await page.locator('#poll-dispatch-status').innerText(),/Mismo informe/);
 revision=1;await page.locator('#dispatch-polls').click();await page.waitForFunction(()=>!document.querySelector('#dispatch-polls').disabled);assert.match(await page.locator('#poll-dispatch-status').innerText(),/1 publicación nueva/);
 assert.equal(await page.getByRole('tab',{name:'Novedades',exact:true}).getAttribute('aria-selected'),'true');
 assert.match(await page.locator('#launch-discovery').getAttribute('href'),/vigilancia-encuestas.yml$/);assert.match(await page.locator('#update-summary').innerText(),/no alimentan el pronóstico principal/);
 await page.selectOption('#discovery-source','p2');assert.equal(await page.locator('.news-candidates article').count(),1);assert.match(await page.locator('.news-candidates').innerText(),/Promedio/);await page.selectOption('#discovery-source','');
 await page.selectOption('#discovery-type','Microdatos');assert.equal(await page.locator('.news-candidates article').count(),1);assert.match(await page.locator('#poll-candidates-list').innerText(),/Cobertura parcial/);
 await page.selectOption('#discovery-type','Promedios');assert.equal(await page.locator('.news-candidates article').count(),1);assert.match(await page.locator('.news-candidates').innerText(),/Promedio/);
 await page.locator('#discovery-microdata > summary').click();assert.match(await page.locator('#discovery-microdata-results').innerText(),/0 matrices descargadas/);
 const audit=await new AxeBuilder({page}).include('.poll-update').withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();assert.deepEqual(audit.violations.map(x=>({id:x.id,nodes:x.nodes.map(n=>n.target)})),[]);
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);await context.close();console.log(`Novedades ${width}px: enlaces, filtros, fallo parcial, microdatos, motor y accesibilidad correctos.`);
}}finally{await browser.close();}

// Run npm run build and npm run dev first. No scan, submit or workflow dispatch.
import {chromium} from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {enVeda} from './veda.mjs';
if(enVeda()){
 assert.match(fs.readFileSync('dist/index.html','utf8'),/publicación suspendida/);
 assert.equal(fs.existsSync('dist/data'),false);
 console.log('Veda: aviso presente y datos no publicados; las pruebas del artefacto de veda siguen en npm test.');process.exit(0);
}
const base=process.env.BROWSER_URL||'http://127.0.0.1:4173/';
const output='work/auditoria-interiores';fs.mkdirSync(output,{recursive:true});
const executablePath=process.env.CHROMIUM_PATH||(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined);
const browser=await chromium.launch({executablePath,args:['--no-sandbox']});
const results=[],accessibility=[];
try{
 for(const width of [390,768,1440]){
  const context=await browser.newContext({viewport:{width,height:1000}});const page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  // Tests do not depend on availability of external editorial services.
  await page.route('https://gjzihgfzxorpvevrrfkh.supabase.co/**',r=>r.fulfill({status:200,contentType:'application/json',body:r.request().url().includes('action=approved')?'[]':'{"checked_at":null,"candidates":[],"errors":[]}'}));
  for(const route of ['dashboard','pronostico','encuestas','cocina','contexto','metodologia','atlas','laboratorio']){
   await page.goto(base+'#'+route);await page.waitForTimeout(900);
   const info=await page.evaluate(()=>({title:document.title,overflow:document.documentElement.scrollWidth>innerWidth+1}));
   assert.equal(info.overflow,false,`${route} ${width}: horizontal overflow`);assert.deepEqual(errors,[],`${route}: JS errors`);
   await page.screenshot({path:`${output}/${route}-${width}.png`});results.push({width,route,...info});
   if(route!=='dashboard'){
    for(const a of await page.locator('.interior-paths a').all()){
     const href=await a.getAttribute('href');
     if(href.startsWith('#')&&href.includes('-'))assert.ok(await page.locator('[id="'+href.slice(1)+'"]').count(),href);
    }
    if(width===1440){
     const result=await new AxeBuilder({page}).include('#visor').withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
     accessibility.push({route,violations:result.violations});
    }
   }
  }
  if(width===1440){
   await page.goto(base+'#encuestas');await page.waitForSelector('#poll-chart circle');
   await page.selectOption('#poll-institute',{label:'CIS'});assert.match(await page.locator('#poll-count').innerText(),/1 institutos/);
   assert.ok((await page.locator('#poll-chart circle title').allTextContents()).every(x=>x.startsWith('CIS')));
   await page.fill('#poll-search','no-existe-123');assert.equal(await page.locator('#poll-chart circle').count(),0);
   await page.click('#poll-reset');assert.ok(await page.locator('#poll-chart circle').count()>0);
   const point=page.locator('#poll-chart circle').first(),id=await point.getAttribute('data-poll');
   await point.focus();await page.keyboard.press('Enter');assert.ok((await page.locator('#poll-detail').innerText()).includes(id));
   await page.locator('a[href="#encuestas-visual"]').first().click();await page.waitForTimeout(250);assert.match(page.url(),/#encuestas-visual$/);
   await page.screenshot({path:`${output}/encuestas-grafico.png`});
   // Correct a fixture in the intercepted archive; never write to the service.
   const archive=JSON.parse(fs.readFileSync('data/polls.json','utf8'));archive[0].notes+=' PRUEBA DE RECARGA';
   await page.route('**/data/polls.json',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(archive)}));
   await page.click('#reload-polls');await page.waitForFunction(()=>document.querySelector('#poll-reload-status').textContent.includes('1 corregidas'));
   await page.click('#poll-reset');await page.fill('#poll-search',archive[0].id);assert.match(await page.locator('#poll-detail').innerText(),/PRUEBA DE RECARGA/);
   await page.goto(base+'#laboratorio');await page.waitForSelector('.seat-change');
   assert.ok((await page.locator('.seat-change b').allTextContents()).every(x=>x==='0'));
   await page.locator('.weight').first().fill('1.2');await page.click('#calculate');assert.ok((await page.locator('.seat-change b').allTextContents()).some(x=>x!=='0'));
   await page.screenshot({path:`${output}/laboratorio-cambio.png`});
  }
  await context.close();
 }
 fs.writeFileSync(`${output}/resultados.json`,JSON.stringify({results,accessibility},null,2));
 assert.ok(accessibility.every(r=>r.violations.length===0),'WCAG violations: see resultados.json');
 console.log(`${results.length} route/viewport checks, ${accessibility.length} WCAG checks; filters, keyboard, reload and simulation passed.`);
}finally{await browser.close();}

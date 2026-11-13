import {chromium} from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const base=process.env.BROWSER_URL||'http://127.0.0.1:4173/',out='work/auditoria-interiores';fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),args:['--no-sandbox']});
try{for(const width of [390,1440]){
 const context=await browser.newContext({viewport:{width,height:1000},ignoreHTTPSErrors:true}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'misma-muestra.html');await page.waitForSelector('#sample-app:not([hidden])');assert.equal(await page.locator('#sample-study').inputValue(),'3584');assert.match(await page.locator('#sample-status').innerText(),/45.074/);assert.equal(await page.locator('#sample-b').inputValue(),'oficial');assert.equal(await page.locator('#sample-charts article').count(),4);
 const pp=page.locator('[data-category="PP"]');assert.match(await pp.innerText(),/25,5 %/);assert.match(await pp.innerText(),/21,69 %/);assert.match(await page.locator('#sample-context').innerText(),/matriz individual no incorporada/);
 await page.screenshot({path:`${out}/misma-muestra-3584-${width}.png`,fullPage:true});
 await page.selectOption('#sample-a','censo');assert.match(await page.locator('#sample-compatibility').innerText(),/bases distintas/);assert.match(await pp.innerText(),/B − A: no comparable/);
 await page.selectOption('#sample-view','all');assert.equal(await page.locator('#sample-charts article').count(),18);await page.selectOption('#sample-view','main');
 await page.click('#sample-demo');await page.waitForFunction(()=>document.getElementById('sample-study').value==='3582'&&!document.getElementById('sample-app').hidden);assert.match(await page.locator('#sample-status').innerText(),/5[.]?024/);assert.equal(await page.locator('#sample-a').inputValue(),'peso');
 const recipe=JSON.parse(fs.readFileSync('data/microdatos/cocina_cis_3582.json'));assert.ok((await pp.innerText()).includes(recipe.resultado.estimacion.PP.toLocaleString('es-ES',{maximumFractionDigits:2})+' %'));
 await page.locator('#sample-progress').focus();await page.keyboard.press('ArrowLeft');assert.equal(await page.locator('#sample-b').inputValue(),'indecisos');await page.selectOption('#sample-b','recuerdo');
 await page.screenshot({path:`${out}/misma-muestra-receta-${width}.png`,fullPage:true});
 const url=page.url();await page.reload();await page.waitForSelector('#sample-app:not([hidden])');assert.equal(page.url(),url);assert.equal(await page.locator('#sample-b').inputValue(),'recuerdo');
 await page.selectOption('#sample-study','3411');await page.waitForFunction(()=>document.getElementById('sample-status').textContent.includes('29.201'));await page.selectOption('#sample-view','all');assert.equal(await page.locator('[data-category="PODEMOS"]').count(),0);assert.match(await page.locator('[data-category="BNG"]').innerText(),/sin cifra oficial/);
 const promise=page.waitForEvent('download');await page.click('#sample-download');const download=await promise;await download.saveAs(`${out}/misma-muestra-${width}.json`);const snapshot=JSON.parse(fs.readFileSync(`${out}/misma-muestra-${width}.json`));assert.equal(snapshot.estudio,'3411');assert.equal(snapshot.n_origen,29201);assert.equal(snapshot.entrada_pronostico,false);
 const axe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();assert.deepEqual(axe.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})),[]);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.goto(base+'comparador-encuestas.html');await page.waitForSelector('#compare-cis:not([hidden])');assert.match(await page.locator('#compare-cis').innerText(),/45.074/);assert.match(await page.locator('#compare-cis').innerText(),/2026-11-12/);
 await page.click('#compare-cis-detail');await page.waitForSelector('#compare-detail[open]');assert.match(await page.locator('#compare-detail').innerText(),/45.074/);await page.keyboard.press('Escape');await page.click('#compare-cis-show');assert.equal(await page.locator('#compare-charts circle').count(),3);assert.equal(await page.locator('#compare-table tbody tr').count(),1);assert.equal(await page.locator('#compare-a').inputValue(),'cis-3584');
 await page.locator('#compare-cis a').click();await page.waitForSelector('#sample-app:not([hidden])');assert.equal(await page.locator('#sample-study').inputValue(),'3584');
 const finalAxe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();assert.deepEqual(finalAxe.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})),[]);assert.deepEqual(errors,[]);await context.close();console.log(`Misma muestra ${width}px: 3584, recetas individuales, bases, slider, ausencias, exportación, acceso visible al CIS y WCAG correctos.`);
}}finally{await browser.close();}

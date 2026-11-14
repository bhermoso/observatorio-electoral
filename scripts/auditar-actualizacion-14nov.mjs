import {chromium} from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const base=process.env.BROWSER_URL||'http://127.0.0.1:4173/';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),args:['--no-sandbox']});
try{for(const width of [390,1440]){
 const context=await browser.newContext({viewport:{width,height:1000},ignoreHTTPSErrors:true}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'#encuestas',{waitUntil:'domcontentloaded'});await page.waitForSelector('#poll-table [data-poll]');await page.fill('#poll-search','40db-2026-11-13-tracking-dia01');await page.locator('#poll-table [data-poll]').click();
 assert.match(await page.locator('#poll-detail').innerText(),/122–135/);assert.match(await page.locator('#poll-detail').innerText(),/3,5 %/);assert.match(await page.locator('#poll-detail').innerText(),/territorial/);await page.keyboard.press('Escape');
 await page.click('#poll-reset');await page.fill('#poll-search','sigma-dos-2026-11-13-tracking');await page.locator('#poll-table [data-poll]').click();assert.match(await page.locator('#poll-detail').innerText(),/4.620/);assert.match(await page.locator('#poll-detail').innerText(),/104–109/);await page.keyboard.press('Escape');
 await page.getByRole('tab',{name:'Promedios y fuentes',exact:true}).click();await page.waitForSelector('#analisis-externos');assert.match(await page.locator('#analisis-externos h2').innerText(),/Promedios y otras estimaciones/);
 const llaneras=page.locator('#analisis-externos article').filter({has:page.getByRole('heading',{name:'Promedio de EL PAÍS · Kiko Llaneras · 14 noviembre',exact:true})});await llaneras.locator('summary').click();assert.match(await llaneras.locator('table').innerText(),/31,1 %/);
 const ateneo=page.locator('#analisis-externos article').filter({has:page.getByRole('heading',{name:'Ateneo del Dato · reestimación del CIS 3584',exact:true})});await ateneo.locator('summary').click();assert.match(await ateneo.locator('table').innerText(),/30,14 %/);assert.match(await ateneo.locator('table').innerText(),/113–133/);assert.match(await ateneo.innerText(),/misma muestra/);
 const axe=await new AxeBuilder({page}).include('#analisis-externos').withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();assert.deepEqual(axe.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})),[]);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);await context.close();console.log(`Datos 14/11 ${width}px: fichas nuevas, cifras primarias, promedios, Ateneo y WCAG correctos.`);
}}finally{await browser.close();}

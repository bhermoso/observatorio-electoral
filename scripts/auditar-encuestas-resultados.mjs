import {chromium} from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {historicalSelection,historicalScore} from '../encuestas-resultados-metricas.mjs';
const data=JSON.parse(fs.readFileSync('data/historico/encuestas-resultados.json')),base=process.env.BROWSER_URL||'http://127.0.0.1:4173/',out='work/auditoria-interiores';fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),args:['--no-sandbox']});
try{for(const width of [390,1440]){
 const context=await browser.newContext({viewport:{width,height:1000},ignoreHTTPSErrors:true}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'encuestas-resultados.html');await page.waitForSelector('#history-app:not([hidden])');assert.equal(await page.locator('#history-charts figure').count(),2);
 for(const year of ['2011-11-20','2023-07-23'])for(const horizon of [7,30,90]){
  await page.selectOption('#history-election',year);await page.selectOption('#history-horizon',String(horizon));
  const rows=historicalSelection(data,{election:year,horizon});assert.equal(await page.locator('#history-table tbody tr').count(),rows.length);
  assert.equal(await page.locator('#history-charts [data-history]').count(),rows.length*2);
 }
 await page.selectOption('#history-horizon','7');await page.selectOption('#history-house','CIS');
 assert.equal(await page.locator('.history-track-grid article').count(),6);assert.match(await page.locator('#history-track').innerText(),/mismo horizonte de 7 días/);
 await page.screenshot({path:`${out}/historico-${width}.png`,fullPage:true});
 await page.selectOption('#history-house','');await page.selectOption('#history-election','2023-07-23');
 const point=page.locator('#history-charts [data-history]').first(),id=await point.getAttribute('data-history'),study=data.encuestas.find(p=>p.id===id),election=data.elecciones.find(e=>e.fecha==='2023-07-23'),score=historicalScore(study,election.resultado,['PP','PSOE']);
 await point.focus();await page.keyboard.press('Enter');await page.waitForSelector('#history-detail[open]');assert.ok((await page.locator('#history-detail').innerText()).includes(score.mae.toLocaleString('es-ES',{maximumFractionDigits:2})+' pp'));
 assert.ok((await page.locator('#history-detail a').first().getAttribute('href')).startsWith('http'));
 const modalAxe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();assert.deepEqual(modalAxe.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})),[]);
 await page.keyboard.press('Escape');assert.equal(await page.locator('#history-detail[open]').count(),0);
 await page.selectOption('#history-party','SUMAR');assert.equal(await page.locator('#history-charts figure').count(),1);
 await page.selectOption('#history-house','CIS');const url=page.url();await page.reload();await page.waitForSelector('#history-app:not([hidden])');assert.equal(page.url(),url);assert.equal(await page.locator('#history-party').inputValue(),'SUMAR');
 await page.selectOption('#history-election','2011-11-20');assert.equal(await page.locator('#history-party').inputValue(),'common');
 await page.selectOption('#history-house','40dB.');assert.match(await page.locator('#history-charts').innerText(),/No hay estudios/);assert.match(await page.locator('#history-track').innerText(),/No se imputa error cero/);
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));const axe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();assert.deepEqual(axe.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})),[]);assert.deepEqual(errors,[]);
 await context.close();console.log(`Histórico ${width}px: cortes, casas, soporte, signos, recorrido, teclado, fuentes, enlace y WCAG correctos.`);
}}finally{await browser.close();}

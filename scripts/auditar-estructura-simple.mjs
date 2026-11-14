import {chromium} from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const archiveCount=JSON.parse(fs.readFileSync('data/polls.json')).length;
const base=process.env.BROWSER_URL||'http://127.0.0.1:4173/',out='work/auditoria-interiores';fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),args:['--no-sandbox']});
try{for(const width of [390,1440]){
 const context=await browser.newContext({viewport:{width,height:1000},ignoreHTTPSErrors:true}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base);await page.waitForSelector('.simple-dashboard .hub-tarjeta');assert.deepEqual(await page.locator('.principal-nav a').allTextContents(),['Panorama','Encuestas','Cocina','Método']);
 assert.equal(await page.locator('#hub-tarjetas .hub-tarjeta').count(),3);assert.equal(await page.locator('.home-more[open]').count(),0);assert.ok(await page.locator('#hub-hemiciclo').isVisible());assert.equal(await page.locator('#hub-promedio').isVisible(),false);
 const houses=await page.locator('#hub-tarjetas .hub-tarjeta-cab b').allTextContents();assert.equal(new Set(houses).size,3);
 const info=await page.evaluate(()=>({height:document.documentElement.scrollHeight,overflow:document.documentElement.scrollWidth>innerWidth}));assert.equal(info.overflow,false);assert.ok(info.height<2300,'Portada excesiva: '+info.height);
 await page.screenshot({path:`${out}/estructura-simple-${width}.png`,fullPage:true});
 await page.getByRole('tab',{name:'Voto',exact:true}).click();assert.ok(await page.locator('#hub-promedio').isVisible());await page.getByRole('tab',{name:'Escaños',exact:true}).click();
 const axe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();assert.deepEqual(axe.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})),[]);
 await page.locator('.principal-nav a').filter({hasText:'Encuestas'}).click();await page.waitForSelector('#poll-table [data-poll]');assert.equal(await page.locator('#poll-table [data-poll]').count(),archiveCount);assert.equal(await page.locator('#visor .section-tools a').count(),4);
 await page.locator('#visor .section-tools a').filter({hasText:'Institutos'}).click();await page.waitForSelector('#directory article');assert.deepEqual(await page.locator('[data-global-navigation] a').allTextContents(),['Panorama','Encuestas','Cocina','Método']);assert.ok(await page.locator('#directory article').count()>15);
 await page.locator('[data-global-navigation] a').filter({hasText:'Cocina'}).click();await page.waitForSelector('#sample-app:not([hidden])');assert.equal(await page.locator('#sample-study').inputValue(),'3584');assert.equal(await page.locator('[data-global-navigation] a').count(),4);
 assert.deepEqual(errors,[]);await context.close();console.log(`Estructura ${width}px: cuatro entradas, portada ${info.height}px, tres sondeos únicos, archivo completo, institutos y cocina accesibles.`);
}}finally{await browser.close();}

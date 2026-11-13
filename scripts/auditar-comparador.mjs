import {chromium} from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const base=process.env.BROWSER_URL||'http://127.0.0.1:4173/';
const polls=JSON.parse(fs.readFileSync('data/polls.json'));
const output='work/auditoria-interiores';fs.mkdirSync(output,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),args:['--no-sandbox']});
try{for(const width of [390,768,1440]){
 const context=await browser.newContext({viewport:{width,height:1000},ignoreHTTPSErrors:true}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'comparador-encuestas.html');await page.waitForSelector('#comparison:not([hidden])');
 assert.equal(await page.locator('#compare-charts figure').count(),3);
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 if(width===390)assert.equal(await page.locator('.compare-filter[open]').count(),0);
 await page.screenshot({path:`${output}/comparador-${width}.png`,fullPage:true});
 for(const d of await page.locator('.compare-filter').all())await d.evaluate(n=>n.open=true);
 const initialParties=await page.locator('#compare-parties input:checked').evaluateAll(ns=>ns.map(n=>n.value));
 for(const p of initialParties)await page.locator('#compare-parties input').evaluateAll((ns,value)=>{const n=ns.find(n=>n.value===value);n.checked=false;n.dispatchEvent(new Event('change',{bubbles:true}));},p);
 for(const p of ['PP','PSOE','VOX','SALF'])await page.locator('#compare-parties input').evaluateAll((ns,value)=>{const n=ns.find(n=>n.value===value);n.checked=true;n.dispatchEvent(new Event('change',{bubbles:true}));},p);
 const fifth=page.locator('#compare-parties input:not(:checked)').first();await fifth.click();assert.equal(await fifth.isChecked(),false);assert.match(await page.locator('#compare-message').innerText(),/hasta cuatro/);
 await page.click('#compare-none');assert.match(await page.locator('#compare-count').innerText(),/0 estudios/);assert.equal(await page.locator('#compare-charts circle').count(),0);
 await page.locator('#compare-houses input').evaluateAll(ns=>{for(const n of ns)if(['CIS','GAD3'].includes(n.value)){n.checked=true;n.dispatchEvent(new Event('change',{bubbles:true}));}});
 await page.selectOption('#compare-mode','latest');assert.match(await page.locator('#compare-count').innerText(),/2 estudios de 2 institutos/);
 const pair=await page.locator('#compare-a option').evaluateAll(ns=>ns.map(n=>n.value));const a=polls.find(p=>p.id===pair[0]),b=polls.find(p=>p.id===pair[1]);
 await page.selectOption('#compare-a',a.id);await page.selectOption('#compare-b',b.id);
 const expected=Number((b.values.PP-a.values.PP).toFixed(6)),delta=(expected>0?'+':'')+expected.toLocaleString('es-ES',{maximumFractionDigits:2})+' pp';
 assert.ok((await page.locator('#compare-difference').innerText()).includes(delta));
 const point=page.locator('#compare-charts circle').first();await point.focus();await page.keyboard.press('Enter');await page.waitForSelector('#compare-detail[open]');assert.match(await page.locator('#compare-detail').innerText(),/Publicación original/);
 if(width===1440){const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();assert.deepEqual(result.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})),[]);}
 await page.keyboard.press('Escape');assert.equal(await page.locator('#compare-detail[open]').count(),0);
 const downloadPromise=page.waitForEvent('download');await page.click('#compare-export');const download=await downloadPromise;await download.saveAs(`${output}/comparador-${width}.csv`);const csv=fs.readFileSync(`${output}/comparador-${width}.csv`,'utf8');assert.ok(csv.includes(a.id)&&csv.includes(b.id));assert.equal(csv.trim().split('\r\n').length,3);
 await page.click('#compare-share');assert.match(await page.locator('#compare-message').innerText(),/Enlace copiado|Copia este enlace/);
 const url=page.url();await page.reload();await page.waitForSelector('#comparison:not([hidden])');assert.equal(page.url(),url);assert.equal(await page.locator('#compare-a').inputValue(),a.id);assert.equal(await page.locator('#compare-b').inputValue(),b.id);
 for(const d of await page.locator('.compare-filter').all())await d.evaluate(n=>n.open=true);
 await page.fill('#compare-from','2026-11-20');await page.locator('#compare-from').dispatchEvent('change');await page.fill('#compare-until','2026-10-01');await page.locator('#compare-until').dispatchEvent('change');assert.match(await page.locator('#compare-count').innerText(),/Periodo no válido/);
 await page.click('#compare-reset');await page.click('#compare-history');assert.match(await page.locator('#compare-count').innerText(),new RegExp(polls.length+' estudios'));
 const axe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();assert.deepEqual(axe.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})),[]);
 assert.deepEqual(errors,[]);await context.close();console.log(`Comparador ${width}px: filtros, cuatro candidaturas, diferencias, ficha, teclado, CSV, enlace y WCAG correctos.`);
}}finally{await browser.close();}

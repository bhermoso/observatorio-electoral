import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
let server;
if(!process.env.OEE_SITE){
 server=spawn(process.execPath,['scripts/serve.mjs'],{stdio:['ignore','pipe','pipe'],windowsHide:true});
 await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);server.once('exit',code=>reject(Error('Servidor local terminó: '+code)))});
}
let browser;
try {
 browser=await chromium.launch({headless:true,...(process.env.OEE_CHROME?{executablePath:process.env.OEE_CHROME}:{})});
 for(const width of [390,1280]){
  const page=await browser.newPage({viewport:{width,height:850}});
  await page.goto((process.env.OEE_SITE||'http://127.0.0.1:4173')+'/metapromedio.html');
  await page.locator('#cutoff').fill('2026-11-19');
  await page.getByText('3 promedios incluidos', {exact:false}).waitFor();
  assert.match(await page.locator('#results').innerText(),/31,33/);
  await page.locator('#weight-0').fill('0');
  await page.getByText('2 promedios incluidos', {exact:false}).waitFor();
  assert.match(await page.locator('#results').innerText(),/31,45/);
  assert.ok(await page.getByText('Excluida por el usuario').isVisible());
  assert.ok(await page.getByRole('link',{name:'Ir al estimador experimental con microdatos →'}).isVisible());
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth));
  await page.close();
 }
 console.log('Promedio de promedios: interacción y anchuras verificadas.');
} finally {if(browser)await browser.close();if(server)server.kill();}

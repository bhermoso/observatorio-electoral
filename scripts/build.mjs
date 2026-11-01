import fs from 'node:fs';
import {enVeda, AVISO_VEDA} from './veda.mjs';
import {validatePolls} from '../schema.mjs';
import {validateEvents} from '../events.mjs';
const eventCount=validateEvents(JSON.parse(fs.readFileSync('data/events.json')));
console.log(`Contexto: ${eventCount} acontecimientos documentados.`);
const coverage=validatePolls(JSON.parse(fs.readFileSync('data/polls.json')),JSON.parse(fs.readFileSync('data/references.json')));
console.log(`Validación: ${coverage.polls} encuestas, ${coverage.institutes} institutos y ${coverage.references} referencias.`);
fs.mkdirSync('dist',{recursive:true});
for(const f of ['index.html','sala-mandos.html','styles.css','app.mjs','engine.mjs','map.mjs','polls.mjs','events.mjs','analysis.mjs']) fs.copyFileSync(f,`dist/${f}`);
fs.cpSync('data','dist/data',{recursive:true});
fs.cpSync('docs','dist/docs',{recursive:true});
// Publicar el pronóstico agregado y su historial para la pantalla de bloques.
fs.mkdirSync('dist/data/modelo',{recursive:true});
for(const [src,dest] of [['modelo/salida/pronostico.json','dist/data/modelo/pronostico.json'],['modelo/registro/historial.json','dist/data/modelo/historial.json']]) { if(fs.existsSync(src))fs.copyFileSync(src,dest); }

// Plataforma de pronóstico (modelo/): la página generada por `python3 -m modelo` es un
// fragmento HTML; se envuelve en un documento completo y se publica como pronostico.html.
const pronostico='modelo/salida/pagina.html';
if(enVeda()){
  fs.writeFileSync('dist/pronostico.html',AVISO_VEDA);
  console.log('Veda electoral (LOREG 69.7): pronostico.html sustituido por el aviso.');
}else if(fs.existsSync(pronostico)){
  const fragmento=fs.readFileSync(pronostico,'utf8');
  const corte=fragmento.indexOf('<div class="wrap">');
  const cabeza=corte>0?fragmento.slice(0,corte):'';
  const cuerpo=corte>0?fragmento.slice(corte):fragmento;
  fs.writeFileSync('dist/pronostico.html',`<!doctype html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>\n${cabeza}</head>\n<body>\n${cuerpo}\n</body>\n</html>\n`);
  console.log('Pronóstico publicado en dist/pronostico.html');
}
fs.writeFileSync('dist/.nojekyll','');
console.log('Sitio estático listo en dist/');

import fs from 'node:fs';
import path from 'node:path';
import {enVeda, AVISO_VEDA} from './veda.mjs';
import {validatePolls} from '../schema.mjs';
import {validateEvents} from '../events.mjs';
// Artefacto nuevo: nunca arrastrar JSON de una compilación previa a la veda.
const workspace=fs.realpathSync('.'),output=path.join(workspace,'dist');
if(fs.existsSync(output)){
  const real=fs.realpathSync(output),relative=path.relative(workspace,real);
  if(fs.lstatSync(output).isSymbolicLink()||relative!=='dist')throw Error('Destino dist fuera del proyecto');
  fs.rmSync(output,{recursive:true,force:true});
}
fs.mkdirSync(output,{recursive:true});
if(enVeda()){
  for(const file of ['index.html','pronostico.html'])fs.writeFileSync(path.join(output,file),AVISO_VEDA);
  fs.writeFileSync(path.join(output,'.nojekyll'),'');
  console.log('Veda: artefacto limitado al aviso, sin sondeos ni JSON del modelo.');
}else{
const eventCount=validateEvents(JSON.parse(fs.readFileSync('data/events.json')));
console.log(`Contexto: ${eventCount} acontecimientos documentados.`);
const coverage=validatePolls(JSON.parse(fs.readFileSync('data/polls.json')),JSON.parse(fs.readFileSync('data/references.json')));
console.log(`Validación: ${coverage.polls} encuestas, ${coverage.institutes} institutos y ${coverage.references} referencias.`);
fs.mkdirSync('dist',{recursive:true});
for(const f of ['recuento-encuestas.mjs','actualizar-encuestas.mjs','encuestas-servicio.mjs','buscador-microdatos.mjs','auditoria-microdatos.mjs','schema.mjs','index.html','flujograma.html','flujograma.mjs','laboratorio-imputaciones.html','laboratorio-imputaciones.mjs','motor-imputacion.mjs','diagnostico-cis.html','diagnostico-cis.mjs','tutorial-estimacion.html','tutorial-estimacion.mjs','construye-estimacion.html','construye-estimacion.mjs','cocina-escanos.mjs','cocina-escanos-ui.mjs','algoritmo-escanos.mjs','cocina-secuencial.mjs','cocina-secuencial-ui.mjs','metodologia-analisis.html','como-estimamos.html','guia-cocina.html','sala-mandos.html','styles.css','app.mjs','home-impact.mjs','portada-series.mjs','capas.mjs','orden.mjs','caso-escanos.mjs','portada-hub.mjs','portada-panel.mjs','pronostico-orden.mjs','contraste-capas.mjs','casos-cocina.mjs','pronostico-vista.mjs','acontecimiento.mjs','cocina-propia.mjs','cocina-leccion.mjs','metodo-evidencia.html','metodo-evidencia-ui.mjs','trazabilidad-recetas.mjs','validacion-recetas.html','validacion-2019-retrospectiva.mjs','evaluacion-2019.mjs','homologacion-2019.mjs','validacion-imputaciones.mjs','validacion-imputaciones-ui.mjs','validacion-cobertura.mjs','dashboard-validacion.mjs','comparador-cocina.mjs','engine.mjs','map.mjs','polls.mjs','events.mjs','eventos-visual.mjs','analysis.mjs','promedios-comparador.mjs','evidencia-40db.mjs','contraste-40db.mjs','microdatos-40db.mjs','validacion-40db-2023.mjs','catalogo-microdatos.mjs','microdatos-sociometrica.mjs','integracion.mjs','cocina.mjs','cocina-resultados.mjs','tendencias.mjs','investidura.mjs','trazabilidad.mjs','glosario.mjs']) fs.copyFileSync(f,`dist/${f}`);
fs.cpSync('data','dist/data',{recursive:true});
fs.cpSync('docs','dist/docs',{recursive:true});
// Publicar el pronóstico agregado y su historial para la pantalla de bloques.
fs.mkdirSync('dist/data/modelo',{recursive:true});
// En veda (LOREG 69.7) no se difunden estimaciones: ni la página ni los JSON del modelo.
const veda=enVeda();
if(!veda)for(const [src,dest] of [['modelo/salida/pronostico.json','dist/data/modelo/pronostico.json'],['modelo/registro/historial.json','dist/data/modelo/historial.json']]) { if(fs.existsSync(src))fs.copyFileSync(src,dest); }
// Estado de publicación: lo que el navegador muestra como «último recálculo» y «última publicación».
let corte=null,version=null;
try{const f=JSON.parse(fs.readFileSync('modelo/salida/pronostico.json'));corte=f.corte;version=f.version_modelo??null;}catch{}
fs.writeFileSync('dist/data/estado-publicacion.json',JSON.stringify({esquema:1,construido:new Date().toISOString(),commit:process.env.GITHUB_SHA||null,
 ejecucion:process.env.GITHUB_RUN_ID?`${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`:null,
 corte_modelo:corte,version_modelo:version,encuestas_archivo:coverage.polls,veda},null,1)+'\n');

// Plataforma de pronóstico (modelo/): la página generada por `python3 -m modelo` es un
// fragmento HTML; se envuelve en un documento completo y se publica como pronostico.html.
const pronostico='modelo/salida/pagina.html';
if(veda){
  fs.writeFileSync('dist/pronostico.html',AVISO_VEDA);
  console.log('Veda electoral (LOREG 69.7): pronostico.html sustituido por el aviso.');
}else if(fs.existsSync(pronostico)){
  const fragmento=fs.readFileSync(pronostico,'utf8');
  const corte=fragmento.indexOf('<div class="wrap">');
  const cabeza=corte>0?fragmento.slice(0,corte):'';
  const cuerpo=corte>0?fragmento.slice(corte):fragmento;
  fs.writeFileSync('dist/pronostico.html',`<!doctype html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>\n${cabeza}<style>.term-help{border-bottom:1px dotted #43816c;cursor:help}.term-help:focus-visible{outline:2px solid #43816c}.glossary-tooltip{position:fixed;z-index:99999;background:#163e35;color:#fff;border-radius:10px;padding:14px;max-width:320px;box-shadow:0 12px 24px #0004;pointer-events:none}.glossary-tooltip[hidden]{display:none!important}.glossary-tooltip p{font-size:13px;line-height:1.5;color:#fff;margin:8px 0 0}</style><script type="module" src="glosario.mjs"></script></head>\n<body>\n${cuerpo}\n</body>\n</html>\n`);
  console.log('Pronóstico publicado en dist/pronostico.html');
}
fs.writeFileSync('dist/.nojekyll','');
console.log('Sitio estático listo en dist/');
}


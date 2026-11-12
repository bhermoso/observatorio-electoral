// Reutilización conservadora del último pronóstico publicado cuando solo cambia Cocina/UI.
// Nunca reutilizar salida de Git versionada: puede estar obsoleta.
// En caso de duda o fallo de red, el workflow recalcula el Motor 29N.
import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';

const output=process.env.GITHUB_OUTPUT;
const finish=(ok,reason)=>{
 console.log((ok?'REUTILIZAR':'RECALCULAR')+' Motor 29N: '+reason);
 if(output)fs.appendFileSync(output,'reuse_model='+(ok?'true':'false')+'\n');
};
async function main(){
 if(process.env.GITHUB_EVENT_NAME!=='push')return finish(false,'Evento no es push: programación y ejecución manual requieren recálculo.');
 const event=JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH,'utf8'));
 const base=event.before;
 if(!/^[0-9a-f]{40}$/.test(base??'')||/^0+$/.test(base))return finish(false,'Sin commit anterior verificable.');
 let changed;
 try{changed=execFileSync('git',['diff','--name-only',base,process.env.GITHUB_SHA],{encoding:'utf8'}).trim().split('\n').filter(Boolean);}
 catch{return finish(false,'No se puede comparar el historial de cambios.');}
 // Lista cerrada: el motor no consume estos archivos. Cualquier otro cambio obliga a recalcular.
 const safe=p=>/^(home-impact\.mjs|portada-hub\.mjs|portada-series\.mjs|analysis\.mjs|promedios-comparador\.mjs|pronostico-vista\.mjs|indice-multifuente\.mjs|lectura-editorial\.(mjs|css)|editorial\.css|como-estimamos\.html|guia-cocina\.html|metodologia-analisis\.html|validacion-recetas\.html|tests\/(indice-multifuente|comparacion-visual|neutralidad-editorial)\.test\.mjs)$/.test(p)||p==='tests/test_verificar_originales_2019.py'||p==='scripts/reproducir_cocina_2019.py'||p==='scripts/sensibilidad_recuerdo_2019.py'||p.startsWith('data/microdatos/')||
 /^(cocina\.mjs|ingesta-cis-2026\.mjs|serie-cis-2026\.mjs|contraste-serie-cis-2026\.mjs|puerta-recuerdo-historico\.mjs|directa-2019n-retrospectiva\.mjs|directa-2019a-retrospectiva\.mjs|originales-cis-2019-validacion\.mjs|sensibilidad-recuerdo-cis-2019\.mjs|contraste-cis-3582\.mjs|matriz-microdatos\.mjs|homologacion-microdatos-2026\.mjs|scripts\/build\.mjs|scripts\/verificar_originales_2019\.py|scripts\/plan-publicacion\.mjs|\.github\/workflows\/pages\.yml)$/.test(p)||
 /^tests\/(ingesta-cis-2026|serie-cis-2026|contraste-serie-cis-2026|puerta-recuerdo-historico|directa-2019n-retrospectiva|directa-2019a-retrospectiva|originales-cis-2019-validacion|sensibilidad-recuerdo-cis-2019|contraste-cis-3582)\.test\.mjs$/.test(p);
 if(!changed.length||changed.some(p=>!safe(p)))return finish(false,'Hay cambios fuera de Cocina/UI: '+changed.filter(p=>!safe(p)).join(', '));
 const origin='https://bhermoso.github.io/observatorio-electoral/';
 try{
  const get=async p=>{
   const response=await fetch(origin+p+'?reposicion='+process.env.GITHUB_SHA,{signal:AbortSignal.timeout(20000),headers:{'Cache-Control':'no-cache'}});
   if(!response.ok)throw Error(p+' HTTP '+response.status);
   return response.text();
  };
  const [forecastText,histText,pageText]=await Promise.all([
   get('data/modelo/pronostico.json'),get('data/modelo/historial.json'),get('pronostico.html')
  ]);
  const forecast=JSON.parse(forecastText),history=JSON.parse(histText);
  if(!forecast?.actualizacion?.archivo_sha256||typeof forecast.corte!=='string'||!Array.isArray(history))throw Error('Pronóstico publicado incompleto');
  const currentHash=crypto.createHash('sha256').update(fs.readFileSync('data/polls.json')).digest('hex');
  if(forecast.actualizacion.archivo_sha256!==currentHash)throw Error('Hash de encuestas distinto: no se puede reutilizar');
  const day=Date.parse(forecast.corte+'T00:00:00Z'),today=Date.now();
  if(!Number.isFinite(day)||today-day<0||today-day>2*86400000)throw Error('Corte del pronóstico publicado supera el margen de dos días');
  if(!pageText.includes('<!doctype html>')&&!pageText.includes('<!DOCTYPE html>'))throw Error('Página técnica previa inválida');
  // Solo escribir los tres archivos una vez superadas TODAS las comprobaciones.
  fs.mkdirSync('modelo/salida',{recursive:true});
  fs.mkdirSync('modelo/registro',{recursive:true});
  fs.writeFileSync('modelo/salida/pronostico.json',forecastText);
  fs.writeFileSync('modelo/registro/historial.json',histText);
  fs.writeFileSync('modelo/salida/pronostico-publicado.html',pageText);
  return finish(true,'Cambios seguros ('+changed.length+'); hash de encuestas y corte publicado '+forecast.corte+' verificados.');
 }catch(e){return finish(false,'No se reutiliza publicación previa: '+e.message);}
}
await main();

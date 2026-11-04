import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const script=fs.readFileSync(new URL('../glosario.mjs',import.meta.url),'utf8').replace(/^export /gm,'');
const globals={document:{readyState:'loading',addEventListener(){}},console};
const items=vm.runInNewContext(script+'\nTERMINOS',globals);
const terms=new Map(items.map(([name,definition])=>[name.toLowerCase(),definition]));

test('Glosario contiene y explica los conceptos fundamentales',()=>{
 for(const term of ['intención de voto','intención directa ponderada','recuerdo de voto','error muestral','error no muestral','probabilidad de votar','probabilidad de voto','error de industria','simpatía','transferencias de voto','efecto de encuestadora','mayoría simple','d’Hondt']){
  assert.ok(terms.has(term.toLowerCase()),term);
  assert.ok(terms.get(term.toLowerCase()).length>55,term);
 }
 assert.ok(items.length>=35);
});
test('No confunde intención, recuerdo, simpatía o abstenciones',()=>{
 assert.match(terms.get('intención de voto'),/persona dice/);
 assert.match(terms.get('recuerdo de voto'),/elección pasada/);
 assert.match(terms.get('simpatía'),/No garantiza/);
 assert.match(terms.get('error de industria'),/mismo sentido/);
 assert.match(terms.get('abstención'),/170 síes/);
});
test('Las definiciones aportan ejemplos de cálculo y distinguen supuestos del motor',()=>{
 assert.match(terms.get('media ponderada'),/30×2/);
 assert.match(terms.get('mae'),/\(1\+2\+3\)\/3/);
 assert.match(terms.get('mayoría simple'),/170 a favor/);
 assert.match(terms.get('error de industria'),/2,2 puntos/);
 assert.match(terms.get('calibración histórica'),/circular/);
 assert.match(terms.get('voto más simpatía'),/no todo simpatizante/);
});
test('Portal, páginas técnicas y pronóstico generado cargan el mismo glosario',()=>{
 for(const page of ['index.html','como-estimamos.html','guia-cocina.html','metodologia-analisis.html','sala-mandos.html']){
  assert.match(fs.readFileSync(new URL('../'+page,import.meta.url),'utf8'),/src="glosario.mjs"/,page);
 }
 const build=fs.readFileSync(new URL('../scripts/build.mjs',import.meta.url),'utf8');
 assert.match(build,/\x27glosario.mjs\x27/);
 assert.match(build,/src="glosario.mjs"/);
});

test('Placebo, efecto, comparabilidad y límites estadísticos explicados con ejemplos',()=>{
 for(const term of ['placebo','prueba placebo','pruebas placebo','umbral placebo','percentil 95',
   'salto inmediato','cambio a 14 días','efecto causal','contrafactual',
   'comparabilidad','campo íntegramente posterior','oleada',
   'error típico','significación estadística','ruido estadístico',
   'mediana de escaños','probabilidad de mayoría','retroprueba','backtesting',
   'veda electoral','fecha de publicación','fecha de corte',
   'fuente primaria','fuente secundaria','puerta de calidad','Monte Carlo',
   'distribución provincial','magnitud de distrito','número de simulaciones']){
  assert.ok(terms.has(term.toLowerCase()),'Falta etiqueta emergente: '+term);
  assert.ok(terms.get(term.toLowerCase()).length>75,'Explicación insuficiente: '+term);
 }
 assert.match(terms.get('umbral placebo'),/95 %/);
 assert.match(terms.get('efecto causal'),/contrafactual/);
 assert.match(terms.get('probabilidad de mayoría'),/no es la probabilidad/);
 assert.ok(!terms.has('pp'),'No confundir la abreviatura técnica con el partido PP');
});

test('Glosario reconoce texto de encabezados desplegables y los cambios DOM sin perder registros',()=>{
 assert.match(script,/const SKIP='a,button,input/);
 assert.match(script,/queuedDecorations\.add\(n\)/);
 assert.match(script,/queuedDecorations\.clear\(\)/);
 const duplicates=items.map(([name])=>name.toLowerCase()).filter((name,index,arr)=>arr.indexOf(name)!==index);
 assert.deepEqual(duplicates,[]);
 assert.ok(items.length>=90,'El glosario debe explicar términos de varias áreas');
});

test('Los términos críticos de la página de acontecimientos están cubiertos',()=>{
 const src=fs.readFileSync(new URL('../acontecimiento.mjs',import.meta.url),'utf8');
 for(const term of ['placebo','comparabilidad','margen','salto','efecto causal']){
  assert.ok(src.toLowerCase().includes(term),'La página debería mencionar '+term);
 }
 for(const term of ['placebo','comparabilidad','margen de error','salto inmediato','efecto causal']){
  assert.ok(terms.has(term),'No hay ayuda para '+term);
 }
});

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

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {renderCocina} from '../cocina.mjs';
import {renderAnalysis} from '../analysis.mjs';
import {renderEvents} from '../events.mjs';
import {renderPronostico} from '../pronostico-vista.mjs';
const file=p=>fs.readFileSync(p,'utf8');

test('Nueve rutas y enlaces a secciones se conservan',()=>{
 const source=file('app.mjs');
 for(const route of ['dashboard','pronostico','encuestas','analisis','contexto','cocina','atlas','laboratorio','metodologia'])
   assert.match(source,new RegExp("'"+route+"'"));
 assert.match(source,/export function resolveRoute\(hash\)/);
 assert.match(source,/const base=full\.split\('-'\)\[0\]/);
 assert.match(source,/anchor:full/);
 for(const target of ['#cocina-resultados','#pronostico-evaluacion'])
   assert.match(source, /document\.getElementById\(anchor\)/);
});

test('Los cinco módulos esenciales están enlazados y publicados',()=>{
 const build=file('scripts/build.mjs');
 const kitchen=renderCocina();
 const analysis=renderAnalysis([]);
 const events=renderEvents([]);
 const forecast=renderPronostico();
 assert.match(kitchen,/id="cocina-resultados"/);
 assert.ok(kitchen.indexOf('id="cocina-observatorio"')>=0);
 assert.ok(kitchen.indexOf('id="cocina-observatorio"')<kitchen.indexOf('id="cocina-resultados"'));
 assert.match(analysis,/id="analysis-compare"/);
 assert.match(events,/Acontecimientos: datos y evolución/);
 assert.match(forecast,/id="fc-validation-publica"/);
 for(const module of ['home-impact.mjs','promedios-comparador.mjs','eventos-visual.mjs','cocina.mjs','cocina-resultados.mjs','pronostico-vista.mjs'])
   assert.ok(build.includes("'"+module+"'"),'Falta en compilación: '+module);
 assert.match(build,/modelo\/salida\/pronostico\.json/);
});

test('Las fuentes y límites del modelo no se exageran',()=>{
 const results=file('cocina-resultados.mjs');
 const lesson=file('cocina-leccion.mjs');
 const kitchen=file('cocina.mjs');
 const audit=file('modelo/motor/validacion_publica.py');
 const forecast=file('pronostico-vista.mjs');
 assert.doesNotMatch(results,/barometro-de-octubre-2026/);
 assert.match(results,/\/es\/estudios\/catalogo/);
 assert.match(results,/buscar estudio 3582/);
 assert.match(kitchen,/varias elecciones independientes/);
 assert.doesNotMatch(lesson,/el recuerdo de voto es una actitud disfrazada de dato/);
 assert.doesNotMatch(lesson,/Es lo que hacen casi todas las encuestadoras privadas/);
 assert.match(audit,/def corte_publicado/);
 assert.match(audit,/fecha_publicacion_desconocida/);
 assert.match(audit,/congelado_por_veda/);
 assert.match(forecast,/publicValidation\(f\)/);
 assert.match(forecast,/no cuentan como varias elecciones/);
 const micro=JSON.parse(file('data/microdatos/analisis_3582.json'));
 const auditCis=JSON.parse(file('data/microdatos/auditoria_cocina_23j.json'));
 assert.equal(micro.study,'3582');
 assert.equal(micro.n,5024);
 assert.equal(auditCis.pruebas_seleccion_y_traslado.length,2);
 assert.ok(auditCis.pruebas_seleccion_y_traslado.every(x=>x.mejora_frente_publicado===false));
});

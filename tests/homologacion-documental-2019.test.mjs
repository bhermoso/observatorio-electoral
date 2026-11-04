import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validarEvidencia2019,renderHomologacion2019,renderEstadoHomologacion2019} from '../homologacion-2019.mjs';
import {renderPronostico} from '../pronostico-vista.mjs';

const evidence=JSON.parse(fs.readFileSync('data/microdatos/evidencia_homologacion_2019.json','utf8'));
const config=JSON.parse(fs.readFileSync('data/microdatos/homologacion_2019_pendiente.json','utf8'));

test('CIS 2019: referencias oficiales comprobadas no equivalen a homologación completa',()=>{
 const a=validarEvidencia2019(evidence,config);
 assert.equal(a.ready,false);
 assert.equal(a.status,'PARCIAL');
 assert.equal(a.verified,8);
 assert.equal(a.elections.length,2);
 assert.ok(a.elections.every(x=>!x.homologated&&x.missing.length>0&&x.unresolved.length>0));
 assert.equal(evidence.status,'DOCUMENTAL_PARCIAL_BLOQUEADA');
 for(const item of a.elections)for(const proof of item.proof.verified)
  assert.match(proof.source,/^https:\/\/www\.cis\.es\//);
});
test('El cuestionario del CIS 3263 distingue indecisión, no respuesta, intención y participación',()=>{
 const x=evidence.studies['3263'];
 assert.equal(x.direct_vote_questionnaire_codes['94'],'Indecisión explícita');
 assert.equal(x.direct_vote_questionnaire_codes['98'],'No sabe');
 assert.equal(x.direct_vote_questionnaire_codes['99'],'No contesta');
 assert.equal(x.direct_vote_questionnaire_codes['96'],'Voto en blanco');
 assert.equal(x.direct_vote_questionnaire_codes['77'],'Voto nulo');
 assert.equal(x.direct_vote_questionnaire_codes['21'],'Unidas Podemos');
 assert.equal(x.direct_vote_questionnaire_codes['50'].includes('no convertir automáticamente'),true);
 assert.ok(x.verified.some(v=>v.field==='participación declarada'&&v.value.includes('P.8')));
 assert.ok(x.unresolved.some(v=>v.includes('P.8')&&v.includes('P11')));
 assert.ok(x.unresolved.some(v=>v.includes('P.9')&&v.includes('P9R')));
 assert.equal(config.studies['3263'].intention,null);
 assert.equal(config.studies['3242'].intention,null);
});
test('Evaluación muestra evidencia y límites, sin convertirla en validación del Motor',()=>{
 const checked=validarEvidencia2019(evidence,config),html=renderEstadoHomologacion2019(checked);
 assert.match(html,/0 de 2 estudios habilitados/);
 assert.match(html,/Pendiente de homologación completa/g);
 assert.match(html,/CIS 3242/);
 assert.match(html,/CIS 3263/);
 assert.match(html,/P\.9/);
 assert.match(html,/libro de códigos/);
 assert.match(html,/Fuente CIS/);
 assert.match(html,/no se altera la receta/);
 assert.match(renderHomologacion2019(),/id="historical-codes-data"/);
 const page=renderPronostico();
 assert.match(page,/id="pronostico-homologacion"/);
 assert.match(page,/id="pronostico-evaluacion"/);
 const code=fs.readFileSync('pronostico-vista.mjs','utf8');
 assert.match(code,/bindHomologacion2019\(\)/);
 const build=fs.readFileSync('scripts/build.mjs','utf8');
 assert.match(build,/'homologacion-2019\.mjs'/);
});
test('No se inventan códigos sin soporte documental',()=>{
 assert.throws(()=>validarEvidencia2019({},config),/Registro documental incompleto/);
 assert.throws(()=>validarEvidencia2019(evidence,{}),/Falta contrato/);
 const modified=structuredClone(evidence);
 modified.studies['3263'].verified[0].source='https://example.com/inventado';
 assert.throws(()=>validarEvidencia2019(modified,config),/fuente oficial/);
});

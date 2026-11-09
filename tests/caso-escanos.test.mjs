import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {construirCaso,renderCaso,proyectarPorPartido,CASO_ENCUESTA} from '../caso-escanos.mjs';
const J=f=>JSON.parse(fs.readFileSync(f,'utf8'));
const poll=J('data/polls.json').find(p=>p.id===CASO_ENCUESTA);
const audit=J('data/microdatos/40db-auditoria-2026.json'),election=J('data/election.json');

test('El caso suma 100 en la intención directa y conserva el voto válido de cada provincia',()=>{
 const c=construirCaso({poll,audit,election});
 const total=c.directa.reduce((a,[,v])=>a+v,0)+c.resto+c.noValidos.reduce((a,[,v])=>a+v,0);
 assert.ok(Math.abs(total-100)<0.05);
 assert.ok(Math.abs(c.validos-83.1)<0.05);
 for(const [i,d] of election.districts.entries()){
  const valid=Object.values(d.votes).reduce((a,b)=>a+b,0)+d.blank;
  assert.ok(Math.abs(c.proy.provincias[i].validos-valid)<=20,d.name);
 }
});
test('Reparte 350 escaños, 37 en Madrid y 5 en Jaén, y la traza coincide con el reparto',()=>{
 const c=construirCaso({poll,audit,election});
 assert.equal(Object.values(c.proy.escanos).reduce((a,b)=>a+b,0),350);
 for(const [n,k] of [['Madrid',37],['Jaén',5]]){
  const p=c.proy.provincias.find(x=>x.nombre===n);
  assert.equal(Object.values(p.reparto).reduce((a,b)=>a+b,0),k);
  assert.equal(p.traza.length,k);
 }
 // Cerca de los escaños publicados por 40dB para los grandes partidos.
 for(const k of ['PP','PSOE','Vox'])assert.ok(Math.abs(c.proy.escanos[k]-c.publicados[k])<=3,k);
});
test('La proyección exige una estimación que sume 100',()=>{
 assert.throws(()=>proyectarPorPartido(election,{PP:30,PSOE:30,VOX:10,SUMAR:5,PODEMOS:2,SALF:1,OTROS:10}),/no suma 100/);
});
test('El texto del caso no tiene huecos y está en la portada',()=>{
 const html=renderCaso(construirCaso({poll,audit,election}));
 assert.doesNotMatch(html.replace(/<[^>]+>/g,''),/NaN|undefined|null/);
 assert.match(html,/Madrid: 37 escaños/);assert.match(html,/Jaén: 5 escaños/);
 assert.match(fs.readFileSync('home-impact.mjs','utf8'),/id="portada-caso"/);
 assert.match(fs.readFileSync('scripts/build.mjs','utf8'),/'caso-escanos\.mjs'/);
});

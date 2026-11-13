import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {historicalCut,historicalSelection,historicalScore,historicalTrack} from '../encuestas-resultados-metricas.mjs';
const row=(id,pub,fin,voto={PP:30,PSOE:25})=>({id,estudio:id,eleccion:'2023-07-23',casa:'Casa',publicacion:pub,campo_ini:fin,campo_fin:fin,voto});
test('corte temporal exige publicación conocida y campo terminado; no mira el resultado',()=>{
 const data={encuestas:[row('admitida','2023-07-16','2023-07-15'),row('futura','2023-07-17','2023-07-14'),row('antigua','2022-01-01','2022-01-01'),row('desconocida',null,'2023-07-15')]};
 assert.equal(historicalCut('2023-07-23',7),'2023-07-16');assert.deepEqual(historicalSelection(data,{election:'2023-07-23'}).map(r=>r.id),['admitida']);
 data.encuestas[0].voto.PP=99;assert.equal(historicalSelection(data,{election:'2023-07-23'})[0].id,'admitida');
});
test('dedup conserva primera publicación de mismo campo/voto, sin desplazar una oleada posterior',()=>{
 const data={encuestas:[row('original','2023-07-10','2023-07-09'),row('duplicado','2023-07-16','2023-07-09'),row('posterior','2023-07-14','2023-07-13')]};
 assert.equal(historicalSelection(data,{election:'2023-07-23'})[0].id,'posterior');
});
test('soporte común no convierte ausencia en cero ni mezcla candidaturas',()=>{
 const data={encuestas:[row('incompleta','2023-07-16','2023-07-15',{PP:0})]};assert.equal(historicalSelection(data,{election:'2023-07-23'}).length,0);assert.equal(historicalSelection(data,{election:'2023-07-23',parties:['PP']}).length,1);
 assert.equal(historicalScore(data.encuestas[0],{PP:20},['PP']).mae,20);assert.equal(historicalScore(data.encuestas[0],{PP:20,PSOE:25},['PP','PSOE']),null);
});
test('error es estimación menos oficial y MAE no cancela signos',()=>{
 const s=historicalScore({voto:{PP:35,PSOE:25}},{PP:30,PSOE:30},['PP','PSOE']);assert.deepEqual(s.errors.map(r=>r.error),[5,-5]);assert.equal(s.mae,5);
});
test('recorrido cuenta convocatorias con soporte y deja huecos explícitos',()=>{
 const data={elecciones:[{fecha:'2023-07-23',resultado:{PP:30,PSOE:30}},{fecha:'2019-11-10',resultado:{PP:20,PSOE:30}}],encuestas:[row('unica','2023-07-16','2023-07-15')]};
 const track=historicalTrack(data,{horizon:7,parties:['PP','PSOE'],house:'Casa'});assert.equal(track.length,2);assert.equal(track[1].score,null);assert.equal(track[0].study.id,'unica');
});
test('archivo real mantiene seis resultados y todas las selecciones respetan corte y soporte',()=>{
 const data=JSON.parse(fs.readFileSync('data/historico/encuestas-resultados.json'));assert.equal(data.elecciones.length,6);
 for(const e of data.elecciones)for(const horizon of [90,60,30,15,7]){
  const rows=historicalSelection(data,{election:e.fecha,horizon});assert.equal(rows.length,new Set(rows.map(r=>r.casa)).size);assert.ok(rows.every(r=>r.publicacion<=historicalCut(e.fecha,horizon)));
  for(const r of rows)assert.ok(Number.isFinite(historicalScore(r,e.resultado,['PP','PSOE']).mae));
 }
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {promedioPublicado,pollsFromModelInputs} from '../capas.mjs';
test('Entradas del motor sin publicación respetan el supuesto de fin de campo más dos días',()=>{
 const polls=pollsFromModelInputs([{estudio:'sintetica',casa:'X',campo_fin:'2026-10-31',voto:{PP:30}}]);
 assert.equal(polls[0].published,'2026-11-02');
 assert.equal(promedioPublicado(polls,{corte:'2026-11-01'}).institutos,0);
});
test('Un instituto excluido con peso cero no reduce la cobertura del bloque activo',()=>{
 const p=(id,values)=>({id,institute:id,kind:'poll-estimate',fieldStart:'2026-10-01',fieldEnd:'2026-10-02',published:'2026-10-03',scope:'España',values});
 const r=promedioPublicado([p('A',{PP:30,VOX:20}),p('B',{PP:35}),p('C',{PP:33})],{corte:'2026-11-03',ventana:45,ponderacion:'manual',pesos:{A:1,B:0,C:0}});
 assert.equal(r.bloques['PP+VOX'].valor,50);assert.equal(r.bloques['PP+VOX'].omitidos,0);assert.equal(r.institutos,1);
});

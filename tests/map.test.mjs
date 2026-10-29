import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {districtPath,renderMap} from '../map.mjs';
const data=JSON.parse(fs.readFileSync(new URL('../data/election.json',import.meta.url)));
const map=JSON.parse(fs.readFileSync(new URL('../data/cartography.json',import.meta.url)));
test('El mapa representa exactamente 52 circunscripciones y 59 unidades de origen',()=>{
 assert.equal(map.districts.length,52);assert.equal(new Set(map.districts.map(d=>d.id)).size,52);
 assert.equal(new Set(map.districts.flatMap(d=>d.nuts)).size,59);
 for(const d of data.districts){const g=map.districts.find(g=>g.id===d.id);assert.equal(g.name,d.name);assert.ok(g.polygons.length);assert.ok(!districtPath(g).includes('NaN'));}
 for(const [name,n] of [['Balears (Illes)',3],['Palmas (Las)',3],['Santa Cruz de Tenerife',4]])assert.equal(map.districts.find(d=>d.name===name).nuts.length,n);
});
test('El mapa expone 52 controles accesibles y atribución de fuente',()=>{
 const svg=renderMap(map,data,'30');assert.equal((svg.match(/role="button"/g)||[]).length,52);assert.equal((svg.match(/aria-pressed="true"/g)||[]).length,1);assert.ok(svg.includes('EuroGeographics'));assert.ok(svg.includes('uso no comercial'));
});

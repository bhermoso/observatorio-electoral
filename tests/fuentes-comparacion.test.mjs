import test from 'node:test';
import assert from 'node:assert/strict';
import {encuestasDelMotor,archivoConEntradas,promedioDeReferencia} from '../fuentes-comparacion.mjs';

const archivo=[
 {id:'a',kind:'poll-estimate',institute:'Casa A',scope:'España',fieldStart:'2026-11-01',fieldEnd:'2026-11-03',published:'2026-11-04',values:{PP:30,PSOE:27},source:'https://example.org/a',title:'Ficha completa'},
 {id:'fuera',kind:'poll-estimate',institute:'Casa C',scope:'España',fieldStart:'2026-11-01',fieldEnd:'2026-11-02',published:'2026-11-03',values:{PP:38,PSOE:18},source:'https://example.org/c'}
];
const forecast={corte:'2026-11-12',entradas:[
 {estudio:'a',casa:'Casa A',campo_ini:'2026-11-01',campo_fin:'2026-11-03',publicacion:'2026-11-04',voto:{PP:30,PSOE:27}},
 {estudio:'b',casa:'Casa B',campo_ini:'2026-11-03',campo_fin:'2026-11-08',publicacion:'2026-11-09',voto:{PP:32,PSOE:25}}
]};
test('selección del motor no incorpora fichas fuera del pronóstico',()=>{
 const rows=encuestasDelMotor(archivo,forecast);
 assert.deepEqual(rows.map(x=>x.id),['a','b']);
 assert.equal(rows[0].title,'Ficha completa');
 assert.equal(rows[1].values.PP,32);
});
test('archivo exploratorio conserva fichas e incluye entradas desconocidas',()=>{
 const rows=archivoConEntradas(archivo,forecast);
 assert.deepEqual(rows.map(x=>x.id),['a','fuera','b']);
});
test('el promedio de portada usa las entradas y el corte exacto del motor',()=>{
 const x=promedioDeReferencia(archivo,forecast);
 assert.equal(x.corte,'2026-11-12');
 assert.equal(x.fuente,'entradas_verificadas_motor');
 assert.equal(x.estudios.length,2);
 assert.equal(x.promedio.institutos,2);
 assert.equal(x.promedio.partidos.PP.valor,31);
 assert.equal(x.promedio.partidos.PSOE.valor,26);
});
test('sin pronóstico el promedio usa el archivo y declara su procedencia',()=>{
 const x=promedioDeReferencia(archivo,null,{corte:'2026-11-12'});
 assert.equal(x.fuente,'archivo');
 assert.equal(x.estudios.length,2);
});

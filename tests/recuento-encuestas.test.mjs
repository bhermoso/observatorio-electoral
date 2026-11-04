import test from 'node:test';
import assert from 'node:assert/strict';
import {renderRecuento} from '../recuento-encuestas.mjs';

test('Explica conjuntos solapados y cuenta estudios actuales, no institutos ni partidos',()=>{
 const forecast={corte:'2026-11-04',entradas:[{casa:'A',voto:{PP:30,PSOE:28}},{casa:'A'},{casa:'B'}],excluidas:[{}],auditoria_fuentes:{inventario:{total:14,historicas:10,ciclo_actual:4,wikipedia:8,archivo_verificado:5}}};
 const s=renderRecuento({forecast,seleccion:{estudios:1,institutos:1,detalle:'filtro <limitado>'}});
 assert.match(s,/2 institutos; puede usar varias oleadas/);
 assert.match(s,/10 históricas \+ 4 del ciclo actual/);
 assert.match(s,/3 admitidas y 1 excluidas/);
 assert.match(s,/8 proceden de Wikipedia/);
 assert.match(s,/No deben sumarse/);
 assert.match(s,/filtro &lt;limitado&gt;/);
});
test('Falta de metadatos no equivale a cero encuestas históricas',()=>{
 const s=renderRecuento({archivo:13,seleccion:{estudios:0,institutos:0}});
 assert.match(s,/El desglose histórico no está disponible/);
 assert.doesNotMatch(s,/0 históricas|0 proceden de Wikipedia/);
 assert.match(s,/<dd>0<\/dd>/);
});

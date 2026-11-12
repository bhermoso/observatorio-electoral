import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {renderHouseComparison} from '../promedios-comparador.mjs';

test('la comparación en Encuestas prioriza puntos y mantiene tabla de auditoría',()=>{
 const studies=[];
 const summary={rows:[],average:{PP:{value:30,count:0}}};
 const html=renderHouseComparison(studies,summary,'PP');
 assert.match(html,/house-chart/);
 assert.match(html,/<details class="house-matrix-detail">/);
 assert.match(html,/Consultar tabla completa de institutos y fuentes/);
});
test('la portada ofrece gráfico comparable sin ocultar el detalle de cifras',()=>{
 const source=readFileSync(new URL('../portada-series.mjs',import.meta.url),'utf8');
 assert.match(source,/class="cmp-graphic"/);
 assert.match(source,/class="cmp-track"/);
 assert.match(source,/<details class="cmp-detail">/);
 assert.match(source,/if\(party.value===ALL\)/);
 assert.match(source,/data-choose-party/);
 assert.doesNotMatch(source,/party.value===ALL\?'PP':party.value/);
});

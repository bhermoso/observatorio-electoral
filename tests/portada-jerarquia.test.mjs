import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {renderHomeImpact} from '../home-impact.mjs';

test('portada antepone la comparación visual a las tarjetas tradicionales',()=>{
 const html=renderHomeImpact();
 assert.ok(html.indexOf('id="home-series"')<html.indexOf('id="portada-hub"'));
 assert.ok(html.indexOf('id="portada-hub"')<html.indexOf('id="portada-ultimas"'));
 assert.match(html,/<details class="portada-metodo-desplegable">/);
 assert.match(html,/Comparador electoral/);
});
test('serie temporal sigue accesible pero el contraste por partido aparece primero',()=>{
 const src=readFileSync(new URL('../portada-series.mjs',import.meta.url),'utf8');
 assert.ok(src.indexOf('class="series-comparacion"')<src.indexOf('class="portada-grafico"'));
 assert.match(src,/<details class="series-lectura-temporal">/);
 assert.match(src,/temporal\.open\)requestAnimationFrame/);
 assert.match(src,/vistaCuatroEstimaciones/);
});

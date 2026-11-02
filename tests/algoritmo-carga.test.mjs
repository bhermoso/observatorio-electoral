import test from 'node:test';
import assert from 'node:assert/strict';
import {renderSimulador,bindSimulador} from '../algoritmo-escanos.mjs';
import fs from 'node:fs';
test('El módulo del algoritmo y el simulador son importables sin errores de sintaxis',async()=>{
// El flujograma ejecuta DOM al importarse, por lo que aquí solo se verifica su gramática con node --check en CI.
 assert.equal(typeof renderSimulador,'function');
 assert.equal(typeof bindSimulador,'function');
 assert.match(renderSimulador(),/alg-live-result/);
 const source=fs.readFileSync('algoritmo-escanos.mjs','utf8');
 assert.match(source,/ids\.map\(p=>\[p,Number\(/);
});

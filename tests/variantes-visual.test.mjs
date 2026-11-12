import test from 'node:test';
import assert from 'node:assert/strict';
import {variantsTable} from '../pronostico-vista.mjs';

function forecast(){
 const ids=['PP','PSOE','VOX','SUMAR','PODEMOS'];
 const shape=shift=>Object.fromEntries(ids.map((id,i)=>[id,{voto:[(i+1)*5+shift,0,0],escanos:[(i+1)*12+shift,0,0]}]));
 return {principal:{partidos:shape(0),industria:2.1,bloques:{}},variantes:{
  consenso_privadas:{partidos:shape(-1),bloques:{}},
  consenso_todas:{partidos:shape(1),bloques:{}},
  calibrada_23j:{partidos:shape(2),bloques:{}}
 }};
}
test('variantes priorizan gráficos de voto y escaños y conservan la auditoría',()=>{
 const html=variantsTable(forecast());
 assert.equal((html.match(/class="pr-variant-plot"/g)||[]).length,2);
 assert.equal((html.match(/class="pr-variant-row"/g)||[]).length,10);
 assert.match(html,/No es un intervalo de confianza ni de probabilidad/);
 assert.match(html,/<details class="pr-variants-detail">/);
 assert.match(html,/class="variants"/);
 assert.match(html,/Consenso de todas/);
 assert.match(html,/2,1 pp/);
 assert.doesNotMatch(html,/NaN|undefined/);
});
test('sin variantes no se inventan bandas ni cifras alternativas',()=>{
 const x=forecast();delete x.variantes;
 const html=variantsTable(x);
 assert.equal((html.match(/class="pr-variant-span"/g)||[]).length,0);
 assert.equal((html.match(/class="pr-variant-main-mark"/g)||[]).length,10);
});

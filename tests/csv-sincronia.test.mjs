import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
// Los CSV son derivados de data/polls.json: si se desfasan, la vigilancia los regenera y
// el cambio no debe confundirse con encuestas nuevas. Esta prueba exige que estén al día.
test('data/polls.csv contiene exactamente los estudios de data/polls.json',()=>{
 const polls=JSON.parse(fs.readFileSync('data/polls.json','utf8'));
 const csv=fs.readFileSync('data/polls.csv','utf8').replace(/^﻿/,'').trim().split('\n').slice(1);
 const ids=csv.map(l=>JSON.parse('['+l.split('","')[0].replace(/^"/,'"')+'"]')[0]);
 assert.deepEqual([...ids].sort(),polls.map(p=>p.id).sort());
});
test('la vigilancia solo cuenta como incorporación un cambio en polls.json',()=>{
 const wf=fs.readFileSync('.github/workflows/vigilancia-encuestas.yml','utf8');
 assert.match(wf,/git diff --quiet -- data\/polls\.json/);
 assert.doesNotMatch(wf,/git add data\/polls\.json data\/polls\.csv data\/poll-results\.csv\n\s+if git diff --cached --quiet/);
});

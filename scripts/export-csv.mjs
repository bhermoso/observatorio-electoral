import fs from 'node:fs';
const data=JSON.parse(fs.readFileSync('data/election.json'));
const csv=rows=>'\uFEFF'+rows.map(r=>r.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(',')).join('\r\n')+'\r\n';
fs.writeFileSync('data/results.csv',csv([['election','kind','district','party','votes','seats','source'],...data.districts.flatMap(d=>data.parties.filter(p=>Object.hasOwn(d.votes,p.id)).map(p=>[data.election,'official',d.name,p.name,d.votes[p.id],d.officialSeats[p.id]||0,data.source]))]));
fs.writeFileSync('data/districts.csv',csv([['election','kind','district','seats','electors','turnout','valid','candidacy','blank','invalid','source'],...data.districts.map(d=>[data.election,'official',d.name,d.seats,d.electors,d.turnout,d.valid,d.candidacy,d.blank,d.invalid,data.source])]));
const polls=JSON.parse(fs.readFileSync('data/polls.json'));
fs.writeFileSync('data/polls.csv',csv([['study','institute','kind','field_start','field_end','published','sample','mode','PP','PSOE','Sumar','VOX','source'],...polls.map(p=>[p.id,p.institute,p.kind,p.fieldStart,p.fieldEnd,p.published,p.sample,p.mode,p.values.PP,p.values.PSOE,p.values.Sumar,p.values.VOX,p.source])]));
console.log('CSV exportados con procedencia y naturaleza del dato.');

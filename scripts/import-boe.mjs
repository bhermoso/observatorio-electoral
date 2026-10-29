import fs from 'node:fs';
import crypto from 'node:crypto';
const dir = new URL('../data/sources/', import.meta.url);
const html = fs.readFileSync(new URL('resultados-boe.html',dir),'utf8');
const clean = s => s.replace(/<[^>]*>/g,'').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim();
const num = s => Number(s.replace(/\./g,'')) || 0;
const tables = [...html.matchAll(/<table\b[\s\S]*?<\/table>/g)].map(m=>m[0]);
const rows = t => [...t.matchAll(/<tr\b[\s\S]*?<\/tr>/g)].map(m=>[...m[0].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/g)].map(c=>clean(c[1]))).filter(r=>r.length);
const short = ['PP','PSOE','VOX','Sumar','PSC','ERC','Junts','EH Bildu','PNV','BNG','CC','UPN'];
const parties = []; const districts = [];
for(let ti=0;ti<tables.length;ti++) {
 const t=tables[ti], rr=rows(t), first=ti<3;
 const head=t.match(/<thead\b[\s\S]*?<\/thead>/)[0];
 const names=[...head.matchAll(/<th\b[^>]*>([\s\S]*?)<\/th>/g)].map(m=>clean(m[1])).filter(x=>x && !['Total escaños','Votos','Escaños'].includes(x));
 const group=names.map(name=>{const i=parties.length; const p={id:`p${i}`,name,label:short[i]||name.match(/\(([^()]*)\)[. ]*$/)?.[1]||name}; parties.push(p);return p;});
 rr.slice(0,52).forEach((r,i)=>{
  if(ti===0) districts.push({id:String(i+1).padStart(2,'0'),name:r[0].replace(/\.$/,''),seats:num(r[1]),votes:{},officialSeats:{}});
  group.forEach((p,j)=>{let v=r[(first?2:1)+j*(first?2:1)]; if(v?.trim()) districts[i].votes[p.id]=num(v); if(first) districts[i].officialSeats[p.id]=num(r[3+j*2]||'');});
 });
}
const text=fs.readFileSync(new URL('cuadro1.txt',dir),'utf8');
const summary=text.split('\n').map(l=>l.trim().match(/^([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+(.+)$/)).filter(Boolean).filter(m=>!m[7].includes('Total estatal'));
if(summary.length!==52) throw Error('Cuadro I incompleto');
summary.forEach((m,i)=>{
 if(m[7].trim()!==districts[i].name) throw Error(`Orden provincial incorrecto ${m[7]}`);
 const [electors,turnout,valid,candidacy,blank,invalid]=m.slice(1,7).map(num);
 Object.assign(districts[i],{electors,turnout,valid,candidacy,blank,invalid});
});
const seatHtml=fs.readFileSync(new URL('circunscripciones-boe.html',dir),'utf8');
const seatRows=rows(seatHtml.match(/<table\b[\s\S]*?<\/table>/)[0]);
if(seatRows.length!==52||seatRows.some((r,i)=>num(r[1])!==districts[i].seats || r[0].replace(/\.$/,'')!==districts[i].name)) throw Error('El anexo de escaños difiere');
const data={election:'2023-07-23',verified:'2026-10-28',kind:'official',source:'https://www.boe.es/diario_boe/txt.php?id=BOE-A-2023-18907',seatSource:'https://www.boe.es/buscar/doc.php?id=BOE-A-2023-12663',parties,districts};
fs.writeFileSync(new URL('../election.json',dir),JSON.stringify(data,null,2)+'\n');
const hashes=Object.fromEntries(['resultados-boe.html','circunscripciones-boe.html','cuadro1.txt'].map(f=>[f,crypto.createHash('sha256').update(fs.readFileSync(new URL(f,dir))).digest('hex')]));
fs.writeFileSync(new URL('../source-hashes.json',dir),JSON.stringify(hashes,null,2)+'\n');
console.log(`Importadas ${districts.length} circunscripciones y ${parties.length} candidaturas.`);

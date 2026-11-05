/** Comparar SOLO etiquetas explícitas del SAV, nunca respuestas individuales.
 * Un código idéntico con distinto significado NO se armoniza automáticamente.
 */
import fs from 'node:fs';
import {pathToFileURL} from 'node:url';

const INPUT='data/microdatos/homologacion-more-in-common-2026.json';
const OUTPUT='data/microdatos/compatibilidad-codigos-more-in-common-2026.json';
const normalize=s=>String(s||'').trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const wave=id=>String(id).match(/2026-(\d\d)-01$/)?.[1]??id;
const canonicalCodes=rows=>new Map(rows.map(r=>[String(r.codigo),String(r.etiqueta)]));

export function compareCodes(input){
 if(input?.esquema!==1||!Array.isArray(input.estudios)||input.estudios.length!==4)
  throw new Error('Se esperan cuatro olas de metadata SAV verificadas');
 const n=input.estudios.length;
 const byVar=new Map();
 for(const row of input.estudios){
  if(!row.id||!Array.isArray(row.matrices))throw new Error('Falta procedencia de la ola');
  const variables=new Map(row.matrices.flatMap(m=>m.variables_relevantes||[]).map(v=>[v.nombre,v]));
  for(const [name,v] of variables){
   if(!byVar.has(name))byVar.set(name,[]);
   byVar.get(name).push({wave:wave(row.id),name,labels:canonicalCodes(v.categorias_documentadas||[])});
  }
 }
 const conflicts=[],added=[];
 for(const [name,rows] of byVar){
  // Los códigos sin etiqueta o sin valor numérico no son comparables automáticamente.
  const union=new Set(rows.flatMap(x=>[...x.labels.keys()].filter(Boolean)));
  for(const code of union){
   const appeared=rows.map(x=>({ola:x.wave,etiqueta:x.labels.get(code)})).filter(x=>x.etiqueta!==undefined);
   if(appeared.length<2){
    if(appeared.length===1)added.push({variable:name,codigo:code,ola:appeared[0].ola,etiqueta:appeared[0].etiqueta});
    continue;
   }
   const meanings=new Set(appeared.map(x=>normalize(x.etiqueta)));
   if(meanings.size>1)conflicts.push({
     variable:name,codigo:code,
     diferencias:appeared,
     accion:'Revisar y declarar equivalencia o ruptura por ola. No recodificar automáticamente.'
   });
  }
 }
 const presentAll=[...byVar.entries()].filter(([,r])=>r.length===n).map(([k])=>k).sort();
 return {
  esquema:1,
  fuente:'Metadatos SPSS con huellas SHA-256 verificadas, sin entrevistas',
  olas:input.estudios.map(x=>({id:x.id,ola:wave(x.id),sha256:x.sha256})),
  variables_comunes:presentAll,
  cambios_de_significado:conflicts.sort((a,b)=>a.variable.localeCompare(b.variable)||a.codigo.localeCompare(b.codigo)),
  codigos_en_una_sola_ola:added.sort((a,b)=>a.variable.localeCompare(b.variable)||a.codigo.localeCompare(b.codigo)),
  politica:'Un mismo código con una etiqueta distinta es incompatible hasta declaración humana. Código ausente no significa cero respuestas.',
  homologacion_automatica:false,
  calculos_electorales:false,
  participa_motor_29n:false
 };
}
export function main(){
 const data=JSON.parse(fs.readFileSync(INPUT,'utf8'));
 const out=compareCodes(data);
 fs.writeFileSync(OUTPUT,JSON.stringify(out,null,2)+'\n','utf8');
 console.log('Comparación de etiquetas publicada sin filas: '+out.cambios_de_significado.length+
  ' cambios de significado; '+out.codigos_en_una_sola_ola.length+' categorías exclusivas de una ola.');
 const diff=out.cambios_de_significado.filter(x=>x.variable.startsWith('intencion_voto')&&x.codigo==='4.0');
 if(!diff.length)throw new Error('La regla de seguridad no detectó cambio conocido de código 4 en intención');
 console.log('Bloqueada equivalencia implícita del código 4 entre olas (Sumar / Frente Amplio).');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)main();

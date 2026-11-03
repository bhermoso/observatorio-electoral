// Datos SINTÉTICOS (identificados como tales); no representan encuestas reales.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {analizarAcontecimiento,comparabilidad,margenDiferencia,simularDesplazamiento,SIM_LABEL,renderLectura} from '../acontecimiento.mjs';
const ev={id:'sintetico',date:'2026-10-28',title:'Suceso sintético',summary:'Prueba',verified:'2026-10-29',sources:[]};
const P=(id,institute,fieldStart,fieldEnd,values,extra={})=>({id:'SINT-'+id,kind:'poll-estimate',institute,fieldStart,fieldEnd,published:fieldEnd,scope:'España',universe:'U',mode:'CATI',scenario:'E',sample:1000,values,...extra});
const polls=[
 P('a-antes','A','2026-10-10','2026-10-12',{PP:30,PSOE:27,VOX:19,Sumar:7,Podemos:3}),
 P('a-despues','A','2026-10-29','2026-10-30',{PP:31,PSOE:25,VOX:19,Sumar:7,Podemos:3}),
 P('b-antes','B','2026-10-20','2026-10-22',{PP:33,PSOE:26,VOX:18}),
 P('c-dia','C','2026-10-28','2026-10-30',{PP:29,PSOE:28,VOX:20}),
 P('d-cruza','D','2026-10-25','2026-10-29',{PP:29,PSOE:28,VOX:20})
];
test('clasificación anterior, coincidente y posterior: el día del suceso cuenta como coincidente',()=>{
 const a=analizarAcontecimiento(ev,polls,{ventana:30});
 assert.deepEqual(a.counts,{before:2,overlap:2,after:1});
});
test('comparación dentro de instituto y cambios por partido',()=>{
 const a=analizarAcontecimiento(ev,polls,{ventana:30});
 assert.deepEqual(a.institutosAmbos,['A']);
 const pp=a.partidos.find(p=>p.id==='PP');
 assert.equal(pp.antes,31.5);assert.equal(pp.despues,31);assert.equal(pp.diferencia,-0.5);
 assert.equal(pp.mismoInstituto.media,1);
 assert.match(pp.comparabilidad,/Institutos distintos/);
 assert.equal(a.parejas[0].cambios.find(c=>c.id==='PSOE').diferencia,-2);
 assert.equal(a.parejas[0].comparabilidad.nivel,'alta');
});
test('cambios por bloque solo con encuestas que publican todos los partidos',()=>{
 const a=analizarAcontecimiento(ev,polls,{ventana:30});
 const izq=a.bloques.find(b=>b.id==='PSOE+SUMAR+PODEMOS');
 assert.equal(izq.nAntes,1);assert.equal(izq.antes,37);assert.equal(izq.despues,35);
});
test('ausencia de atribución causal automática',()=>{
 const a=analizarAcontecimiento(ev,polls,{ventana:30,eventoModelo:{aplicado_al_pronostico:false}});
 assert.equal(a.causalEffectEstimated,false);
 assert.ok(a.conclusiones.some(c=>/no es causalidad/.test(c)));
 assert.ok(a.conclusiones.some(c=>/Ninguna cifra de esta pantalla es un efecto causal/.test(c)));
 const html=renderLectura(a,ev);
 assert.match(html,new RegExp(SIM_LABEL));
 assert.doesNotMatch(html,/efecto (causal )?(de|del) (Urda|suceso) (es|fue) de/i);
});
test('sin encuestas posteriores no se calcula ninguna diferencia',()=>{
 const a=analizarAcontecimiento(ev,polls.filter(p=>p.id!=='SINT-a-despues'),{ventana:30});
 assert.equal(a.counts.after,0);
 assert.ok(a.partidos.every(p=>p.diferencia===null));
 assert.match(a.conclusiones[0],/todavía no puede medirse/);
});
test('comparabilidad señala modo, duración y muestra distintos',()=>{
 const c=comparabilidad(P('x','A','2026-10-01','2026-10-15',{},{sample:3000}),P('y','A','2026-10-29','2026-10-30',{},{mode:'CAWI',sample:1000}));
 assert.equal(c.nivel,'baja');assert.equal(c.motivos.length,3);
});
test('margen de error de la diferencia',()=>{
 const m=margenDiferencia(25,2500,25,2500,1);
 assert.ok(Math.abs(m-1.96*Math.sqrt(2*0.1875/2500)*100)<1e-9);
 assert.equal(margenDiferencia(25,0,25,100),null);
});
test('simulación hipotética etiquetada y coherente con la proyección base',()=>{
 const election=JSON.parse(fs.readFileSync('data/election.json','utf8'));
 const r=simularDesplazamiento(election,{PP:31,PSOE:27,VOX:19,SUMAR:6},{PSOE:-1,PP:1});
 assert.equal(r.etiqueta,SIM_LABEL);
 assert.equal(r.simulado.PSOE,26);
 assert.ok(r.diferencia.PP>=0);
 assert.throws(()=>simularDesplazamiento(election,{PP:31},{}),/referencia/);
});
test('caso Urda con el archivo actual: recuentos recalculados, no fijados',()=>{
 const real=JSON.parse(fs.readFileSync('data/polls.json','utf8'));
 const urda=JSON.parse(fs.readFileSync('data/events.json','utf8')).find(e=>e.id==='urda-2026-10-28');
 const a=analizarAcontecimiento(urda,real,{ventana:30});
 const total=a.counts.before+a.counts.overlap+a.counts.after;
 assert.equal(total,real.filter(p=>p.kind==='poll-estimate'&&p.fieldEnd>='2026-09-28'&&p.fieldStart<='2026-11-27').length);
 for(const p of a.parejas)for(const c of p.cambios)assert.ok(Number.isFinite(c.diferencia));
});

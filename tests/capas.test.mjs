// Datos SINTÉTICOS, identificados como tales: nunca representan resultados reales.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {promedioPublicado,capaModelo,capasExternas,matriz,efectoCocina,canonicalValues,pollsFromModelInputs,diferencias} from '../capas.mjs';

const P=(id,institute,fieldEnd,values,extra={})=>({id:'SINTETICA-'+id,kind:'poll-estimate',institute,fieldStart:extra.fieldStart||fieldEnd,fieldEnd,published:extra.published||fieldEnd,scope:'España',values});
const polls=[
 P('a1','Casa A','2026-10-01',{PP:30,PSOE:28,VOX:18,Sumar:7,Podemos:3}),
 P('a2','Casa A','2026-10-20',{PP:32,PSOE:26,VOX:19,Sumar:6,Podemos:3}),
 P('b1','Casa B','2026-10-18',{PP:34,PSOE:25,VOX:17,'Frente Amplio':6}),
 P('cis','CIS','2026-10-10',{PP:22,PSOE:34,VOX:17,'Sumar/FA':6,Podemos:3}),
 P('vieja','Casa C','2026-08-01',{PP:40,PSOE:20,VOX:10}),
 P('futura','Casa D','2026-11-10',{PP:10,PSOE:50,VOX:10})
];

test('capa 1: un estudio por instituto, el último por fin de campo',()=>{
 const r=promedioPublicado(polls,{corte:'2026-11-01',ventana:30});
 assert.deepEqual(r.estudios.map(e=>e.id).sort(),['SINTETICA-a2','SINTETICA-b1','SINTETICA-cis']);
 assert.equal(r.institutos,3);
});
test('capa 1: selección por fecha (ventana y corte) excluye estudios antiguos y futuros',()=>{
 const r=promedioPublicado(polls,{corte:'2026-11-01',ventana:120});
 assert.ok(r.estudios.some(e=>e.id==='SINTETICA-vieja'));
 assert.ok(!r.estudios.some(e=>e.id==='SINTETICA-futura'));
 assert.ok(!promedioPublicado(polls,{corte:'2026-11-01',ventana:30}).estudios.some(e=>e.id==='SINTETICA-vieja'));
});
test('capa 1: filtro con y sin CIS',()=>{
 const con=promedioPublicado(polls,{corte:'2026-11-01',ventana:30,cis:true});
 const sin=promedioPublicado(polls,{corte:'2026-11-01',ventana:30,cis:false});
 assert.equal(con.partidos.PP.valor,(32+34+22)/3);
 assert.equal(sin.partidos.PP.valor,(32+34)/2);
 assert.equal(sin.excluidos[0].institute,'CIS');
});
test('capa 1: ponderación manual y por recencia',()=>{
 const m=promedioPublicado(polls,{corte:'2026-11-01',ventana:30,cis:false,ponderacion:'manual',pesos:{'Casa A':3,'Casa B':1}});
 assert.equal(m.partidos.PP.valor,(32*3+34)/4);
 const r=promedioPublicado(polls,{corte:'2026-11-01',ventana:30,cis:false,ponderacion:'recencia',semivida:12});
 const wa=2**(-12/12),wb=2**(-14/12);
 assert.ok(Math.abs(r.partidos.PP.valor-(32*wa+34*wb)/(wa+wb))<1e-12);
 assert.throws(()=>promedioPublicado(polls,{corte:'2026-11-01',ponderacion:'manual',pesos:{'Casa A':-1}}));
});
test('capa 1: etiquetas Sumar equivalentes se unifican y quedan registradas',()=>{
 const r=promedioPublicado(polls,{corte:'2026-11-01',ventana:30});
 assert.deepEqual(r.partidos.SUMAR.etiquetas.sort(),['Frente Amplio','Sumar','Sumar/FA']);
 assert.equal(r.partidos.SUMAR.n,3);
});
test('capa 1: registros no comparables (dos etiquetas para el mismo partido) se excluyen, no se suman',()=>{
 const c=canonicalValues({Sumar:5,'Frente Amplio':6,PP:30});
 assert.equal(c.values.SUMAR,undefined);assert.deepEqual(c.ambiguous,['SUMAR']);assert.equal(c.values.PP,30);
});
test('capa 1: bloques solo con encuestas que publican todos sus partidos; sin imputar ausentes',()=>{
 const r=promedioPublicado(polls,{corte:'2026-11-01',ventana:30});
 assert.equal(r.bloques['PSOE+SUMAR+PODEMOS'].n,2);// Casa B no publica Podemos
 assert.equal(r.bloques['PSOE+SUMAR+PODEMOS'].valor,((26+6+3)+(34+6+3))/2);
 assert.equal(r.bloques['PP+VOX+UPN'].valor,null);
});
test('errores cuando faltan datos o parámetros',()=>{
 assert.throws(()=>promedioPublicado(polls,{corte:'no'}),/Corte/);
 assert.throws(()=>promedioPublicado(polls,{corte:'2026-11-01',ventana:0}),/Ventana/);
 assert.throws(()=>capaModelo(null,3),/no disponible/);
 assert.throws(()=>capaModelo({principal:{}},3),/principal/);
});

const forecast={corte:'2026-11-01',eleccion:'2026-11-29',
 capas:{sin_cocina:{variante:'consenso_todas'}},
 principal:{n:300,sin_encuestas:['UPN'],partidos:{PP:{voto:[31,27,35],escanos:[130,110,150]},PSOE:{voto:[27,23,31],escanos:[110,95,130]},VOX:{voto:[19,16,22],escanos:[68,55,80]},UPN:{voto:[0.2,0,0.5],escanos:[0,0,1]}},
  bloques:{'PP+VOX':{mediana:198,p5:175,p95:220,p_mayoria:0.9}}},
 variantes:{consenso_privadas:{partidos:{PP:{voto:[32,28,36],escanos:[134,115,152]}},bloques:{}},
  consenso_todas:{partidos:{PP:{voto:[30.5,27,34],escanos:[128,110,146]},PSOE:{voto:[27.2,23,31],escanos:[111,95,130]},VOX:{voto:[19,16,22],escanos:[68,55,80]}},bloques:{'PP+VOX':{mediana:196,p5:174,p95:218,p_mayoria:0.97}}}},
 corte_anterior:{fecha:'2026-10-31',escanos:{PP:2,PSOE:-1},voto:{PP:0.3},bloques:{'PP+VOX':3}},
 externos:[{id:'x1',nombre:'Productor sintético',fecha:'2026-10-20',voto:{PP:33,PSOE:26,Vox:18},escanos:{PP:137},verificado:false}]};

test('coherencia portada–pronóstico: la capa 3 es siempre `principal`, nunca una variante',()=>{
 const c=capaModelo(forecast,3);
 assert.equal(c.variante,'principal');
 assert.equal(c.partidos.PP.escanos[0],forecast.principal.partidos.PP.escanos[0]);
 assert.notEqual(c.partidos.PP.escanos[0],forecast.variantes.consenso_privadas.partidos.PP.escanos[0]);
});
test('capa 2 es la variante declarada sin cocina y no se confunde con el promedio',()=>{
 const c=capaModelo(forecast,2);
 assert.equal(c.variante,'consenso_todas');assert.equal(c.tipo,'estimacion_sin_cocina');
 const p=promedioPublicado(polls,{corte:'2026-11-01'});
 assert.equal(p.tipo,'promedio');assert.notEqual(p.tipo,c.tipo);
});
test('efecto de la cocina = con − sin',()=>{
 const e=efectoCocina(capaModelo(forecast,2),capaModelo(forecast,3));
 assert.equal(e.PP.voto,0.5);assert.equal(e.PP.escanos,2);assert.equal(e.SUMAR,null);
});
test('lectura de resultados externos: alias normalizados y sin mezclar con el promedio',()=>{
 const x=capasExternas(forecast);
 assert.equal(x[0].partidos.VOX,18);assert.equal(x[0].capa,4);assert.equal(x[0].verificado,false);
});
test('matriz: no rellena huecos con ceros y explica cada ausencia',()=>{
 const args={promedio:promedioPublicado(polls,{corte:'2026-11-01'}),sinCocina:capaModelo(forecast,2),conCocina:capaModelo(forecast,3),externos:capasExternas(forecast),corteAnterior:forecast.corte_anterior};
 for(const vista of ['voto','escanos','cambio']){
  const m=matriz(args,vista);
  for(const r of m.rows)for(const c of r.cells){if(c.valor==null)assert.ok(c.motivo,`${vista} ${r.id} sin motivo`);}
 }
 const e=matriz(args,'escanos');
 assert.equal(e.rows.find(r=>r.id==='PP').cells[0].valor,null);
 assert.match(e.rows.find(r=>r.id==='PP').cells[0].motivo,/no reparte escaños/);
 assert.equal(e.rows.find(r=>r.id==='PP+VOX').cells[2].valor,198);
 const v=matriz(args,'voto');
 assert.equal(v.rows.find(r=>r.id==='UPN').cells[2].hipotesis,true);
 const d=diferencias(v);assert.equal(d[0][2],null);
});
test('bloques cubiertos por menos de la mitad de los estudios no se publican',()=>{
 const r=promedioPublicado([...polls,P('e','Casa E','2026-10-25',{PP:30,PSOE:27,VOX:18,UPN:0.2})],{corte:'2026-11-01',ventana:30});
 assert.equal(r.bloques['PP+VOX+UPN'].valor,null);assert.match(r.bloques['PP+VOX+UPN'].motivo,/Solo 1 de 4/);
});
test('externos: primero los verificados',()=>{
 const x=capasExternas({externos:[{id:'a',nombre:'A',fecha:'2026-11-01',verificado:false},{id:'b',nombre:'B',fecha:'2026-10-01',verificado:true}]});
 assert.equal(x[0].id,'b');
});
test('pollsFromModelInputs conserva el origen de cada entrada',()=>{
 const p=pollsFromModelInputs([{estudio:'s1',casa:'Casa A',campo_fin:'2026-10-10',voto:{PP:30},origen:'terceros-29n'}]);
 assert.equal(p[0].origin,'terceros-29n');assert.equal(p[0].published,'2026-10-10');
});
test('el pronóstico publicado del repositorio expone las cuatro capas',()=>{
 const f=JSON.parse(fs.readFileSync('modelo/salida/pronostico.json','utf8'));
 assert.ok(f.principal?.partidos?.PP,'falta principal');
 assert.ok(f.variantes?.consenso_todas,'falta consenso_todas');
 assert.equal(f.capas?.con_cocina?.variante,'principal');
 assert.ok(Array.isArray(f.entradas)&&f.entradas.length>0);
 assert.ok(Array.isArray(f.excluidas));
 for(const x of f.excluidas)assert.ok(x.motivo);
 assert.ok(Array.isArray(f.externos));
 assert.equal(f.eventos?.['urda-2026-10-28']?.aplicado_al_pronostico,false);
});

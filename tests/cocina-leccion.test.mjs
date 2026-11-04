import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {datosLeccion,textoLeccion} from '../cocina-leccion.mjs';
const J=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const forecast=J('modelo/salida/pronostico.json'),receta=J('data/microdatos/cocina_cis_3582.json'),val=J('data/microdatos/validacion_cocina_cis.json');
test('la lección toma sus cifras de los datos publicados, no de un texto fijo',()=>{
 const d=datosLeccion(forecast,receta,val);
 const html=textoLeccion(d);
 const fmt=v=>v.toLocaleString('es-ES',{minimumFractionDigits:1,maximumFractionDigits:1});
 assert.ok(html.includes(fmt(d.recuerdo.muestra.PSOE)));
 assert.ok(html.includes(fmt(d.con.partidos.PSOE.voto[0])));
 for(const k of Object.keys(d.correccion.puntos))assert.ok(Math.abs(d.correccion.puntos[k])<5);
 assert.match(html,/no permite distinguir por sí sola entre sesgo de muestra y error de recuerdo/);
 assert.doesNotMatch(html,/undefined|NaN/);
});
test('la corrección publicada es la mitad del error medio de las casas',()=>{
 const err=Object.values(forecast.error_23j).map(e=>e.PSOE).filter(Number.isFinite);
 const media=err.reduce((a,b)=>a+b,0)/err.length;
 assert.ok(Math.abs(forecast.principal.correccion_industria.puntos.PSOE-(-0.5*media))<0.01);
});
test('falla de forma explícita si faltan datos',()=>{
 assert.throws(()=>datosLeccion({},receta,val),/Faltan datos/);
});

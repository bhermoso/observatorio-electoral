// Una selección de entradas, reutilizable por portada, pronóstico y análisis.
// Se preserva la ficha primaria del archivo cuando existe; para las demás
// entradas del motor se usa el registro reconstruido y marcado como tal.
import {pollsFromModelInputs,promedioPublicado} from './capas.mjs';
export function encuestasDelMotor(archivo=[],forecast=null){
 if(!Array.isArray(archivo))throw Error('Archivo de encuestas inválido');
 const entries=forecast?.entradas;
 if(!Array.isArray(entries)||!entries.length)return [...archivo];
 const porId=new Map(archivo.map(p=>[p.id,p]));
 return pollsFromModelInputs(entries).map(p=>porId.get(p.id)||p);
}
export function archivoConEntradas(archivo=[],forecast=null){
 const ids=new Set(archivo.map(p=>p.id));
 return [...archivo,...encuestasDelMotor(archivo,forecast).filter(p=>!ids.has(p.id))];
}
export function promedioDeReferencia(archivo=[],forecast=null,{corte=forecast?.corte,ventana=30,cis=true,ponderacion='igual',semivida=14}={}){
 if(!corte)throw Error('Falta corte de referencia');
 const estudios=encuestasDelMotor(archivo,forecast);
 return {promedio:promedioPublicado(estudios,{corte,ventana,cis,ponderacion,semivida}),
  fuente:forecast?.entradas?.length?'entradas_verificadas_motor':'archivo',
  corte,estudios};
}

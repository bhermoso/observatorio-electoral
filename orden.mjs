// Criterios de orden de las listas del Observatorio. Un criterio por tipo de lista, para que
// la misma relación no aparezca ordenada de forma distinta en cada pantalla.
//
// Regla general (Blas Hermoso, 9 nov 2026): toda lista de encuestas, promedios o estimaciones
// se ordena por fecha, con la más reciente al principio. Incluye tablas, tarjetas y leyendas.
// · Estudios (archivo, promedio, pronóstico, algoritmo, acontecimientos): por fin del trabajo
//   de campo, que es cuándo se midió la opinión. Desempate: publicación más reciente; casa.
// · Vistas de «lo que se sabía en cada fecha» (Tendencias): por publicación.
// · Promedios y modelos externos (capa 4): por fecha; a igual fecha, el consultado en origen.
// · Registros fechados (cortes del modelo, microdatos): el más reciente primero.
// Excepciones, porque no son listas sino ejes: los gráficos y líneas temporales dibujan el
// tiempo de izquierda a derecha; `cronologico` existe solo para esos cálculos.
// · Errores frente a un resultado: de menor a mayor error absoluto; sin dato, al final.
// · Territorios y listas de consulta: alfabético en español.

export const porTexto=(a,b)=>String(a??'').localeCompare(String(b??''),'es',{sensitivity:'base'});
const porFecha=(a,b)=>String(a??'').localeCompare(String(b??''));

/** Estudios, el más reciente primero. get: accesores {fin, pub, casa}. */
export const recientesPrimero=({fin,pub=()=>'',casa=()=>''})=>(a,b)=>
 porFecha(fin(b),fin(a))||porFecha(pub(b),pub(a))||porTexto(casa(a),casa(b));

/** Estudios en orden cronológico, de antes a después. */
export const cronologico=({fin,pub=()=>'',casa=()=>''})=>(a,b)=>
 porFecha(fin(a),fin(b))||porFecha(pub(a),pub(b))||porTexto(casa(a),casa(b));

/** Errores, de menor a mayor valor absoluto; sin dato al final. */
export const menorError=(valor,nombre=()=>'')=>(a,b)=>{
 const x=Math.abs(valor(a)),y=Math.abs(valor(b));
 const fx=Number.isFinite(x),fy=Number.isFinite(y);
 if(fx!==fy)return fx?-1:1;
 return (fx?x-y:0)||porTexto(nombre(a),nombre(b));
};

/** Media de los errores absolutos disponibles (NaN si no hay ninguno). */
export const errorMedioAbsoluto=valores=>{
 const v=valores.filter(Number.isFinite).map(Math.abs);
 return v.length?v.reduce((s,x)=>s+x,0)/v.length:NaN;
};

/** Antigüedad de una fecha respecto a otra, en días y en texto legible. */
export function antiguedad(desde,hasta){
 const d=Math.round((Date.parse(String(hasta).slice(0,10)+'T12:00:00Z')-Date.parse(String(desde).slice(0,10)+'T12:00:00Z'))/86400000);
 if(!Number.isFinite(d))return {dias:null,texto:'—'};
 const texto=d<0?'posterior':d===0?'el mismo día':d===1?'1 día':d<60?`${d} días`:d<365?`${Math.round(d/30.44)} meses`:(()=>{const m=Math.round(d/30.44),a=Math.floor(m/12),r=m%12;return `${a} año${a>1?'s':''}${r?` y ${r} mes${r>1?'es':''}`:''}`})();
 return {dias:d,texto};
}

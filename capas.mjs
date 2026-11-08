// Contrato de capas del Observatorio. Módulo puro (sin DOM): lo usan la portada,
// la vista de pronóstico y las pruebas.
//
// Capa 1 · promedio_publicado  Agregación de estimaciones publicadas por las encuestadoras.
// Capa 2 · sin_cocina          Motor 29N, variante consenso_todas: tendencia + efecto de casa.
// Capa 3 · con_cocina          Motor 29N, `principal`: estimación de referencia del Observatorio.
// Capa 4 · externos            Promedios y modelos de otros productores.
// Experimento                  Ejercicios ilustrativos (cocina CIS, laboratorio): fuera de la matriz.
import {selectStudies} from './analysis.mjs';

export const PARTIES=[
 {id:'PP',label:'PP'},{id:'PSOE',label:'PSOE'},{id:'VOX',label:'Vox'},
 {id:'SUMAR',label:'Sumar / Frente Amplio',aviso:'Las encuestadoras usan «Sumar», «Sumar/FA» o «Frente Amplio». Se tratan como la misma candidatura; la equivalencia no está garantizada si cambia la composición de la coalición.'},
 {id:'PODEMOS',label:'Podemos'},{id:'ERC',label:'ERC'},{id:'JUNTS',label:'Junts'},{id:'BILDU',label:'EH Bildu'},
 {id:'PNV',label:'PNV'},{id:'BNG',label:'BNG'},{id:'CC',label:'CC'},{id:'UPN',label:'UPN'},{id:'SALF',label:'SALF'}
];
export const BLOCKS=[
 {id:'PP+VOX',label:'PP + Vox',parties:['PP','VOX']},
 {id:'PP+VOX+UPN',label:'PP + Vox + UPN',parties:['PP','VOX','UPN']},
 {id:'PSOE+SUMAR+PODEMOS',label:'PSOE + Sumar + Podemos',parties:['PSOE','SUMAR','PODEMOS']},
 {id:'PSOE+SUMAR+PODEMOS+ERC+JUNTS+BILDU+PNV+BNG+CC',label:'PSOE + Sumar + Podemos + ERC + Junts + Bildu + PNV + BNG + CC',parties:['PSOE','SUMAR','PODEMOS','ERC','JUNTS','BILDU','PNV','BNG','CC']}
];
export const BLOCK_NOTE='Suma aritmética de escaños o votos. No presupone acuerdos políticos.';
const ALIAS={PP:'PP',PSOE:'PSOE',VOX:'VOX',Vox:'VOX',Sumar:'SUMAR','Sumar/FA':'SUMAR','Frente Amplio':'SUMAR','Sumar / Frente Amplio':'SUMAR',
 SUMAR:'SUMAR',Podemos:'PODEMOS',PODEMOS:'PODEMOS',ERC:'ERC','ERC–Sobiranistes':'ERC',Junts:'JUNTS',JUNTS:'JUNTS','EH Bildu':'BILDU',BILDU:'BILDU',
 PNV:'PNV','EAJ-PNV':'PNV',BNG:'BNG',CC:'CC','Coalición Canaria':'CC',UPN:'UPN',SALF:'SALF'};

export const LAYERS={
 promedio:{capa:1,nombre:'Promedio de encuestas publicadas',corto:'Promedio publicado',naturaleza:'Observación agregada',
  explica:'Media de las estimaciones que publican las encuestadoras. El Observatorio no corrige el voto: solo selecciona estudios (último de cada instituto dentro de la ventana), unifica etiquetas equivalentes y pondera según la regla elegida. Las cifras de cada encuestadora ya incluyen su propia cocina.'},
 sinCocina:{capa:2,nombre:'Observatorio sin cocina adicional',corto:'Sin cocina',naturaleza:'Estimación estadística propia',
  explica:'Motor 29N, variante «consenso_todas». Estima una tendencia diaria por partido y un efecto de casa para cada instituto (su desviación respecto a la media de todas las casas). Pondera por tamaño muestral y simula hasta el día de la elección. No aplica calibración con errores históricos. Difiere del promedio porque usa todas las encuestas del ciclo, no solo la última, y descuenta la desviación sistemática de cada casa.'},
 conCocina:{capa:3,nombre:'Observatorio con cocina (estimación de referencia)',corto:'Con cocina · referencia',naturaleza:'Estimación propia ajustada',
  explica:'Motor 29N, salida «principal»: une a partes iguales tres variantes (consenso de privadas, consenso de todas y calibración con el error de cada casa en el 23J), corrige la mitad del sesgo común que tuvieron las encuestadoras en el 23J y amplía el error de la industria. La cocina sobre microdatos (recuerdo, simpatía, indecisos, participación) se probó con el CIS y empeoró el acierto en 2023: por eso no se aplica. Ver «La cocina del Observatorio».'},
 externo:{capa:4,nombre:'Otros observatorios y modelos',corto:'Externo',naturaleza:'Estimación de terceros',
  explica:'Promedios y modelos publicados por otros. No entran en nuestros cálculos. Si el original no se ha consultado, se indica.'}
};

const day=s=>Date.parse(String(s).slice(0,10)+'T00:00:00Z')/86400000;
const isDate=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}/.test(s)&&Number.isFinite(day(s));

/** Valores de una encuesta por partido canónico. Si dos etiquetas originales caen en el
 *  mismo partido (p. ej. «Sumar» y «Frente Amplio» a la vez), no se suman: se descarta. */
export function canonicalValues(values){
 const out={},labels={},ambiguous=[];
 for(const [label,value] of Object.entries(values||{})){
  const id=ALIAS[label];
  if(!id||typeof value!=='number'||!Number.isFinite(value))continue;
  if(id in out){ambiguous.push(id);continue;}
  out[id]=value;labels[id]=label;
 }
 for(const id of ambiguous){delete out[id];delete labels[id];}
 return {values:out,labels,ambiguous:[...new Set(ambiguous)]};
}

/** Convierte las entradas del Motor 29N en registros compatibles con selectStudies. */
export function pollsFromModelInputs(entradas){
 return (entradas||[]).map(e=>({id:e.estudio,kind:'poll-estimate',institute:e.casa,fieldStart:e.campo_ini||e.campo_fin,fieldEnd:e.campo_fin,
  published:e.publicacion||new Date(Date.parse(e.campo_fin+'T00:00:00Z')+2*86400000).toISOString().slice(0,10),scope:'España',values:Object.fromEntries(Object.entries(e.voto||{})),origin:e.origen}));
}

/**
 * CAPA 1. Promedio de encuestas publicadas.
 * Reglas: última encuesta por instituto con fin de campo en la ventana y publicada en el corte
 * (selectStudies, la misma función de #analisis); con o sin CIS; ponderación igual, por
 * recencia (semivida en días desde el fin de campo) o manual por instituto.
 */
export function promedioPublicado(polls,{corte,ventana=30,cis=true,ponderacion='igual',semivida=14,pesos={}}={}){
 if(!isDate(corte))throw Error('Corte temporal inválido');
 if(!Number.isInteger(ventana)||ventana<1||ventana>365)throw Error('Ventana inválida');
 if(!['igual','recencia','manual'].includes(ponderacion))throw Error('Ponderación desconocida');
 if(ponderacion==='recencia'&&!(semivida>0))throw Error('Semivida inválida');
 const all=selectStudies(polls,corte,ventana);
 const excluded=[];
 const studies=all.filter(p=>{if(!cis&&p.institute==='CIS'){excluded.push({id:p.id,institute:p.institute,motivo:'Filtro sin CIS'});return false;}return true;});
 const rows=studies.map(p=>{
  const manual=ponderacion==='manual'?(pesos[p.institute]??1):1;
  if(!Number.isFinite(manual)||manual<0||manual>5)throw Error('Peso de instituto inválido');
  const age=day(corte)-day(p.fieldEnd);
  const weight=manual*(ponderacion==='recencia'?2**(-age/semivida):1);
  return {id:p.id,institute:p.institute,fieldStart:p.fieldStart,fieldEnd:p.fieldEnd,published:p.published,origin:p.origin||'verificada',weight,age,...canonicalValues(p.values)};
 });
 const activeRows=rows.filter(r=>r.weight>0);
 const partidos={};
 for(const {id} of PARTIES){
  const c=rows.filter(r=>r.weight>0&&id in r.values).map(r=>({id:r.id,institute:r.institute,value:r.values[id],label:r.labels[id],weight:r.weight}));
  const w=c.reduce((s,x)=>s+x.weight,0);
  partidos[id]=c.length&&w>0?{valor:c.reduce((s,x)=>s+x.value*x.weight,0)/w,n:c.length,contribuciones:c,etiquetas:[...new Set(c.map(x=>x.label))]}:null;
 }
 // Bloques: solo encuestas que publican todos los partidos del bloque (sin imputar ausentes).
 const bloques={};
 for(const b of BLOCKS){
  const c=rows.filter(r=>r.weight>0&&b.parties.every(p=>p in r.values)).map(r=>({id:r.id,institute:r.institute,weight:r.weight,value:b.parties.reduce((s,p)=>s+r.values[p],0)}));
  const w=c.reduce((s,x)=>s+x.weight,0);
  // Con menos de la mitad de los estudios, la suma representaría a unas pocas casas: no se publica.
  bloques[b.id]=!c.length||w<=0?{valor:null,n:0,motivo:'Ninguna encuesta publica todos los partidos del bloque'}
   :c.length*2<activeRows.length?{valor:null,n:c.length,motivo:`Solo ${c.length} de ${activeRows.length} encuestas activas publican todos los partidos del bloque`}
   :{valor:c.reduce((s,x)=>s+x.value*x.weight,0)/w,n:c.length,omitidos:activeRows.length-c.length};
 }
 return {capa:1,tipo:'promedio',corte,ventana,cis,ponderacion,semivida:ponderacion==='recencia'?semivida:null,
  estudios:rows.map(({values,labels,ambiguous,...r})=>({...r,ambiguos:ambiguous})),excluidos:excluded,
  institutos:new Set(activeRows.map(r=>r.institute)).size,partidos,bloques,
  ultimaPublicacion:rows.map(r=>r.published).sort().at(-1)||null};
}

/** CAPAS 2 y 3 desde data/modelo/pronostico.json. Nunca sustituye `principal` por una variante. */
export function capaModelo(forecast,capa){
 if(!forecast||typeof forecast!=='object')throw Error('Pronóstico no disponible');
 const key=capa===3?'principal':capa===2?(forecast.capas?.sin_cocina?.variante||'consenso_todas'):null;
 if(!key)throw Error('Capa de modelo desconocida');
 const src=key==='principal'?forecast.principal:forecast.variantes?.[key];
 if(!src?.partidos)throw Error(`El pronóstico publicado no contiene «${key}»`);
 const partidos={};
 for(const {id} of PARTIES){const x=src.partidos[id];partidos[id]=x?{voto:x.voto,escanos:x.escanos,primero:x.primero}:null;}
 const bloques={};
 for(const b of BLOCKS){
  const x=src.bloques?.[b.id];
  const votos=b.parties.map(p=>src.partidos[p]?.voto?.[0]);
  bloques[b.id]={escanos:x?[x.mediana,x.p5,x.p95]:null,p_mayoria:x?.p_mayoria??null,
   voto:votos.every(Number.isFinite)?votos.reduce((s,v)=>s+v,0):null};
 }
 const sinEncuestas=key==='principal'?(src.sin_encuestas||[]):(forecast.principal?.sin_encuestas||[]);
 return {capa,tipo:capa===3?'estimacion_con_cocina':'estimacion_sin_cocina',variante:key,corte:forecast.corte,eleccion:forecast.eleccion,
  partidos,bloques,sinEncuestas,n:key==='principal'?src.n:null,
  entradas:forecast.auditoria_fuentes?.incluidas_2023_26??null,porOrigen:forecast.auditoria_fuentes?.por_origen||null};
}

/** CAPA 4. Externos, ordenados por fecha descendente. */
export function capasExternas(forecast){
 return [...(forecast?.externos||[])].map(x=>({capa:4,tipo:'externo',...x,partidos:Object.fromEntries(Object.entries(x.voto||{}).map(([k,v])=>[ALIAS[k]||k,v])),
  escanosPartidos:Object.fromEntries(Object.entries(x.escanos||{}).map(([k,v])=>[ALIAS[k]||k,v]))}))
  // Primero los de original consultado; después, por fecha descendente.
  .sort((a,b)=>(b.verificado===true)-(a.verificado===true)||String(b.fecha).localeCompare(String(a.fecha))||String(a.nombre).localeCompare(String(b.nombre)));
}

/** Productor de un registro externo: el nombre sin el paréntesis final («Demócrata (11 institutos)» → «Demócrata»). */
export const productorExterno=x=>String(x?.nombre||'').replace(/\s*\([^)]*\)\s*$/,'').trim();

/** Para la tabla de capas: el registro más reciente de cada productor, sin repetir productor.
 * Orden: primero los consultados en origen; después, por fecha descendente. */
export function externosRecientes(externos,n=2){
 const latest=new Map();
 for(const x of externos){
  const k=productorExterno(x),prev=latest.get(k);
  if(!prev||String(x.fecha)>String(prev.fecha)||(String(x.fecha)===String(prev.fecha)&&x.verificado===true&&prev.verificado!==true))latest.set(k,x);
 }
 return [...latest.values()]
  .sort((a,b)=>(b.verificado===true)-(a.verificado===true)||String(b.fecha).localeCompare(String(a.fecha))||String(a.nombre).localeCompare(String(b.nombre)))
  .slice(0,n);
}

/** Diferencia con cocina − sin cocina: cambio atribuible a decisiones del modelo, no a un factor político. */
export function efectoCocina(sin,con){
 const out={};
 for(const {id} of PARTIES){
  const a=sin.partidos[id],b=con.partidos[id];
  out[id]=a&&b?{voto:b.voto[0]-a.voto[0],escanos:b.escanos[0]-a.escanos[0]}:null;
 }
 return out;
}

/**
 * Matriz central. Cada celda: {valor, intervalo, unidad} o null con `motivo`. Nunca rellena con ceros.
 * vista: 'voto' | 'escanos' | 'cambio'
 */
export function matriz({promedio,sinCocina,conCocina,externos=[],promedioAnterior=null,corteAnterior=null},vista='voto'){
 if(!['voto','escanos','cambio'].includes(vista))throw Error('Vista desconocida');
 const ext=externosRecientes(externos,2);
 const columns=[
  {id:'promedio',layer:'promedio'},{id:'sin',layer:'sinCocina'},{id:'con',layer:'conCocina'},
  ...ext.map((x,i)=>({id:'ext'+i,layer:'externo',externo:x}))
 ];
 const none=motivo=>({valor:null,motivo});
 const cellParty=(col,id)=>{
  if(col.layer==='promedio'){
   const x=promedio?.partidos?.[id];
   if(vista==='voto')return x?{valor:x.valor,n:x.n,unidad:'%'}:none('Ningún estudio de la selección publica este partido');
   if(vista==='escanos')return none('El promedio de encuestas no reparte escaños');
   const prev=promedioAnterior?.partidos?.[id];
   return x&&prev?{valor:x.valor-prev.valor,unidad:'pp',signo:true}:none('Sin promedio comparable en el corte anterior');
  }
  if(col.layer==='sinCocina'||col.layer==='conCocina'){
   const m=col.layer==='sinCocina'?sinCocina:conCocina;const x=m?.partidos?.[id];
   if(!x)return none(m?(m.sinEncuestas.includes(id)?'Sin estimación en encuestas':'No modelizado'):'Pronóstico no disponible');
   if(vista==='voto')return {valor:x.voto[0],intervalo:[x.voto[1],x.voto[2]],unidad:'%',hipotesis:m.sinEncuestas.includes(id)};
   if(vista==='escanos')return {valor:x.escanos[0],intervalo:[x.escanos[1],x.escanos[2]],unidad:'esc.',hipotesis:m.sinEncuestas.includes(id)};
   if(col.layer==='conCocina'&&corteAnterior?.escanos&&id in corteAnterior.escanos)return {valor:corteAnterior.escanos[id],unidad:'esc.',signo:true,extra:corteAnterior.voto?.[id]};
   return none(col.layer==='sinCocina'?'El historial solo registra la estimación de referencia':'Sin corte anterior registrado');
  }
  const x=col.externo;
  if(vista==='voto')return Number.isFinite(x.partidos[id])?{valor:x.partidos[id],unidad:'%'}:none('No publicado por el productor');
  if(vista==='escanos')return Number.isFinite(x.escanosPartidos[id])?{valor:x.escanosPartidos[id],unidad:'esc.'}:none('No publicado por el productor');
  return none('No se registra la serie del productor');
 };
 const cellBlock=(col,b)=>{
  if(col.layer==='promedio'){
   const x=promedio?.bloques?.[b.id];
   if(vista==='voto')return x?.valor!=null?{valor:x.valor,n:x.n,unidad:'%'}:none(x?.motivo||'Sin datos');
   if(vista==='escanos')return none('El promedio de encuestas no reparte escaños');
   const prev=promedioAnterior?.bloques?.[b.id];
   return x?.valor!=null&&prev?.valor!=null?{valor:x.valor-prev.valor,unidad:'pp',signo:true}:none('Sin promedio comparable en el corte anterior');
  }
  if(col.layer==='sinCocina'||col.layer==='conCocina'){
   const m=col.layer==='sinCocina'?sinCocina:conCocina;const x=m?.bloques?.[b.id];
   if(!x)return none('Pronóstico no disponible');
   if(vista==='voto')return x.voto!=null?{valor:x.voto,unidad:'%',aprox:true}:none('Algún partido del bloque no está estimado');
   if(vista==='escanos')return x.escanos?{valor:x.escanos[0],intervalo:[x.escanos[1],x.escanos[2]],unidad:'esc.',p:x.p_mayoria}:none('Sin distribución de escaños');
   if(col.layer==='conCocina'&&corteAnterior?.bloques&&b.id in corteAnterior.bloques)return {valor:corteAnterior.bloques[b.id],unidad:'esc.',signo:true};
   return none(col.layer==='sinCocina'?'El historial solo registra la estimación de referencia':'Sin corte anterior registrado');
  }
  const x=col.externo;
  const v=b.parties.map(p=>vista==='escanos'?x.escanosPartidos[p]:x.partidos[p]);
  if(vista==='cambio')return none('No se registra la serie del productor');
  return v.every(Number.isFinite)?{valor:v.reduce((s,n)=>s+n,0),unidad:vista==='escanos'?'esc.':'%'}:none('El productor no publica todos los partidos del bloque');
 };
 const rows=PARTIES.map(p=>({tipo:'partido',id:p.id,label:p.label,aviso:p.aviso||null,cells:columns.map(c=>cellParty(c,p.id))}))
  .filter(r=>r.cells.some(c=>c.valor!=null));
 const blocks=BLOCKS.map(b=>({tipo:'bloque',id:b.id,label:b.label,aviso:BLOCK_NOTE,cells:columns.map(c=>cellBlock(c,b))}));
 return {vista,columns,rows:[...rows,...blocks]};
}

/** Diferencia entre la estimación de referencia y el resto de columnas, por fila (solo valores disponibles). */
export function diferencias(m){
 const ref=m.columns.findIndex(c=>c.layer==='conCocina');
 return m.rows.map(r=>{const base=r.cells[ref];return r.cells.map((c,i)=>i===ref||base?.valor==null||c?.valor==null||c.signo||base.signo?null:base.valor-c.valor);});
}

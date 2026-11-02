// Puerta de calidad antes de afirmar validación prospectiva entre elecciones.
// Las métricas en un solo proceso electoral NO constituyen evidencia independiente.
export function auditCoverage(registry){
 const elections=registry?.elections;
 if(!Array.isArray(elections)||!elections.length)throw Error('Registro de elecciones no disponible');
 const unique=new Set();const units=[];
 for(const e of elections){
  if(!e.id||unique.has(e.id))throw Error('Elección repetida o sin ID');
  unique.add(e.id);
  if(e.independent_election_test && (!e.comparable || !e.results || !e.pre_registered_protocol || !e.frozen_model_sha || !e.scored_results)){
    throw Error(e.id+': falta trazabilidad exigida para prueba independiente');
  }
  units.push({id:e.id,date:e.date,status:e.status,comparable:!!e.comparable,
   independent:!!e.independent_election_test,
   studies:e.cis?.map(s=>({id:s.study,status:s.microdata_status}))||[],
   missing:e.requires||[]});
 }
 const independent=units.filter(e=>e.independent).length;
 const exploratory=units.filter(e=>e.status==='exploratory_retrofit').length;
 return {elections:units,independent,exploratory,eligibleForMethodSelection:independent>=2,
  headline:independent>=2?'Validación entre elecciones registrada: comprobar protocolo y resultados.':'Validación independiente pendiente',
  note:'La existencia de estudios CIS o cifras publicadas no significa que la receta de microdatos haya sido evaluada en esa convocatoria.'};
}

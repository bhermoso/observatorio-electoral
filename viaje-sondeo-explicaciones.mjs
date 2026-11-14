const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const f=(v,d=2)=>Number(v).toLocaleString('es-ES',{useGrouping:'always',minimumFractionDigits:d,maximumFractionDigits:d});
const label=(data,p)=>data.labels?.[p]||({PSOE:'PSOE',PP:'PP',VOX:'Vox',SUMAR:data.meta.fourthLabel,FA:'Frente Amplio',BLANCO:'En blanco',OTROS:'Otros',BILDU:'EH Bildu'}[p])||p;
const table=(head,rows,caption='')=>`<div class="table-scroll operation-table"><table><caption>${caption}</caption><thead><tr>${head.map(h=>'<th>'+esc(h)+'</th>').join('')}</tr></thead><tbody>${rows.map(row=>'<tr>'+row.map((v,i)=>i?'<td>'+esc(v)+'</td>':'<th scope="row">'+esc(v)+'</th>').join('')+'</tr>').join('')}</tbody></table></div>`;

export function explainStep(data,stages,step,p){
 const o=stages[step].outcome,raw=data.scenarios['00000'],before=step>0?stages[step-1].outcome:raw;
 const name=label(data,p),v=data.meta.variables,share=o.shares[p],mass=o.masses[p],base=o.denominator;
 const result={input:{value:f(before.masses[p],4),note:'Peso acumulado del paso anterior'},calculation:{value:'',note:''},output:{value:f(share,3)+' %',note:`${f(mass,4)} ÷ ${f(base,4)} × 100`},why:'',details:''};
 if(step===0){
  result.input={value:f(raw.counts[p],0)+' respuestas',note:`Declaran ${name}; cada entrevista cuenta una vez.`};
  result.calculation={value:`${f(raw.counts[p],0)} ÷ ${f(data.n,0)} × 100`,note:'Base: todas las entrevistas, incluidas las no respuestas.'};
  result.output={value:f(100*raw.counts[p]/data.n,3)+' %',note:'Intención directa sobre la muestra completa.'};
  result.why='Antes de decidir qué hacer con indecisos y abstención, se conserva el recuento original.';
  result.details=table(['Respuesta original','Entrevistas','% de muestra'],Object.entries(data.categories).map(([k,n])=>[label(data,k),f(n,0),f(100*n/data.n,4)]));
 }else if(step===1){
  result.input={value:f(raw.counts[p],0)+' de '+f(data.n,0),note:f(100*raw.counts[p]/data.n,3)+' % de toda la muestra.'};
  result.calculation={value:`${f(data.n,0)} − ${f(data.n-base,0)} = ${f(base,0)}`,note:'Se retiran del denominador nulos, abstención y NS/NC; se mantienen candidaturas y blanco.'};
  result.why=`Se conservan las ${f(raw.counts[p],0)} respuestas de ${name}. Sube su porcentaje al reducir la base: no se le adjudican las respuestas excluidas.`;
  result.details=table(['Destino de las respuestas','Casos'],[['Candidaturas y blanco: se conservan',f(base,0)],['Abstención/nulo/NS/NC: fuera de la base',f(data.n-base,0)]],'Cambiar de base no es imputar votos.');
 }else if(step<=6&&!stages[step].applied){
  result.calculation={value:'× 1 · sin cambios',note:'Este ingrediente está desactivado.'};
  result.why='Se conserva exactamente el resultado de la etapa anterior.';
 }else if(step===2){
  const n=raw.counts[p],avg=n?mass/n:0;
  result.input={value:f(n,0)+' respuestas',note:'Hasta aquí todas pesaban 1.'};
  result.calculation={value:`Σ ${v.weight} = ${f(mass,4)}`,note:`Peso medio de estas respuestas: ${f(avg,6)}. Peso mínimo/máximo de toda la muestra: ${data.weight_range.map(x=>f(x,4)).join(' / ')}.`};
  result.why=`Ponderar da distinta representación a cada entrevista. ${f(n,0)} personas no se convierten en más personas: aportan ${f(mass,4)} unidades de peso. La base completa también cambia: ${f(before.denominator,4)} → ${f(base,4)}.`;
  result.details=table(['Candidatura','Personas','Peso antes','Σ peso original','Peso medio','% antes','% después'],Object.keys(o.shares).map(k=>[label(data,k),f(raw.counts[k],0),f(raw.masses[k],4),f(o.masses[k],4),raw.counts[k]?f(o.masses[k]/raw.counts[k],6):'Sin casos',f(raw.shares[k],3),f(o.shares[k],3)]),'Los pesos se leen del fichero de la casa. No se deducen ni se sustituyen por un coeficiente por partido.');
 }else if(step===3){
  const gain=mass-before.masses[p];
  result.calculation={value:`${f(before.masses[p],4)} ${gain<0?'−':'+'} ${f(Math.abs(gain),4)} = ${f(mass,4)}`,note:data.meta.sympathyMode==='combined'?`${v.vote} se sustituye por la variable combinada ${v.sympathy}.`:`Solo NS/NC con simpatía de candidatura en ${v.sympathy} se completan; las demás respuestas se conservan.`};
  result.why=`La simpatía cambia la clasificación, no añade una segunda entrevista. Aportantes: ${f(before.contributors,0)} → ${f(o.contributors,0)}. La base se vuelve a sumar: ${f(before.denominator,4)} → ${f(base,4)}.`;
  result.details=table(['Candidatura','Personas antes','Personas después','Peso antes','Peso después','Δ peso'],Object.keys(o.shares).map(k=>[label(data,k),f(before.counts[k],0),f(o.counts[k],0),f(before.masses[k],4),f(o.masses[k],4),f(o.masses[k]-before.masses[k],4)]),'La variación de peso procede de reclasificar respuestas; los porcentajes se recalculan con la nueva base.');
 }else if(step===4){
  const ledger=o.recall_ledger?.[p]||{};
  result.calculation={value:`Σ (peso previo × factor de recuerdo)<br>= ${f(mass,4)}`,note:`El factor depende de lo que cada persona recuerda haber votado en ${data.meta.recallElection}; no de lo que votaría ahora.`};
  result.why='Para cada grupo: factor = cuota oficial anterior ÷ cuota recordada en la muestra. Si falta representación el factor sube; si sobra, baja. Se recorta entre 0,2 y 5. El recuerdo puede fallar y el ajuste es experimental.';
  result.details=table(['Recuerdo de quienes hoy eligen '+name,'Personas','Peso previo','Factor','Peso tras ajuste'],Object.entries(ledger).map(([g,x])=>[g,f(x.n,0),f(x.before,4),f(o.factors[g]??1,4),f(x.after,4)]),'Cada fila: peso previo × factor. La suma de la última columna da el peso actual de la candidatura.')+
   table(['Grupo de recuerdo','Cuota recordada %','Objetivo oficial %','Cálculo del factor','Factor aplicado'],Object.keys(o.factors).map(g=>[g,f(o.recall_sample[g],4),f(o.recall_official[g],4),`${f(o.recall_official[g],4)} ÷ ${f(o.recall_sample[g],4)}`,f(o.factors[g],4)]),'Recorte [0,2; 5] y redondeo de factores a cuatro decimales. Si un grupo no está observado no se inventan entrevistas.');
 }else if(step===5){
  result.calculation={value:`${f(o.observed[p],4)} + ${f(o.imputed[p],4)} = ${f(mass,4)}`,note:'Peso observado + peso imputado desde NS/NC.'};
  result.why='Dentro de cada grupo de recuerdo, se observa cómo eligen los decididos y se aplica esa distribución a sus NS/NC. No todo indeciso es imputable. Es una hipótesis de comportamiento compartido, no un voto declarado.';
  result.details=table(['Grupo de recuerdo','Personas NS/NC imputables','Peso NS/NC','Proporción hacia '+name,'Multiplicación: peso × proporción'],Object.entries(o.imputation_groups).map(([g,x])=>[g,f(x.interviews,0),f(x.mass,4),f(100*(o.transfers[g][p]||0),4)+' %',f(x.mass*(o.transfers[g][p]||0),4)]),'La suma de la última columna es el peso imputado. Cada entrevista se distribuye en fracciones cuya suma es su peso.')+
  table(['Recuerdo',...Object.keys(o.shares).map(k=>label(data,k))],Object.entries(o.transfers).map(([g,ps])=>[g,...Object.keys(o.shares).map(k=>f(100*(ps[k]||0),2)+' %')]),'Matriz completa. Cada fila suma 100 % antes del redondeo.');
 }else if(step===6){
  const ratio=before.masses[p]?mass/before.masses[p]:0;
  result.calculation={value:`${f(before.masses[p],4)} × ${f(ratio,6)} ≈ ${f(mass,4)}`,note:`Probabilidad media ponderada de estas aportaciones. Se aplica individualmente ${v.participation}/10, conservando las imputaciones anteriores.`};
  result.why=`Una respuesta 10 conserva su peso, 5 lo divide por dos y 0 lo anula. Los valores ausentes o fuera de 0–10 reciben 0,5${data.diagnostic?.invalid_probability!==undefined?' ('+f(data.diagnostic.invalid_probability,0)+' entrevistas en este fichero)':''}. Es un supuesto, no la participación electoral observada.`;
  result.details=table(['Candidatura','Peso previo','Probabilidad media ponderada','Peso final','Base final','% final'],Object.keys(o.shares).map(k=>[label(data,k),f(before.masses[k],4),before.masses[k]?f(o.masses[k]/before.masses[k],6):'Sin masa',f(o.masses[k],4),f(base,4),f(o.shares[k],4)]),'La matriz de transferencias permanece fijada antes de aplicar participación. No se vuelve a imputar.');
 }else if(step===7){
  const cand=100-o.shares.BLANCO;
  result.input={value:f(share,3)+' %',note:'Porcentaje sobre candidaturas + blanco.'};
  result.calculation={value:p==='BLANCO'?'Se retira de la cuota de candidaturas':`${f(share,3)} ÷ ${f(cand,3)} × 100`,note:'El blanco histórico provincial se conserva aparte para el umbral.'};
  result.output={value:p==='BLANCO'?'No recibe escaños':f(100*share/cand,3)+' %',note:'Cuota nacional de candidaturas.'};
  result.why='Para obtener números de votos se conserva el volumen provincial de 2023 y se ajusta la matriz hasta reproducir las cuotas nacionales. No se deduce la geografía electoral de una cifra nacional.';
 }else{
  result.input={value:'Votos enteros por provincia',note:'Proceden del escenario territorial anterior.'};
  result.calculation={value:'Votos ÷ 1, 2, 3…',note:'Se ordenan los cocientes de las candidaturas que superan el umbral.'};
  result.output={value:'350 escaños',note:'Suma de los 52 repartos. Ceuta y Melilla: gana el más votado.'};
  result.why='En el panel provincial puedes adjudicar cada escaño y ver el número de votos, el divisor y el cociente ganador.';
 }
 return result;
}

export function accountHTML(r){
 const box=(title,x,cls='')=>`<div class="account-box ${cls}"><span>${title}</span><strong>${x.value}</strong><small>${esc(x.note)}</small></div>`;
 return box('ENTRADA',r.input)+'<span class="account-arrow" aria-hidden="true">→</span>'+box('OPERACIÓN CON CIFRAS',r.calculation,'calc')+'<span class="account-arrow" aria-hidden="true">→</span>'+box('SALIDA',r.output,'out');
}

export function diagnosticRows(data){
 const raw=data.scenarios['00000'],weighted=data.scenarios['10000'],corrected=data.scenarios['10100'];
 return Object.keys(weighted.factors).map(g=>({group:g,raw:raw.recall_sample[g],weighted:weighted.recall_sample[g],target:weighted.recall_official[g],factor:corrected.factors[g],after:corrected.recall_after[g],delta:weighted.recall_sample[g]-weighted.recall_official[g]}));
}

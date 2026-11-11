const h=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const day=s=>Date.parse(s+'T12:00:00Z');
/** Original party labels only: no implicit coalition mapping, imputation or averaging. */
export function renderPollScatter(polls,party){
 const rows=polls.filter(p=>Number.isFinite(p.values?.[party])&&Number.isFinite(day(p.fieldEnd)));
 if(!rows.length)return '<p class="empty">No hay cifras publicadas para esta candidatura en la selección.</p>';
 const start=Math.min(...rows.map(p=>day(p.fieldEnd))),end=Math.max(...rows.map(p=>day(p.fieldEnd)));
 const top=Math.min(100,Math.max(10,Math.ceil(Math.max(...rows.map(p=>p.values[party]))/10)*10));
 const houses=[...new Set(rows.map(p=>p.institute))].sort();
 const colors=['#286c58','#9a442e','#435aa0','#766118','#963d77','#267387','#654f8a','#50682a','#2867a0','#a05d21','#943c43','#53725b'];
 const x=p=>65+(end===start?0.5:(day(p.fieldEnd)-start)/(end-start))*710;
 const y=v=>245-v/top*215;
 return `<figure class="poll-scatter"><figcaption><b>${h(party)}</b> · ${rows.length} estimaciones publicadas · eje horizontal: fin de campo</figcaption><div class="table-wrap"><svg viewBox="0 0 820 290" role="group" aria-label="Dispersión de ${h(party)} por fin de campo; cifras y fuentes en la tabla del archivo"><title>Estimaciones publicadas por instituto, sin unirlas ni promediarlas</title>${Array.from({length:6},(_,i)=>{const v=i*top/5;return `<line x1="65" x2="775" y1="${y(v)}" y2="${y(v)}" stroke="#d6dfd3"/><text x="53" y="${y(v)+4}" text-anchor="end">${v} %</text>`;}).join('')}${rows.map(p=>`<circle data-poll="${h(p.id)}" role="button" tabindex="0" aria-label="Ver ficha: ${h(p.institute)}, ${h(p.fieldEnd)}, ${p.values[party]} %" cx="${x(p)}" cy="${y(p.values[party])}" r="5" fill="${colors[houses.indexOf(p.institute)%colors.length]}" stroke="white"><title>${h(p.institute)} · ${h(p.fieldEnd)} · ${p.values[party]} % · ${h(p.id)}</title></circle>`).join('')}<text x="65" y="275">${new Date(start).toISOString().slice(0,10)}</text><text x="775" y="275" text-anchor="end">${new Date(end).toISOString().slice(0,10)}</text></svg></div><div class="scatter-legend">${houses.map((v,i)=>`<span><i style="background:${colors[i%colors.length]}"></i>${h(v)}</span>`).join('')}</div><p class="muted">Cada punto es una cifra de la fuente. Diferencias de fecha, ámbito, muestra y escenario pueden afectar a la comparación. La dispersión entre sondeos no es un intervalo de confianza. Selecciona un punto o «Ficha y desglose» en la tabla para auditar.</p></figure>`;
}

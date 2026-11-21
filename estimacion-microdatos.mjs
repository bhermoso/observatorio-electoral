const $=id=>document.getElementById(id);
const fmt=(x,d=1)=>Number.isFinite(Number(x))?Number(x).toLocaleString("es-ES",{minimumFractionDigits:d,maximumFractionDigits:d}):"—";
const esc=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const parties=["PP","PSOE","VOX"], labels={PP:"PP",PSOE:"PSOE",VOX:"Vox"}, today=new Date().toISOString().slice(0,10);
const dt=s=>new Date(String(s)+"T00:00:00Z"), mid=(a,b)=>(dt(a).getTime()+dt(b).getTime())/2;
let records=[], polls=[], ref=null, valCis={}, val40={}, chosen="", party="PP";
function eligible(studies){
 const xs=(studies||[]).filter(x=>x.file&&x.sha256_zip&&x.fieldStart&&x.fieldEnd&&x.historical!==true&&dt(x.fieldEnd)<=dt(today));
 const overlap=xs.filter(x=>x.overlap).sort((a,b)=>dt(b.fieldEnd)-dt(a.fieldEnd))[0];
 return xs.filter(x=>!x.overlap||x.id===overlap?.id).sort((a,b)=>dt(a.fieldEnd)-dt(b.fieldEnd));
}
function age(x){return Math.max(0,(dt(today).getTime()-mid(x.fieldStart,x.fieldEnd))/86400000);}
function lambda(x,h){return h?Math.pow(.5,age(x)/h):1;}
function estimate(h,code="10000"){
 let masses={PP:0,PSOE:0,VOX:0}, den=0, a=0,b=0;
 for(const r of records){const s=r.data.scenarios?.[code];if(!s)continue;const w=lambda(r.meta,h);
  den+=Number(s.denominator)*w;for(const p of parties)masses[p]+=Number(s.masses[p]||0)*w;
  a+=Number(s.neff||0)*w;b+=Number(s.neff||0)*w*w;
 }
 const n=b?a*a/b:0, vote={};
 for(const p of parties)vote[p]=den?masses[p]/den*100:null;
 const intervals={};for(const p of parties){const q=vote[p]/100,se=n?Math.sqrt(q*(1-q)/n)*100:0;intervals[p]=[vote[p]-1.645*se,vote[p]+1.645*se];}
 return {vote,intervals,n};
}
function share(r,p,c){return Number(r.data.scenarios?.[c]?.shares?.[p]);}
function name(m){return m.title||m.id;}
function headline(){
 const main=estimate(14),a21=estimate(21),a30=estimate(30),a0=estimate(0);
 const rawN=records.reduce((s,r)=>s+Number(r.meta.n||0),0);
 const latest=records.reduce((a,b)=>dt(a.meta.fieldEnd)>dt(b.meta.fieldEnd)?a:b);
 $("headline").innerHTML='<div class="result-grid">'+parties.map(p=>'<div class="card"><span>'+labels[p]+'</span><strong>'+fmt(main.vote[p])+'%</strong><small>Intervalo de muestreo aprox. 90%: '+fmt(main.intervals[p][0])+'–'+fmt(main.intervals[p][1])+'%. No incluye sesgo sistemático.</small></div>').join("")+'</div><div class="metric-row"><span class="metric">'+records.length+' matrices</span><span class="metric">'+rawN.toLocaleString("es-ES")+' entrevistas en archivos</span><span class="metric">campo más reciente '+esc(latest.meta.fieldEnd)+'</span><span class="metric">n efectivo agrupado ≈ '+Math.round(main.n).toLocaleString("es-ES")+'</span></div><p class="foot">Sensibilidad a semivida 21 / 30 días: PP '+fmt(a21.vote.PP)+' / '+fmt(a30.vote.PP)+'%; PSOE '+fmt(a21.vote.PSOE)+' / '+fmt(a30.vote.PSOE)+'%; Vox '+fmt(a21.vote.VOX)+' / '+fmt(a30.vote.VOX)+'%. Sin descuento: PP '+fmt(a0.vote.PP)+'%, PSOE '+fmt(a0.vote.PSOE)+'%, Vox '+fmt(a0.vote.VOX)+'%.</p>';
 $("result").innerHTML='<div class="table-wrap"><table><thead><tr><th>Partido</th><th class="num">Semivida 14 d</th><th class="num">21 d</th><th class="num">30 d</th><th class="num">Sin descuento</th></tr></thead><tbody>'+parties.map(p=>'<tr><th>'+labels[p]+'</th><td class="num"><strong>'+fmt(main.vote[p])+'%</strong></td><td class="num">'+fmt(a21.vote[p])+'%</td><td class="num">'+fmt(a30.vote[p])+'%</td><td class="num">'+fmt(a0.vote[p])+'%</td></tr>').join("")+'</tbody></table></div><p class="foot">El intervalo es solo una aproximación muestral suponiendo independencia entre matrices. No cubre cobertura, no respuesta, cambio de voto ni error de modelización.</p>';
}
function timeline(){
 const W=900,H=310,L=50,R=18,T=15,B=38,dates=records.map(r=>dt(r.meta.fieldEnd).getTime()),minDate=new Date(Math.min(...dates)),maxDate=new Date(Math.max(...dates)),lo=Date.UTC(minDate.getUTCFullYear(),0,1),hi=Date.UTC(maxDate.getUTCFullYear(),11,31);
 const x=s=>L+(dt(s).getTime()-lo)/(hi-lo)*(W-L-R), y=v=>H-B-(v/40)*(H-T-B), colors={PP:"#2869a6",PSOE:"#b52d38",VOX:"#678c30"};
 let svg='<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Respuestas ponderadas por estudio y estimación agrupada">';
 for(let k=0;k<=40;k+=10)svg+='<line x1="'+L+'" y1="'+y(k)+'" x2="'+(W-R)+'" y2="'+y(k)+'" stroke="#dce6dc"/><text x="'+(L-8)+'" y="'+(y(k)+4)+'" text-anchor="end" font-size="12" fill="#52695c">'+k+'%</text>';
 for(const p of parties){const pts=records.map(r=>[x(r.meta.fieldEnd),y(share(r,p,"10000"))]).filter(z=>Number.isFinite(z[1])).sort((a,b)=>a[0]-b[0]);svg+='<polyline points="'+pts.map(z=>z.join(",")).join(" ")+'" fill="none" stroke="'+colors[p]+'" stroke-width="2" opacity=".48"/>';pts.forEach(z=>svg+='<circle cx="'+z[0]+'" cy="'+z[1]+'" r="4" fill="'+colors[p]+'"/>');svg+='<line x1="'+L+'" y1="'+y(estimate(14).vote[p])+'" x2="'+(W-R)+'" y2="'+y(estimate(14).vote[p])+'" stroke="'+colors[p]+'" stroke-dasharray="6 5" stroke-width="1.5"/>';}
 svg+='<text x="'+L+'" y="'+(H-10)+'" font-size="12" fill="#52695c">enero</text><text x="'+(W-R)+'" y="'+(H-10)+'" text-anchor="end" font-size="12" fill="#52695c">noviembre</text></svg>';$("timeline").innerHTML=svg;
}
function ledger(){
 $("ledger").innerHTML='<div class="table-wrap"><table><caption>Entradas del cálculo central. “Publicado” no es una entrada del modelo.</caption><thead><tr><th>Fuente / estudio</th><th>Campo</th><th class="num">n bruto</th><th class="num">n efectivo</th><th class="num">PP</th><th class="num">PSOE</th><th class="num">Vox</th><th>Huella del original</th></tr></thead><tbody>'+records.map(r=>{const s=r.data.scenarios["10000"],v=s.shares;return '<tr><th>'+esc(r.meta.house)+'<small>'+esc(name(r.meta))+'</small><small><a href="'+esc(r.meta.source)+'" target="_blank" rel="noopener">Fuente ↗</a></small></th><td>'+esc(r.meta.fieldStart)+' – '+esc(r.meta.fieldEnd)+'</td><td class="num">'+Number(r.meta.n).toLocaleString("es-ES")+'</td><td class="num">'+Math.round(s.neff).toLocaleString("es-ES")+'</td><td class="num">'+fmt(v.PP)+'%</td><td class="num">'+fmt(v.PSOE)+'%</td><td class="num">'+fmt(v.VOX)+'%</td><td><code>'+esc(r.meta.sha256_zip)+'</code></td></tr>';}).join("")+'</tbody></table></div>';
}
function recipes(){
 const r=records.find(x=>x.meta.id===chosen)||records[0],codes=["00000","10000","11000","11100","11110","11111"];
 const names=["Sin ingredientes","Peso de diseño","+ simpatía","+ recuerdo 23J","+ indecisos","+ probabilidad de voto"];
 const items=codes.map((c,i)=>({code:c,label:names[i],s:r.data.scenarios[c]})).filter(x=>x.s);
 const W=760,H=265,L=50,R=20,T=15,B=45,y=v=>H-B-(Number(v)/45)*(H-T-B),gap=(W-L-R)/Math.max(1,items.length-1);
 let svg='<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Ingredientes acumulativos para '+esc(labels[party])+'">';
 for(let k=0;k<=40;k+=10)svg+='<line x1="'+L+'" y1="'+y(k)+'" x2="'+(W-R)+'" y2="'+y(k)+'" stroke="#dce6dc"/><text x="'+(L-8)+'" y="'+(y(k)+4)+'" text-anchor="end" font-size="12" fill="#52695c">'+k+'%</text>';
 const xy=items.map((a,i)=>[L+i*gap,y(a.s.shares?.[party])]);svg+='<polyline points="'+xy.map(z=>z.join(",")).join(" ")+'" fill="none" stroke="#196c4b" stroke-width="3"/>';
 xy.forEach((z,i)=>svg+='<circle cx="'+z[0]+'" cy="'+z[1]+'" r="6" fill="'+(items[i].code==="10000"?"#bd8d32":"#196c4b")+'"/><text x="'+z[0]+'" y="'+(z[1]-12)+'" text-anchor="middle" font-size="12" font-weight="700">'+fmt(items[i].s.shares?.[party])+'</text><text x="'+z[0]+'" y="'+(H-B+18)+'" text-anchor="middle" font-size="11" fill="#52695c">'+items[i].code+'</text>');
 $("recipe-chart").innerHTML=svg+'</svg>';
 const published=polls.find(p=>p.id===r.meta.id)?.values?.[party];
 $("recipe-table").innerHTML='<div class="table-wrap"><table><thead><tr><th>Código</th><th>Operación añadida</th><th class="num">Voto '+labels[party]+'</th><th class="num">n efectivo</th></tr></thead><tbody>'+items.map(x=>'<tr'+(x.code==="10000"?' style="background:#f4f7ed;font-weight:700"':'')+'><th><code>'+x.code+'</code></th><td>'+x.label+'</td><td class="num">'+fmt(x.s.shares?.[party])+'%</td><td class="num">'+Math.round(x.s.neff||0).toLocaleString("es-ES")+'</td></tr>').join("")+(published==null?"":'<tr><th>Referencia</th><td>Cifra publicada por la casa; fuera del cálculo</td><td class="num">'+fmt(published)+'%</td><td class="num">—</td></tr>')+'</tbody></table></div>';
}
function validation(){
 const cisRows=Object.entries(valCis.resumen||{}).map(([k,v])=>({name:k.replaceAll("_"," "),mae:Number(v)}));
 const methods=Object.keys(val40.metodos||{}), studies=val40.estudios||[];
 const dbRows=methods.map((k,i)=>{const xs=studies.map(s=>Number(s.mae_metodos?.[i])).filter(Number.isFinite);return {name:val40.metodos[k],mae:xs.reduce((a,b)=>a+b,0)/Math.max(1,xs.length),n:xs.length};});
 const direct=Object.values(valCis.estudios||{}).map(xs=>(xs||[]).find(x=>x.paso==="directa")?.mae).filter(Number.isFinite);
 cisRows.unshift({name:"intención directa (media)",mae:direct.reduce((a,b)=>a+b,0)/Math.max(1,direct.length)});
 $("validation").innerHTML='<div class="grid2">'+[['CIS',cisRows],['40dB',dbRows]].map(([title,rows])=>'<div><h3>'+title+' · error absoluto medio ante el 23J</h3><div class="table-wrap"><table><thead><tr><th>Tratamiento</th><th class="num">MAE pp</th><th class="num">n</th></tr></thead><tbody>'+rows.map(x=>'<tr><th>'+esc(x.name)+'</th><td class="num">'+fmt(x.mae,2)+'</td><td class="num">'+(x.n|| (title==="CIS"?2:3))+'</td></tr>').join("")+'</tbody></table></div></div>').join("")+'</div><p class="foot">Una elección, dos estudios CIS y tres de 40dB. No valida generalización; sirve para auditar la dirección del cambio al añadir ingredientes.</p>';
}
function compare(){
 const p=ref?.principal?.partidos;if(!p){$("comparison").innerHTML="<p>Comparador no disponible.</p>";return;}
 $("comparison").innerHTML='<div class="table-wrap"><table><thead><tr><th>Partido</th><th class="num">Microdatos OEE</th><th class="num">Motor de encuestas publicadas</th><th class="num">Diferencia</th></tr></thead><tbody>'+parties.map(k=>'<tr><th>'+labels[k]+'</th><td class="num">'+fmt(estimate(14).vote[k])+'%</td><td class="num">'+fmt(p[k].voto[0])+'%</td><td class="num">'+fmt(estimate(14).vote[k]-p[k].voto[0])+' pp</td></tr>').join("")+'</tbody></table></div><p class="foot">Comparador: corte '+esc(ref.corte)+'. Es otra cocina y no interviene en la estimación microdatos.</p>';
}
function provenance(){
 $("provenance").innerHTML='<div class="table-wrap"><table><thead><tr><th>Estudio</th><th>Variables declaradas</th><th>SHA-256 ZIP</th></tr></thead><tbody>'+records.map(r=>'<tr><th>'+esc(r.meta.house+" · "+name(r.meta))+'</th><td>'+esc(Object.entries(r.meta.variables||{}).map(x=>x[0]+"="+x[1]).join(" · "))+'</td><td><code>'+esc(r.meta.sha256_zip)+'</code></td></tr>').join("")+'</tbody></table></div><p><a href="data/microdatos/maquina/index.json">Abrir índice de matrices agregadas</a>. Ninguna respuesta individual se publica.</p>';
}
function bind(){
 $("source-select").addEventListener("change",e=>{chosen=e.target.value;recipes();});
 $("party-select").addEventListener("change",e=>{party=e.target.value;recipes();});
}
async function init(){
 try{
  const [idx,cis,db,forecast]=await Promise.all([
   fetch("data/microdatos/maquina/index.json").then(r=>r.json()),
   fetch("data/microdatos/validacion_cocina_cis.json").then(r=>r.json()),
   fetch("data/microdatos/40db-retrospectiva-2023.json").then(r=>r.json()),
   fetch("data/modelo/pronostico.json").then(r=>r.ok?r.json():null).catch(()=>null)
  ]);
  valCis=cis;val40=db;ref=forecast;
  const meta=eligible(idx.studies);
  records=await Promise.all(meta.map(async m=>({meta:m,data:await fetch(m.file).then(r=>r.json())})));
  if(!records.length||records.some(r=>!r.data.scenarios?.["10000"]))throw Error("Faltan escenarios ponderados en matrices fuente");
  polls=await fetch("data/polls.json").then(r=>r.ok?r.json():[]).catch(()=>[]);
  $("source-select").innerHTML=records.map(r=>'<option value="'+esc(r.meta.id)+'">'+esc(r.meta.house+" · "+name(r.meta)+" · "+r.meta.fieldEnd)+'</option>').join("");
  chosen=records.some(r=>r.meta.id==="cis-3582")?"cis-3582":records[0].meta.id;
  $("source-select").value=chosen;bind();
  headline();timeline();ledger();recipes();validation();compare();provenance();
  $("status").textContent="Calculado desde "+records.length+" matrices · actualizado "+new Intl.DateTimeFormat("es-ES",{dateStyle:"long",timeZone:"UTC"}).format(new Date());
 }catch(e){$("status").textContent="No se pudo cargar el cálculo";$("result").innerHTML='<div class="notice">'+esc(e.message||e)+'</div>';}
}
init();
export function districtPath(district){
 const canary=district.nuts.some(id=>id.startsWith('ES70'));
 const point=([lon,lat])=>canary?[70+(lon+18.3)*40,565+(29.5-lat)*40]:[35+(lon+9.5)*49,28+(44-lat)*59];
 return district.polygons.map(polygon=>polygon.map(ring=>ring.map((p,i)=>{const [x,y]=point(p);return `${i?'L':'M'}${x.toFixed(2)},${y.toFixed(2)}`;}).join('')+'Z').join('')).join('');
}
export function renderMap(cartography,election,selected){
 const paths=cartography.districts.map(geo=>{
  const d=election.districts.find(d=>d.id===geo.id),active=selected===d.id;
  const light=90-Math.sqrt(d.seats/37)*46;
  const marker=['Ceuta','Melilla'].includes(d.name)?`<circle cx="${35+((d.name==='Ceuta'?-5.31:-2.94)+9.5)*49}" cy="${28+(44-(d.name==='Ceuta'?35.89:35.29))*59}" r="6"/>`:'';
  return `<g class="map-district" role="button" tabindex="0" data-map-district="${d.id}" aria-label="${d.name}, ${d.seats} escaños" aria-pressed="${active}" style="fill:${active?'#a5cb5f':`hsl(155 24% ${light}%)`}"><title>${d.name} · ${d.seats} escaños</title><path d="${districtPath(geo)}" fill-rule="evenodd"/>${marker}</g>`;
 }).join('');
 return `<svg viewBox="0 0 760 675" class="atlas-map" aria-label="Mapa interactivo de las 52 circunscripciones del Congreso. Color según número de escaños. Canarias en recuadro." role="group">${paths}<rect x="40" y="555" width="260" height="100" rx="7" fill="none" stroke="#c3d2c8"/><text x="55" y="575" font-size="10" fill="#60736e">CANARIAS · posición desplazada</text><text x="445" y="620" font-size="11" fill="#60736e">Menos escaños</text><rect x="445" y="631" width="140" height="9" fill="url(#seat-scale)"/><text x="595" y="640" font-size="11" fill="#60736e">Más escaños</text><defs><linearGradient id="seat-scale"><stop stop-color="hsl(155 24% 82%)"/><stop offset="1" stop-color="hsl(155 24% 44%)"/></linearGradient></defs></svg><p class="muted map-attribution">${cartography.attribution}<br>Geometría generalizada de 2024; escaños del 23J de 2023. <a href="${cartography.terms}" target="_blank" rel="noopener">Condiciones de uso no comercial ↗</a>. Ceuta y Melilla resaltadas con marcadores.</p>`;
}

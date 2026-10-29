import fs from 'node:fs';
import crypto from 'node:crypto';
if(!process.argv[2]) throw Error('Uso: node scripts/import-map.mjs ruta/NUTS_RG_10M_2024_4326_LEVL_3.geojson');
const raw=fs.readFileSync(process.argv[2]);
const features=JSON.parse(raw).features.filter(f=>f.properties.CNTR_CODE==='ES');
const data=JSON.parse(fs.readFileSync('data/election.json'));
const names={'A Coruña':'Coruña (A)','La Rioja':'Rioja (La)'};
const islandNames={ES531:'Balears (Illes)',ES532:'Balears (Illes)',ES533:'Balears (Illes)',ES703:'Santa Cruz de Tenerife',ES704:'Palmas (Las)',ES705:'Palmas (Las)',ES706:'Santa Cruz de Tenerife',ES707:'Santa Cruz de Tenerife',ES708:'Palmas (Las)',ES709:'Santa Cruz de Tenerife'};
const districts=data.districts.map(d=>({id:d.id,name:d.name,nuts:[],polygons:[]}));
for(const f of features){
 const name=islandNames[f.properties.NUTS_ID]||names[f.properties.NAME_LATN]||f.properties.NAME_LATN;
 const d=districts.find(d=>d.name===name);if(!d)throw Error('Territorio no identificado: '+name);
 d.nuts.push(f.properties.NUTS_ID);
 d.polygons.push(...(f.geometry.type==='Polygon'?[f.geometry.coordinates]:f.geometry.coordinates));
}
if(features.length!==59||districts.some(d=>!d.polygons.length))throw Error('Cartografía incompleta');
fs.writeFileSync('data/cartography.json',JSON.stringify({source:'https://gisco-services.ec.europa.eu/distribution/v2/nuts/geojson/NUTS_RG_10M_2024_4326_LEVL_3.geojson',sourceSha256:crypto.createHash('sha256').update(raw).digest('hex'),vintage:2024,verified:'2026-10-29',attribution:'© EuroGeographics para los límites administrativos. Fuente: Eurostat / GISCO, NUTS 2024, escala 1:10 millones.',terms:'https://ec.europa.eu/eurostat/web/gisco/geodata/statistical-units',usage:'Uso no comercial según condiciones GISCO; esta cartografía no está bajo licencia MIT.',districts})+'\n');
console.log('59 unidades NUTS agrupadas en 52 circunscripciones.');

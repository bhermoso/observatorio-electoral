/** Four stable destinations; tools belong to the section that uses them. */
export function primaryNavigation(prefix='./'){
 return `<a href="${prefix}#dashboard">Panorama</a><a href="${prefix}#encuestas">Encuestas</a><a href="${prefix}del-sondeo-al-escano.html">Cocina</a><a href="${prefix}#metodologia">Método</a>`;
}
export function surveyNavigation(prefix='./'){
 return `<nav class="section-tools" aria-label="Herramientas de encuestas"><a href="${prefix}#encuestas">Archivo</a><a href="${prefix}comparador-encuestas.html">Comparar casas</a><a href="${prefix}institutos.html">Institutos</a><a href="${prefix}encuestas-resultados.html">Frente a resultados</a></nav>`;
}
if(typeof document!=='undefined'){
 const file=location.pathname.split('/').at(-1),survey=['comparador-encuestas.html','institutos.html','encuestas-resultados.html'].includes(file);
 document.querySelectorAll('[data-global-navigation]').forEach(nav=>{nav.innerHTML=primaryNavigation();if(survey){const template=document.createElement('template');template.innerHTML=surveyNavigation();nav.after(template.content);}});
}

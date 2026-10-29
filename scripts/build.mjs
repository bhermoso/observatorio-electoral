import fs from 'node:fs';
fs.mkdirSync('dist',{recursive:true});
for(const f of ['index.html','styles.css','app.mjs','engine.mjs','map.mjs']) fs.copyFileSync(f,`dist/${f}`);
fs.cpSync('data','dist/data',{recursive:true});
fs.cpSync('docs','dist/docs',{recursive:true});
fs.writeFileSync('dist/.nojekyll','');
console.log('Sitio estático listo en dist/');

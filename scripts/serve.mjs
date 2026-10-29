import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve('dist');
http.createServer((req,res)=>{
 const file=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]==='/'?'/index.html':req.url.split('?')[0]));
 if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 try {const types={'.html':'text/html; charset=utf-8','.css':'text/css','.mjs':'text/javascript','.json':'application/json','.md':'text/plain; charset=utf-8'};res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404).end();}
}).listen(4173,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:4173'));

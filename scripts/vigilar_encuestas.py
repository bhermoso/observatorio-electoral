"""Vigilancia multifuente directa: solo candidatos documentales, nunca estimaciones.
Publica metadatos auditables y conserva la última búsqueda útil ante un fallo total.
"""
from __future__ import annotations
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from html.parser import HTMLParser
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.parse import urljoin, urlsplit
import json
import re
import sys
import xml.etree.ElementTree as ET

ROOT=Path(__file__).resolve().parents[1]
WORDS=re.compile(r'encuesta|sondeo|bar[oó]metro|estimaci[oó]n|demoscop|microdato|pulso.electoral',re.I)
FILES=re.compile(r'\.(?:zip|sav|dta|xlsx|csv)(?:$|\?)',re.I)
LIMIT=2_000_000

class Links(HTMLParser):
    def __init__(self):super().__init__();self.rows=[];self.href=None;self.words=[]
    def handle_starttag(self,tag,attrs):
        if tag=='a':self.href=dict(attrs).get('href');self.words=[]
    def handle_data(self,data):
        if self.href:self.words.append(data)
    def handle_endtag(self,tag):
        if tag=='a' and self.href:
            self.rows.append((' '.join(' '.join(self.words).split()),self.href));self.href=None

def safe_url(raw,base):
    url=urljoin(base,raw);p=urlsplit(url)
    return url if p.scheme=='https' and p.hostname and not p.username and not p.password else None

def parse(body,source):
    found=[]
    if source['format']=='rss':
        root=ET.fromstring(body)
        if root.tag.rsplit('}',1)[-1] not in ('rss','feed'):raise ValueError('Respuesta XML sin RSS/Atom')
        rows=[]
        for item in root.findall('./channel/item')+root.findall('{http://www.w3.org/2005/Atom}entry'):
            title=item.findtext('title') or item.findtext('{http://www.w3.org/2005/Atom}title') or ''
            link=item.findtext('link') or ''
            atom=item.find('{http://www.w3.org/2005/Atom}link')
            if atom is not None:link=atom.get('href','')
            raw=item.findtext('pubDate') or ''
            try:published=parsedate_to_datetime(raw).astimezone(timezone.utc).isoformat()
            except (ValueError,TypeError,OverflowError):published=None
            rows.append((title,link,published))
    else:
        parser=Links();parser.feed(body.decode('utf-8',errors='replace'))
        if not parser.rows:raise ValueError('La página no contiene enlaces utilizables')
        rows=[(t,u,None) for t,u in parser.rows]
    for title,raw,published in rows:
        url=safe_url(raw,source['url'])
        if not url or not (WORDS.search(title+' '+url) or FILES.search(url)):continue
        found.append({'title':title[:500] or 'Archivo enlazado por el productor','url':url,'discovery_url':url,
                      'published':published,'publication_raw':published or 'Fecha no indicada en el índice',
                      'topic':source['name'],'source_id':source['id'],'original_verified':False,
                      'tipo':'enlace_a_archivo' if FILES.search(url) else 'publicacion_candidata'})
    return found[:50]

def fetch_source(source,opener=urlopen):
    for attempt in (1,2):
        try:
            req=Request(source['url'],headers={'User-Agent':'ObservatorioElectoral/2.0 (+https://bhermoso.github.io/observatorio-electoral/)', 'Accept':'application/rss+xml,application/xml,text/html'})
            with opener(req,timeout=12) as r:

                if getattr(r,'status',200)!=200:raise ValueError('HTTP '+str(r.status))
                body=r.read(LIMIT+1)
            if len(body)>LIMIT:raise ValueError('Respuesta superior a 2 MB')
            items=parse(body,source)
            return {**source,'ok':True,'attempts':attempt,'count':len(items),'items':items}
        except Exception as exc:
            code=getattr(exc,'code',None)
            transient=isinstance(exc,(TimeoutError,OSError)) and (code is None or code>=500 or code==408)
            if attempt==1 and transient:continue
            return {**source,'ok':False,'attempts':attempt,'count':0,'items':[],
                    'error':f'HTTP {code}' if code else type(exc).__name__+': '+str(exc)[:140]}

def assemble(results,previous=None,now=None):
    now=now or datetime.now(timezone.utc).isoformat();previous=previous or {}
    successful=[r for r in results if r['ok']];unique={}
    for source in results:
        for x in source['items']:
            key=x['url'].split('#')[0]
            if key not in unique:unique[key]=x
    items=sorted(unique.values(),key=lambda x:x.get('published') or '',reverse=True)[:150]
    # On total failure the old timestamp and old candidates stay visibly old.
    return {'schema':2,'checked_at':now if successful else previous.get('checked_at'),
            'last_attempt_at':now,'status':'complete' if len(successful)==len(results) else 'partial' if successful else 'failed',
            'searches':len(results),'sources_ok':len(successful),
            'sources':[{k:v for k,v in r.items() if k!='items'} for r in results],
            'results':items if successful else previous.get('results',[]),
            'errors':[{'source':r['name'],'detail':r['error']} for r in results if not r['ok']],
            'policy':'Solo descubrimiento. Revisar original, campo, muestra, cifras y denominador antes de incorporar.'}

def scan(previous=None):
    sources=json.loads((ROOT/'data/vigilancia/fuentes.json').read_text())
    with ThreadPoolExecutor(max_workers=4) as pool:results=list(pool.map(fetch_source,sources))
    return assemble(results,previous)

def main():
    out=Path(sys.argv[1] if len(sys.argv)>1 else 'monitor-output');out.mkdir(parents=True,exist_ok=True)
    archive=ROOT/'data/vigilancia/candidatos.json'
    previous=json.loads(archive.read_text()) if archive.exists() else {}
    report=scan(previous)
    agenda=ROOT/"data/vigilancia/seguimientos.json"
    report["seguimientos"]=json.loads(agenda.read_text()) if agenda.exists() else []
    for target in (out/'candidates.json',archive):target.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    lines=['# Vigilancia directa de publicaciones','',report['policy'],'','Consultado: '+report['last_attempt_at'],
           'Estado: '+report['status'],'Propuestas: '+str(len(report['results'])),'']
    lines += [f"- **{x['topic']}** · [{x['title']}]({x['url']}) · {x['publication_raw']}" for x in report['results']]
    (out/'report.md').write_text('\n'.join(lines)+'\n')
    print(f"Vigilancia: {report['sources_ok']}/{report['searches']} fuentes accesibles; {len(report['results'])} candidatos; {report['status']}")

if __name__=='__main__':main()

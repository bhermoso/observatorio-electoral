#!/usr/bin/env python3
"""Importación conservadora de tablas secundarias. Nunca imputa publicación.

Ejecutar con --fuentes DIR (HTML/PDF conservados) o --descargar. No descarga
microdatos. Los porcentajes son estimación de voto, no intención directa.
"""
import argparse
import gzip
import subprocess
import hashlib
import json
import re
from datetime import date
from pathlib import Path
from urllib.request import Request, urlopen
from lxml import html

ROOT = Path(__file__).resolve().parents[1]
CICLOS = {
 '2011': ('2011-11-20', 5, 4, 24348886, {'PP': {'PP':10061311,'PP-PAR':339502,'PP-EU':339237,'UPN-PP':126516}, 'PSOE':{'PSOE':6080964,'PSC-PSOE':922547}}, '2011/12/10', '2011-19391'),
 '2015': ('2015-12-20', 4, 5, 25211313, {'PP': {'PP':6717462,'PP-PAR':229691,'PP-FORO':187568,'UPN-PP':102244}, 'PSOE':{'PSOE':4736628,'PSC':590274,'PSOE-NCa':218413}}, '2016/01/29', '2016-867'),
 '2016': ('2016-06-26', 4, 5, 24053755, {'PP': {'PP':7372172,'PP-PAR':252456,'PP-FORO':209632,'UPN-PP':106976}, 'PSOE':{'PSOE':4663505,'PSC-PSOE':559870,'PSOE-NCa':220471}}, '2016/07/22', '2016-7133'),
 'April_2019': ('2019-04-28', 4, 5, 26201371, {'PP':{'PP':4373653},'PSOE':{'PSOE+PSC':7513142}}, '2019/05/30', '2019-8070'),
 'November_2019': ('2019-11-10', 5, 4, 24258228, {'PP':{'PP':4917095,'PP-FORO':129945},'PSOE':{'PSOE':5997533,'PSC':794666}}, '2019/12/02', '2019-17344'),
}
EXTRAS = {
 '2011': {'IU':(6,{'LA IZQUIERDA PLURAL (corregido)':1686040}),'UPYD':(9,{'UPyD':1143225})},
 '2015': {'CS':(15,{"C’s":3514528})},
 '2016': {'CS':(7,{"C’s":3141570})},
 'April_2019': {'CS':(7,{'CS':4155665}),'VOX':(14,{'VOX':2688092})},
 'November_2019': {'CS':(6,{'CS':1650318}),'VOX':(8,{'VOX':3656979})},
}
MONTHS = {v:i+1 for i,v in enumerate(['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'])}
FULL = {v:i+1 for i,v in enumerate(['January','February','March','April','May','June','July','August','September','October','November','December'])}

def clean(node):
    return ' '.join(' '.join(node.itertext()).split())

def field_dates(label, year):
    """Solo días explícitos; las fechas mensuales y los signos ? quedan fuera."""
    s = re.sub(r'\[[^]]*\]', '', label).strip().replace('−','–').replace('—','–')
    m = re.fullmatch(r'(\d{1,2})(?:\s+([A-Za-z]{3}))?(?:\s*[–-]\s*(\d{1,2})\s+([A-Za-z]{3}))?(?:\s+(\d{4}))?',s)
    if not m:return None
    d1, mo1, d2, mo2, yy = m.groups()
    if not (mo1 or mo2):return None
    try:
        end = date(int(yy or year), MONTHS[mo2 or mo1],int(d2 or d1))
        start = date(end.year,MONTHS[mo1 or mo2],int(d1))
        return (start,end) if start<=end else None
    except (ValueError, KeyError):return None

def publication(doc, row):
    evidence=[]
    for a in row.xpath('.//sup//a[contains(@href,"#cite_note")]'):
        ident=a.get('href').split('#')[-1]
        refs=[doc[ident]] if ident in doc else []
        if not refs:continue
        ref=refs[0];s=clean(ref)
        # Archive/retrieval dates are NOT publication dates.
        s=re.split(r'Archived|Retrieved|Accessed|Consultado|Archivado',s)[0]
        # Citation titles can contain dates; retain only the bibliographic suffix.
        suffix=s.rsplit('".',1)[-1] if '".' in s else s
        dates=re.findall(r'\b(\d{1,2})\s+('+'|'.join(FULL)+r')\s+(20\d{2})\b',suffix)
        links=ref.xpath('.//a[contains(@class,"external")]/@href')
        if len(dates)!=1 or not links:continue
        dd,mm,yy=dates[0]
        evidence.append({'fecha':date(int(yy),FULL[mm],int(dd)).isoformat(),'url':links[0], 'cita':s})
    # Ambiguous dates are excluded instead of selecting a convenient one.
    unique={x['fecha'] for x in evidence}
    return (next(iter(unique)) if len(unique)==1 else None),evidence

def parse_page(path, key):
    spec=CICLOS[key];doc=html.fromstring(path.read_bytes())
    for node in doc.xpath('//style|//script'):node.drop_tree()
    table=doc.xpath('//table[contains(concat(" ",normalize-space(@class)," ")," wikitable ")]')[0]
    width=len(table.xpath('.//tr')[0].xpath('./th|./td'))
    rows=[];excluded=[]
    refs={node.get('id'):node for node in doc.xpath('//*[@id]')}
    for idx,row in enumerate(table.xpath('.//tr')[3:],3):
        cells=row.xpath('./th|./td');text=clean(row)
        reason=None
        if len(cells)!=width or any(c.get('colspan','1')!='1' or c.get('rowspan','1')!='1' for c in cells):reason='estructura_no_rectangular'
        if reason:excluded.append({'fila':idx,'motivo':reason,'texto':text[:160]});continue
        field=field_dates(clean(cells[1]), int(spec[0][:4]))
        name=re.sub(r'\[[^]]*\]','',clean(cells[0])).strip()
        if 'general election' in name.lower():reason='resultado_no_encuesta'
        elif any(s in name.lower() for s in ['electopanel','electomanía','electomania']):reason='panel_autoseleccionado'
        elif field is None:reason='campo_sin_dias_explicitos'
        votes={}
        for party,col in [('PP',spec[1]),('PSOE',spec[2])]:
            raw=clean(cells[col]);m=re.match(r'^(\d{1,2}\.\d+)(?=\s|$)',raw)
            if m:votes[party]=float(m[1])
        if len(votes)!=2:reason=reason or 'voto_no_numerico_comun'
        for party,(col,_) in EXTRAS[key].items():
            m=re.match(r'^(\d{1,2}\.\d+)(?=\s|$)',clean(cells[col]))
            if m:votes[party]=float(m[1])
        pub,ev=publication(refs,row)
        if not pub:reason=reason or 'publicacion_no_documentada'
        if field and pub and date.fromisoformat(pub)<field[1]:reason=reason or 'publicacion_anterior_fin_campo'
        if reason:excluded.append({'fila':idx,'motivo':reason,'texto':text[:160]});continue
        nraw=clean(cells[2]).replace(',','');n=int(nraw) if nraw.isdigit() else None
        rows.append({'estudio':f'wiki-{key}-{idx}', 'eleccion':spec[0], 'casa':name.split('/')[0].strip(), 'denominacion_original':name,
          'campo_ini':field[0].isoformat(),'campo_fin':field[1].isoformat(),'campo_original':clean(cells[1]),
          'publicacion':pub,'evidencia_publicacion':ev,'n':n,'n_supuesto':n is None,'voto':votes,
          'origen':'tabla_secundaria_con_referencia_fechada','fila':idx})
    return rows,excluded

def main():
    ap=argparse.ArgumentParser(description=__doc__);ap.add_argument('--fuentes',type=Path,default=ROOT/'work/ciencia/fuentes');ap.add_argument('--descargar',action='store_true');a=ap.parse_args();a.fuentes.mkdir(parents=True,exist_ok=True)
    polls=[];cycles=[];ledger=[];sources=[]
    for key,spec in CICLOS.items():
        url=f'https://en.wikipedia.org/wiki/Opinion_polling_for_the_{key}_Spanish_general_election';p=a.fuentes/(key+'.html')
        official=f'https://www.boe.es/boe/dias/{spec[5]}/pdfs/BOE-A-{spec[6]}.pdf';pdf=a.fuentes/({'April_2019':'2019A','November_2019':'2019N'}.get(key,key)+'.pdf')
        for path,link in [(p,url),(pdf,official)]:
            if a.descargar and not path.exists():path.write_bytes(urlopen(Request(link,headers={'User-Agent':'ObservatorioElectoral/1.0'}),timeout=45).read())
            sources.append({'archivo':path.name,'url':link,'sha256':hashlib.sha256(path.read_bytes()).hexdigest()})
        rows,ex=parse_page(p,key);polls.extend(rows);ledger.append({'eleccion':spec[0],'admitidas_importacion':len(rows),'excluidas':ex})
        cycles.append({'fecha':spec[0],'fecha_publicacion_resultado':spec[5].replace('/','-'),'votos_validos':spec[3],'agrupaciones':dict(spec[4],**{p:v[1] for p,v in EXTRAS[key].items()}),'resultado':{p:100*sum(v.values())/spec[3] for p,v in dict(spec[4],**{p:v[1] for p,v in EXTRAS[key].items()}).items()},'fuente':official})
    # The 2011 correction changes valid votes by +49; PP/PSOE numerators unchanged.
    corr=a.fuentes/'2012-6674.pdf'
    if a.descargar and not corr.exists():corr.write_bytes(urlopen('https://www.boe.es/boe/dias/2012/05/19/pdfs/BOE-A-2012-6674.pdf').read())
    sources.append({'archivo':corr.name,'url':'https://www.boe.es/boe/dias/2012/05/19/pdfs/BOE-A-2012-6674.pdf','sha256':hashlib.sha256(corr.read_bytes()).hexdigest()})
    cycles[0]['fecha_publicacion_resultado']='2012-05-19'
    cycles[0]['correccion']='BOE-A-2012-6674: +49 votos válidos (IU Lugo); denominador corregido 24348886.'
    archive=ROOT/'data/historico/fuentes';archive.mkdir(exist_ok=True)
    for src in sources:
        original=a.fuentes/src['archivo']
        stored=original
        if original.suffix=='.pdf':
            stored=original.with_suffix('.txt')
            if not stored.exists():subprocess.run(['pdftotext','-layout',str(original),str(stored)],check=True)
            src['nota_conservacion']='Texto pdftotext -layout del PDF oficial; sha256 identifica también el PDF consultado.'
        dest=archive/(stored.name+'.gz');dest.write_bytes(gzip.compress(stored.read_bytes(),mtime=0))
        src['archivo_conservado']=str(dest.relative_to(ROOT));src['sha256_conservado']=hashlib.sha256(dest.read_bytes()).hexdigest()
    result={'esquema':1,'fecha_importacion':date.today().isoformat(),'universo':'Soporte común PP/PSOE en seis elecciones; ampliaciones por candidatura donde existe agrupación propia documentada. No se inventan equivalencias de coalición ni se validan escaños.', 'calidad':'Secundaria: fechas transcritas de referencias; originales enlazados, no todos contrastados. No son publicaciones históricas archivadas del Observatorio.', 'fuentes':sources,'elecciones':cycles,'encuestas':polls,'ledger':ledger}
    out=ROOT/'data/historico/multieleccion.json';out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(out,len(polls),[(x['eleccion'],x['admitidas_importacion']) for x in ledger])
if __name__=='__main__':main()

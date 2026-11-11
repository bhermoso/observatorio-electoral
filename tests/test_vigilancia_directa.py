import io,json,unittest
from urllib.error import HTTPError
from scripts.vigilar_encuestas import parse,assemble,fetch_source
SOURCE={'id':'test','name':'Productor','url':'https://productor.es/estudios/','format':'html'}
class Response(io.BytesIO):
 status=200
 def __enter__(self):return self
 def __exit__(self,*args):pass
class TestVigilancia(unittest.TestCase):
 def test_paginas_directas_y_enlaces_seguros(self):
  data=b'<a href="/encuestas/noviembre">Sondeo noviembre</a><a href="javascript:x">Encuesta</a><a href="/base.zip">Datos</a>'
  r=parse(data,SOURCE);self.assertEqual(len(r),2);self.assertEqual(r[1]['tipo'],'enlace_a_archivo');self.assertIsNone(r[0]['published'])
 def test_rss_sin_noticias_no_equivale_a_xml_roto(self):
  src={**SOURCE,'format':'rss'};self.assertEqual(parse(b'<rss><channel/></rss>',src),[])
  with self.assertRaises(Exception):parse(b'<rss>',src)
  with self.assertRaises(ValueError):parse(b'<html/>',src)
 def test_respuesta_de_desafio_no_parece_fuente_vacia(self):
  with self.assertRaises(ValueError):parse(b'<html>verifica tu navegador</html>',SOURCE)
 def test_reintento_limitado_y_fallo_permanente(self):
  calls=[]
  def opener(req,timeout):
   calls.append(req.full_url)
   if len(calls)==1:raise HTTPError(req.full_url,503,'gateway',{},None)
   return Response(b'<a href="/sondeo">Sondeo</a>')
  result=fetch_source(SOURCE,opener);self.assertTrue(result['ok']);self.assertEqual(len(calls),2)
  calls.clear()
  def deny(req,timeout):calls.append(req.full_url);raise HTTPError(req.full_url,403,'denied',{},None)
  result=fetch_source(SOURCE,deny);self.assertFalse(result['ok']);self.assertEqual(len(calls),1)
 def test_fallo_total_conserva_fecha_y_candidatos(self):
  fail={**SOURCE,'ok':False,'error':'HTTP 503','items':[],'attempts':2,'count':0}
  prior={'checked_at':'ANTERIOR','results':[{'title':'anterior'}]}
  r=assemble([fail],prior,now='AHORA');self.assertEqual(r['status'],'failed');self.assertEqual(r['checked_at'],'ANTERIOR');self.assertEqual(r['results'],prior['results'])
 def test_parcial_y_deduplicacion(self):
  x={'title':'Sondeo','url':'https://productor.es/a','published':None}
  good={**SOURCE,'ok':True,'items':[x,x],'attempts':1,'count':2}
  bad={**SOURCE,'ok':False,'items':[],'attempts':2,'count':0,'error':'timeout'}
  r=assemble([good,bad],now='AHORA');self.assertEqual(r['status'],'partial');self.assertEqual(len(r['results']),1)

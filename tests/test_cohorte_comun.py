import importlib.util
from pathlib import Path
import unittest

def module(name):
 p=Path(__file__).resolve().parents[1]/'scripts'/f'{name}.py';s=importlib.util.spec_from_file_location(name,p);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
C=module('auditar_cohorte_comun');I=module('importar_historico_multieleccion')
class TestCohorte(unittest.TestCase):
 def test_aisla_denominador_y_numerador(self):
  # Two questions on the SAME eligible cohort; sympathy moves nonresponse.
  cube=[[[[1,10,10,8],[0,0,0,0]],[[1,10,10,2],[0,0,0,0]],[[1,10,10,5],[0,0,0,0]]],[[[1,20,20,10],[0,0,0,0]],[[1,10,10,5],[0,0,0,0]],[[0,0,0,0],[0,0,0,0]]]]
  out=C.contrastar(cube,['PP','PSOE','NO_CANDIDATURA'])
  for comp in out['comparaciones']:
   for p,v in comp['descomposicion'].items():self.assertAlmostEqual(v['cambio_candidaturas_pp'],v['termino_numerador_pp']+v['termino_denominador_pp'])
  self.assertAlmostEqual(out['escenarios']['0_peso']['porcentaje_candidaturas']['PP'],50)
  self.assertAlmostEqual(out['escenarios']['0_participacion']['porcentaje_candidaturas']['PP'],80)
 def test_rechaza_bases_incompatibles(self):
  with self.assertRaises(ValueError):C.contrastar([[[[1,10,10,5]]],[[[1,5,5,3]]]],['NO_CANDIDATURA'])
 def test_fechas_de_campo_no_se_inventan(self):
  self.assertEqual(tuple(map(str,I.field_dates('25 Oct–10 Nov',2019))),('2019-10-25','2019-11-10'))
  self.assertEqual(tuple(map(str,I.field_dates('15–17 Nov 2011',2011))),('2011-11-15','2011-11-17'))
  self.assertIsNone(I.field_dates('Nov 2011',2011));self.assertIsNone(I.field_dates('?',2011))
 def test_fecha_archivo_no_se_trata_como_publicacion(self):
  from lxml import html
  doc=html.fromstring('<div><tr><td><sup><a href="#cite_note-1">1</a></sup></td></tr><li id="cite_note-1">"Encuesta". Medio. Archived on 19 November 2011.<a class="external" href="https://example.org">fuente</a></li></div>')
  pub,ev=I.publication({'cite_note-1':doc.xpath('//li')[0]},doc.xpath('//tr')[0]);self.assertIsNone(pub)
if __name__=='__main__':unittest.main()

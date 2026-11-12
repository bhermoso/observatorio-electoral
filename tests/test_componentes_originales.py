import sys
from pathlib import Path
import unittest
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from auditar_componentes_originales import metrics
class TestComponentesOriginales(unittest.TestCase):
 def test_denominador_validos_no_es_todas_las_entrevistas(self):
  rows=[{'v':'PP'},{'v':'PSOE'},{'v':'NS'}]
  r=metrics(rows,[2.,1.,4.],'v')
  self.assertEqual(r['n_cohorte'],3);self.assertEqual(r['n_aportan'],2);self.assertEqual(r['peso_total'],7);self.assertEqual(r['denominador_valido'],3)
  self.assertAlmostEqual(r['estimacion']['PP'],200/3);self.assertAlmostEqual(r['porcentaje_total']['PP'],200/7)
  self.assertAlmostEqual(r['kish_aportan'],9/5);self.assertAlmostEqual(r['kish_cohorte'],49/21)
 def test_cambiar_peso_no_cambia_cohorte(self):
  rows=[{'v':'PP'},{'v':'PSOE'}];a=metrics(rows,[1.,1.],'v');b=metrics(rows,[1.,0.],'v')
  self.assertEqual(a['n_cohorte'],b['n_cohorte']);self.assertEqual(b['n_aportan'],1);self.assertEqual(b['kish_aportan'],1)
 def test_pesos_incompatibles_no_se_truncan_con_zip(self):
  for w in [[1.],[-1.,2.],[float('nan'),1.],[0.,0.]]:
   with self.subTest(w=w),self.assertRaises(ValueError):metrics([{'v':'PP'},{'v':'PSOE'}],w,'v')
if __name__=='__main__':unittest.main()

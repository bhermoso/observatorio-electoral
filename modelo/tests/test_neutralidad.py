import unittest
from datetime import date
import numpy as np
from modelo.motor.pronostico import frecuencias_primero,resumir
from modelo.motor.fuentes import publicada_antes

class TestNeutralidad(unittest.TestCase):
 def test_empate_no_se_asigna_al_primer_partido(self):
  e=np.array([[100,100,50],[101,100,49],[100,101,49]])
  r=frecuencias_primero(e)
  np.testing.assert_allclose(r['exclusivo'],[1/3,1/3,0]);np.testing.assert_allclose(r['compartido'],[2/3,2/3,0]);self.assertAlmostEqual(r['empate'],1/3)
 def test_permutar_partidos_no_cambia_probabilidades(self):
  e=np.array([[100,100,50],[50,100,100],[100,50,100],[90,100,80]])
  p=[2,0,1];a=frecuencias_primero(e);b=frecuencias_primero(e[:,p])
  np.testing.assert_allclose(b['exclusivo'],a['exclusivo'][p]);np.testing.assert_allclose(b['compartido'],a['compartido'][p])
 def test_resumen_conserva_masa_empate_separada(self):
  e=np.array([[100,100],[101,99]])
  r=resumir(dict(partidos=['A','B'],votos=np.array([[30,30],[31,29]]),escanos=e))
  self.assertEqual(sum(p['primero'] for p in r['partidos'].values())+r['empate_primero'],1)
  self.assertEqual(r['partidos']['B']['primero'],0);self.assertEqual(r['partidos']['B']['primero_o_empate'],.5)
 def test_operativo_no_imputa_publicacion(self):
  e=dict(campo_fin=date(2023,7,1))
  self.assertFalse(publicada_antes(e,date(2023,7,10),estricta=True))
  self.assertTrue(publicada_antes(e,date(2023,7,10))) # Exploratory legacy scenario remains explicit.
if __name__=='__main__':unittest.main()

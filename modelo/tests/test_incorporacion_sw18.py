import unittest
from datetime import date
from modelo.motor import fuentes as F


class SeguimientoSW18(unittest.TestCase):
 def test_entrega_publicada_y_campos_acumulados(self):
  accepted,rejected=F.seleccion_pronostico([e for e in F.todas() if e.get('publicacion') and e['publicacion']<=date(2026,11,18)])
  newest=next(e for e in accepted if e['estudio']=='sw-demoscopia-2026-11-18')
  self.assertEqual((newest['n'],newest['campo_ini'],newest['campo_fin']),(10000,date(2026,10,26),date(2026,11,17)))
  self.assertEqual((newest['voto']['PSOE'],newest['voto']['PP'],newest['voto']['VOX']),(31.9,29.1,16.4))
  self.assertTrue(any(e['estudio']=='sw-demoscopia-2026-11-10' for e in rejected))

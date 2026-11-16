import unittest
from datetime import date
from modelo.motor import fuentes as F
class Incorporacion14Nov(unittest.TestCase):
 def test_solo_candidaturas_comparables_del_nuevo_40db(self):
  e=next(e for e in F.cargar_verificadas() if e['estudio']=='40db-2026-11-13-tracking-dia01')
  self.assertEqual(set(e['voto']),{'PP','PSOE','VOX','SALF'});self.assertEqual(e['n'],1000);self.assertEqual(e['campo_fin'],date(2026,11,12))
 def test_tracking_sigma_conserva_solo_ultima_entrega_solapada(self):
  accepted,rejected=F.seleccion_pronostico(F.todas());ids={e['estudio'] for e in accepted};self.assertIn('sigma-dos-2026-11-13-tracking',ids);self.assertNotIn('sigma-dos-2026-11-12-tracking',ids)
  self.assertTrue(any(e['estudio']=='sigma-dos-2026-11-12-tracking' and 'posterior' in e['motivo'] for e in rejected))

 def test_tracking_40db_posterior_sustituye_oleadas_solapadas(self):
  accepted,rejected=F.seleccion_pronostico(F.todas())
  ids={e['estudio'] for e in accepted}
  self.assertIn('40db-2026-11-15-tracking-dia03',ids)
  for old in ['40db-2026-11-13-tracking-dia01','40db-2026-11-14-tracking-dia02']:
   self.assertNotIn(old,ids)
   self.assertTrue(any(e['estudio']==old for e in rejected))
  e=next(e for e in accepted if e['estudio']=='40db-2026-11-15-tracking-dia03')
  self.assertEqual(set(e['voto']),{'PP','PSOE','VOX','SALF'})
  self.assertEqual(e['n'],2000)

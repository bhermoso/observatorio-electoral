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
  accepted,rejected=F.seleccion_pronostico([e for e in F.todas() if e.get('publicacion') and e['publicacion']<=date(2026,11,15)])
  ids={e['estudio'] for e in accepted}
  self.assertIn('40db-2026-11-15-tracking-dia03',ids)
  for old in ['40db-2026-11-13-tracking-dia01','40db-2026-11-14-tracking-dia02']:
   self.assertNotIn(old,ids)
   self.assertTrue(any(e['estudio']==old for e in rejected))
  e=next(e for e in accepted if e['estudio']=='40db-2026-11-15-tracking-dia03')
  self.assertEqual(set(e['voto']),{'PP','PSOE','VOX','SALF'})
  self.assertEqual(e['n'],2000)

 def test_tracking_dia4_no_suma_muestras_anteriores(self):
  accepted,rejected=F.seleccion_pronostico([e for e in F.todas() if e.get('publicacion') and e['publicacion']<=date(2026,11,16)])
  rows=[e for e in accepted if e['estudio'].startswith('40db-2026-11-') and 'tracking' in e['estudio']]
  self.assertEqual([e['estudio'] for e in rows],['40db-2026-11-16-tracking-dia04'])
  self.assertEqual(rows[0]['n'],2500)
  self.assertEqual(rows[0]['voto']['PSOE'],30.3)

 def test_tracking_dia5_conserva_nuevo_campo_y_muestra(self):
  accepted,rejected=F.seleccion_pronostico([e for e in F.todas() if e.get('publicacion') and e['publicacion']<=date(2026,11,17)])
  rows=[e for e in accepted if e['estudio'].startswith('40db-2026-11-') and 'tracking' in e['estudio']]
  self.assertEqual([e['estudio'] for e in rows],['40db-2026-11-17-tracking-dia05'])
  e=rows[0]
  self.assertEqual(e['n'],2000)
  self.assertEqual((e['campo_ini'],e['campo_fin']),(date(2026,11,12),date(2026,11,16)))
  self.assertEqual(set(e['voto']),{'PP','PSOE','VOX','SALF'})
  self.assertEqual(e['voto']['PSOE'],30.6)

 def test_tracking_dia7_sustituye_campos_solapados(self):
  accepted,rejected=F.seleccion_pronostico([e for e in F.todas() if e.get('publicacion') and e['publicacion']<=date(2026,11,19)])
  rows=[e for e in accepted if e['estudio'].startswith('40db-2026-11-') and 'tracking' in e['estudio']]
  latest=next(e for e in rows if e['estudio']=='40db-2026-11-19-tracking-dia07')
  self.assertEqual((latest['n'],latest['campo_ini'],latest['campo_fin']),(2000,date(2026,11,14),date(2026,11,18)))
  self.assertTrue(all(e is latest or e['campo_fin'] < latest['campo_ini'] for e in rows))
  self.assertTrue(any(e['estudio']=='40db-2026-11-18-tracking-dia06' for e in rejected))

 def test_tracking_dia8_excluye_oleadas_solapadas(self):
  accepted,rejected=F.seleccion_pronostico([e for e in F.todas() if e.get('publicacion') and e['publicacion']<=date(2026,11,20)])
  rows=[e for e in accepted if e['estudio'].startswith('40db-2026-11-') and 'tracking' in e['estudio']]
  latest=next(e for e in rows if e['estudio']=='40db-2026-11-20-tracking-dia08')
  self.assertEqual((latest['n'],latest['campo_ini'],latest['campo_fin']),(2000,date(2026,11,15),date(2026,11,19)))
  self.assertEqual((latest['voto']['PP'],latest['voto']['PSOE'],latest['voto']['VOX']),(32.2,30.2,17.6))
  self.assertTrue(all(e is latest or e['campo_fin'] < latest['campo_ini'] for e in rows))
  self.assertTrue(any(e['estudio']=='40db-2026-11-19-tracking-dia07' for e in rejected))

from datetime import date
import unittest
from modelo.motor import fuentes as F
class TestCis3584(unittest.TestCase):
    def test_candidaturas_desglosadas_no_se_reasignan(self):
        e=next(e for e in F.cargar_verificadas() if e['estudio']=='cis-3584')
        self.assertEqual(e['n'],45074)
        self.assertEqual(e['publicacion'],date(2026,11,12))
        self.assertEqual(e['voto'],{'PSOE':33.3,'PP':25.5,'VOX':18.4,'BILDU':1.8,'JUNTS':1.2,'BNG':1.,'PNV':.7,'SALF':1.4})
        self.assertFalse(F.publicada_antes(e,date(2026,11,11),estricta=True))
        self.assertTrue(F.publicada_antes(e,date(2026,11,12),estricta=True))
if __name__=='__main__':unittest.main()

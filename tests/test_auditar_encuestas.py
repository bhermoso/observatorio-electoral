import unittest
from scripts.auditar_encuestas import assess,audit

def poll(id='p1',**overrides):
    record=dict(id=id,institute='Instituto',publisher='Medio',title='Sondeo',
        fieldStart='2026-10-01',fieldEnd='2026-10-03',published='2026-10-05',
        verified='2026-10-06',sample=1000,scope='España',
        universe='Adultos con derecho a voto',scenario='Partidos separados',
        denominator='votos válidos',source='https://example.org/sondeo',
        technical='https://example.org/ficha',verification='Fuente primaria',
        sourcePages='página 1',kind='poll-estimate',values={'PP':30.0})
    record.update(overrides)
    return record

class TestAudit(unittest.TestCase):
    def test_registro_completo(self):
        self.assertEqual(assess([poll()]),[])
    def test_muestra_repetida(self):
        self.assertTrue(any('misma muestra' in err for err in assess([poll(),poll('p2')])))
    def test_rechaza_valores_y_fuentes_invalidos(self):
        errors=assess([poll(values={'PP':125},source='http://example.org')])
        self.assertTrue(any('porcentaje inválido' in e for e in errors))
        self.assertTrue(any('debe ser https' in e for e in errors))
    def test_delta_y_bloqueo(self):
        ok=audit([poll()],[poll(),poll('p2',fieldStart='2026-10-07',fieldEnd='2026-10-09',published='2026-10-11',verified='2026-10-12')])
        self.assertEqual(len(ok['added']),1)
        self.assertTrue(ok['recalculate_model'])
        bad=audit([poll()],[poll('p2')])
        self.assertFalse(bad['recalculate_model'])

if __name__=='__main__':unittest.main()

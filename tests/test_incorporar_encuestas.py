import unittest
from scripts.incorporar_encuestas import integrate

def sample(id='a',fieldStart='2026-10-01',fieldEnd='2026-10-02',**changes):
    item=dict(id=id,institute='Ejemplo',publisher='Diario',title='Encuesta',
    fieldStart=fieldStart,fieldEnd=fieldEnd,published='2026-10-03',verified='2026-10-04',
    sample=1000,scope='España',universe='Mayores',scenario='Separados',denominator='votos válidos',
    source='https://example.org/original',technical='https://example.org/ficha',
    verification='Revisada',sourcePages='p. 1',kind='poll-estimate',values={'PP':30})\n    item.update(changes)\n    return item

class TestIncorporacion(unittest.TestCase):
    def test_incorpora_y_no_duplica(self):
        new,added,skipped=integrate([], [sample()])
        self.assertEqual((len(new),added,skipped),(1,['a'],[]))
        twice,added,skipped=integrate(new,[sample()])
        self.assertEqual((len(twice),added,skipped),(1,[],['a']))
    def test_rechaza_muestra_repetida(self):
        with self.assertRaisesRegex(ValueError,'misma muestra'):
            integrate([sample()],[sample('b')])
    def test_no_sobrescribe_publicado(self):
        with self.assertRaisesRegex(ValueError,'requiere PR editorial'):
            integrate([sample()],[sample(values={'PP':40})])
    def test_rechaza_datos_incompletos(self):
        with self.assertRaisesRegex(ValueError,'faltan'):
            integrate([],[sample(verification='')])

if __name__=='__main__':unittest.main()

import unittest
from datetime import date
from modelo.motor.registro import _firma

class FirmaHistorialTest(unittest.TestCase):
    def test_correcciones_de_muestra_campo_y_calibracion_invalidan_cache(self):
        e=dict(estudio='sintetica',casa='X',voto={'PP':30},n=1000,campo_fin=date(2026,10,20))
        signature=lambda item,**kw:_firma([item],date(2026,11,3),500,2.2,**kw)
        original=signature(e)
        self.assertNotEqual(signature(dict(e,n=2000)),original)
        self.assertNotEqual(signature(dict(e,campo_fin=date(2026,10,21))),original)
        self.assertNotEqual(signature(e,errores_23j={'X':{'error':{'PP':2}}}),original)
        self.assertEqual(signature(dict(e)),original)

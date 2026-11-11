import tempfile,json,unittest
from pathlib import Path
from unittest.mock import patch
from scripts.actualizar_servicio import ejecutar
class TestCompatibilidadInforme(unittest.TestCase):
 def test_resumen_no_inventa_busqueda_y_conserva_errores(self):
  expected={'ok':False,'checked_at':'ANTERIOR','cached':True,'errors':['HTTP 503']}
  with tempfile.TemporaryDirectory() as d:
   with patch('scripts.actualizar_servicio.refresh',return_value=expected):r=ejecutar(d)
   self.assertEqual(json.loads(Path(d,'servicio.json').read_text()),expected);self.assertFalse(r['ok'])

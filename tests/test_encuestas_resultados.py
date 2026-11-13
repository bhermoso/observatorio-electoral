import importlib.util
import json
from pathlib import Path
import unittest
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('exportar_historico',ROOT/'scripts/generar_encuestas_resultados.py');M=importlib.util.module_from_spec(spec);spec.loader.exec_module(M)
class TestEncuestasResultados(unittest.TestCase):
 def test_reproduccion_del_archivo(self):
  self.assertEqual(M.generar(),json.loads((ROOT/'data/historico/encuestas-resultados.json').read_text()))
 def test_no_imputa_fechas_ni_muestras(self):
  e=dict(estudio='ejemplo',casa='CIS',campo_ini='2023-07-01',campo_fin='2023-07-02',publicacion='2023-07-03',voto={'PP':0},n=1000,n_supuesto=True)
  row=M.normalizar(e,'2023-07-23');self.assertIsNone(row['n']);self.assertEqual(row['voto']['PP'],0)
  self.assertIsNone(M.normalizar(dict(e,publicacion='2023-02-30'),'2023-07-23'))
  self.assertIsNone(M.normalizar(dict(e,publicacion=None),'2023-07-23'))
  self.assertIsNone(M.normalizar(dict(e,publicacion='2023-07-23'),'2023-07-23'))
  self.assertIsNone(M.normalizar(dict(e,campo_supuesto=True),'2023-07-23'))
  self.assertIsNone(M.normalizar(dict(e,publicacion='2023-06-30'),'2023-07-23'))

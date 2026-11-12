import gzip
import hashlib
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('importador_historico',ROOT/'scripts/importar_historico_multieleccion.py');I=importlib.util.module_from_spec(spec);spec.loader.exec_module(I)
class TestFuentesHistoricas(unittest.TestCase):
 def test_tablas_congeladas_reproducen_todas_las_filas_admitidas(self):
  d=json.loads((ROOT/'data/historico/multieleccion.json').read_text())
  for source in d['fuentes']:
   p=ROOT/source['archivo_conservado'];self.assertEqual(hashlib.sha256(p.read_bytes()).hexdigest(),source['sha256_conservado'])
  with tempfile.TemporaryDirectory() as td:
   for key,meta in I.CICLOS.items():
    p=Path(td)/(key+'.html');p.write_bytes(gzip.decompress((ROOT/'data/historico/fuentes'/(key+'.html.gz')).read_bytes()))
    rows,excluded=I.parse_page(p,key)
    expected=[e for e in d['encuestas'] if e['eleccion']==meta[0]]
    self.assertEqual(rows,expected,key)
    ledger=next(x for x in d['ledger'] if x['eleccion']==meta[0]);self.assertEqual(excluded,ledger['excluidas'])
if __name__=='__main__':unittest.main()

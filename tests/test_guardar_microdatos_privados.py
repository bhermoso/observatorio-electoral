import hashlib,tempfile,unittest
from pathlib import Path
from unittest.mock import patch
from scripts import guardar_microdatos_privados as m
class TestCustodiaPrivada(unittest.TestCase):
 def fixture(self,d):
  payload=b'contenido privado de prueba';Path(d,'estudio.zip').write_bytes(payload)
  return [{'study_id':'estudio','sha256':hashlib.sha256(payload).hexdigest(),'bytes':len(payload)}]
 def test_certifica_bytes_recuperados_sin_publicarlos(self):
  with tempfile.TemporaryDirectory() as d:
   approved=self.fixture(d)
   with patch.object(m,'APPROVED',approved):r=m.certify(d,'a'*40)
   self.assertEqual(r['provider'],'github_private');self.assertEqual(len(r['stored']),1)
   self.assertNotIn('contenido privado',str(r));self.assertNotIn('archivo',r['stored'][0])
 def test_rechaza_original_alterado_y_commit_incompleto(self):
  with tempfile.TemporaryDirectory() as d:
   approved=self.fixture(d);Path(d,'estudio.zip').write_bytes(b'alterado')
   with patch.object(m,'APPROVED',approved):
    with self.assertRaises(ValueError):m.certify(d,'a'*40)
    with self.assertRaises(ValueError):m.certify(d,'abc')
 def test_rechaza_enlace_simbolico(self):
  with tempfile.TemporaryDirectory() as d:
   approved=self.fixture(d);Path(d,'real.zip').write_bytes(Path(d,'estudio.zip').read_bytes());Path(d,'estudio.zip').unlink();Path(d,'estudio.zip').symlink_to(Path(d,'real.zip'))
   with patch.object(m,'APPROVED',approved):
    with self.assertRaises(ValueError):m.certify(d,'a'*40)

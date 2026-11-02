"""Pruebas con ZIP sintéticos sin introducir entrevistas ni material restringido."""
import hashlib
import io
import tempfile
import unittest
import zipfile
from pathlib import Path
from scripts.preparar_validacion_2019 import inspect,headers

class TestCIS2019Preflight(unittest.TestCase):
 def test_csv_y_nested_zip(self):
  with tempfile.TemporaryDirectory() as tmp:
   path=Path(tmp)/"MD3242.zip"
   columns=["PESO","INTENCIONGR","VOTOSIMG","RECUVOTOGR","PROBVOTO"]+["VAR"+str(i) for i in range(12)]
   text=";".join(columns)+"\n"+";".join(["1"]*len(columns))+"\n"
   inner=io.BytesIO()
   with zipfile.ZipFile(inner,"w") as zipped:zipped.writestr("3242_num.csv",text)
   with zipfile.ZipFile(path,"w") as zipped:
    zipped.writestr("datos.zip",inner.getvalue())
    zipped.writestr("codigo3242.pdf",b"%PDF-1.5")
    zipped.writestr("datos.sav",b"synthetic")
   report=inspect("3242",path)
   self.assertEqual(report["status"],"VARIABLE_REVIEW_REQUIRED")
   self.assertFalse(report["allowed_as_independent_test"])
   self.assertEqual(report["election"],"2019-04-28")
   self.assertEqual(report["sha256"],hashlib.sha256(path.read_bytes()).hexdigest())
   self.assertEqual(report["detected_formats"]["spss_sav"],1)
   self.assertEqual(report["detected_formats"]["csv"],1)
   self.assertEqual(report["csv_candidates"][0]["possible_variables"]["peso"],["PESO"])
   self.assertNotIn("1;1;1",str(report))
 def test_solo_sav_no_se_considera_ausencia_de_datos(self):
  with tempfile.TemporaryDirectory() as tmp:
   path=Path(tmp)/"MD3263.zip"
   with zipfile.ZipFile(path,"w") as z:z.writestr("3263.sav",b"test")
   report=inspect("3263",path)
   self.assertEqual(report["detected_formats"]["spss_sav"],1)
   self.assertEqual(report["csv_candidates"],[])
   self.assertEqual(report["status"],"VARIABLE_REVIEW_REQUIRED")
 def test_codificaciones(self):
  self.assertIsNotNone(headers(b"PESO;INTENCIONGR;VOTOSIMG;RECUVOTOGR;PROBVOTO;VAR1;VAR2;VAR3;VAR4;VAR5\n"))
  self.assertRaises(ValueError,inspect,"3411","fake.zip")

if __name__=="__main__":unittest.main()

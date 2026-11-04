import csv
import tempfile
import unittest
from pathlib import Path
from modelo.motor.geografia_publica import validar_perfil, estado_geografico

class TestGeografiaPublica(unittest.TestCase):
    def rows(self, extras=None):
        rows=[
          dict(eleccion="2024-06-09", provincia=pr, partido=p, votos=str(v), validos="1000",
               fuente="https://descargas.interior.gob.es/datasets/resultados_electorales/Elecciones-al-Parlamento-Europeo.xlsx")
          for pr in ("A","B") for p,v in (("PP",400),("PSOE",300))]
        return extras if extras is not None else rows

    def check(self, rows):
        with tempfile.TemporaryDirectory() as d:
            p=Path(d)/"datos.csv"
            with p.open("w",encoding="utf-8",newline="") as f:
                w=csv.DictWriter(f,fieldnames=list(self.rows()[0]));w.writeheader();w.writerows(rows)
            return validar_perfil(p,["A","B"])
    def test_fuente_y_denominador_solo_con_datos_completos(self):
        x=self.check(self.rows())
        self.assertEqual(x["PP"]["A"],0.4)
        self.assertEqual(x["PSOE"]["B"],0.3)
    def test_no_imputa_provincias_ni_suma_candidaturas(self):
        with self.assertRaisesRegex(ValueError,"incompleto"):
            self.check(self.rows()[:-1])
        with self.assertRaisesRegex(ValueError,"Duplicado"):
            self.check(self.rows()+[self.rows()[0]])
        r=self.rows();r[0]["validos"]="1200"
        with self.assertRaisesRegex(ValueError,"Denominador"):
            self.check(r)
    def test_nunca_activa_geografia_sin_validacion(self):
        x=estado_geografico(False)
        self.assertFalse(x["geografia_2024_aplicada_al_pronostico"])
        self.assertFalse(x["geografia_2024_importada"])

import json
import unittest
from pathlib import Path
from scripts.analizar_contribuciones import calculate

class ContribucionesTest(unittest.TestCase):
    def test_resultado_versionado_coincide_con_calculo(self):
        original=json.loads(Path("data/microdatos/validacion_23j.json").read_text(encoding="utf-8"))
        stored=json.loads(Path("data/microdatos/contribuciones_cocina_23j.json").read_text(encoding="utf-8"))
        computed=calculate(original)
        self.assertEqual(stored,computed)
    def test_no_hay_ablacion_causal_inventada(self):
        source=json.loads(Path("data/microdatos/validacion_23j.json").read_text(encoding="utf-8"))
        result=calculate(source)
        self.assertTrue(all(c["identificacion_causal"] is False for c in result["comparaciones"]))
        self.assertIn("2019",result["ausencias"]["recuerdo"])
        self.assertIn("escaños",result["ausencias"]["escanos"])

if __name__=="__main__": unittest.main()

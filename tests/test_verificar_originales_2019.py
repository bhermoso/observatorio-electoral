"""Pruebas del verificador de originales CIS 2019 sin ficheros individuales."""
import importlib.util
import pathlib
import tempfile
import unittest
import zipfile

ROOT = pathlib.Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("verificar_originales_2019", ROOT / "scripts/verificar_originales_2019.py")
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class VerificarOriginales2019(unittest.TestCase):
    def test_columnas_documentadas_y_codigos_distintos(self):
        self.assertEqual(MODULE._column_positions("P9R 252-253\nPESO 271-277\n", "PESO"), (270, 277))
        self.assertEqual(MODULE._column_positions("P9R 252-253\n", "P9R"), (251, 253))
        self.assertEqual(MODULE._category("94"), "INDECISION")
        self.assertEqual(MODULE._category("98"), "NO_SABE")
        self.assertEqual(MODULE._category("99"), "NO_CONTESTA")
        self.assertEqual(MODULE._category("21"), "UNIDAS_PODEMOS")
        self.assertNotEqual(MODULE._category("94"), MODULE._category("98"))
        with self.assertRaises(ValueError):
            MODULE._column_positions("P9 1-3", "P9R")

    def test_zip_sin_sha_correcta_se_rechaza_antes_de_leer_datos(self):
        with tempfile.TemporaryDirectory() as root:
            path = pathlib.Path(root) / "MD3242.zip"
            with zipfile.ZipFile(path, "w") as z:
                z.writestr("ES3242", "P10R 1-2\nPESO 3-9")
                z.writestr("DA3242", "000000001\n")
            with self.assertRaisesRegex(ValueError, "SHA-256"):
                MODULE._read_original("3242", path, "0" * 64)

    def test_falta_original_no_equivale_a_validacion(self):
        with tempfile.TemporaryDirectory() as root:
            with self.assertRaises(FileNotFoundError):
                MODULE._read_original("3263", pathlib.Path(root) / "MD3263.zip", "0" * 64)

    def test_no_hay_publicacion_individual_en_salidas(self):
        import inspect
        source = inspect.getsource(MODULE.verify)
        self.assertIn('"apto_recuerdo":False', source)
        self.assertIn("celdas_de_cruce_no_publicadas", source)
        self.assertNotIn("return rows", source)


if __name__ == "__main__":
    unittest.main()

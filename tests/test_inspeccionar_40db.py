"""Pruebas sin microdatos reales: solo ZIP sintéticos y metadatos."""
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
import zipfile

SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "inspeccionar_40db.py"
spec = importlib.util.spec_from_file_location("inspeccionar_40db", SCRIPT)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)


class Auditar40dbTest(unittest.TestCase):
    def test_metadatos_sin_respuestas_individuales(self):
        with tempfile.TemporaryDirectory() as carpeta:
            archivo = Path(carpeta) / "encuesta.zip"
            with zipfile.ZipFile(archivo, "w") as zf:
                zf.writestr("matrices/base.sav", b"RESPUESTA_PERSONAL_FICTICIA")
                zf.writestr("documentos/cuestionario.pdf", b"PDF FICTICIO")
            resultado = mod.auditar("40db-2026-10-flash", archivo)
            serializado = json.dumps(resultado)
            self.assertEqual(resultado["n_archivos"], 2)
            self.assertEqual(resultado["formatos"], {".pdf": 1, ".sav": 1})
            self.assertEqual(resultado["estado"], "zip_local_metadatos_auditados_no_homologado")
            self.assertTrue(resultado["no_utilizar_para_pronostico"])
            self.assertFalse(resultado["contenido_leido"])
            self.assertFalse(resultado["respuestas_publicadas"])
            self.assertNotIn("RESPUESTA_PERSONAL_FICTICIA", serializado)
            self.assertEqual(len(resultado["sha256_zip"]), 64)

    def test_rechaza_rutas_peligrosas(self):
        with tempfile.TemporaryDirectory() as carpeta:
            archivo = Path(carpeta) / "malo.zip"
            with zipfile.ZipFile(archivo, "w") as zf:
                zf.writestr("../entrevistas.csv", "a,b\n1,2\n")
            with self.assertRaisesRegex(ValueError, "no segura"):
                mod.resumen_zip(archivo)

    def test_rechaza_estudios_no_registrados(self):
        with tempfile.TemporaryDirectory() as carpeta:
            archivo = Path(carpeta) / "prueba.zip"
            with zipfile.ZipFile(archivo, "w") as zf:
                zf.writestr("datos.csv", "columna\n")
            with self.assertRaisesRegex(ValueError, "desconocido"):
                mod.auditar("fuente-inventada", archivo)

    def test_rechaza_fichero_que_no_es_zip(self):
        with tempfile.TemporaryDirectory() as carpeta:
            archivo = Path(carpeta) / "falso.zip"
            archivo.write_text("no es zip", encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "no es un ZIP"):
                mod.resumen_zip(archivo)


if __name__ == "__main__":
    unittest.main()

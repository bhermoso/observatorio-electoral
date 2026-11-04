"""Pruebas sin red ni matrices de entrevistas para auditoría de GAD3/SocioMétrica."""
import importlib.util
import io
import json
import unittest
import zipfile
from pathlib import Path
from unittest.mock import patch

SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "auditar_fuentes_privadas.py"
SPEC = importlib.util.spec_from_file_location("auditar_fuentes_privadas", SCRIPT)
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


def mock_xlsx():
    stream = io.BytesIO()
    with zipfile.ZipFile(stream, "w") as z:
        z.writestr("[Content_Types].xml", "<Types/>")
        z.writestr("xl/worksheets/sheet1.xml",
                   '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
                   '<sheetData><row r="1"><c r="A1"><v>1</v></c>'
                   '<c r="D1"><v>2</v></c></row>'
                   '<row r="11"><c r="C11"><v>3</v></c></row></sheetData></worksheet>')
    return stream.getvalue()


class AuditoriaFuentesTest(unittest.TestCase):
    def test_xlsx_detecta_hojas_sin_extraer_respuestas(self):
        data = MODULE.inspect_xlsx(mock_xlsx())
        self.assertEqual(data["hay_hojas"], 1)
        self.assertEqual(data["hojas"][0]["filas_de_hoja_incluyendo_cabecera"], 11)
        self.assertEqual(data["hojas"][0]["columnas"], 4)
        self.assertEqual(data["hojas"][0]["celdas_referenciadas"], 3)

    def test_no_confundir_archivos_invalidos_con_microdatos(self):
        with self.assertRaises((ValueError, zipfile.BadZipFile)):
            MODULE.inspect_xlsx(b"Esto no es una base")
        with self.assertRaises(ValueError):
            MODULE.inspect_sav(b"Datos que no son SPSS")

    def test_descarga_error_no_publica_filas(self):
        with patch.object(MODULE, "get", side_effect=ValueError("descarga bloqueada")):
            result = MODULE.inspect_one(MODULE.ARCHIVOS[0])
        self.assertEqual(result["estado"], "descarga_o_lectura_fallida")
        self.assertNotIn("sha256", result)
        self.assertNotIn("entrevistas", result)
        self.assertNotIn("filas", result)
        self.assertEqual(len(MODULE.ARCHIVOS), 7)
        self.assertEqual({x["casa"] for x in MODULE.ARCHIVOS}, {"GAD3", "SocioMétrica"})


if __name__ == "__main__":
    unittest.main()

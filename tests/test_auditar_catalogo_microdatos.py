"""Regresión: una URL descubierta no equivale a entrevistas homologadas."""
import hashlib
import importlib.util
import io
import json
import tempfile
import unittest
import zipfile
from pathlib import Path
from unittest.mock import patch

SPEC = importlib.util.spec_from_file_location(
    "auditar_microdatos", Path(__file__).resolve().parents[1] / "scripts" / "auditar_microdatos_catalogo.py"
)
M = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(M)


def zip_csv(rows=120, cols=9):
    out = io.BytesIO()
    with zipfile.ZipFile(out, "w", compression=zipfile.ZIP_DEFLATED) as z:
        content = (";".join(["recuerdo_voto"] + ["variable" + str(i) for i in range(cols-1)]) + "\n")
        content += (";".join(["PP"]+["1"]*(cols-1)) + "\n") * rows
        z.writestr("datos/matriz.csv", content)
        z.writestr("informe.pdf", b"%PDF-1.4 fake report")
    return out.getvalue()


class TestAuditorMicrodatos(unittest.TestCase):
    def test_permite_solo_fuentes_publicas_aprobadas(self):
        good = "https://ep00.epimg.net/infografias/2026/09/microdatos.zip"
        self.assertEqual(M.validate_url(good), good)
        for bad in [
            "http://ep00.epimg.net/file.zip",
            "https://127.0.0.1/secreto.sav",
            "https://evil.example/internal.zip",
            "file:///etc/passwd",
            "https://www.gad3.com/portal.html",
            "https://user:pass@www.gad3.com/file.zip",
        ]:
            with self.subTest(url=bad), self.assertRaises(ValueError):
                M.validate_url(bad)

    def test_reconoce_zip_comprimido_sin_extraer_filas(self):
        data = zip_csv()
        info = M.inspect(data, ".zip")
        self.assertEqual(info["tipo"], "zip")
        self.assertEqual(info["ficheros_tabulares"], 1)
        self.assertEqual(info["matrices"][0]["tipo"], "csv")
        self.assertEqual(info["matrices"][0]["columnas"], 9)
        self.assertEqual(M.classify(info), "matriz_detectada_pendiente_homologacion")
        self.assertNotIn("PP", json.dumps(info))  # ninguna respuesta individual

    def test_detecta_html_y_zip_no_valido(self):
        for body, suffix in [(b"<html>Access denied", ".sav"), (b"nada", ".zip")]:
            with self.assertRaises(ValueError):
                M.inspect(body, suffix)

    def test_registro_no_guarda_entrevistas_ni_descarga_fallida_como_auditada(self):
        study = {"id": "40db-prueba", "productor": "40db", "fecha": "2026-11-01",
                 "archivo": "https://ep00.epimg.net/descarga.zip"}
        with patch.object(M, "fetch_bytes", return_value=zip_csv()):
            res = M.audit(study)
        self.assertEqual(res["estado"], "matriz_detectada_pendiente_homologacion")
        self.assertEqual(res["sha256"], hashlib.sha256(zip_csv()).hexdigest())
        self.assertNotIn("respuestas", res)
        with patch.object(M, "fetch_bytes", side_effect=TimeoutError("sin respuesta")):
            fail = M.audit(study)
        self.assertEqual(fail["estado"], "descarga_fallida")
        self.assertNotIn("sha256", fail)

    def test_fecha_se_conserva_si_no_cambian_estados(self):
        row = {"id": "x", "estado": "descarga_fallida", "productor": "40db",
               "fecha": "2026-10-01", "url": "https://ep00.epimg.net/file.zip", "es_pronostico": False}
        old = dict(row, verificado_en="2026-11-04T00:00:00+00:00")
        prior = {"archivos": [old, {"id": "anterior", "estado": "descarga_fallida",
                                     "verificado_en": "2026-11-03T00:00:00+00:00"}]}
        new = M.build(prior, [dict(row)], "2026-11-05T00:00:00+00:00")
        self.assertEqual(new["archivos"][-1]["verificado_en"], old["verificado_en"])
        self.assertEqual(len(new["archivos"]), 2)
        self.assertNotIn("filas_individuales", json.dumps(new))

    def test_prioridad_de_nuevas_descargas_nacionales(self):
        url="https://moreincommon.es/data/microdatos-2026-10.zip"
        catalog={"estudios":[
            {"id":"actual","productor":"more-in-common","archivo":url,"estado":"enlace_documentado",
             "fecha":"2026-10-01","ambito":"España"},
            {"id":"antigua","productor":"40db","archivo":"https://ep00.epimg.net/2019/data.zip",
             "fecha":"2019-01-01","estado":"enlace_documentado","ambito":"España"}]}
        self.assertEqual([x["id"] for x in M.candidates(catalog,10)],["actual"])

    def test_hallazgos_reales_solo_archivos_de_hosts_aprobados(self):
        catalog={"estudios":[]}
        payload={"checked_at":"2026-11-05T06:00:00Z","candidates":[
            {"tipo":"enlace_a_archivo","fuente":"40db","url":"https://ep00.epimg.net/2026/11/a.zip"},
            {"tipo":"noticia_sobre_microdatos","fuente":"40db","url":"https://news.google.com/r"},
            {"tipo":"enlace_a_archivo","fuente":"gad3","url":"https://localhost/admin.xlsx"},
            {"tipo":"enlace_a_archivo","fuente":"unknown","url":"https://ep00.epimg.net/a.zip"}]}
        class Dummy:
            def __enter__(self): return self
            def __exit__(self,*a): pass
            def read(self,n): return json.dumps(payload).encode()
        # Uso de fecha fija en el test: sustituir clase datetime por mock temporal.
        from datetime import datetime, timezone
        original = M.datetime
        class FixedDatetime:
            @staticmethod
            def now(tz=None): return datetime(2026, 11, 5, 8, 0, tzinfo=timezone.utc)
            @staticmethod
            def fromisoformat(x): return datetime.fromisoformat(x)
        with patch.object(M.urllib.request,"urlopen",return_value=Dummy()), patch.object(M,"datetime",FixedDatetime):
            rows=M.read_discoveries(catalog)
        self.assertEqual(len(rows),1)
        self.assertTrue(rows[0]["id"].startswith("hallazgo-"))
        self.assertEqual(rows[0]["productor"],"40db")

if __name__ == "__main__":
    unittest.main()

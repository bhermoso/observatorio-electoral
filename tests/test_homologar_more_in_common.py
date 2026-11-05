"""Contrato del reconocimiento semántico: ni filas, ni códigos inventados."""
import importlib.util
import io
import json
import os
import sys
import types
import unittest
import zipfile
from pathlib import Path
from unittest.mock import patch

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/"scripts"))
spec=importlib.util.spec_from_file_location("mic_homol",ROOT/"scripts"/"homologar_more_in_common.py")
M=importlib.util.module_from_spec(spec)
spec.loader.exec_module(M)


def makezip():
    buf=io.BytesIO()
    with zipfile.ZipFile(buf,'w',compression=zipfile.ZIP_DEFLATED) as zip:
        zip.writestr("respuestas.sav",b"FAKE_SAV_BYTES_NEVER_TO_EXPORT")
        zip.writestr("codebook.pdf",b"PUBLIC_DOCUMENT")
    return buf.getvalue()


class TestHomologacion(unittest.TestCase):
    def setUp(self):
        self.zip=makezip()
        import hashlib
        self.fake_id="more-in-common-2026-10-01"
        self.original=M.ALLOWED
        M.ALLOWED={self.fake_id:(hashlib.sha256(self.zip).hexdigest(),len(self.zip))}

    def tearDown(self):
        M.ALLOWED=self.original

    def test_originales_no_certificados_se_rechazan(self):
        self.assertEqual(M.check_archive(self.zip,self.fake_id),M.ALLOWED[self.fake_id][0])
        with self.assertRaises(ValueError):
            M.check_archive(self.zip+b"x",self.fake_id)

    def test_roles_no_imputan_codigos(self):
        self.assertEqual(M.select_role("intencion_voto_raw"),"intencion_declarada_bruta")
        self.assertEqual(M.select_role("voto_2023_final"),"recuerdo_voto_transformado")
        self.assertEqual(M.select_role("prob_voto_pp"),"probabilidad_voto_por_partido")
        self.assertEqual(M.select_role("peso_nacional"),"ponderacion_candidata_sin_validar")
        self.assertIsNone(M.select_role("intencion_voto_raw_otros"))
        self.assertIsNone(M.select_role("email"))
        self.assertIsNone(M.select_role("identificador_personal"))

    def test_metadataonly_y_vocabulario_real_sin_entrevistas(self):
        calls=[]
        def read_sav(path,metadataonly,**kwargs):
            calls.append((metadataonly,kwargs.get('output_format')))
            meta=types.SimpleNamespace(
                column_names=["intencion_voto_raw","intencion_voto_final","prob_voto_pp","comentarios_abiertos","peso"],
                column_labels=["Intención declarada", "Variable final", "Probabilidad", "Texto", "Factor"],
                number_rows=2201, number_columns=5,
                variable_value_labels={
                    "intencion_voto_raw":{1:"Partido X",2:"Partido Y",98:"No sabe"},
                    "intencion_voto_final":{1:"Partido X",2:"Partido Y"},
                }
            )
            return None,meta
        with patch.dict(sys.modules,{"pyreadstat":types.SimpleNamespace(read_sav=read_sav)}):
            result=M.examine_zip(self.zip,self.fake_id)
        self.assertEqual(calls,[(True,'dict')])
        self.assertEqual(result["matrices"][0]["filas"],2201)
        relevant=result["matrices"][0]["variables_relevantes"]
        self.assertEqual(len(relevant),4)
        self.assertFalse(any(v["nombre"]=="comentarios_abiertos" for v in relevant))
        direct=next(x for x in relevant if x["nombre"]=="intencion_voto_raw")
        self.assertEqual(len(direct["categorias_documentadas"]),3)
        self.assertEqual(direct["funcion_provisional"],"intencion_declarada_bruta")
        self.assertFalse(any(v["uso_en_motor"] for v in relevant))
        self.assertEqual(result["documentos"],["codebook.pdf"])
        self.assertFalse(result["entra_en_motor_29n"])
        self.assertNotIn("FAKE_SAV_BYTES",json.dumps(result))

    def test_no_se_homologa_automaticamente_por_coincidencia_de_campos(self):
        rows=[{"id":"A","matrices":[{"variables_relevantes":[{"funcion_provisional":"simpatia"},{"funcion_provisional":"intencion_declarada_bruta"}]}]},
              {"id":"B","matrices":[{"variables_relevantes":[{"funcion_provisional":"simpatia"},{"funcion_provisional":"recuerdo_voto_bruto"}]}]}]
        x=M.build(rows)
        self.assertEqual(x["comparabilidad_provisional"]["roles_presentes_en_todos"],["simpatia"])
        self.assertFalse(x["motor_29n_modificado"])
        self.assertTrue(any("final" in t for t in x["limites"]))


if __name__=="__main__":
    unittest.main()

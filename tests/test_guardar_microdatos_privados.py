import importlib.util
import io
import json
import os
import unittest
import urllib.request
from pathlib import Path
from unittest.mock import patch

PATH=Path(__file__).resolve().parents[1]/'scripts'/'guardar_microdatos_privados.py'
spec=importlib.util.spec_from_file_location('guarda_privada',PATH)
M=importlib.util.module_from_spec(spec)
spec.loader.exec_module(M)


class MockResponse:
    def __init__(self,data):
        self.data=io.BytesIO(json.dumps(data).encode('utf-8'))
    def __enter__(self):return self
    def __exit__(self,*args):pass
    def read(self,n=-1):return self.data.read(n)


class TestGuardarMicrodatos(unittest.TestCase):
    def test_whitelist_y_unico_endpoint_privado(self):
        self.assertEqual(len(M.APPROVED),4)
        self.assertTrue(all(s.startswith('more-in-common-2026-') for s in M.APPROVED))
        with self.assertRaises(ValueError):
            M.store('otro-estudio','token',opener=lambda *args,**kwargs:None)

    def test_sin_oidc_no_arranca(self):
        with self.assertRaises(ValueError):
            M.oidc_token({})

    def test_token_oidc_usa_audiencia_fija_y_no_la_imprime(self):
        called=[]
        def opener(req,timeout):
            called.append((req.full_url,req.get_header('Authorization')))
            return MockResponse({'value':'token-validado-en-github'})
        with patch.object(M.urllib.request,'urlopen',side_effect=opener):
            out=M.oidc_token({
                'ACTIONS_ID_TOKEN_REQUEST_URL':'https://token.actions.githubusercontent.com/request?abc=1',
                'ACTIONS_ID_TOKEN_REQUEST_TOKEN':'token-de-solicitud'
            })
        self.assertEqual(out,'token-validado-en-github')
        self.assertIn('audience=',called[0][0])
        self.assertIn('almacen-microdatos',called[0][0])
        self.assertIn('Bearer token-de-solicitud',called[0][1])

    def test_solo_exito_si_el_servidor_confirma_recuperacion_e_integridad(self):
        requests=[]
        def opener(req,timeout):
            requests.append(req)
            return MockResponse({
                'ok':True,'study_id':'more-in-common-2026-10-01',
                'original_conservado':True,'integridad_verificada':True,
                'sha256':'a'*64,'bytes':615299,'ya_existia':False
            })
        result=M.store('more-in-common-2026-10-01','token-oidc',opener=opener)
        self.assertEqual(result['bytes'],615299)
        self.assertEqual(requests[0].get_header('Authorization'),'Bearer token-oidc')
        self.assertEqual(json.loads(requests[0].data)['study_id'],'more-in-common-2026-10-01')
        self.assertEqual(requests[0].full_url,M.AUDIENCE+'?action=store')

    def test_no_da_por_guardado_un_enlace_o_un_resultado_no_certificado(self):
        def opener(req,timeout):
            return MockResponse({'ok':True,'original_conservado':True,'integridad_verificada':False})
        with self.assertRaises(RuntimeError):
            M.store('more-in-common-2026-10-01','token',opener=opener)


if __name__=='__main__':
    unittest.main()

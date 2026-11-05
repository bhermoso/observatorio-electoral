import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
from urllib.error import HTTPError, URLError

from scripts.actualizar_servicio import ejecutar
from scripts.estado_actualizacion import construir


class ServicioDegradadoTest(unittest.TestCase):
    def test_502_se_conserva_como_error_sin_inventar_fecha_de_busqueda(self):
        with tempfile.TemporaryDirectory() as d:
            with patch('scripts.actualizar_servicio.refresh',side_effect=HTTPError('https://example.org',502,'Gateway',{},None)):
                r=ejecutar(d)
            self.assertFalse(r['ok'])
            self.assertIsNone(r['checked_at'])
            self.assertIsNotNone(r['attempted_at'])
            self.assertEqual(json.loads(Path(d,'servicio.json').read_text(encoding='utf-8')),r)
            Path(d,'candidates.json').write_text(json.dumps({'checked_at':'RSS','results':[],'errors':[]}))
            Path(d,'actualizacion.json').write_text(json.dumps({'before':13,'after':13,'added':[]}))
            e=construir(d)
            self.assertEqual(e['registros_despues'],13)
            self.assertTrue(any('HTTP 502' in x for x in e['errores_busqueda']))
            self.assertFalse(any('incorporación no generó' in x for x in e['errores_busqueda']))

    def test_cache_no_se_presenta_como_busqueda_fresca(self):
        with patch('scripts.actualizar_servicio.refresh',return_value={'ok':True,'checked_at':'ANTERIOR','cached':True,'errors':[]}):
            r=ejecutar()
        self.assertEqual(r['checked_at'],'ANTERIOR')
        self.assertTrue(r['cached'])

    def test_error_de_red_tampoco_se_confunde_con_cero_candidatos(self):
        with patch('scripts.actualizar_servicio.refresh',side_effect=URLError('offline')):
            r=ejecutar()
        self.assertFalse(r['ok'])
        self.assertNotIn('candidates',r)

    def test_veda_es_suspension_prevista(self):
        with patch('scripts.actualizar_servicio.refresh',side_effect=HTTPError('https://example.org',451,'Veda',{},None)):
            r=ejecutar()
        self.assertTrue(r['ok'])
        self.assertTrue(r['veda'])

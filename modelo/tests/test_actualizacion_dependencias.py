import tempfile
import unittest
from datetime import date
from unittest.mock import patch
from modelo.motor import fuentes as F, registro as RG


def encuesta(id, ini, fin, pub, casa='Sigma Dos'):
    return dict(estudio=id, casa=casa, origen='verificada', ciclo='2023-26',
                campo_ini=date.fromisoformat(ini), campo_fin=date.fromisoformat(fin),
                publicacion=date.fromisoformat(pub), voto={'PP':30}, n=1000, modo='CAWI')


class ActualizacionDependenciasTest(unittest.TestCase):
    def test_no_duplica_entrevistas_de_dos_oleadas_verificadas(self):
        old=encuesta('old','2026-10-29','2026-10-30','2026-11-02')
        new=encuesta('new','2026-10-30','2026-11-06','2026-11-09')
        for records in ([old,new],[new,old]):
            included,excluded=F.seleccion_pronostico(records)
            self.assertEqual([e['estudio'] for e in included],['new'])
            self.assertEqual(excluded[0]['estudio'],'old')
            self.assertIn('new',excluded[0]['motivo'])

    def test_historial_no_retira_una_oleada_por_informacion_futura(self):
        old=encuesta('old','2026-10-29','2026-10-30','2026-11-02')
        new=encuesta('new','2026-10-30','2026-11-06','2026-11-09')
        other=encuesta('other','2026-10-29','2026-10-30','2026-11-02',casa='Otra')
        with tempfile.TemporaryDirectory() as dest, patch.object(RG,'DIR',dest), \
             patch.object(RG.PR,'principal',return_value={}) as calculate, \
             patch.object(RG,'_compacto',side_effect=lambda r,d,disp: {'fecha':str(d)}):
            RG.historial([old,new,other],date(2026,10,20),date(2026,11,8),date(2026,11,9),date(2026,11,29),{},n_por_variante=1)
        self.assertEqual({e['estudio'] for e in calculate.call_args_list[0].args[0]},{'old','other'})
        self.assertEqual({e['estudio'] for e in calculate.call_args_list[1].args[0]},{'new','other'})

    def test_cambios_en_dependencias_invalidan_cache_aun_sin_encuestas_nuevas(self):
        with patch.object(RG,'firma_dependencias',return_value='antes'):
            before=RG._firma([],date(2026,11,11),10,1.5)
        with patch.object(RG,'firma_dependencias',return_value='despues'):
            after=RG._firma([],date(2026,11,11),10,1.5)
        self.assertNotEqual(before,after)

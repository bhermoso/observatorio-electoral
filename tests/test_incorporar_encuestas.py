import unittest
import json,tempfile
from pathlib import Path
from scripts.incorporar_encuestas import integrate,integrate_each
from scripts.estado_actualizacion import construir

def sample(id='a',fieldStart='2026-10-01',fieldEnd='2026-10-02',**changes):
    item=dict(id=id,institute='Ejemplo',publisher='Diario',title='Encuesta',
    fieldStart=fieldStart,fieldEnd=fieldEnd,published='2026-10-03',verified='2026-10-04',
    sample=1000,scope='España',universe='Mayores',scenario='Separados',denominator='votos válidos',
    source='https://example.org/original',technical='https://example.org/ficha',
    verification='Revisada',sourcePages='p. 1',kind='poll-estimate',values={'PP':30})
    item.update(changes)
    return item

class TestIncorporacion(unittest.TestCase):
    def test_ficha_sin_id_no_rompe_el_informe_ni_la_siguiente_alta(self):
        updated,added,skipped,rejected=integrate_each([], [None, {}, sample()])
        self.assertEqual(added,['a'])
        self.assertEqual([r['id'] for r in rejected],['sin-id','sin-id'])
        self.assertTrue('; '.join(r['id']+': '+r['motivo'] for r in rejected))
    def test_incorpora_y_no_duplica(self):
        new,added,skipped=integrate([], [sample()])
        self.assertEqual((len(new),added,skipped),(1,['a'],[]))
        twice,added,skipped=integrate(new,[sample()])
        self.assertEqual((len(twice),added,skipped),(1,[],['a']))
    def test_rechaza_muestra_repetida(self):
        with self.assertRaisesRegex(ValueError,'misma muestra'):
            integrate([sample()],[sample('b')])
    def test_no_sobrescribe_publicado(self):
        with self.assertRaisesRegex(ValueError,'requiere PR editorial'):
            integrate([sample()],[sample(values={'PP':40})])
    def test_rechaza_datos_incompletos(self):
        with self.assertRaisesRegex(ValueError,'faltan'):
            integrate([],[sample(verification='')])

    def test_una_ficha_invalida_no_bloquea_las_demas(self):
        new,added,skipped,rejected=integrate_each([],[sample(verification=''),sample('b',fieldStart='2026-10-05',fieldEnd='2026-10-06',published='2026-10-07',verified='2026-10-08')])
        self.assertEqual(added,['b']);self.assertEqual(rejected[0]['id'],'a');self.assertIn('faltan',rejected[0]['motivo'])

class TestEstado(unittest.TestCase):
    def test_busqueda_fallida_no_se_presenta_como_cero_resultados(self):
        with tempfile.TemporaryDirectory() as d:
            Path(d,'actualizacion.json').write_text(json.dumps({'before':13,'after':13,'added':[]}))
            e=construir(d,ahora='T')
        self.assertIsNone(e['candidatos_detectados'])
        self.assertTrue(any('búsqueda no generó informe' in x for x in e['errores_busqueda']))
    def test_estado_resume_ejecucion_sin_inventar(self):
        with tempfile.TemporaryDirectory() as d:
            Path(d,'candidates.json').write_text(json.dumps({'checked_at':'2026-11-03T07:40:00+00:00','results':[{'title':'x'}],'errors':[{'source':'GAD3','detail':'timeout'}]}))
            Path(d,'actualizacion.json').write_text(json.dumps({'before':13,'after':14,'added':['n1'],'already_registered':[],'rejected':[],'candidates_approved':1}))
            e=construir(d,previo={},run_url='https://github.com/x',recalculo=True,ahora='T')
        self.assertEqual((e['registros_antes'],e['registros_despues'],e['incorporadas']),(13,14,['n1']))
        self.assertEqual(e['ultima_incorporacion_efectiva'],'T');self.assertEqual(e['ultimo_recalculo_lanzado'],'T')
        self.assertEqual(e['errores_busqueda'],['GAD3: timeout'])
    def test_sin_incorporacion_conserva_fecha_previa_y_registra_fallo(self):
        with tempfile.TemporaryDirectory() as d:
            e=construir(d,previo={'ultima_incorporacion_efectiva':'P'},ahora='T')
        self.assertEqual(e['ultima_incorporacion_efectiva'],'P');self.assertIsNone(e['registros_antes'])
        self.assertTrue(any('no generó informe' in x for x in e['errores_busqueda']))


class TestTrackingMotor(unittest.TestCase):
    def test_oleadas_verificadas_llegan_a_seleccion_y_solo_entra_ultima(self):
        from datetime import date
        from unittest.mock import patch
        from modelo.motor import fuentes as F
        anterior=dict(casa='SW Demoscopia',estudio='sw-demoscopia-2026-11-06',
                      campo_ini=date(2026,10,26),campo_fin=date(2026,11,5),
                      publicacion=date(2026,11,6),origen='verificada',
                      ciclo='2023-26',voto={'PP':28.3,'PSOE':31.0})
        reciente=dict(anterior,estudio='sw-demoscopia-2026-11-10',
                      campo_fin=date(2026,11,9),
                      publicacion=date(2026,11,10),voto={'PP':28.3,'PSOE':31.2})
        with patch.object(F,'cargar_verificadas',return_value=[anterior,reciente]):
            with patch.object(F,'cargar_23j_complementos',return_value=[]):
                with patch.object(F,'cargar_29n',return_value=[]):
                    with patch.object(F,'cargar_prensa',return_value=[]):
                        with patch.object(F,'cargar_wikipedia_2023',return_value=[]):
                            with patch.object(F,'cargar_wikipedia',return_value=[]):
                                loaded=F.todas()
        self.assertEqual(len(loaded),2, 'No perder una oleada antes de la puerta de calidad')
        selected,excluded=F.seleccion_pronostico(loaded)
        self.assertEqual([x['estudio'] for x in selected],['sw-demoscopia-2026-11-10'])
        self.assertEqual(len(excluded),1)
        self.assertIn('Sustituida',excluded[0]['motivo'])

if __name__=='__main__':unittest.main()

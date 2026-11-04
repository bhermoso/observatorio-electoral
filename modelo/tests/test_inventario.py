import unittest
from datetime import date
from modelo.motor.inventario import resumir
from modelo.motor import fuentes as F


class InventarioTest(unittest.TestCase):
    def test_particion_y_wikipedia_son_estudios_no_valores_de_partidos(self):
        enc = [dict(ciclo='2019-23', origen='terceros-wikipedia', campo_fin=date(2020,1,1), voto={'PP':30,'PSOE':28}),
               dict(ciclo='2019-23', origen='verificada', campo_fin=date(2023,7,1)),
               dict(ciclo='2023-26', origen='verificada', campo_fin=date(2026,10,1)),
               dict(ciclo='2023-26', origen='prensa-sin-verificar', campo_fin=date(2026,10,2))]
        r = resumir(enc)
        self.assertEqual((r['total'],r['historicas'],r['ciclo_actual'],r['wikipedia'],r['archivo_verificado']),(4,2,2,1,2))
        self.assertEqual(r['wikipedia_desde'],'2020-01-01')
        self.assertEqual(sum(r['por_origen'].values()),r['total'])

    def test_conjunto_real_coincide_con_admitidas_y_excluidas(self):
        enc = F.todas()
        admitidas, excluidas = F.seleccion_pronostico(enc)
        r = resumir(enc)
        self.assertEqual(r['ciclo_actual'],len(admitidas)+len(excluidas))
        self.assertEqual(r['total'],r['historicas']+r['ciclo_actual'])
        self.assertLessEqual(r['wikipedia'],r['historicas'])

    def test_sin_historico_no_inventa_fechas(self):
        self.assertIsNone(resumir([])['wikipedia_desde'])

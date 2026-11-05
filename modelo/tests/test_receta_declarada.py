import unittest
import numpy as np
from modelo.microdatos.receta_declarada import cocinar


class RecetaDeclaradaTest(unittest.TestCase):
    def test_ninguno_no_es_blanco_y_nc_no_se_imputa(self):
        r=cocinar([1,2,99,98,25],[99,99,23,1,1],[1,2,1,1,1],
                  [1]*5,[10]*5,validos=[1,2,23])
        self.assertEqual(r["diagnostico"]["asignadas_por_simpatia"],0)
        self.assertEqual(r["diagnostico"]["asignadas_por_transferencias"],1)
        self.assertEqual(r["diagnostico"]["sin_asignacion_final"],2)
        self.assertEqual(r["pasos"]["participacion"]["porcentajes"][23],0)

    def test_conserva_masa_y_no_duplica_decididos(self):
        r=cocinar([1,2,99],[2,1,1],[1,2,1],[2,1,3],[10,10,10],validos=[1,2])
        self.assertEqual(r["diagnostico"]["asignadas_por_simpatia"],1)
        self.assertEqual(r["pasos"]["simpatia"]["denominador_ponderado"],6)
        self.assertAlmostEqual(r["pasos"]["participacion"]["porcentajes"][1],100*5/6)

    def test_grupo_sin_donantes_y_recuerdo_ausente(self):
        r=cocinar([1,2,99,99],[99]*4,[1,2,9,np.nan],[1]*4,[10]*4,validos=[1,2])
        self.assertEqual(r["diagnostico"]["imputadas_con_distribucion_global"],2)
        self.assertEqual(r["pasos"]["participacion"]["porcentajes"],{1:50,2:50})

    def test_contraccion_reduce_extremo_y_participacion_se_aplica(self):
        args=([1,2,99],[99]*3,[1,2,1],[1]*3,[10,5,10])
        a=cocinar(*args,validos=[1,2],contraccion=0)
        b=cocinar(*args,validos=[1,2],contraccion=100)
        self.assertGreater(a["pasos"]["participacion"]["porcentajes"][1],b["pasos"]["participacion"]["porcentajes"][1])
        self.assertAlmostEqual(a["pasos"]["participacion"]["denominador_ponderado"],2.5)
        self.assertAlmostEqual(sum(b["pasos"]["participacion"]["porcentajes"].values()),100)

    def test_rechaza_pesos_y_vectores_invalidos(self):
        with self.assertRaises(ValueError):cocinar([1],[1],[1],[-1],[10],validos=[1])
        with self.assertRaises(ValueError):cocinar([1,2],[1],[1],[1],[10],validos=[1])


if __name__=="__main__":unittest.main()

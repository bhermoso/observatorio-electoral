import unittest
from datetime import date
from modelo.motor.validacion_publica import corte_publicado, estimacion_corte, auditar_historico

def poll(casa, trabajo, publicado, valor, id=None, **kw):
    return dict(casa=casa,campo_fin=date.fromisoformat(trabajo),
        publicacion=date.fromisoformat(publicado) if publicado else None,
        estudio=id or casa+trabajo,voto={"PP":valor},origen="test",**kw)

class TestValidacionPublica(unittest.TestCase):
    def test_no_usa_sondeos_futuros_ni_publicacion_inferida(self):
        p=[poll("A","2023-07-12","2023-07-17",32),
           poll("A","2023-07-17","2023-07-23",44),
           poll("B","2023-07-14",None,50),
           poll("C","2023-07-13","2023-07-16",30),
           poll("D","2023-07-16","2023-07-17",99,campo_supuesto=True)]
        s=estimacion_corte(p,date(2023,7,17),("PP",))
        self.assertEqual(s["n"],2)
        self.assertAlmostEqual(s["voto"]["PP"],31)
        self.assertEqual(set(s["estudios"]),{"A2023-07-12","C2023-07-13"})
    def test_seleccion_ultima_publicada_y_no_ultima_campo(self):
        p=[poll("A","2023-07-15","2023-07-16",30),
           poll("A","2023-07-11","2023-07-17",32),
           poll("A","2023-07-16","2023-07-18",40)]
        self.assertEqual(corte_publicado(p,date(2023,7,17))[0]["voto"]["PP"],32)
    def test_veda_congela_cortes_y_no_fabrica_elecciones_independientes(self):
        polls=[poll("A","2023-07-13","2023-07-17",32)]
        report=auditar_historico(polls,[dict(fecha=date(2023,7,23),resultado={"PP":33.06},
                                        fuente="https://www.boe.es/diario_boe/txt.php?id=BOE-A-2023-18907")],
                               partidos=("PP",),horizontes=(7,1))
        e=report["elecciones"][0]["cortes"]
        self.assertEqual(e[0]["voto"],e[1]["voto"])
        self.assertEqual(e[1]["fecha"],"2023-07-17")
        self.assertEqual(report["elecciones_independientes"],1)
        self.assertEqual(report["estado"],"exploratorio")
        self.assertFalse(report["parametros_calibrados"])
    def test_sin_encuestas_no_inventa_porcentajes(self):
        r=auditar_historico([], [dict(fecha=date(2019,11,10),resultado={"PP":20},
                                        fuente="fuente oficial")],partidos=("PP",))
        self.assertEqual(r["elecciones_independientes"],0)
        self.assertTrue(all(c["mae"] is None for c in r["elecciones"][0]["cortes"]))

if __name__=="__main__":
    unittest.main()

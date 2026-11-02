import unittest
from datetime import date
from modelo.motor.ablaciones import comparar, generar, EXPERIMENTOS
from modelo.motor import pronostico as PR
from unittest.mock import patch

class AblacionesTest(unittest.TestCase):
    def test_comparacion_usa_medianas_de_bloque_conjuntas(self):
        baseline={"partidos":{"PP":{"voto":[30,28,32],"escanos":[130,115,145]}},
            "bloques":{"PP+VOX":{"mediana":180,"p_mayoria":.6,"p5":160,"p95":196}}}
        test={"partidos":{"PP":{"voto":[31,29,33],"escanos":[132,116,147]}},
            "bloques":{"PP+VOX":{"mediana":185,"p_mayoria":.7,"p5":159,"p95":200}}}
        r=comparar(baseline,test)
        self.assertEqual(r["cambio_voto_pp"]["PP"],1)
        self.assertEqual(r["bloques"]["PP+VOX"]["cambio_mediana_escanos"],5)
        self.assertEqual(r["bloques"]["PP+VOX"]["cambio_frecuencia_umbral_puntos"],10)
    def test_no_hay_ingredientes_ficticios(self):
        self.assertFalse(any(x in EXPERIMENTOS for x in ("simpatia","recuerdo","participacion","transferencias")))
    def test_variantes_y_semillas_se_mantienen_por_experimento(self):
        # Una prueba rápida de orquestación evita lanzar miles de simulaciones.
        response={"partidos":{},"bloques":{},"n":30,"industria":2.2}
        with patch("modelo.motor.ablaciones.PR.principal",return_value=response) as model:
            from datetime import timedelta
            today=date(2026,11,2)
            r=generar([],today,today,today+timedelta(days=27),{},n_por_variante=10)
            self.assertEqual(len(r["experimentos"]),len(EXPERIMENTOS))
            self.assertEqual(model.call_count,1+len(EXPERIMENTOS))
            self.assertTrue(all(c.kwargs["n_por_variante"]==10 for c in model.call_args_list))
if __name__=="__main__":unittest.main()

import unittest
from modelo.motor.fuentes import aptas_para_pronostico

class CalidadFuentesTest(unittest.TestCase):
    def test_excluye_prensa_sin_verificar_aunque_tenga_porcentajes(self):
        registros = [
          {"ciclo":"2023-26", "origen":"verificada", "estudio":"completa"},
          {"ciclo":"2023-26", "origen":"terceros-29n", "estudio":"externa"},
          {"ciclo":"2023-26", "origen":"prensa-sin-verificar", "estudio":"sin-original"},
          {"ciclo":"2019-23", "origen":"verificada", "estudio":"historica"},
        ]
        activos=aptas_para_pronostico(registros)
        self.assertEqual([e["estudio"] for e in activos], ["completa", "externa"])
        self.assertEqual(len(registros),4)

    def test_no_silencia_resto_de_fuentes_secundarias(self):
        r=[{"ciclo":"2023-26","origen":"terceros-29n"}]
        self.assertEqual(len(aptas_para_pronostico(r)),1)

if __name__=="__main__": unittest.main()

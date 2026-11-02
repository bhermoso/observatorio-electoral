import unittest
from datetime import date
from modelo.motor.trazabilidad import elaborar

class TrazabilidadTest(unittest.TestCase):
    def test_no_atribuye_porcentajes_falsos_a_ingredientes(self):
        e=[dict(ciclo="2023-26",origen="verificada",casa="Casa A",voto={"PP":31,"PSOE":27}),
           dict(ciclo="2023-26",origen="terceros-29n",casa="Casa B",voto={"PP":30})]
        aj={"consenso_privadas":{"PP":{"media":[30.5],"sd":[1.1],"anclas":["Casa A","Casa B"]}}}
        p=dict(partidos={"PP":{"voto":[31,28,34]}})
        result=elaborar(e,aj,{},p,date(2026,11,2),excluidas_prensa=2)
        self.assertEqual(result["partidos"]["PP"]["encuestas_con_estimacion"],2)
        self.assertEqual(result["partidos"]["PSOE"]["encuestas_con_estimacion"],1)
        self.assertEqual(result["fuentes"]["registros_prensa_sin_verificar_excluidos"],2)
        self.assertEqual(result["variables"]["simpatia"]["estado"],"no_desagregable")
        self.assertEqual(result["variables"]["intencion_directa"]["estado"],"no_ingresa_directamente")
        self.assertEqual(result["variables"]["recuerdo_de_voto"]["estado"],"no_desagregable")
        self.assertAlmostEqual(result["partidos"]["PP"]["pronostico_principal_voto_mediana"],31)
        self.assertEqual(len(result["partidos"]["PP"]["variantes_tendencia"]),1)
        self.assertFalse(any("porcentaje_de" in k for k in result["variables"]["simpatia"]))
    def test_fuente_ausente_no_se_imputa(self):
        r=elaborar([],{}, {}, {"partidos":{}},date(2026,11,2))
        self.assertIsNone(r["partidos"]["PP"]["pronostico_principal_voto_mediana"])
        self.assertEqual(r["partidos"]["PP"]["encuestas_con_estimacion"],0)

if __name__=="__main__": unittest.main()

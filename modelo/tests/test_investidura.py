import unittest
import numpy as np
from modelo.motor.pronostico import evaluar_investidura

class InvestiduraTest(unittest.TestCase):
 def test_primera_y_segunda_son_reglas_distintas(self):
  parties=["PP","VOX","UPN","CC","PSOE"]
  # El resto de los 350 se incluye en el no si no consta una abstención.
  seats=np.array([[130,45,2,1,125],[120,42,2,1,130],[140,40,2,1,120]],dtype=int)
  cases={"caso":dict(nombre="Supuesto",si=("PP","VOX"),abstienen=("UPN","CC"))}
  r=evaluar_investidura(parties,seats,cases)["caso"]
  self.assertEqual(r["n"],3)
  self.assertEqual(r["mediana_abstenciones"],3)
  self.assertAlmostEqual(r["frecuencia_primera"],1/3)
  # 175 sí + 3 abstenciones -> 172 no; la segunda es aprobada.
  self.assertAlmostEqual(r["frecuencia_segunda"],2/3)
 def test_no_sumar_medianas_aisladas(self):
  parties=["A","B"]
  seats=np.array([[200,0],[0,200],[0,200]],dtype=int)
  r=evaluar_investidura(parties,seats,{"c":dict(nombre="c",si=("A","B"),abstienen=())})["c"]
  self.assertEqual(r["mediana_si"],200)
  self.assertEqual(r["frecuencia_primera"],1)
 def test_no_permite_mismo_partido_si_y_abstencion(self):
  with self.assertRaises(ValueError):
   evaluar_investidura(["A"],np.array([[200]]),{"c":dict(nombre="c",si=("A",),abstienen=("A",))})
 def test_ausencia_de_partido_no_se_reemplaza_por_cero(self):
  r=evaluar_investidura(["A"],np.array([[175]]),{"c":dict(nombre="c",si=("A","B"),abstienen=())})["c"]
  self.assertFalse(r["disponible"])

if __name__=="__main__": unittest.main()

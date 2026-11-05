import json
import unittest
from pathlib import Path
import numpy as np
from modelo.microdatos.taller import encode, calcular, CODES


class TallerTest(unittest.TestCase):
    def test_ninguno_blanco_y_nulo_no_se_confunden(self):
        a=encode(['NINGUNO','BLANCO','NULO','BLANCO_NULO'])
        self.assertEqual(len(set(a)),4)
        with self.assertRaises(ValueError):encode(['partido sin diccionario'])

    def test_los_perfiles_son_operaciones_y_conservan_denominador(self):
        v=['PP','PSOE','VOX','SUMAR','NS','NC']
        s=['PP','PSOE','VOX','SUMAR','NINGUNO','PP']
        r=['PP','PSOE','VOX','SUMAR','PP','PP']
        out=calcular(v,s,r,[1]*6,[10,10,10,10,np.nan,10],
            {'PP':33,'PSOE':32,'VOX':12,'SUMAR':12})
        self.assertEqual(out['directa']['estimacion']['PP'],25)
        self.assertEqual(out['participacion']['diagnostico']['asignadas_por_simpatia'],0)
        self.assertEqual(out['participacion']['diagnostico']['asignadas_por_transferencias'],1)
        self.assertEqual(out['participacion']['diagnostico']['sin_asignacion_final'],1)
        self.assertEqual(out['participacion']['diagnostico']['participacion_faltante'],1)
        for profile in out.values():
            self.assertAlmostEqual(sum(profile['estimacion'].values()),100)

    def test_la_salida_publica_es_revisable_y_sin_duplicacion(self):
        root=Path(__file__).resolve().parents[2]
        data=json.loads((root/'data/microdatos/taller-integrado.json').read_text())
        self.assertEqual(data['entrevistas'],8034)
        self.assertEqual(len(data['escenarios']),10)
        for source in data['fuentes']:
            self.assertNotIn('peso',source)
            for profile in source['recetas'].values():
                self.assertAlmostEqual(sum(profile['estimacion'].values()),100)
        for key,scenario in data['escenarios'].items():
            ids=[e['estudio'] for e in scenario['entradas']]
            self.assertEqual(len(ids),len(set(ids)))
            self.assertEqual(scenario['encuestas'],3 if key.startswith('microdatos') else 21)
            self.assertEqual(scenario['cocinadas'],0 if key.endswith('publicada') else 3)

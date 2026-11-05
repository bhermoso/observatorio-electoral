import unittest
from datetime import date
from unittest.mock import patch
from modelo.motor import pronostico as P


class FraccionErrorTest(unittest.TestCase):
    def test_cero_anula_centro_pero_conserva_dispersion(self):
        errors={'Casa':{'error':{'PP':4.0,'PSOE':-3.0,'VOX':1.0}}}
        with patch.object(P,'ajustar',return_value=None) as fit:
            P.estimar([],date(2026,10,1),date(2026,11,5),'calibrada_23j',
                errores_23j=errors,factor_prior_23j=0)
        pp=next(c for c in fit.call_args_list if c.args[1]=='PP')
        self.assertEqual(pp.kwargs['prior_sesgos']['Casa'],(0,1.5))

    def test_factor_no_queda_fijado_a_la_mitad(self):
        errors={'Casa':{'error':{'PP':4.0}}}
        for factor,expected in [(0.25,1),(0.5,2),(1,4)]:
            with self.subTest(factor=factor),patch.object(P,'ajustar',return_value=None) as fit:
                P.estimar([],date(2026,10,1),date(2026,11,5),'calibrada_23j',
                    errores_23j=errors,factor_prior_23j=factor)
                pp=next(c for c in fit.call_args_list if c.args[1]=='PP')
                self.assertEqual(pp.kwargs['prior_sesgos']['Casa'][0],expected)

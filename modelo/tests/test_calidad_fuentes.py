import unittest
from datetime import date
from modelo.motor.fuentes import aptas_para_pronostico, seleccion_pronostico
from modelo.motor import eventos as EV


def reg(estudio, origen, casa="X", ini=None, fin=date(2026, 10, 10), ciclo="2023-26", **kw):
    return dict(estudio=estudio, origen=origen, casa=casa, campo_ini=ini, campo_fin=fin, ciclo=ciclo, **kw)


class CalidadFuentesTest(unittest.TestCase):
    def test_excluye_prensa_sin_verificar_aunque_tenga_porcentajes(self):
        registros = [reg("completa", "verificada"), reg("externa", "terceros-29n", casa="Y"),
                     reg("sin-original", "prensa-sin-verificar"), reg("historica", "verificada", ciclo="2019-23")]
        activos = aptas_para_pronostico(registros)
        self.assertEqual([e["estudio"] for e in activos], ["completa", "externa"])
        self.assertEqual(len(registros), 4)

    def test_no_silencia_resto_de_fuentes_secundarias(self):
        self.assertEqual(len(aptas_para_pronostico([reg("t", "terceros-29n")])), 1)

    def test_excluye_terceros_con_campo_supuesto(self):
        aptas, excl = seleccion_pronostico([reg("t", "terceros-29n", campo_supuesto=True)])
        self.assertEqual(aptas, [])
        self.assertIn("supuesta", excl[0]["motivo"])

    def test_excluye_terceros_solapados_con_verificada_de_la_misma_casa(self):
        v = reg("v", "verificada", casa="Sigma Dos", ini=date(2026, 10, 8), fin=date(2026, 10, 22))
        t = reg("t", "terceros-29n", casa="Sigma Dos", ini=date(2026, 10, 9), fin=date(2026, 10, 10))
        otra = reg("o", "terceros-29n", casa="GAD3", ini=date(2026, 10, 9), fin=date(2026, 10, 10))
        aptas, excl = seleccion_pronostico([v, t, otra])
        self.assertEqual([e["estudio"] for e in aptas], ["v", "o"])
        self.assertEqual(excl[0]["estudio"], "t")
        self.assertIn("v", excl[0]["motivo"])

    def test_oleada_de_prensa_posterior_sustituye_a_la_verificada_solapada(self):
        v = reg("v", "verificada", casa="Sigma Dos", ini=date(2026, 10, 29), fin=date(2026, 10, 30))
        p = reg("p", "prensa-original-consultado", casa="Sigma Dos", ini=date(2026, 10, 30), fin=date(2026, 11, 6))
        aptas, excl = seleccion_pronostico([v, p])
        self.assertEqual([e["estudio"] for e in aptas], ["p"])
        self.assertEqual(excl[0]["estudio"], "v")
        self.assertIn("Sustituida por la oleada posterior p", excl[0]["motivo"])

    def test_terceros_posteriores_no_sustituyen_a_la_verificada(self):
        v = reg("v", "verificada", casa="Sigma Dos", ini=date(2026, 10, 29), fin=date(2026, 10, 30))
        t = reg("t", "terceros-29n", casa="Sigma Dos", ini=date(2026, 10, 30), fin=date(2026, 11, 6))
        aptas, _ = seleccion_pronostico([v, t])
        self.assertEqual([e["estudio"] for e in aptas], ["v"])

    def test_cada_exclusion_tiene_motivo(self):
        _, excl = seleccion_pronostico([reg("p", "prensa-sin-verificar"), reg("t", "terceros-29n", campo_supuesto=True)])
        self.assertTrue(all(x["motivo"] for x in excl))



class Historical23JCompletenessTest(unittest.TestCase):
    def test_serie_febrero_julio_2023_completa_y_con_fecha(self):
        from modelo.motor.fuentes import cargar_wikipedia_2023
        filas = cargar_wikipedia_2023()
        self.assertGreaterEqual(len(filas), 200)
        self.assertTrue(any(e["campo_fin"].month == 2 for e in filas))
        self.assertTrue(any(e["campo_fin"].month == 7 for e in filas))
        self.assertTrue(all(e["origen"] == "terceros-wikipedia" for e in filas))
        self.assertTrue(all(e.get("publicacion") for e in filas))
        self.assertTrue(any(e["publicacion"] > date(2023, 7, 17) for e in filas))

    def test_ultimas_40db_imop_y_sigma_dos_anteriores_a_veda(self):
        from modelo.motor.fuentes import todas, resultado_23j
        from modelo.motor.evaluacion import error_final
        enc = todas()
        finales = error_final(enc, date(2023, 7, 23), resultado_23j(),
                             ["PP", "PSOE", "VOX", "SUMAR"])
        self.assertEqual(finales["40dB."]["estudio"], "40db-2023-07-17-tracking11")
        self.assertEqual(finales["IMOP"]["estudio"], "imop-2023-07-17-completo")
        self.assertEqual(finales["Sigma Dos"]["estudio"], "sigmados-2023-07-17-elmundo")
        for casa in ("40dB.", "IMOP", "Sigma Dos"):
            self.assertTrue(finales[casa]["completa"], casa)
        self.assertEqual(len(finales["40dB."]["error"]), 4)
        self.assertEqual(len(finales["IMOP"]["error"]), 4)


class SolapeAcontecimientoTest(unittest.TestCase):
    """Datos sintéticos. Mismo criterio que events.mjs: el día del suceso cuenta como solape."""
    E = date(2026, 10, 28)

    def enc(self, casa, ini, fin, pp):
        return dict(casa=casa, campo_ini=ini, campo_fin=fin, voto={"PP": pp}, n=1000)

    def test_campo_que_empieza_el_dia_del_suceso_no_es_posterior(self):
        a = self.enc("A", date(2026, 10, 20), date(2026, 10, 22), 30.0)
        b = self.enc("A", date(2026, 10, 28), date(2026, 10, 30), 31.0)
        _, det = EV.pares([a, b], self.E, ["PP"])
        self.assertEqual(det, {})

    def test_campo_integramente_posterior_forma_par(self):
        a = self.enc("A", date(2026, 10, 8), date(2026, 10, 22), 30.6)
        b = self.enc("A", date(2026, 10, 29), date(2026, 10, 30), 31.1)
        media, det = EV.pares([a, b], self.E, ["PP"])
        self.assertAlmostEqual(det["A"]["cambio"]["PP"], 0.5)
        self.assertEqual(media["PP"][2], 1)


if __name__ == "__main__":
    unittest.main()


class ContrasteTercerosTest(unittest.TestCase):
    def test_correcciones_documentadas_se_aplican_y_se_marcan(self):
        from modelo.motor.fuentes import cargar_29n, contraste_terceros
        reg = {e["estudio"]: e for e in cargar_29n()}
        for k, c in contraste_terceros().items():
            self.assertIn(c["estado"], ("original_consultado", "corregido_con_original", "solo_secundaria", "discrepancia_secundaria", "cifras_confirmadas_sin_ficha"))
            self.assertTrue(c["original"].startswith("https://"))
            self.assertEqual(reg[k]["contraste"], c["estado"])
            for partido, v in (c.get("correcciones") or {}).items():
                self.assertEqual(reg[k]["voto"][partido], v["original"])

    def test_registros_sin_entrada_quedan_sin_contrastar(self):
        from modelo.motor.fuentes import cargar_29n, contraste_terceros
        conocidos = set(contraste_terceros())
        otros = [e for e in cargar_29n() if e["estudio"] not in conocidos]
        self.assertTrue(all(e["contraste"] == "sin_contrastar" for e in otros))

    def test_prensa_con_original_y_campo_entra_y_sin_ellos_no(self):
        from modelo.motor.fuentes import cargar_prensa, seleccion_pronostico
        pr = cargar_prensa()
        aptas, excl = seleccion_pronostico(pr)
        for e in pr:
            if e["origen"] == "prensa-original-consultado":
                self.assertIn(e, aptas)
                self.assertTrue(e["contraste_url"].startswith("https://"))
            else:
                self.assertTrue(any(x["estudio"] == e["estudio"] for x in excl))


class CorreccionIndustriaTest(unittest.TestCase):
    def test_corrige_la_mitad_del_error_medio_y_exige_casas_suficientes(self):
        from modelo.motor.pronostico import correccion_industria
        err = {f"c{i}": {"error": {"PSOE": -3.0, "PP": 1.0}} for i in range(5)}
        err["c5"] = {"error": {"VOX": 2.0}}
        c = correccion_industria(err, 0.5, 5)
        self.assertEqual(c, {"PSOE": 1.5, "PP": -0.5})
        self.assertEqual(correccion_industria(err, 0.0, 5), {"PSOE": 0.0, "PP": 0.0})

import unittest
from datetime import date, timedelta
import numpy as np
from modelo.motor.dhondt import dhondt
from modelo.motor.tendencia import ajustar
from modelo.motor import eventos as EV, evaluacion as V, fuentes as F
from modelo.motor.escanos import Base


def sintetica(casas, dias, nivel, salto=0.0, fecha_salto=None, ruido=0.4, semilla=1, n=1500):
    rng = np.random.default_rng(semilla)
    ini = date(2026, 1, 1)
    out = []
    for d in range(0, dias, 3):
        f = ini + timedelta(days=d)
        for c, sesgo in casas.items():
            v = nivel + sesgo + (salto if fecha_salto and f >= fecha_salto else 0) + rng.normal(0, ruido)
            out.append(dict(casa=c, campo_fin=f, campo_ini=f, n=n, voto={"A": v}, estudio=f"{c}{d}",
                            origen="test", url="", modo="", ciclo="test"))
    return out, ini


class TestDhondt(unittest.TestCase):
    def test_cocientes(self):
        self.assertEqual(dhondt([100000, 80000, 30000, 20000], 7).tolist(), [3, 3, 1, 0])

    def test_umbral(self):
        self.assertEqual(dhondt([50, 47.5, 2.5], 40)[2], 0)


class TestTendencia(unittest.TestCase):
    def test_sesgos_y_nivel(self):
        enc, ini = sintetica({"X": 0.0, "Y": 0.0, "CIS": 6.0}, 120, 30.0)
        r = ajustar(enc, "A", ini, ini + timedelta(days=119))
        self.assertAlmostEqual(r["media"][-1], 30.0, delta=0.6)
        self.assertAlmostEqual(r["sesgos"]["CIS"][0], 6.0, delta=0.8)

    def test_salto(self):
        fs = date(2026, 3, 1)
        enc, ini = sintetica({"X": 0.0, "Y": 1.0, "Z": -1.0}, 120, 30.0, salto=-3.0, fecha_salto=fs)
        r = ajustar(enc, "A", ini, ini + timedelta(days=119), eventos=[fs])
        s = r["saltos"][fs]
        self.assertAlmostEqual(s["salto"], -3.0, delta=3 * s["sd"])
        self.assertLess(s["salto"], -1.5)

    def test_prior_calibrado_desplaza_nivel(self):
        enc, ini = sintetica({"X": 0.0, "Y": 0.0}, 60, 30.0)
        r = ajustar(enc, "A", ini, ini + timedelta(days=59), prior_sesgos={"X": (2.0, 0.3), "Y": (2.0, 0.3)})
        self.assertAlmostEqual(r["media"][-1], 28.0, delta=0.7)


class TestEventos(unittest.TestCase):
    def test_pares_excluyen_solapes(self):
        ev = date(2026, 10, 28)
        mk = lambda c, i, f, v: dict(casa=c, campo_ini=i, campo_fin=f, voto={"A": v}, n=1000)
        enc = [mk("X", date(2026, 10, 20), date(2026, 10, 22), 30), mk("X", date(2026, 10, 27), date(2026, 10, 30), 99),
               mk("X", date(2026, 11, 2), date(2026, 11, 4), 28)]
        m, det = EV.pares(enc, ev, ["A"])
        self.assertEqual(det["X"]["cambio"]["A"], -2)


class TestEvaluacion(unittest.TestCase):
    def test_error_final(self):
        enc = [dict(casa="X", campo_fin=date(2023, 7, 15), voto={"PP": 35.0}, estudio="a", origen="t", url=""),
               dict(casa="X", campo_fin=date(2023, 6, 1), voto={"PP": 40.0}, estudio="b", origen="t", url="")]
        e = V.error_final(enc, date(2023, 7, 23), {"PP": 33.0}, ["PP"])
        self.assertAlmostEqual(e["X"]["error"]["PP"], 2.0)


class TestDisponibilidadTemporal(unittest.TestCase):
    def test_no_utilizar_encuesta_antes_de_publicarse(self):
        encuesta = {
            "campo_fin": date(2026, 10, 25),
            "publicacion": date(2026, 10, 29),
        }
        self.assertFalse(F.publicada_antes(encuesta, date(2026, 10, 28)))
        self.assertTrue(F.publicada_antes(encuesta, date(2026, 10, 29)))

    def test_fecha_desconocida_aplica_retraso_explicito(self):
        encuesta = {"campo_fin": date(2026, 10, 25)}
        self.assertFalse(F.publicada_antes(encuesta, date(2026, 10, 26)))
        self.assertTrue(F.publicada_antes(encuesta, date(2026, 10, 27)))


class TestDatosReales(unittest.TestCase):
    def test_reproduce_escanos_23j(self):
        b = Base(["PP", "PSOE", "VOX", "SUMAR", "ERC", "JUNTS", "BILDU", "PNV", "BNG", "CC", "UPN", "OTROS"],
                 {"SUMAR": 1.0})
        e = dict(zip(b.partidos, b.repartir(b.cuota).sum(0).tolist()))
        self.assertEqual(e, {"PP": 137, "PSOE": 121, "VOX": 33, "SUMAR": 31, "ERC": 7, "JUNTS": 7, "BILDU": 6,
                             "PNV": 5, "BNG": 1, "CC": 1, "UPN": 1, "OTROS": 0})

    def test_resultado_23j(self):
        r = F.resultado_23j()
        self.assertAlmostEqual(r["PP"], 33.06, delta=0.01)
        self.assertAlmostEqual(r["PSOE"], 31.68, delta=0.01)

    def test_fuentes_con_origen(self):
        enc = F.todas()
        self.assertTrue(all(e["origen"] in ("verificada", "terceros-wikipedia", "terceros-29n", "prensa-sin-verificar") for e in enc))


if __name__ == "__main__":
    unittest.main()


class TestErrorCorrelacionado(unittest.TestCase):
    def _aj(self, mu):
        T = 5
        return {p: dict(media=np.full(T, m), sd=np.full(T, 0.5), escala=float(np.sqrt(m / 25)))
                for p, m in mu.items()}

    def test_bloques_amplia_diferencia_y_conserva_marginal(self):
        from modelo.motor.pronostico import simular
        aj = self._aj({"PP": 32.0, "PSOE": 27.0, "VOX": 19.0, "SUMAR": 6.0, "PODEMOS": 3.0})
        a = simular(aj, 0, n=1500, rho_bloque=0.0)
        b = simular(aj, 0, n=1500, rho_bloque=0.8)
        P = a["partidos"]
        i, j = P.index("PP"), P.index("PSOE")
        dif = lambda s: np.std(s["votos"][:, i] - s["votos"][:, j])
        self.assertGreater(dif(b), dif(a) * 1.15)
        self.assertAlmostEqual(np.std(b["votos"][:, i]), np.std(a["votos"][:, i]), delta=0.35)


class TestCocinaMicrodatos(unittest.TestCase):
    def test_reponderar_corrige_sobrerrepresentacion(self):
        from modelo.microdatos.cocina import estimacion_propia
        rng = np.random.default_rng(3)
        # Población: 50 % recuerda A, 50 % B; cada grupo vota sobre todo lo mismo que recuerda.
        # Muestra sesgada: el grupo A está sobrerrepresentado (70 %).
        n = 4000
        rec = np.where(rng.random(n) < 0.7, 1, 2)
        intn = np.where(rng.random(n) < 0.9, rec, 3 - rec)
        w = np.ones(n)
        r = estimacion_propia(intn, rec, w, {1: "A", 2: "B"}, {1: "A", 2: "B"}, {"A": 50, "B": 50}, ["A", "B"])
        self.assertGreater(r["voto_directo"]["A"], 60)
        self.assertAlmostEqual(r["reponderado"]["A"], 50, delta=2)
        self.assertAlmostEqual(r["transferencias"]["A"]["A"], 90, delta=3)

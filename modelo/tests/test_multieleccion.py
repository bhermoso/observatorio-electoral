import copy
import json
import unittest
from datetime import date,timedelta
from pathlib import Path
from modelo.motor.validacion_multieleccion import temporal, aprender, predecir, evaluar

class TestProtocoloHistorico(unittest.TestCase):
    def setUp(self):
        self.cut=date(2016,6,19);self.day=date(2016,6,26)
        self.obs=[dict(estudio=c,eleccion=str(self.day),casa=c,campo_ini=str(self.cut-timedelta(days=3)),campo_fin=str(self.cut-timedelta(days=1)),publicacion=str(self.cut),n=1200,voto={'PP':30+i,'PSOE':25-i}) for i,c in enumerate(['Casa A','Casa B'])]
    def test_no_publicacion_ni_campo_imputados(self):
        for change in [{'publicacion':None},{'publicacion':'2016-06-20'},{'campo_fin':'2016-06-20'},{'campo_supuesto':True},{'fecha_publicacion_desconocida':True},{'campo_ini':None}]:
            with self.subTest(change=change):self.assertEqual(temporal([dict(self.obs[0],**change)],self.cut),[])
    def test_no_resultado_objetivo_ni_elecciones_futuras(self):
        cycles=[dict(fecha='2015-12-20',fecha_publicacion_resultado='2016-01-29',resultado={'PP':29,'PSOE':22}),dict(fecha=str(self.day),resultado={'PP':30,'PSOE':25}),dict(fecha='2023-07-23',resultado={'PP':33,'PSOE':32})]
        old=[dict(e,eleccion='2015-12-20',campo_ini='2015-12-10',campo_fin='2015-12-11',publicacion='2015-12-12') for e in self.obs]
        before=aprender(cycles,old,self.day)
        cycles[1]['resultado']={'PP':90,'PSOE':1};cycles[2]['resultado']={'PP':1,'PSOE':90}
        self.assertEqual(before,aprender(cycles,old,self.day));self.assertEqual(before[1],['2015-12-20'])
    def test_resultado_previo_aun_no_publicado_no_entrena(self):
        ciclos=[dict(fecha='2015-12-20',fecha_publicacion_resultado='2016-01-29',resultado={'PP':29,'PSOE':22})]
        old=[dict(e,eleccion='2015-12-20',campo_ini='2015-12-10',campo_fin='2015-12-11',publicacion='2015-12-12') for e in self.obs]
        self.assertEqual(aprender(ciclos,old,self.day,disponible_hasta=date(2016,1,1)),({},[]))
    def test_publicacion_futura_no_cambia_prediccion_pasada(self):
        p=predecir(self.obs,self.cut,self.day,ventana=14)
        extra=dict(self.obs[0],estudio='futura',publicacion='2016-06-20',voto={'PP':80,'PSOE':10})
        q=predecir(self.obs+[extra],self.cut,self.day,ventana=14)
        for k in ('predicciones','admitidas','firma_entrada'):self.assertEqual(p[k],q[k])
        self.assertEqual(q['excluidas'],[{'estudio':'futura','motivo':'publicacion_posterior_al_corte'}])
    def test_mismo_soporte_sin_normalizar_dos_partidos_a_100(self):
        p=predecir(self.obs,self.cut,self.day,ventana=14)
        for v,parties in p['predicciones'].items():
            self.assertEqual(set(parties),{'PP','PSOE'})
            for x in parties.values():self.assertLess(x['p5'],x['p95'])
        self.assertAlmostEqual(sum(x['media'] for x in p['predicciones']['media_casas'].values()),55)
        self.assertEqual(p['n_casas'],2);self.assertLessEqual(p['n_efectivo_casas_recencia'],2)
    def test_elecciones_no_se_cuentan_como_cortes(self):
        r=evaluar([dict(fecha=str(self.day),resultado={'PP':31,'PSOE':24})],self.obs,horizontes=(7,))
        self.assertEqual(r['elecciones_independientes'],1);self.assertFalse(r['modelo_operativo_29n_evaluado']);self.assertFalse(r['validacion_independiente'])
    def test_no_ajuste_por_cambio_del_resultado_de_prueba(self):
        a=[dict(fecha=str(self.day),resultado={'PP':31,'PSOE':24})];b=copy.deepcopy(a);b[0]['resultado']['PP']=70
        x=evaluar(a,self.obs,horizontes=(7,));y=evaluar(b,self.obs,horizontes=(7,))
        self.assertEqual(x['cortes'][0]['predicciones'],y['cortes'][0]['predicciones']);self.assertNotEqual(x['resumen'],y['resumen'])
    def test_resultados_oficiales_con_agrupacion_y_correccion(self):
        p=Path(__file__).resolve().parents[2]/'data/historico/multieleccion.json';d=json.loads(p.read_text())
        expected={'2011-11-20':(24348886,10866566,7003511),'2015-12-20':(25211313,7236965,5545315),'2016-06-26':(24053755,7941236,5443846)}
        for c in d['elecciones']:
            if c['fecha'] in expected:
                n,pp,psoe=expected[c['fecha']];self.assertEqual(c['votos_validos'],n)
                self.assertAlmostEqual(c['resultado']['PP'],100*pp/n);self.assertAlmostEqual(c['resultado']['PSOE'],100*psoe/n)

if __name__=='__main__':unittest.main()

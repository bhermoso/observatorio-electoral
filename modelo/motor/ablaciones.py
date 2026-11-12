"""Ablaciones CONTROLADAS de componentes realmente presentes en el Motor 29N.

Se usan las mismas semillas por variante y el mismo número de simulaciones.
No son validaciones históricas ni efectos causales de recuerdo/simpatía.
Cada contraste cambia una decisión de modelización respecto a la referencia.
"""
from . import pronostico as PR
from .fuentes import aptas_para_pronostico

PARTIDOS=tuple(PR.PARTIDOS)
BLOQUES=("PP+VOX","PP+VOX+UPN","PSOE+SUMAR+PODEMOS",
          "PSOE+SUMAR+PODEMOS+ERC+JUNTS+BILDU+PNV+BNG+CC")

EXPERIMENTOS={
 "sin_error_industria": ("Sin error de industria",{"industria":0.0}),
 "sin_correlacion_bloques": ("Sin componente común entre bloques",{"rho_bloque":0.0}),
 "sin_variacion_provincial": ("Sin ruido provincial adicional",{"sd_prov":0.0}),
 "traslado_uniforme": ("Traslado provincial uniforme",{"metodo_geo":"uniforme"}),
 "solo_consenso_privadas": ("Solo ancla de casas privadas",{"variantes":("consenso_privadas",)}),
 "solo_consenso_todas": ("Solo ancla incluyendo CIS",{"variantes":("consenso_todas",)}),
 "sin_calibracion_23j": ("Sin la variante de calibración 23J",{"variantes":("consenso_privadas","consenso_todas")}),
}

def comparar(base, alternativa):
    votos={}
    escanos={}
    for p in PARTIDOS:
        a,b=base["partidos"].get(p),alternativa["partidos"].get(p)
        if a is not None and b is not None:
            votos[p]=round(b["voto"][0]-a["voto"][0],3)
            escanos[p]=round(b["escanos"][0]-a["escanos"][0],3)
    bloques={}
    for name in BLOQUES:
        a,b=base["bloques"].get(name),alternativa["bloques"].get(name)
        if a and b:
            bloques[name]={
                "cambio_mediana_escanos":round(b["mediana"]-a["mediana"],3),
                "cambio_frecuencia_umbral_puntos":round(100*(b["p_mayoria"]-a["p_mayoria"]),2),
                "intervalo_escanos":[b["p5"],b["p95"]],
            }
    return dict(cambio_voto_pp=votos,cambio_mediana_escanos=escanos,bloques=bloques)

def generar(encuestas, inicio, hoy, eleccion, errores23, referencia=None, n_por_variante=120):
    if n_por_variante<10: raise ValueError("Se requieren al menos 10 simulaciones por variante")
    activos=aptas_para_pronostico(encuestas)
    base=referencia if referencia is not None else PR.principal(
        activos,inicio,hoy,eleccion,errores23,n_por_variante=n_por_variante)
    salidas=[]
    for clave,(nombre,opciones) in EXPERIMENTOS.items():
        prueba=PR.principal(activos,inicio,hoy,eleccion,errores23,
                           n_por_variante=n_por_variante,**opciones)
        salidas.append(dict(id=clave,nombre=nombre,configuracion=opciones,
                            comparacion=comparar(base,prueba)))
    return {
      "corte":hoy.isoformat(),"eleccion":eleccion.isoformat(),
      "tipo":"Sensibilidad del modelo, no efecto observado sobre votantes",
      "metodo":"Semillas fijas y misma muestra de simulaciones por variante; cada escenario altera una decisión explícita.",
      "n_por_variante":n_por_variante,
      "referencia":{"n":base["n"],"industria":base["industria"]},
      "experimentos":salidas,
      "no_identificables":[
        "Recuerdo, simpatía, transferencia e intención directa no son términos separados del Motor 29N: no es posible desactivarlos individualmente.",
        "Los resultados no constituyen validación en elecciones independientes.",
        "Un cambio al eliminar la incertidumbre no significa una variación equivalente en intención de voto real.",
        "Comparar el método territorial o los anclajes mezcla transformación y distribución de estimaciones, no identifica una causa electoral."
      ],
    }

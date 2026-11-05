"""Homologación explícita y receta común sobre tres matrices individuales.

El peso original pertenece al productor. El resto de operaciones se declara aquí.
Solo devuelve agregados; no devuelve ni publica filas ni matrices de celdas pequeñas.
"""
import re
import numpy as np
from .receta_declarada import cocinar

PARTIES = ['PP','PSOE','VOX','SUMAR','PODEMOS','SALF','ERC','JUNTS','BILDU','PNV','BNG','CC','UPN','OTROS','BLANCO']
CODES = {p:i+1 for i,p in enumerate(PARTIES)}
SPECIAL = {'NS':99,'NC':98,'ABSTENCION':96,'NO_VOTARIA':96,'NULO':97,'NUEVO':95,'NR':94,'NINGUNO':93,'BLANCO_NULO':92}
PROFILES = {
 'directa': {'nombre':'Voto declarado ponderado','paso':'peso_demografico','recuerdo':0},
 'indecisos': {'nombre':'Simpatía y reparto de indecisos','paso':'indecisos_transferencias','recuerdo':0},
 'participacion': {'nombre':'Indecisos y participación declarada','paso':'participacion','recuerdo':0},
 'recuerdo': {'nombre':'Ensayo: añadir ajuste parcial del recuerdo','paso':'participacion','recuerdo':.5},
}


def encode(values):
    result=[]
    for value in values:
        if value is None: result.append(np.nan)
        elif value in CODES: result.append(CODES[value])
        elif value in SPECIAL: result.append(SPECIAL[value])
        else: raise ValueError('Categoría no homologada: '+str(value))
    return np.array(result,dtype=float)


def calcular(vote,sympathy,recall,weight,turnout,truth):
    v,s,r=map(encode,(vote,sympathy,recall))
    w=np.asarray(weight,dtype=float)
    p=np.asarray(turnout,dtype=float)
    profiles={}
    # Calibración solo en el subconjunto PP/PSOE/Vox/Sumar recordado: no fuerza
    # a todos los entrevistados a reproducir el resultado ni corrige nuevos votantes.
    major=['PP','PSOE','VOX','SUMAR']
    recalled=np.isin(r,[CODES[x] for x in major])
    total=w[recalled].sum()
    factors={}
    for party in major:
        mass=w[r==CODES[party]].sum()
        if mass<=0 or total<=0: raise ValueError('Recuerdo sin soporte: '+party)
        factors[party]=float(np.clip((truth[party]/sum(truth[x] for x in major))/(mass/total),.5,2))
    for key,config in PROFILES.items():
        weights=w.copy()
        strength=config['recuerdo']
        if strength:
            for party,factor in factors.items():
                weights[r==CODES[party]]*=1+strength*(factor-1)
        calculation=cocinar(v,s,r,weights,p,validos=CODES.values(),
            ninguno_simpatia=SPECIAL['NINGUNO'],contraccion=50,imputar_nc=False)
        steps={name:{'estimacion':{party:stage['porcentajes'][code] for party,code in CODES.items()},
            'denominador_ponderado':stage['denominador_ponderado'],
            'efectivo_kish':stage['efectivo_kish_asignado']} for name,stage in calculation['pasos'].items()}
        profiles[key]={'nombre':config['nombre'],'paso':config['paso'],
            'estimacion':steps[config['paso']]['estimacion'], 'pasos':steps,
            'diagnostico':calculation['diagnostico'],'intensidad_recuerdo':strength,
            'factores_recuerdo_completo':factors}
    return profiles

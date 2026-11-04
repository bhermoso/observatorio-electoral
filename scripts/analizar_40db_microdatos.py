#!/usr/bin/env python3
"""Recalcula desde los ZIP originales 40dB SOLO cifras agregadas y hashes.

Dependencias opcionales de análisis: pandas, numpy. No es necesario para compilar la web.
Ejemplo: python scripts/analizar_40db_microdatos.py /ruta/privada/con-los-tres-zip
No redistribuye ZIP, filas ni identificadores. El ajuste de recuerdo es una HIPÓTESIS,
no una descripción del algoritmo interno de 40dB ni una validación electoral.
"""
import hashlib
import io
import json
import sys
import zipfile
from pathlib import Path

try:
    import numpy as np
    import pandas as pd
except ImportError as exc:
    raise SystemExit("Para este script local: pip install numpy pandas") from exc

FILES = {
    "enero": ("2026_01_barometro_descargables.zip", "p3", "p6", "p4"),
    "octubre": ("2026_10_barometro_descargables.zip", "p3", "p6", "p4"),
    "flash": ("2026_10_08_barometro_flash_descargables.zip", "p2", "p9", "p3"),
}
VALID_BASE = {"PP", "PSOE", "VOX", "SUMAR", "PODEMOS", "SALF", "BLANCO",
              "OTROS", "ERC", "JUNTS", "BILDU", "PNV", "BNG", "CUP",
              "CC", "UPN", "UPL", "ADELANTE", "ESPANA_VACIADA", "NC"}
REF = {"PP":33.1,"PSOE":31.7,"VOX":12.4,"SUMAR":12.3}


def decode(value):
    if pd.isna(value):
        return ""
    s=str(value)
    try: return s.encode("latin1").decode("utf8")
    except (UnicodeError,UnicodeEncodeError): return s


def code(value):
    s=decode(value).casefold()
    if s.startswith("pp ("):return "PP"
    if s.startswith("psoe ("):return "PSOE"
    if s=="vox":return "VOX"
    if s=="sumar" or s.startswith("sumar/frente amplio"):return "SUMAR"
    if s=="podemos":return "PODEMOS"
    if s.startswith("se acabó la fiesta"):return "SALF"
    if "blanco" in s:return "BLANCO"
    if s.startswith("no votar") or s.startswith("no voté"):return "ABSTENCION"
    if "nulo" in s:return "NULO"
    if s.startswith("no lo sé"):return "INDECISO"
    if s.startswith("prefiero no contestar"):return "NO_RESPUESTA"
    if s.startswith("no tenía edad"):return "SIN_EDAD"
    for head,name in [("erc (","ERC"),("jxcat","JUNTS"),("eh bildu","BILDU"),
        ("eaj","PNV"),("bng","BNG"),("cup","CUP"),("coalición canaria","CC"),
        ("upn","UPN"),("upl","UPL"),("adelante andalucía","ADELANTE"),
        ("españa vaciada","ESPANA_VACIADA"),("nueva canarias","NC"),
        ("otro","OTROS")]:
        if s.startswith(head):return name
    return "OTROS" if s else "FALTANTE"


def read_zip(path):
    with zipfile.ZipFile(path) as zf:
        matches=[n for n in zf.namelist() if n.endswith(".dta") and not n.startswith("__MACOSX")]
        if len(matches)!=1:raise ValueError("Se esperaba una matriz .dta")
        return pd.read_stata(io.BytesIO(zf.read(matches[0])), convert_categoricals=True)


def values(v,w):
    valid=np.isin(v,list(VALID_BASE))
    return {p:round(100*float(w[v==p].sum())/float(w[valid].sum()),3)
            for p in REF}


def analizar(folder):
    output={}
    for key,(fname,vote,recall,sym) in FILES.items():
        path=Path(folder)/fname
        df=read_zip(path)
        w=df.ponde.to_numpy(dtype=float)
        v=df[vote].map(code).to_numpy()
        rec=df[recall].map(code).to_numpy()
        direct=values(v,w)
        raw={p:round(100*float(w[v==p].sum())/float(w.sum()),3) for p in REF}
        n_four=float(w[np.isin(rec,list(REF))].sum())
        target=sum(REF.values())
        adjusted=w.copy()
        for p in REF:
            current=float(w[rec==p].sum())
            if current<=0:raise ValueError("Falta recuerdo para "+p)
            adjusted[rec==p]*=(REF[p]/target)/(current/n_four)
        output[key]={
           "sha256_zip":hashlib.sha256(path.read_bytes()).hexdigest(),
           "n":len(df),"n_efectivo_kish":round(float(w.sum()**2/(w*w).sum()),2),
           "directa_sobre_muestra":raw,"directa_entre_validos":direct,
           "recuerdo_4_pesos_2023":{p:round(100*float(w[rec==p].sum())/n_four,3) for p in REF},
           "recuerdo_calibrado_experimental":values(v,adjusted),
           "porcentaje_validos":round(100*float(w[np.isin(v,list(VALID_BASE))].sum())/float(w.sum()),3),
           "variables":dict(intencion=vote,recuerdo=recall,simpatia=sym,peso="ponde"),
        }
    return output


if __name__=="__main__":
    if len(sys.argv)!=2:raise SystemExit("Uso: python scripts/analizar_40db_microdatos.py /carpeta/zip")
    print(json.dumps({"tipo":"solo_agregados","no_es":"formula_40db_ni_validacion",
                      "resultados":analizar(sys.argv[1])},ensure_ascii=False,indent=2))

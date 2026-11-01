"""Carga y normalización de encuestas de todas las fuentes a un formato único.

Cada encuesta es un dict:
  casa, estudio, campo_fin (date), campo_ini (date|None), n, modo, voto {partido: %},
  origen ('verificada' | 'terceros-wikipedia' | 'terceros-29n'), url, ciclo
"""
import csv
import json
import os
from datetime import date, timedelta

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
EXT = os.path.join(RAIZ, "modelo", "externos")

# Nombre canónico de cada casa (las fuentes escriben distinto el mismo instituto).
CASAS = {
    "imop insights": "IMOP", "imop": "IMOP", "sociometrica": "SocioMétrica",
    "sociométrica": "SocioMétrica", "40db": "40dB.", "40db.": "40dB.",
    "gad3": "GAD3", "sigma dos": "Sigma Dos", "nc report": "NC Report",
    "simple lógica": "Simple Lógica", "cis": "CIS", "dym": "DYM",
    "ateneo del dato": "Ateneo del Dato", "demoscopia y servicios": "Demoscopia y Servicios",
    "electopanel": "ElectoPanel", "invymark": "InvyMark", "keydata": "KeyData",
    "metroscopia": "Metroscopia", "celeste-tel": "Celeste-Tel", "data10": "Data10",
    "hamalgama métrica": "Hamalgama Métrica", "sw demoscopia": "SW Demoscopia",
    "gesop": "GESOP", "target point": "Target Point", "ágora integral": "Ágora Integral",
}

# Partidos canónicos. Ciclo 2019-23: UP y MAS_PAIS; ciclo 2023-26: SUMAR y PODEMOS.
PARTIDOS = {
    "PP": "PP", "PSOE": "PSOE", "VOX": "VOX", "Vox": "VOX",
    "Sumar": "SUMAR", "SUMAR": "SUMAR", "Sumar/FA": "SUMAR", "Frente Amplio": "SUMAR",
    "Podemos": "PODEMOS", "PODEMOS": "PODEMOS", "Unidas Podemos": "UP", "Más País": "MAS_PAIS",
    "Cs": "CS", "SALF": "SALF", "ERC": "ERC", "ERC–Sobiranistes": "ERC", "Junts": "JUNTS",
    "JUNTS": "JUNTS", "JxCat": "JUNTS", "EH Bildu": "BILDU", "BILDU": "BILDU", "PNV": "PNV",
    "BNG": "BNG", "CC": "CC", "Coalición Canaria": "CC", "UPN": "UPN",
}

# Bloque comparable entre ciclos: espacio a la izquierda del PSOE.
BLOQUE_IZQ = {"2019-23": ("UP", "MAS_PAIS"), "2023-26": ("SUMAR", "PODEMOS")}


def casa_canonica(nombre):
    n = nombre.strip()
    return CASAS.get(n.lower(), n)


def _fecha(s):
    return date.fromisoformat(s[:10])


def ciclo_de(d):
    if d <= date(2019, 11, 10):
        return "pre-2019N"
    if d <= date(2023, 7, 23):
        return "2019-23"
    return "2023-26"


def cargar_verificadas():
    """Registro verificado del observatorio (data/polls.json)."""
    out = []
    for s in json.load(open(os.path.join(RAIZ, "data", "polls.json"), encoding="utf-8")):
        if s.get("kind") != "poll-estimate":
            continue
        voto = {PARTIDOS[k]: float(v) for k, v in (s.get("values") or {}).items()
                if k in PARTIDOS and v is not None}
        fin = _fecha(s["fieldEnd"])
        out.append(dict(casa=casa_canonica(s["institute"]), estudio=s["id"], campo_fin=fin,
                        campo_ini=_fecha(s["fieldStart"]) if s.get("fieldStart") else None,
                        n=int(s.get("sample") or 1000), modo=s.get("mode") or "",
                        voto=voto, origen="verificada", url=s.get("source", ""),
                        ciclo=ciclo_de(fin), ambito=s.get("scope", ""),
                        publicacion=_fecha(s["published"]) if s.get("published") else None))
    return out


def cargar_wikipedia():
    """Ciclo 2019-23 (nov-2019 a ene-2023) desde tablas de Wikipedia, vía endikasatu."""
    por_id = {}
    for r in csv.DictReader(open(os.path.join(EXT, "wikipedia_2019_2023.csv"), encoding="utf-8")):
        if r["partisan"] == "Yes" or not r["vote_share"] or r["party"] not in PARTIDOS:
            continue
        clave = (r["polling_firm"], r["end_date"], r["sample_size"])
        if clave not in por_id:
            fin = _fecha(r["end_date"])
            por_id[clave] = dict(casa=casa_canonica(r["pollster"]),
                                 estudio=f"wiki-{r['polling_firm']}-{r['end_date']}",
                                 campo_fin=fin, campo_ini=None,
                                 n=int(float(r["sample_size"])) if r["sample_size"] not in ("", "NA") else 1000,
                                 modo="", voto={}, origen="terceros-wikipedia",
                                 url=r["source"], ciclo=ciclo_de(fin), ambito="España",
                                 cliente=r["polling_firm"])
        por_id[clave]["voto"][PARTIDOS[r["party"]]] = float(r["vote_share"])
    # Las encuestas de terceros sobre el CIS (p. ej. "CIS (SocioMétrica)") son
    # reestimaciones, no encuestas propias: se excluyen.
    return [e for e in por_id.values() if "(" not in e["casa"]]


def cargar_29n():
    """Encuestas privadas (2023 y 2025-26) del proyecto 29N, con URL de publicación."""
    por_id = {}
    for l in open(os.path.join(EXT, "29n_encuestadores.jsonl"), encoding="utf-8"):
        r = json.loads(l)
        if r.get("ambito") != "nacional" or "Cataluña" in r["eleccion"] or "post-23J" in r["eleccion"]:
            continue
        p = PARTIDOS.get(r["partido_canonico"])
        if p is None or r.get("porcentaje") is None:
            continue
        if r["estudio_id"] not in por_id:
            if r.get("fecha_trabajo"):
                ini, fin = r["fecha_trabajo"].split("/")
                ini, fin = _fecha(ini), _fecha(fin)
            else:  # sin campo publicado: fin = publicación - 2 días (supuesto declarado)
                ini, fin = None, _fecha(r["fecha_publicacion"]) - timedelta(days=2)
            por_id[r["estudio_id"]] = dict(casa=casa_canonica(r["fuente"]), estudio=r["estudio_id"],
                                           campo_fin=fin, campo_ini=ini, n=int(r.get("n") or 1000),
                                           modo=r.get("metodologia", ""), voto={}, origen="terceros-29n",
                                           url=r["fuente_url"], ciclo=ciclo_de(fin), ambito="España",
                                           publicacion=_fecha(r["fecha_publicacion"]) if r.get("fecha_publicacion") else None)
        por_id[r["estudio_id"]]["voto"][p] = float(r["porcentaje"])
    return list(por_id.values())


def cargar_prensa():
    """Encuestas citadas en prensa sin original consultado (modelo/externos/prensa_2026.csv).
    Sin fin de campo publicado se supone publicación - 3 días (supuesto declarado)."""
    out = []
    ruta = os.path.join(EXT, "prensa_2026.csv")
    if not os.path.exists(ruta):
        return out
    for r in csv.DictReader(open(ruta, encoding="utf-8")):
        pub = _fecha(r["publicacion"])
        fin = _fecha(r["campo_fin"]) if r["campo_fin"] else pub - timedelta(days=3)
        voto = {p: float(r[p]) for p in ("PP", "PSOE", "VOX", "SUMAR", "PODEMOS") if r.get(p)}
        out.append(dict(casa=casa_canonica(r["casa"]), estudio=r["estudio"], campo_fin=fin,
                        campo_ini=_fecha(r["campo_ini"]) if r["campo_ini"] else None,
                        n=int(r["n"]) if r["n"] else 1000, modo=r["modo"], voto=voto,
                        origen="prensa-sin-verificar", url=r["fuente_url"], ciclo=ciclo_de(fin),
                        ambito="España", publicacion=pub, nota=r["nota"]))
    return out


def todas(deduplicar=True):
    """Todas las fuentes. Si una misma casa tiene dos registros con fin de campo a
    <= 2 días, se conserva el verificado (o el primero cargado)."""
    enc = cargar_verificadas() + cargar_29n() + cargar_prensa() + cargar_wikipedia()
    if not deduplicar:
        return enc
    out = []
    for e in enc:
        dup = next((o for o in out if o["casa"] == e["casa"]
                    and abs((o["campo_fin"] - e["campo_fin"]).days) <= 2), None)
        if dup is None:
            out.append(e)
    return sorted(out, key=lambda e: e["campo_fin"])


def dia_central(e):
    """Día representativo del campo: punto medio si hay inicio; si no, fin - 1."""
    if e.get("campo_ini"):
        return e["campo_ini"] + (e["campo_fin"] - e["campo_ini"]) / 2
    return e["campo_fin"] - timedelta(days=1)


# Resultados oficiales nacionales (% sobre voto válido). 23J desde data/ (BOE).
def resultado_23j():
    votos, validos = {}, 0
    for r in csv.DictReader(open(os.path.join(RAIZ, "data", "districts.csv"), encoding="utf-8-sig")):
        if r["election"] == "2023-07-23":
            validos += int(r["valid"])
    mapa = {"PP": "PP", "PSOE": "PSOE", "PSC": "PSOE", "VOX": "VOX", "SUMAR": "SUMAR", "ERC": "ERC",
            "JUNTS": "JUNTS", "EH Bildu": "BILDU", "EAJ-PNV": "PNV", "BNG": "BNG", "CCa": "CC", "UPN": "UPN"}
    for r in csv.DictReader(open(os.path.join(RAIZ, "data", "results.csv"), encoding="utf-8-sig")):
        if r["election"] != "2023-07-23":
            continue
        cod = r["party"].rstrip(".").rsplit("(", 1)[1].rstrip(")")
        if cod in mapa:
            votos[mapa[cod]] = votos.get(mapa[cod], 0) + int(r["votes"])
    return {p: 100 * v / validos for p, v in votos.items()}


def referencias_agregadores():
    """Promedios y modelos externos registrados en data/references.json (p. ej. EL PAÍS).
    No son encuestas: solo se usan como contraste del motor."""
    out = []
    for r in json.load(open(os.path.join(RAIZ, "data", "references.json"), encoding="utf-8")):
        if r.get("kind") != "aggregate-model" or not r.get("published"):
            continue
        voto = {PARTIDOS.get(k, k): v for k, v in (r.get("approximateValues") or r.get("values") or {}).items()}
        esc = {PARTIDOS.get(k, k): v for k, v in (r.get("modelSeats") or {}).items()}
        out.append(dict(id=r["id"], nombre=r["name"], fecha=_fecha(r["published"]), voto=voto, escanos=esc,
                        url=r.get("source"), notas=r.get("notes", ""), metodo=r.get("methodology", ""),
                        verificado=r.get("verified")))
    return out


def publicada_antes(e, fecha, retraso=2):
    """¿Era pública la encuesta en `fecha`? Usa la fecha de publicación si consta; si no,
    supone que se publicó `retraso` días después del fin de campo (supuesto declarado)."""
    pub = e.get("publicacion") or (e["campo_fin"] + timedelta(days=retraso))
    return pub <= fecha


def otros_agregadores():
    """Promedios de otros agregadores vistos en prensa o en el buscador (externos/agregadores.csv).
    Solo para contraste; no entran en el pronóstico."""
    ruta = os.path.join(EXT, "agregadores.csv")
    out = []
    if not os.path.exists(ruta):
        return out
    for r in csv.DictReader(open(ruta, encoding="utf-8")):
        out.append(dict(nombre=r["nombre"], fecha=_fecha(r["fecha"]), fecha_tipo=r["fecha_tipo"],
                        voto={p: float(r[p]) for p in ("PP", "PSOE", "VOX", "SUMAR", "PODEMOS") if r.get(p)},
                        escanos={p: int(r["escanos_" + p]) for p in ("PP", "PSOE", "VOX") if r.get("escanos_" + p)},
                        metodo=r["metodo"], url=r["fuente_url"], nota=r["nota"]))
    return out

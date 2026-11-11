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
    "gad3": "GAD3", "sigma dos": "Sigma Dos", "sigmados": "Sigma Dos", "nc report": "NC Report",
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


def contraste_terceros():
    """Registro de contraste con originales (modelo/externos/contraste_terceros.json)."""
    ruta = os.path.join(EXT, "contraste_terceros.json")
    if not os.path.exists(ruta):
        return {}
    return json.load(open(ruta, encoding="utf-8")).get("registros", {})


def cargar_29n():
    """Encuestas privadas (2023 y 2025-26) del proyecto 29N, con URL de publicación.
    Aplica las correcciones documentadas en contraste_terceros.json y marca el estado del contraste."""
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
                supuesto = False
            else:  # sin campo publicado: fin = publicación - 2 días (supuesto declarado)
                ini, fin = None, _fecha(r["fecha_publicacion"]) - timedelta(days=2)
                supuesto = True
            por_id[r["estudio_id"]] = dict(casa=casa_canonica(r["fuente"]), estudio=r["estudio_id"],
                                           campo_fin=fin, campo_ini=ini, n=int(r.get("n") or 1000),
                                           modo=r.get("metodologia", ""), voto={}, origen="terceros-29n",
                                           url=r["fuente_url"], ciclo=ciclo_de(fin), ambito="España",
                                           publicacion=_fecha(r["fecha_publicacion"]) if r.get("fecha_publicacion") else None,
                                           campo_supuesto=supuesto, n_supuesto=not r.get("n"),
                                           fuente_tipo=r.get("fuente_tipo", ""))
        por_id[r["estudio_id"]]["voto"][p] = float(r["porcentaje"])
    contraste = contraste_terceros()
    for k, e in por_id.items():
        c = contraste.get(k)
        e["contraste"] = c["estado"] if c else "sin_contrastar"
        e["contraste_url"] = c.get("original") if c else None
        for partido, v in ((c or {}).get("correcciones") or {}).items():
            e["voto"][partido] = float(v["original"])
    return list(por_id.values())




def cargar_wikipedia_2023():
    """Serie ampliada secundaria (feb-jul 2023); sin inventar publicación."""
    ruta = os.path.join(EXT, "wikipedia_2023_completa.csv")
    if not os.path.exists(ruta):
        return []
    out = []
    for r in csv.DictReader(open(ruta, encoding="utf-8")):
        fin = _fecha(r["campo_fin"])
        votos = {p: float(r[p]) for p in ("PP", "PSOE", "VOX", "SUMAR") if r.get(p)}
        out.append(dict(casa=casa_canonica(r["casa"]), estudio=r["estudio"],
                        campo_fin=fin, campo_ini=_fecha(r["campo_ini"]),
                        n=int(r["n"]) if r.get("n") else 1000,
                        n_supuesto=not bool(r.get("n")), modo="",
                        voto=votos, origen="terceros-wikipedia", url=r["url"],
                        publicacion=_fecha(r["publicacion"]) if r.get("publicacion") else None,
                        fecha_publicacion_desconocida=not bool(r.get("publicacion")),
                        ciclo=ciclo_de(fin), ambito="España", cliente=r.get("fuente_tabla","")))
    return out


def cargar_23j_complementos():
    """Correcciones históricas documentadas sin reescribir fuentes importadas."""
    ruta = os.path.join(EXT, "23j_complementos.json")
    if not os.path.exists(ruta):
        return []
    registros = json.load(open(ruta, encoding="utf-8"))["registros"]
    out = []
    for r in registros:
        fin = _fecha(r["campo_fin"])
        out.append(dict(casa=casa_canonica(r["casa"]), estudio=r["estudio"],
                        campo_fin=fin, campo_ini=_fecha(r["campo_ini"]), n=int(r["n"]),
                        modo=r["modo"], voto=r["voto"], origen="terceros-wikipedia",
                        url=r["url"], publicacion=_fecha(r["publicacion"]),
                        ciclo=ciclo_de(fin), ambito="España",
                        nota=r.get("nota", ""), contraste="fuente_secundaria_con_fecha"))
    return out


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
        # Con el original consultado y fechas de campo publicadas deja de ser una cita sin verificar.
        consultado = bool(r.get("original_url")) and bool(r["campo_fin"])
        out.append(dict(casa=casa_canonica(r["casa"]), estudio=r["estudio"], campo_fin=fin,
                        campo_ini=_fecha(r["campo_ini"]) if r["campo_ini"] else None,
                        n=int(r["n"]) if r["n"] else 1000, modo=r["modo"], voto=voto,
                        origen="prensa-original-consultado" if consultado else "prensa-sin-verificar",
                        url=r.get("original_url") or r["fuente_url"], ciclo=ciclo_de(fin),
                        contraste="cifras_confirmadas_sin_ficha" if consultado else "sin_contrastar",
                        contraste_url=r.get("original_url") or None,
                        ambito="España", publicacion=pub, nota=r["nota"],
                        campo_supuesto=not r["campo_fin"], n_supuesto=not r["n"]))
    return out


def _solapa_campo(a, b):
    """¿Se solapan los periodos de campo de dos registros? Sin inicio, se usa el fin."""
    ai, bi = a.get("campo_ini") or a["campo_fin"], b.get("campo_ini") or b["campo_fin"]
    return ai <= b["campo_fin"] and bi <= a["campo_fin"]


def seleccion_pronostico(encuestas, ciclo="2023-26"):
    """Puerta de calidad del pronóstico principal. Devuelve (aptas, excluidas).

    Reglas, en este orden (cada exclusión conserva su motivo):
    1. Prensa sin original verificado: nunca entra como observación de voto.
    2. Registro de terceros con fecha de campo supuesta (no publicada): su posición
       temporal es una conjetura y puede coincidir con otra oleada ya registrada.
    3. Registro de terceros cuyo campo se solapa con un registro verificado de la
       misma casa: probable submuestra u oleada acumulada; se evita contar dos veces
       las mismas entrevistas.
    4. Excepción a la regla 3 (decisión de Blas Hermoso, 9 nov 2026): si el registro
       solapado es una oleada de prensa con el original consultado y su campo termina
       después que el de la verificada, entra la oleada posterior y sale la anterior.
       Sigue contándose una sola vez cada entrevista, pero con la medición más reciente.
    Los registros de terceros que superan las reglas entran con su origen
    marcado; `PROCEDENCIA.md` documenta la fuente y los límites de cada uno.
    """
    del_ciclo = [e for e in encuestas if e["ciclo"] == ciclo]
    verificadas = [e for e in del_ciclo if e["origen"] == "verificada"]
    aptas, excluidas = [], []
    sustituida_por = {}
    # Dos fichas verificadas también pueden compartir entrevistas. Conservar la
    # oleada más reciente; el archivo documental retiene ambas.
    retenidas = []
    for v in sorted(verificadas, key=lambda e: (e["campo_fin"], e.get("publicacion") or e["campo_fin"], e["estudio"]), reverse=True):
        posterior = next((r for r in retenidas if r["casa"] == v["casa"] and _solapa_campo(r, v)), None)
        if posterior:
            sustituida_por[v["estudio"]] = posterior["estudio"]
        else:
            retenidas.append(v)
    for e in del_ciclo:
        if e["origen"] == "prensa-original-consultado" and not e.get("campo_supuesto"):
            for v in verificadas:
                if v["casa"] == e["casa"] and _solapa_campo(e, v) and e["campo_fin"] > v["campo_fin"]:
                    sustituida_por[v["estudio"]] = e["estudio"]
    for e in del_ciclo:
        motivo = None
        if e["estudio"] in sustituida_por:
            motivo = f"Sustituida por la oleada posterior {sustituida_por[e['estudio']]} de la misma casa, con campo solapado"
        elif e["origen"] == "prensa-sin-verificar" and e.get("contraste_url") and e.get("campo_supuesto"):
            motivo = "Original consultado, pero no publica la fecha de fin del trabajo de campo"
        elif e["origen"] == "prensa-sin-verificar":
            motivo = "Cita de prensa sin original ni ficha técnica verificados"
        elif e["origen"] != "verificada" and e.get("campo_supuesto"):
            motivo = "Fecha de campo no publicada (supuesta a partir de la publicación)"
        elif e["origen"] != "verificada":
            gemela = next((v for v in verificadas if v["casa"] == e["casa"] and _solapa_campo(e, v)
                           and sustituida_por.get(v["estudio"]) != e["estudio"]), None)
            if gemela is not None:
                motivo = f"Campo solapado con el registro verificado {gemela['estudio']} de la misma casa"
        if motivo:
            excluidas.append(dict(estudio=e["estudio"], casa=e["casa"], origen=e["origen"],
                                  campo_ini=e.get("campo_ini"), campo_fin=e["campo_fin"], motivo=motivo, url=e.get("url", ""),
                                  publicacion=e.get("publicacion"), n=None if e.get("n_supuesto") else e.get("n"),
                                  campo_supuesto=bool(e.get("campo_supuesto")),
                                  voto=dict(e.get("voto") or {})))
        else:
            aptas.append(e)
    return aptas, excluidas


def aptas_para_pronostico(encuestas, ciclo="2023-26"):
    """Compatibilidad: estudios que superan la puerta de calidad (ver seleccion_pronostico)."""
    return seleccion_pronostico(encuestas, ciclo)[0]


def todas(deduplicar=True):
    """Carga todas las fuentes sin perder oleadas verificadas de un tracking.

    La deduplicación temporal solo compacta registros secundarios de la misma
    casa, nunca fichas primarias diferentes. Las oleadas verificadas deben llegar
    juntas a seleccion_pronostico, que conserva la última si hay campo solapado.
    Esto también preserva el archivo histórico de cada fecha.
    """
    enc = cargar_verificadas() + cargar_23j_complementos() + cargar_29n() + cargar_prensa() + cargar_wikipedia_2023() + cargar_wikipedia()
    if not deduplicar:
        return enc
    out = []
    for e in enc:
        # Un identificador de estudio repetido es la única deduplicación global.
        if any(o["estudio"] == e["estudio"] and o["casa"] == e["casa"] for o in out):
            continue
        # No eliminar fichas verificadas ni registros de otros orígenes antes de
        # aplicar la puerta de calidad (que registra el motivo de exclusión).
        if e["origen"] == "verificada" or e["ciclo"] == "2023-26":
            out.append(e)
            continue
        # En registros históricos secundarios, compactar copias idénticas.
        dup = next((o for o in out if o["casa"] == e["casa"] and
                    o["origen"] != "verificada" and o["ciclo"] == e["ciclo"] and
                    o["campo_fin"] == e["campo_fin"] and o["voto"] == e["voto"]), None)
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
                        verificado=r.get("verified"), aproximado=bool(r.get("approximateValues"))))
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

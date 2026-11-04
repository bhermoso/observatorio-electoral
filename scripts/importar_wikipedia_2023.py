#!/usr/bin/env python3
"""Snapshot reproducible de las tablas nacionales 2023 de Wikipedia (fuente secundaria).

No sustituye fuentes originales. Publicación solo si fecha visible en la referencia.
La agrupación Sumar/Podemos en 2023 cambia: solo unificamos SUMAR en la tabla
que declara expresamente 'Podemos within Sumar'.
"""
import csv
import hashlib
import json
import re
from datetime import date, datetime
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.parse import urljoin

from bs4 import BeautifulSoup

URL = "https://en.wikipedia.org/wiki/Opinion_polling_for_the_2023_Spanish_general_election"
OUT = Path("modelo/externos/wikipedia_2023_completa.csv")
META = Path("modelo/externos/wikipedia_2023_completa.meta.json")
MONTHS = {m: i for i, m in enumerate(("Jan", "Feb", "Mar", "Apr", "May", "Jun",
                                      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"), 1)}
MN = r"January|February|March|April|May|June|July|August|September|October|November|December"
def field_dates(raw):
    s = raw.replace("–", "-").replace("—", "-")
    found = re.findall(r"(\d{1,2})\s*(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*", s, re.I)
    if not found:
        return None
    end_day, end_mon = found[-1]
    end = date(2023, MONTHS[end_mon.title()[:3]], int(end_day))
    if len(found) > 1:
        start_day, start_mon = found[0]
        start = date(2023, MONTHS[start_mon.title()[:3]], int(start_day))
    else:
        early = re.search(r"(\d{1,2})\s*-", s)
        start = date(2023, end.month, int(early.group(1))) if early else end
    if start > end or end < date(2023, 2, 1) or end >= date(2023, 7, 23):
        return None
    return start, end

def pct(td):
    s = td.get_text(" ", strip=True)
    m = re.match(r"^\s*(\d{1,2}(?:[.,]\d+)?)\s*(?:%|\b|$)", s)
    if not m:
        return None
    v = float(m.group(1).replace(",", "."))
    return v if 0 <= v <= 100 else None

def publication(soup, td):
    # Referencias enciclopédicas: la fecha de la noticia es la evidencia temporal.
    for a in td.select('sup.reference a[href^="#cite_note-"]'):
        ref = soup.find(id=a.get("href", "")[1:])
        if ref is None:
            continue
        t = ref.get_text(" ", strip=True)
        m = re.search(rf"\b(\d{{1,2}})\s+({MN})\s+2023\b", t, re.I)
        if not m:
            continue
        try:
            d = date(2023, datetime.strptime(m.group(2)[:3], "%b").month, int(m.group(1)))
        except ValueError:
            continue
        external = [x.get("href", "") for x in ref.select('a[href^="http"]')
                    if "wikipedia.org" not in x.get("href", "") and "web.archive.org" not in x.get("href", "")]
        return d.isoformat(), external[0] if external else URL
    return "", URL

def run():
    request = Request(URL, headers={"User-Agent": "ObservatorioElectoralResearch/1.0 (public historical verification)"})
    html = urlopen(request, timeout=40).read()
    soup = BeautifulSoup(html, "html.parser")
    sections = [
        ("2023 (Podemos w/i", True),
        ("2023 (with Sumar)", False),
        ("2023 (before Sumar)", False),
    ]
    rows, seen = [], set()
    for name, combined in sections:
        heading = next((h for h in soup.find_all(re.compile("^h[3-6]$"))
                        if name.lower() in h.get_text(" ", strip=True).lower()), None)
        if heading is None:
            raise RuntimeError("No se encuentra la tabla: "+name)
        table = heading.find_next("table", class_=lambda c: c and "wikitable" in c)
        if table is None:
            raise RuntimeError("Sin tabla para "+name)
        for tr in table.find_all("tr"):
            cells = tr.find_all(["td", "th"], recursive=False)
            if len(cells) < 8:
                continue
            firm = cells[0].get_text(" ", strip=True).split("[")[0].strip()
            if not firm or "election" in firm.lower() or "polling" in firm.lower() or "(" in firm:
                continue
            dates = field_dates(cells[1].get_text(" ", strip=True))
            if dates is None:
                continue
            start, end = dates
            votes = {p: pct(cells[i]) for p, i in (("PSOE", 4), ("PP", 5), ("VOX", 6))}
            if combined:
                votes["SUMAR"] = pct(cells[7])
            if not (votes.get("PP") is not None and votes.get("PSOE") is not None):
                continue
            pub, source = publication(soup, cells[0])
            sample_str = cells[2].get_text(" ", strip=True)
            sample_digits = re.search(r"\d[\d,\.]*", sample_str)
            sample = int(re.sub(r"\D", "", sample_digits.group())) if sample_digits else ""
            house = firm.split("/")[0].strip()
            if len(house) > 80 or not house:
                continue
            key = (house.lower(), start.isoformat(), end.isoformat(),
                   tuple(sorted((p, v) for p, v in votes.items() if v is not None)))
            if key in seen:
                continue
            seen.add(key)
            id_ = "wiki2023-"+hashlib.sha256(repr(key).encode()).hexdigest()[:14]
            rows.append(dict(estudio=id_, casa=house, campo_ini=start.isoformat(),
                             campo_fin=end.isoformat(), publicacion=pub, n=sample,
                             PSOE=votes.get("PSOE"), PP=votes.get("PP"), VOX=votes.get("VOX"),
                             SUMAR=votes.get("SUMAR"), url=source, fuente_tabla=name,
                             origen="terceros-wikipedia"))
    if len(rows) < 60 or not any(x["campo_fin"].startswith("2023-02") for x in rows) or not any(x["campo_fin"].startswith("2023-07") for x in rows):
        raise RuntimeError(f"Extracción incompleta: {len(rows)} filas; se rechaza archivar")
    rows.sort(key=lambda x: (x["campo_fin"], x["casa"], x["estudio"]))
    OUT.parent.mkdir(parents=True, exist_ok=True)
    with OUT.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0]))
        w.writeheader()
        w.writerows(rows)
    META.write_text(json.dumps({"fuente":URL, "sha256_html":hashlib.sha256(html).hexdigest(),
           "filas":len(rows), "con_fecha_publicacion":sum(bool(x["publicacion"]) for x in rows),
           "criterio":"Tablas nacionales 2023; originales no verificados sistemáticamente; sin imputar fechas de publicación",
           "advertencia":"Febrero-mayo: Sumar y Podemos no se agregan; estas filas solo tienen PSOE, PP y Vox."},
           ensure_ascii=False, indent=2)+"\n",encoding="utf-8")
    print("Extraídas",len(rows),"filas; con publicación",sum(bool(x["publicacion"]) for x in rows))

if __name__ == "__main__":
    run()

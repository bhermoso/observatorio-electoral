"""Inspección estructural no destructiva del XLSX oficial del Interior."""
from urllib.request import Request,urlopen
from zipfile import ZipFile
from io import BytesIO
import hashlib
import re
import xml.etree.ElementTree as ET

URL="https://descargas.interior.gob.es/datasets/resultados_electorales/Elecciones-al-Parlamento-Europeo.xlsx"
xns={"x":"http://schemas.openxmlformats.org/spreadsheetml/2006/main",
     "r":"http://schemas.openxmlformats.org/officeDocument/2006/relationships"}
request=Request(URL,headers={"User-Agent":"ObservatorioElectoralInvestigacion/1.0"})
with urlopen(request,timeout=90) as response:
    raw=response.read(75_000_000)
print("XLSX DESCARGADO",len(raw),"sha256",hashlib.sha256(raw).hexdigest())
z=ZipFile(BytesIO(raw))
books=ET.fromstring(z.read("xl/workbook.xml"))
print("HOJAS:",[(s.attrib.get("name"),s.attrib.get("sheetId")) for s in books.findall("x:sheets/x:sheet",xns)])
strings=[]
if "xl/sharedStrings.xml" in z.namelist():
    root=ET.fromstring(z.read("xl/sharedStrings.xml"))
    strings=["".join(t.text or "" for t in si.findall(".//x:t",xns)) for si in root.findall("x:si",xns)]
print("STRINGS",len(strings))
for name in sorted(p for p in z.namelist() if re.match(r"xl/worksheets/sheet[0-9]+.xml$",p)):
    print("ARCHIVO",name)
    with z.open(name) as infile:
        for event,el in ET.iterparse(infile,events=("end",)):
            if el.tag.endswith("}row"):
                ri=int(el.attrib.get("r","0"))
                if ri<8:
                    vals=[]
                    for cell in el.findall("x:c",xns):
                        v=cell.find("x:v",xns)
                        if v is not None:
                            value=v.text
                            if cell.attrib.get("t")=="s":
                                value=strings[int(value)]
                            vals.append((cell.attrib.get("r"),str(value)[:120]))
                    print("FILA",ri,repr(vals[:22]))
                el.clear()
                if ri>=8:break

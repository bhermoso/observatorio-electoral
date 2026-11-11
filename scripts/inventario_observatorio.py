"""Inventario estático reproducible de páginas, módulos, datos y consumidores.

No ejecuta código ni modifica entradas del modelo. Los enlaces interpolados requieren
la revisión funcional de navegador; este inventario conserva su expresión literal.
"""
import json
import re
from pathlib import Path
from collections import defaultdict

ROOT = Path(__file__).resolve().parents[1]

def inventory():
    files = sorted([*ROOT.glob('*.html'), *ROOT.glob('*.mjs'), ROOT/'modelo/pagina/plantilla.html'])
    entries = []
    consumers = defaultdict(set)
    for file in files:
        text = file.read_text(encoding='utf-8')
        links = sorted(set(re.findall(r'(?:href|src)=["\']([^"\']+)', text)))
        imports = sorted(set(re.findall(r'(?:from\s*|import\s*)["\'](\.[^"\']+)', text)))
        data = sorted(set(re.findall(r'["\']((?:data|modelo)/[^"\'`<>\s]+\.(?:json|csv))["\']', text)))
        key = str(file.relative_to(ROOT))
        for ref in imports + data:
            consumers[ref.removeprefix('./')].add(key)
        entries.append({'archivo': key, 'tipo': 'pagina' if file.suffix == '.html' else 'modulo',
                        'importa': imports, 'datos_literales': data, 'enlaces': links,
                        'anclas': sorted(set(re.findall(r'id=["\']([^"\']+)', text)))})
    return {'alcance': 'HTML y módulos raíz, más plantilla del informe del Motor 29N; dependencias estáticas literales, no ejecución dinámica',
            'entradas': entries, 'consumidores': {k: sorted(v) for k, v in sorted(consumers.items())}}

if __name__ == '__main__':
    out = ROOT/'docs/inventario-observatorio.json'
    out.write_text(json.dumps(inventory(), ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    print(out.relative_to(ROOT))

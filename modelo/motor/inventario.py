"""Recuentos del conjunto realmente cargado, después de deduplicar y filtrar el corte."""
from collections import Counter


def resumir(encuestas):
    historicas = [e for e in encuestas if e['ciclo'] != '2023-26']
    actuales = [e for e in encuestas if e['ciclo'] == '2023-26']
    wiki = [e for e in historicas if e['origen'] == 'terceros-wikipedia']
    return dict(
        total=len(encuestas), historicas=len(historicas), ciclo_actual=len(actuales),
        wikipedia=len(wiki),
        wikipedia_desde=str(min(e['campo_fin'] for e in wiki)) if wiki else None,
        wikipedia_hasta=str(max(e['campo_fin'] for e in wiki)) if wiki else None,
        archivo_verificado=sum(e['origen'] == 'verificada' for e in encuestas),
        por_origen=dict(sorted(Counter(e['origen'] for e in encuestas).items())))

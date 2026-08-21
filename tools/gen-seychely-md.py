#!/usr/bin/env python3
"""One-off migration script (srpen 2026): destinace/seychely.html -> 13
web/src/content/destinace/<ostrov>.md 'oblast' records under nadrazena: seychely.

Run once from repo root: python3 tools/gen-seychely-md.py
"""
ROOT = __file__.rsplit('tools', 1)[0]

ISLANDS = [
    ('mahe', 'Mahé', 'Ostrov Mahé', True),
    ('bird-island', 'Bird Island', 'Ostrov Bird Island', False),
    ('cerf', 'Cerf', 'Ostrov Cerf', False),
    ('cousine', 'Cousine', 'Ostrov Cousine', False),
    ('denis-island', 'Denis Island', 'Ostrov Denis Island', False),
    ('desroches', 'Desroches', 'Ostrov Desroches', False),
    ('fregate', 'Fregate', 'Ostrov Fregate', False),
    ('la-digue', 'La Digue', 'Ostrov La Digue', True),
    ('north-island', 'North Island', 'Ostrov North Island', False),
    ('praslin', 'Praslin', 'Ostrov Praslin', True),
    ('round-island', 'Round Island', 'Ostrov Round Island', False),
    ('silhouette', 'Silhouette', 'Ostrov Silhouette', False),
    ('platte-island', 'Platte Island', 'Platte Island', False),
]

TEMPLATE = """---
typ: oblast
nazev: {nazev}
nadrazena: seychely
kontinent: AF
{vybrana}
hlavni_foto: /assets/seychely/{slug}.jpg

galerie:
  - src: /assets/seychely/{slug}.jpg
    alt: {alt}

chybi:
  - "Popis ostrova, doporučené hotely, cena od — na starém webu (destinace/seychely.html) byl jen název a foto v rozcestníku."
---
"""

count = 0
for slug, nazev, alt, featured in ISLANDS:
    content = TEMPLATE.format(slug=slug, nazev=nazev, alt=alt, vybrana='vybrana: true' if featured else '')
    with open(ROOT + f'web/src/content/destinace/{slug}.md', 'w', encoding='utf-8', newline='\n') as out:
        out.write(content)
    count += 1

print(f'Wrote {count} Seychelles island files.')

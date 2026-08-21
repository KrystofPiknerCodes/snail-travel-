#!/usr/bin/env python3
"""One-off migration script (srpen 2026): destinace.html -> web/src/content/destinace/*.md

Parses the 6 continent <section class="continent-block"> blocks in destinace.html,
extracts each country's name / photo slug / featured flag, cross-references
js/ref-counts.js for a ref_tag, and writes one thin Astro content-collection
markdown file per country (skips Seychely — handled by gen-seychely-md.py
because it has real sub-page content, not just a name+photo).

Run once from repo root: python3 tools/gen-destinace-md.py
"""
import re
import json
import unicodedata

ROOT = __file__.rsplit('tools', 1)[0]

with open(ROOT + 'destinace.html', encoding='utf-8') as f:
    html = f.read()

with open(ROOT + 'js/ref-counts.js', encoding='utf-8') as f:
    refcounts_src = f.read()

# js/ref-counts.js is `window.SNAIL_REF_COUNTS = { ... };` — strip the JS wrapper, parse as JSON.
m = re.search(r'window\.SNAIL_REF_COUNTS\s*=\s*(\{.*?\});', refcounts_src, re.S)
REF_COUNTS = json.loads(m.group(1))


def norm(s):
    s = s.lower()
    s = unicodedata.normalize('NFD', s)
    s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
    return s.strip()


REF_BY_NORM = {norm(name): entry['t'] for name, entry in REF_COUNTS.items()}

CONTINENT_SECTIONS = {
    'kontinent-evropa': 'EU',
    'kontinent-afrika': 'AF',
    'kontinent-asie': 'AS',
    'kontinent-amerika-sever': 'NA',
    'kontinent-amerika-jih': 'SA',
    'kontinent-australie': 'OC',
}

LI_RE = re.compile(
    r'<li(?P<featured>\s+class="is-featured")?>'
    r'<a href="(?P<href>[^"]+)">'
    r'<img class="country-photo" src="assets/countries/(?P<slug>[^"]+)\.jpg"[^>]*alt="(?P<alt>[^"]+)"[^>]*/>'
    r'<span class="country-name">(?P<name>[^<]+)</span>'
    r'</a></li>'
)

YAML_TEMPLATE = """---
typ: destinace
nazev: {nazev}
kontinent: {kontinent}
{vybrana}
hlavni_foto: /assets/countries/{slug}.jpg

galerie:
  - src: /assets/countries/{slug}.jpg
    alt: {alt}
{ref_tag}
chybi:
  - "Popis destinace (perex, úvodní text) — na starém webu žádný nebyl, jen název, foto a kontinent."
  - "Cena od, kdy jet, zážitky, konkrétní hotely — u této destinace zatím žádná data neexistují (na rozdíl od Madeiry)."
---
"""

count = 0
skipped = []
for section_id, cont_code in CONTINENT_SECTIONS.items():
    sec_match = re.search(
        r'id="' + re.escape(section_id) + r'".*?<ul class="country-grid[^>]*>(.*?)</ul>',
        html, re.S,
    )
    if not sec_match:
        print('WARN: section not found', section_id)
        continue
    block = sec_match.group(1)
    for li in LI_RE.finditer(block):
        name = li.group('name').strip()
        slug = li.group('slug').strip()
        alt = li.group('alt').strip()
        href = li.group('href').strip()

        if slug == 'seychely' or 'seychely.html' in href:
            skipped.append(name)
            continue

        # Madeira already has a full hand-written record (hero, gallery,
        # weather, hotels, experiences) from the earlier sample migration —
        # never overwrite it with the thin auto-generated version.
        if slug == 'madeira':
            skipped.append(name + ' (already hand-authored)')
            continue

        ref_tag_field = ''
        tag = REF_BY_NORM.get(norm(name))
        if tag:
            ref_tag_field = f'ref_tag: {tag}\n\n'

        vybrana_field = 'vybrana: true' if li.group('featured') else ''

        content = YAML_TEMPLATE.format(
            nazev=name, kontinent=cont_code, slug=slug, alt=alt,
            ref_tag=ref_tag_field, vybrana=vybrana_field,
        )
        out_path = ROOT + f'web/src/content/destinace/{slug}.md'
        with open(out_path, 'w', encoding='utf-8', newline='\n') as out:
            out.write(content)
        count += 1

print(f'Wrote {count} destination files.')
print('Skipped (handled separately):', skipped)

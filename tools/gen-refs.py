#!/usr/bin/env python3
"""Z js/references-data.js odvodí dva lehké soubory pro ostatní stránky.

  js/ref-counts.js  — destinace -> { n: pocet, t: tag }
                      (odznaky na kartách zemí na destinace.html)
  js/ref-quotes.js  — tag -> [ { d: datum, t: [odstavce] }, ... ]
                      (inline reference na detailu destinace)

Proč: js/references-data.js má ~170 KB a nikdo kromě reference.html
nepotřebuje všech 221 referencí najednou.

Spouštět z kořene repa:  python3 tools/gen-refs.py
"""

import json
import os
import re
import sys
import unicodedata
from collections import Counter, defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "js", "references-data.js")
OUT_COUNTS = os.path.join(ROOT, "js", "ref-counts.js")
OUT_QUOTES = os.path.join(ROOT, "js", "ref-quotes.js")
PAGES = [os.path.join(ROOT, "destinace.html")]

# Kolik referencí na destinaci si nese detailová stránka.
QUOTES_PER_DEST = 3
# Preferovaná délka citace na detailu — ani útržek, ani zeď textu.
GOOD_MIN, GOOD_MAX = 180, 900

# Tagy z referencí, které se píší jinak než karta země na destinace.html.
ALIAS = {
    "Fidži": "Fiji",
}


def norm(s):
    s = unicodedata.normalize("NFD", str(s).lower())
    return "".join(c for c in s if unicodedata.category(c) != "Mn").strip()


def load_references():
    with open(DATA, encoding="utf-8") as fh:
        src = fh.read()
    body = src.split("window.SNAIL_REFERENCES =", 1)[1]
    return json.loads(body[body.index("[") : body.rindex("]") + 1])


def country_names():
    """Názvy zemí tak, jak stojí v .country-name na destinace.html."""
    names = []
    for page in PAGES:
        with open(page, encoding="utf-8") as fh:
            html = fh.read()
        for m in re.finditer(r'<span class="country-name">(.*?)</span>', html, re.S):
            names.append(re.sub(r"\s+", " ", m.group(1)).replace("&nbsp;", " ").strip())
    return names


def write_js(path, header, payload):
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(header)
        json.dump(payload, fh, ensure_ascii=False, indent=1)
        fh.write(";\n")


def build_counts(refs):
    counts = Counter()
    for r in refs:
        for tag in r.get("tags", []):
            counts[tag] += 1

    known = {norm(n): n for n in country_names()}
    matched, orphans = {}, []
    for tag, n in counts.items():
        key = norm(ALIAS.get(tag, tag))
        if key in known:
            name = known[key]
            # t = tag tak, jak stojí v datech (kvůli ?dest=), protože karta
            # země se občas jmenuje jinak než tag (Fiji / Fidži).
            entry = matched.setdefault(name, {"n": 0, "t": tag})
            entry["n"] += n
        else:
            orphans.append((tag, n))

    payload = dict(sorted(matched.items(), key=lambda kv: (-kv[1]["n"], kv[0])))
    write_js(
        OUT_COUNTS,
        "/* Snail Travel — GENEROVÁNO, needitovat ručně.\n"
        "   Zdroj: js/references-data.js · generátor: tools/gen-refs.py\n"
        "   Mapa: nazev destinace (jak stoji v .country-name) -> { n: pocet, t: tag }. */\n"
        "window.SNAIL_REF_COUNTS = ",
        payload,
    )
    return len(counts), len(matched), orphans


def build_quotes(refs):
    by_tag = defaultdict(list)
    for r in refs:
        for tag in r.get("tags", []):
            by_tag[tag].append(r)

    def length(r):
        return len(" ".join(r["text"]))

    payload = {}
    for tag, items in by_tag.items():
        items.sort(key=lambda r: r.get("date", ""), reverse=True)
        good = [r for r in items if GOOD_MIN <= length(r) <= GOOD_MAX]
        rest = [r for r in items if not (GOOD_MIN <= length(r) <= GOOD_MAX)]
        picked = (good + rest)[:QUOTES_PER_DEST]
        payload[tag] = [{"d": r["dateLabel"], "t": r["text"]} for r in picked]

    payload = dict(sorted(payload.items()))
    write_js(
        OUT_QUOTES,
        "/* Snail Travel — GENEROVÁNO, needitovat ručně.\n"
        "   Zdroj: js/references-data.js · generátor: tools/gen-refs.py\n"
        f"   Mapa: tag destinace -> max {QUOTES_PER_DEST} referenci "
        "{ d: datum, t: [odstavce] },\n"
        "   pro inline sekci na detailu destinace (js/dest-references.js). */\n"
        "window.SNAIL_REF_QUOTES = ",
        payload,
    )
    return len(payload)


def main():
    refs = load_references()
    n_tags, n_matched, orphans = build_counts(refs)
    n_quoted = build_quotes(refs)

    def rel(p):
        return os.path.relpath(p, ROOT)

    print(f"referencí: {len(refs)} · destinací s referencemi: {n_tags}")
    print(f"{rel(OUT_COUNTS)}: napárováno na karty zemí: {n_matched}")
    print(
        f"{rel(OUT_QUOTES)}: destinací: {n_quoted} "
        f"({os.path.getsize(OUT_QUOTES) // 1024} KB)"
    )
    if orphans:
        print("\nBEZ KARTY ZEMĚ (odznak se nezobrazí):")
        for tag, n in sorted(orphans, key=lambda kv: -kv[1]):
            print(f"  {n:4}  {tag}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

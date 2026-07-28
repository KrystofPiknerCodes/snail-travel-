import re, json, html, unicodedata

def clean(s):
    s = re.sub(r'<[^>]+>', '', s)
    s = html.unescape(s).replace('\xa0', ' ')
    return re.sub(r'\s+', ' ', s).strip()


ALIAS = {
    'Mauritius': 'mauricius',
    'USA': 'spojene staty americke amerika new york kalifornie florida',
    'Emiráty': 'spojene arabske emiraty dubaj abu dhabi',
    'Jihoafrická republika': 'jar jizni afrika kapske mesto',
    'Fiji': 'fidzi',
    'Polynésie': 'francouzska polynesie bora bora tahiti',
    'Réunion': 'reunion',
    'Svatý Tomáš': 'sao tome a principe',
    'Anglie': 'velka britanie uk londyn',
    'Nový Zéland': 'novy zeland',
}

items = []

# --- countries from destinace.html ---
d = open('destinace.html', encoding='utf-8').read()
blocks = re.findall(r'<section class="section continent-block[^"]*" id="([^"]+)" data-continent="([^"]+)".*?</section>', d, re.S)
LABEL = {'evropa':'Evropa','afrika':'Afrika','asie':'Asie','amerika-sever':'Severní Amerika','amerika-jih':'Jižní Amerika','australie':'Austrálie a Oceánie'}
for sec_id, cont in blocks:
    body = re.search(r'id="%s".*?</section>' % re.escape(sec_id), d, re.S).group(0)
    for li in re.findall(r'<li[^>]*>.*?</li>', body, re.S):
        name = clean(re.search(r'country-name">(.*?)</span>', li, re.S).group(1))
        href = re.search(r'href="([^"]+)"', li).group(1)
        if href.startswith('destinace/'):
            url = href
        else:
            url = 'destinace.html?q=%s#%s' % (name.replace(' ', '+'), sec_id)
        items.append({'t': name, 's': LABEL.get(cont, cont), 'c': 'Destinace', 'u': url,
                      'k': ALIAS.get(name, '')})

# --- zážitky tiles from index.html ---
i = open('index.html', encoding='utf-8').read()
for tile in re.findall(r'<a class="tile"[^>]*>.*?</a>', i, re.S):
    title = clean(re.search(r'tile-title">(.*?)</h3>', tile, re.S).group(1))
    cat = re.search(r'tile-cat">(.*?)</p>', tile, re.S)
    desc = re.search(r'tile-desc">(.*?)</p>', tile, re.S)
    items.append({'t': title, 's': clean(cat.group(1)) if cat else 'Zážitky',
                  'c': 'Zážitky', 'u': 'index.html#zazitky',
                  'k': clean(desc.group(1)) if desc else ''})

# --- Seychelské ostrovy ---
s = open('destinace/seychely.html', encoding='utf-8').read()
for name in re.findall(r'country-name">(.*?)</span>', s, re.S):
    items.append({'t': clean(name), 's': 'Seychely', 'c': 'Ostrov', 'u': 'destinace/seychely.html'})

# --- stránky a sekce ---
pages = [
    ('Destinace', 'Všechny země, které pro vás zařídíme', 'Stránka', 'destinace.html', 'mapa globus kontinenty země'),
    ('Reference', '221 skutečných ohlasů klientů od roku 2011', 'Stránka', 'reference.html', 'recenze hodnocení zkušenosti klienti ohlasy'),
    ('Filozofie', 'Proč cestujeme pomalu', 'Stránka', 'index.html#filozofie', 'o nás příběh hodnoty'),
    ('Zážitky', 'Kurátorský výběr zážitků', 'Stránka', 'index.html#zazitky', 'golf safari svatby wellness plavby'),
    ('Kontakt', 'Napište nám a připravíme cestu na míru', 'Stránka', 'index.html#kontakt', 'poptávka email telefon formulář barbora'),
]
for t, sub, c, u, k in pages:
    items.append({'t': t, 's': sub, 'c': c, 'u': u, 'k': k})

def norm(x):
    return ''.join(ch for ch in unicodedata.normalize('NFD', x.lower()) if unicodedata.category(ch) != 'Mn')

for it in items:
    it['n'] = norm(' '.join([it['t'], it.get('s', ''), it.get('k', '')]))
    it.pop('k', None)

out = "/* Snail Travel — index pro fulltextové vyhledávání v hlavičce.\n   Generováno z destinace.html / index.html / destinace/seychely.html.\n   Při přidání země nebo zážitku doplnit i sem. */\nwindow.SNAIL_SEARCH_INDEX = [\n"
out += ",\n".join("  " + json.dumps(it, ensure_ascii=False) for it in items)
out += "\n];\n"
open('js/search-index.js', 'w', encoding='utf-8').write(out)
print(len(items), 'položek')

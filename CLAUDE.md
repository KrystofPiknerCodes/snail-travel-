# Snail Travel — homepage + destinace + reference

Exkluzivní česká luxusní cestovní agentura. Statika: homepage (`index.html`) + stránka destinací (`destinace.html`) + stránka referencí (`reference.html`).

## Stack & spuštění
- Čistá statika: `index.html`, `destinace.html`, `reference.html`, `css/style.css`, `js/*.js`, `assets/`. Žádný build.
- Lokální náhled: `python3 -m http.server 4137` v rootu → http://localhost:4137
  (`.claude/launch.json` existuje, ale MCP `preview_start` ho aktuálně nenačítá — spouštět server přes Bash.)
- Cache-busting přes query verze: aktuálně `style.css?v=21`, `main.js?v=5`, `destinations.js?v=1`, `globe.js?v=4`, `references.js?v=1`, `hero.mp4?v=6`. **Při změně CSS/JS zvýšit verzi**, jinak prohlížeč drží cache. (Verze mezi stránkami se občas rozjedou — před release srovnat.)
- Externí knihovny (jen na `destinace.html`) z CDN: D3 v7, topojson-client v3, `world-atlas@2/countries-110m.json`.

## Design
- Směr: světlý editorial + cinematic video hero (reference Rolex + Reschio). Jazyk: **čeština**.
- Brand zlatá z loga: `--gold: #BD9A45`, `--gold-deep: #927233`, `--gold-soft: #D8BE7E`. Klient chce zlatou výrazně (CTA tlačítka, akcenty jsou zlaté).
- Fonty: Playfair Display (nadpisy), Cormorant Garamond (lead), Inter (text).
- Barvy/tokeny jsou CSS proměnné v `:root` v `css/style.css`.

## Logo (klientovo, důležité)
- Zdroj: `~/Downloads/LOGO STI.gif` (průhledný, oficiální). Z něj vyrobeno:
  - `assets/logo-mark.png` — ulita (hlavička)
  - `assets/logo-full.png` — ulita + nápis SNAIL TRAVEL (patička)
- Pokud přijde vektor (SVG/AI/PDF), nahradit za ostřejší verzi.

## Sekce (pořadí v `index.html`)
1. Header/nav (fixní, průhledná nad herem → krémová po odscrollování), CTA „Naplánovat cestu" (zlaté).
2. Hero — jedno video `assets/hero.mp4` (Uluwatu útes, Mixkit id 13000, 720p). Nadpis: **„Cestování definované pro nejnáročnější"**. Fallback poster `assets/ph-hero.svg`.
3. Filozofie (`#filozofie`).
4. Destinace (`#destinace`) — **slider**, viz níže.
5. Zážitky/pilíře (`#zazitky`).
6. Citát (parallax band).
7. Kontakt (`#kontakt`) — formulář (zatím jen frontend, bez backendu).
8. Footer.

## Destinace slider
- 6 destinací: Seychely, Bali, Azorské ostrovy, Madeira, Maledivy, Mauritius.
- Fotky lokálně: `assets/dest-<slug>.jpg` (Pexels + Unsplash, licenčně čisté pro komerční užití, vizuálně ověřené). Fallback `assets/ph-<slug>.svg`.
- Slider: `--cols` = 3 (desktop) / 2 (≤1024) / 1+peek (≤540). Přesný počet celých karet, žádná půlka.
- Ovládání: šipky + drag (desktop), swipe (mobil). JS v `main.js` (`#destSlider`, `.dest-arrow`).
- Pod sliderem tlačítko **„Všechny destinace"** (`.btn-ghost`) → odkazuje na `destinace.html`.

## Stránka `destinace.html`
- **Hero**: kicker „DESTINACE" + title „Vyberte si, kam vás zavedeme" + lead + **vyhledávací bar** (search bar).
- **Vyhledávání** (`js/destinations.js`): diakritika-agnostické, real-time filtr, schová prázdné bloky, hint s počtem výsledků. Enter = skok na první match.
- **Globus** (`js/globe.js`): D3 orthographic projekce, world-atlas countries-110m. Draggable rotace + pomalý auto-rotate. Hover státu → celý kontinent zezlátne (brand gold) + tmavý pill tooltip s názvem kontinentu u kurzoru. Klik → smooth scroll na sekci daného kontinentu.
- **6 sekcí zemí** pod globem (`#kontinent-evropa`, `-afrika`, `-asie`, `-amerika-sever`, `-amerika-jih`, `-australie`). Každá země je odkaz na `index.html#kontakt` (zatím).
- **CTA band**: „Nenašli jste svou destinaci?" → kontakt.
- Klasifikace zemí → kontinent je v `js/globe.js` konstantě `COUNTRY` (name → EU/AF/AS/NA/SA/OC). Střední Amerika + Karibik jdou pod NA. Rusko a Turecko pod EU (kulturní volba). Antarktida není klikatelná na globu, ale je v seznamu zemí Jižní Ameriky.

## Stránka `reference.html`
- Zdroj dat: 221 reálných klientských referencí (2011–2026) stažených z živého webu `snailtravel.cz/reference`, zparsováno skriptem a uloženo jako `js/references-data.js` (`window.SNAIL_REFERENCES`, pole `{date, dateLabel, year, tags[], text[]}`). Text je beze změny (jen sloučené odstavce), destinace jsou odvozené automaticky z původního nadpisu reference přes keyword tagger — při dalších úpravách dat kontrolovat přiřazené `tags`.
- **Vitrína** (`#vyber`): 8 ručně vybraných citátů, napsáno přímo v HTML (`.ref-quote-card`), beze změny smyslu, jen zkráceno na nejsilnější větu.
- **Archiv** (`#archiv`, `js/references.js`): render všech 221 karet z `SNAIL_REFERENCES`, prvních 12 viditelných, zbytek za tlačítkem „Zobrazit všechny reference“ (`.ref-more-item` / `.is-expanded`, stejný vzorec jako `bentoToggle` v `main.js`). Vyhledávání je diakritika-agnostické (stejný princip jako `destinations.js`) + chipy pro filtr podle destinace (`#refChips`, počty auto-odvozené). Filtr/hledání ignoruje sbalený stav a prohledává úplně vše. Delší reference mají per-kartu clamp (`.is-clampable`, 420+ znaků) s „Zobrazit celý text“.
- Statistiky v hlavičce (`#refStatCount/Years/Dest`) se počítají v JS z dat, ne hardcoded.

## Stav / TODO
- [ ] Detail jednotlivé země (teď každá vede na `index.html#kontakt`).
- [ ] Kontaktní formulář napojit na backend / službu (teď jen simuluje úspěch).
- [ ] Finální hero video od klienta → přepsat `assets/hero.mp4` (a zvýšit `?v=`). Zvážit kompresi.
- [ ] Volitelně: vektor loga; vlastní fotky destinací od klienta.
- [ ] Nasazení (hosting) — zatím jen lokálně.

## Poznámky
- Vše respektuje `prefers-reduced-motion`.
- Placeholder kontakt: `cesty@snailtravel.cz`, `+420 000 000 000` (nahradit reálnými).

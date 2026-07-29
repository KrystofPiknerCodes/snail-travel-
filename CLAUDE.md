# Snail Travel — homepage + destinace + reference

Exkluzivní česká luxusní cestovní agentura. Statika: homepage (`index.html`) + destinace (`destinace.html`) + reference (`reference.html`) + o nás/tým (`o-nas.html`).

## Stack & spuštění
- Čistá statika: `index.html`, `destinace.html`, `reference.html`, `o-nas.html`, `css/style.css`, `js/*.js`, `assets/`. Žádný build.
- Lokální náhled: `python3 -m http.server 4137` v rootu → http://localhost:4137
  (`.claude/launch.json` existuje, ale MCP `preview_start` ho aktuálně nenačítá — spouštět server přes Bash.)
- Cache-busting přes query verze: aktuálně `style.css?v=41`, `main.js?v=7`, `destinations.js?v=3`, `globe.js?v=4`, `references.js?v=3`, `references-data.js?v=1`, `ref-counts.js?v=1`, `ref-quotes.js?v=1`, `dest-refs.js?v=2`, `dest-references.js?v=1`, `popup.js?v=4`, `search-index.js?v=4`, `header-search.js?v=2`, `hero.mp4?v=6`. **Při změně CSS/JS zvýšit verzi**, jinak prohlížeč drží cache. Pozor: verzi zvyšovat **až po** přegenerování obsahu, ne dopředu — jinak se stará verze stihne zacachovat pod novým číslem.
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

## Navigace (sdílená napříč stránkami)
- Hlavička (desktop) má 5 položek: **O nás · Destinace · Reference · Zážitky · Kontakt**. „Filozofie" z hlavičky vypadla, aby se vešlo O nás — zůstává v mobilním draweru a v patičce (obojí má 6 položek).
- Při přidání stránky upravit ve **všech** HTML: `.nav`, `.mobile-nav`, `.footer-nav` — markup není sdílený.

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
- **6 sekcí zemí** pod globem (`#kontinent-evropa`, `-afrika`, `-asie`, `-amerika-sever`, `-amerika-jih`, `-australie`). Každá země je odkaz na `index.html#kontakt`, **kromě Seychel** → `destinace/seychely.html` (viz níže).
- **CTA band**: „Nenašli jste svou destinaci?" → kontakt.
- Klasifikace zemí → kontinent je v `js/globe.js` konstantě `COUNTRY` (name → EU/AF/AS/NA/SA/OC). Střední Amerika + Karibik jdou pod NA. Rusko a Turecko pod EU (kulturní volba). Antarktida není klikatelná na globu, ale je v seznamu zemí Jižní Ameriky.

## Detail destinace — `destinace/seychely.html` (vzor pro další země)
- Zatím jediná rozklikávací destinace (ostatní země i homepage slider dál vedou na `index.html#kontakt`). Odkazují sem: karta „Seychely" v `destinace.html` (sekce Afrika) a karta „Seychely" v homepage sliderU (`index.html#destinace`).
- Struktura stránky: drobečková navigace (`.crumb`) + kicker/h1/lead (`.dest-head`, stejné jako hlavička `destinace.html`) → grid ostrovů (znovupoužité `.country-grid`/`.country-photo`/`.country-name` z `destinace.html`, 3 ostrovy `is-featured`: Mahé, La Digue, Praslin) → CTA band → footer. Zatím žádné JS specifické pro stránku (jen `main.js` + `popup.js`), každý ostrov vede na `index.html#kontakt`.
- Fotky ostrovů: `assets/seychely/<slug>.jpg` (13 ostrovů), staženo a zkomprimováno (šířka ≤1000px) z živého webu `snailtravel.cz/destinace/seychely1`.
- Stránka žije v podsložce `destinace/`, takže všechny cesty k `css/`, `js/`, `assets/`, `index.html`, `destinace.html`, `reference.html` mají prefix `../`. Další zemské detaily by měly následovat stejný vzor (`destinace/<slug>.html`).

## Stránka `reference.html`
- Zdroj dat: 221 reálných klientských referencí (2011–2026) stažených z živého webu `snailtravel.cz/reference`, zparsováno skriptem a uloženo jako `js/references-data.js` (`window.SNAIL_REFERENCES`, pole `{date, dateLabel, year, tags[], text[]}`). Text je beze změny (jen sloučené odstavce), destinace jsou odvozené automaticky z původního nadpisu reference přes keyword tagger — při dalších úpravách dat kontrolovat přiřazené `tags`.
- **Vitrína** (`#vyber`): 8 ručně vybraných citátů, napsáno přímo v HTML (`.ref-quote-card`), beze změny smyslu, jen zkráceno na nejsilnější větu.
- **Archiv** (`#archiv`, `js/references.js`): render všech 221 karet z `SNAIL_REFERENCES`, prvních 12 viditelných, zbytek za tlačítkem „Zobrazit všechny reference“ (`.ref-more-item` / `.is-expanded`, stejný vzorec jako `bentoToggle` v `main.js`). Vyhledávání je diakritika-agnostické (stejný princip jako `destinations.js`) + chipy pro filtr podle destinace (`#refChips`, počty auto-odvozené). Filtr/hledání ignoruje sbalený stav a prohledává úplně vše. Delší reference mají per-kartu clamp (`.is-clampable`, 420+ znaků) s „Zobrazit celý text“.
- Statistiky v hlavičce (`#refStatCount/Years/Dest`) se počítají v JS z dat, ne hardcoded.

## Propojení referencí s destinacemi
Reference jsou hlavní důkazní materiál — proto nesedí jen na `reference.html`, ale jsou vidět tam, kde návštěvník hledá destinaci.

- **Odznaky na kartách zemí** (`destinace.html`): `js/dest-refs.js` přišije do `.country-grid li` pill „57 referencí" u zemí, které reference mají (30 ze 107). Odkaz vede na `reference.html?dest=<tag>`. Odznak je **sourozenec** karty, ne vnořený odkaz (to by nebylo validní HTML), proto `.country-grid li { position: relative }`.
  - CSS musí být `.country-grid .country-refs`, jinak ho přebije `.country-grid a` (display/aspect-ratio/overlaye). U `li.is-featured` je navíc potřeba `aspect-ratio: auto`.
  - `js/destinations.js` čte název země z `.country-name`, ne z `li.textContent` — jinak by se text odznaku dostal do vyhledávacího klíče.
- **`?dest=` na `reference.html`** (`js/references.js`): předvybere chip dané destinace a po `load` odscrolluje na `#archiv`. Když chip neexistuje, spadne na fulltext.
- **Inline reference na detailu destinace** (`js/dest-references.js`): sekce `.ref-inline` s `data-dest="<tag>"` a `data-root="../"` vyrenderuje pár referencí přímo na stránku a odkáže na plný archiv. Bez referencí se sekce sama skryje. Použito na `destinace/seychely.html`, stejně to bude fungovat na dalších detailech.

### Generovaná data (`tools/gen-refs.py`)
`js/references-data.js` má ~170 KB, takže se nikam jinam netahá. Z něj se generuje:
- `js/ref-counts.js` — `destinace -> { n: počet, t: tag }` pro odznaky (~1,7 KB)
- `js/ref-quotes.js` — `tag -> max 3 reference` pro detaily destinací (~40 KB)

Spouštět `python3 tools/gen-refs.py` z rootu po každé změně `references-data.js` **nebo po přidání země** do `destinace.html` (počty se párují na `.country-name`). Skript vypíše tagy, ke kterým karta země neexistuje — dnes jen „Skandinávie". Přejmenování řeší konstanta `ALIAS` (např. tag „Fidži" → karta „Fiji").

## Stránka `o-nas.html` — tým
- Obsah převzatý z živého webu `snailtravel.cz/o-nas`: firma založena **1998**, butiková CK, „kvalita před kvantitou". Adresa Snail Travel International a.s., Veleslavínova 6, 110 00 Praha 1.
- Struktura: hlavička s `.ref-stats` proužkem (1998 / 107 destinací / 221 referencí — čísla jsou v HTML natvrdo, při změně srovnat) → `.philosophy` s příběhem → `.team` s mřížkou lidí → CTA band → patička.
- **Tým**: 5 lidí (Kristina Králová, Barbora Blaschke, Marcela Hynštová, Jitka Weiss, Pavla Piknerová), u každého fotka + e-mail + telefon. Fotky staženy z živého webu do `assets/team/<jmeno>.jpg` (440×440, kruhový výřez už zapečený na bílém pozadí — proto `border-radius: 50%` + zlatý kroužek sedí).
- **Role/pozice u lidí zatím nikde nejsou** — živý web je neuvádí a nevymýšlíme je. Až je klient dodá, doplnit pod `.team-name`.
- Členové týmu jsou i ve vyhledávání v hlavičce (kategorie „Tým", odkaz na `o-nas.html#tym`) — vztahový byznys, klienti hledají jméno.

## Hlavička — telefon + fulltextové vyhledávání
- Sdílený `js/header-search.js` (na všech 4 stránkách) injektuje do `.header-inner` dvě kolečka (lupa + telefon) před CTA — markup není v HTML, stejný princip jako `popup.js`. Styly `.hact-*` a `.hsearch-*` v `css/style.css`.
- **Telefon**: klik vysune `+420 602 552 624` vedle ikony (`tel:` odkaz, zavře se klikem mimo). Na dotykových zařízeních (`hover: none`) klik rovnou vytáčí.
- **Hledání**: klik (nebo ⌘/Ctrl+K) otevře overlay pod hlavičkou — live výsledky, diakritika-agnostické, šipky ↑↓ + Enter, Esc zavře. Prázdný dotaz nabídne chipy s tipy. Overlay má `z-index: 1200`, tj. nad kontaktní kartou, a kartu i launcher po dobu otevření skryje (`body.hsearch-open`).
- Data: `js/search-index.js` = `window.SNAIL_SEARCH_INDEX`, 149 položek (107 zemí, 18 zážitků, 13 seychelských ostrovů, 5 lidí z týmu, 6 stránek/sekcí). Pole `t` (název), `s` (podtitulek), `c` (kategorie), `u` (URL relativní ke kořeni — na podstránkách se prefixuje `../`), `n` (normalizovaný text pro hledání vč. aliasů typu „mauricius“ → Mauritius).
- Index **negeneruje se za běhu** — je vyparsovaný z `destinace.html` / `index.html` / `destinace/seychely.html` skriptem. Při přidání země, zážitku, člověka nebo stránky doplnit i sem (generátor: `python3 tools/gen-search-index.py` z rootu — regex parser, přepíše `js/search-index.js`; aliasy názvů jsou v konstantě `ALIAS`, tým a stránky jsou ručně v konstantách `team` a `pages`).
- Reference (221 textů) v tomto indexu **nejsou**, ty má vlastní vyhledávání přímo na `reference.html`.
- Odkaz na zemi vede na `destinace.html?q=<země>#kontinent-<x>`; `destinations.js` `?q=` přečte, předvyplní hledání a odscrolluje na kartu. Seychely vedou rovnou na `destinace/seychely.html`.

## Kontaktní karta (Barbora)
- Sdílený `js/popup.js` (načtený na všech 3 stránkách) sám injektuje rohovou kartu + launcher — markup není duplikovaný v HTML. Styly v `css/style.css` (`.cpop-*`, `.cpop-launcher`). **Není to modal** — karta sedí vpravo dole (`.cpop-overlay` je poziční kontejner, žádné ztmavení, `pointer-events` mimo kartu neblokují stránku).
- Chování: auto-vysune se po **15 s** (konstanta `DELAY`), jednou za návštěvu — po zavření se drží `sessionStorage['snailContactDismissed']`, takže při dalších stránkách už sama nevyskočí, jen zůstává zlatý launcher „Kontakt" vpravo dole. Zavření: zlatý křížek nebo Esc. Chceš-li vysouvat při každém načtení, smaž session guard.
- Kontakt: Barbora Blaschke, `barbora@snailtravel.cz`, `+420 602 552 624` (reálné údaje, na rozdíl od placeholderů v patičce/kontaktu).

## Co web reálně prodává (z dat, ne z dojmu)
Rozbor 221 referencí říká něco jiného, než co dnes web vypichuje — dobré vědět při každé úpravě obsahu:
- **Madeira 57 · Turecko 25 · Azory 14 · Maledivy 14 · Mauritius 13 · Itálie 12 · Portugalsko 11**. Naopak **Seychely 4, Bali 3** — tedy vlajkové destinace homepage slideru a jediný hotový detail jsou fakticky okrajový byznys.
- 30 % referencí zmiňuje **průvodce/doprovod**, 26 % **skupinový zájezd**, 15 % **golf** (nejvíc Turecko, Mauritius, Kanáry).
- Reference jsou samovýběr a jeden skupinový zájezd vygeneruje víc ohlasů než jedna individuální cesta, takže skupinová část je nadhodnocená — poměr 57 : 4 tím ale vysvětlit nejde.

## Stav / TODO
- [ ] Doplnit role/pozice členů týmu na `o-nas.html` (klient je zatím nikde neuvádí).
- [ ] Nahradit stockové fotky destinací (Pexels/Unsplash) fotkami z vlastních zájezdů — na stránce, jejímž úkolem je důvěryhodnost, stock pracuje proti.
- [ ] Doplnit tvrdé signály existence (pojištění proti úpadku, IČO, počet klientů) na `o-nas.html`.
- [ ] Detail jednotlivé země pro zbytek destinací (vzor hotový v `destinace/seychely.html`, ostatní země zatím vedou na `index.html#kontakt`). Prioritně Madeira a Azory — tam je byznys i reference.
- [ ] Kontaktní formulář napojit na backend / službu (teď jen simuluje úspěch).
- [ ] Finální hero video od klienta → přepsat `assets/hero.mp4` (a zvýšit `?v=`). Zvážit kompresi.
- [ ] Volitelně: vektor loga; vlastní fotky destinací od klienta.
- [ ] Nasazení (hosting) — zatím jen lokálně.

## Poznámky
- Vše respektuje `prefers-reduced-motion`.
- Placeholder kontakt: `cesty@snailtravel.cz`, `+420 000 000 000` (nahradit reálnými).

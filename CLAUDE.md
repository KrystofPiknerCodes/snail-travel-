# Snail Travel — web (Astro)

Exkluzivní česká luxusní cestovní agentura. **Aktivní web je Astro projekt v `web/`.**
Root repa navíc obsahuje starý statický prototyp (`index.html`, `destinace.html`,
`reference.html`, `o-nas.html`, `css/`, `js/`, `assets/`) — ten se **od srpna 2026
dál nevyvíjí**, jede se výhradně v Astru. Prototyp zůstává v repu jako designová
reference (vizuál a CSS proměnné se do Astra přenesly 1:1) a jako zdroj, ze kterého
se część obsahu migrovala do content kolekce. Neopravovat bugy ve statickém webu,
pokud o to uživatel výslovně nepožádá — každá běžná úprava jde do `web/`.

## Stack & spuštění

- **Astro** (`web/`), obsahové kolekce v Markdownu, žádný server na produkci —
  build je čistá statika (`web/dist/`).
- Poprvé: `cd web && npm install`. Pokud `npm install` spadne na
  `EACCES`/`EEXIST` v `~/.npm/_cacache` (poškozená globální cache, stávalo se),
  obejít přes `npm install --cache /tmp/npm-cache-<neco>`.
- Dev server: `cd web && npm run dev` → http://localhost:4321 (port 4321 je
  Astro default, ne 4137 jako u starého statického webu).
- Produkční build: `cd web && npm run build` → `web/dist/`. `npm run preview`
  pro lokální náhled buildu.
- **Nasazení**: GitHub Pages, branch `gh-pages` existuje na originu. `astro.config.mjs`
  čte `SITE_BASE` z env (prázdné = `/` pro dev/lokální build; při GH Pages podadresáři
  se nastaví na `/snail-travel-/`), aby Vite/Astro správně prefixovaly assety (např.
  dynamické importy Leafletu v `MapaOblasti.astro`). Přesný deploy příkaz (jak se
  `dist/` dostane na branch `gh-pages`) není v repu zdokumentovaný — než se najde/napíše
  skript, ověřit postup s Krystofem před prvním ručním nasazením.
- **Cache-busting** stejným principem jako dřív u statiky — query `?v=` na
  `<link>`/`<script>` v `web/src/layouts/Base.astro` (`style.css`, `main.js`,
  `search-index.js`, `header-search.js`, `popup.js`, `ref-quotes.js`,
  `dest-references.js`, `dest-toc.js`) a navíc ve `web/src/pages/destinace/index.astro`
  (`ref-counts.js`, `dest-refs.js`, `destinations.js`, `globe.js`). **Při změně
  souboru v `web/public/css` nebo `web/public/js` zvýšit jeho `?v=` na místě, kde
  se importuje** — Astro `public/` se servíruje beze změny, prohlížeč jinak drží cache.
  Zvyšovat verzi až PO úpravě obsahu souboru, ne dopředu.
- Externí knihovny: D3 v7 + topojson-client v3 + `world-atlas@2/countries-110m.json`
  z CDN (jen na `/destinace`, glóbus), Leaflet z npm (`MapaOblasti.astro`, mapa
  oblasti na detailu destinace — vědomě ne Google Maps/CDN, kvůli klíči/ceně/cookies).

## Architektura Astro webu

- **`web/src/layouts/Base.astro`** — jediná sdílená hlavička/patička/`<head>` pro
  všechny stránky (na rozdíl od statického prototypu, kde se `.nav`/`.mobile-nav`/
  `.footer-nav` kopírovaly do každého HTML ručně). Nav má teď 6 položek včetně
  **Golf** — externí odkaz na `https://www.snailtravelgolf.cz/` (samostatný web,
  cílevědomě neslučovat, viz `PLAN.md`).
- **Stránky** (`web/src/pages/`): `index.astro` (homepage), `o-nas.astro`,
  `reference.astro`, `destinace/index.astro` (přehled + glóbus + mřížka zemí),
  `destinace/[...slug].astro` (JEDNA šablona pro celý strom Destinace/Oblast/Hotel,
  libovolně hluboké URL přes `getStaticPaths`).
- **Obsahové kolekce** (`web/src/content.config.ts`, Zod schéma — čti komentáře
  přímo v souboru, jsou obsáhlé a aktuální):
  - `destinace` (`web/src/content/destinace/*.md`) — `typ: 'destinace' | 'oblast'`
    řídí, kterou variantu šablony `[...slug].astro` vykreslí. Hierarchie kontinent
    → země → oblast (např. Destinace/Evropa/Madeira/Funchal) jde přes pole
    `nadrazena` (slug rodiče), procházené `web/src/lib/hierarchie.ts` do libovolné
    hloubky. `nadrazena` může být i jen volný text bez vazby (např. Madeira →
    "Portugalsko", žádný `portugalsko.md` neexistuje) — pak routing/breadcrumb
    na něm zastaví, to je záměr, ne mezera.
  - `hotel` (`web/src/content/hotel/*.md`) — vlastní kolekce (ne pole uvnitř
    destinace), vazba na rodiče stejným polem `nadrazena` (slug oblasti, nebo
    přímo destinace, když oblast neexistuje).
  - `vybrana: boolean` na destinaci = přenesené `li.is-featured` ze starého
    `destinace.html`. Řídí JEN prioritu ve výpisu na `/destinace` (viz níže),
    žádný jiný vliv na obsah stránky destinace samotné.
  - Chybějící/needitovaný obsah se neschovává — nepovinná pole bez hodnoty
    ukážou v šabloně placeholder „⚠ Doplnit od klienta"; pole `chybi` na
    destinaci je explicitní seznam toho, co ještě dodat.
- **Sdílené komponenty**: `Rozcestnik.astro` (sticky kotevní nav na detailu
  destinace, sestavená ze sekcí, co daná destinace reálně má), `MapaOblasti.astro`
  (Leaflet mapa, vykreslí se, jen když má destinace/hotel vyplněné souřadnice).
- **Styly**: `web/public/css/style.css` (design system — CSS proměnné, hlavička/
  patička, `.country-grid`, atd. — historicky 1:1 kopie root `css/style.css`, dnes
  už se vyvíjí nezávisle, root kopii needitovat) + `web/public/css/destinace-detail.css`
  (jen komponenty specifické pro detail destinace — galerie, karty hotelů, počasí).
- **JS** (`web/public/js/`): stejný princip jako dřív u statiky — vanilla JS,
  žádný framework na klientu. Nové oproti statice: `dest-hero-slider.js` (crossfade
  fotogalerie na detailu), `dest-hotel-scroller.js` (horizontální scroller karet
  oblastí/hotelů, Black Tomato styl, stejný princip jako `#destSlider` na
  homepage), `dest-toc.js` (doladí rozcestník za běhu — skryje odkaz na sekci,
  co se sama schovala, např. Reference bez citací).

## Design

- Směr: světlý editorial + cinematic video hero (reference Rolex + Reschio). Jazyk: **čeština**.
- Brand zlatá z loga: `--gold: #BD9A45`, `--gold-deep: #927233`, `--gold-soft: #D8BE7E`.
- Fonty: Playfair Display (nadpisy), Cormorant Garamond (lead), Inter (text),
  Cinzel jen na dvou místech (`.brand-name` v hlavičce, `.hero-title`) — jinam ho
  nešířit ([Cinzel decision paměť](../../../.claude/projects/-Users-krystof-Desktop-Claude-Code/memory/typography-cinzel-decision.md) obsahuje odůvodnění).
- Logo: `web/public/assets/logo-mark.png` (ulita, hlavička), `logo-full.png`
  (ulita + nápis, patička). Zdroj klientův GIF, pokud dorazí vektor, nahradit.
- **`.country-grid` (mřížka zemí na `/destinace` a v seznamu oblastí/hotelů)**:
  dlaždice mají jednotnou velikost (`minmax(200px,1fr)`, `aspect-ratio: 4/5`).
  `li.is-featured` dřív dostávalo `grid-column: span 2` (dvojnásobná šířka) —
  to se **zrušilo** (srpen 2026), protože s proměnlivým počtem featured karet na
  kontinent dělalo nesymetrický poslední řádek. Featured teď mají jen trvalý
  jemný zlatý rámeček (`box-shadow`), stejnou velikost jako ostatní. Nepřidávat
  zpátky rozšiřování šířky bez přepočtu, kolik featured karet na kontinent smí
  být, aby řádky vycházely rovně.
- **Sbalování dlouhých seznamů zemí** (`/destinace`, `web/src/pages/destinace/index.astro`):
  na kontinent se rovnou ukáže jen `VIDITELNYCH = 10` destinací (řazeno `vybrana`
  první, pak abecedně), zbytek za tlačítkem „Zobrazit všechny destinace v/ve
  <kontinent> (N)" (`.country-grid-toggle`, logika v `web/public/js/destinations.js`).
  Aktivní hledání (`.is-filtering`) odkryje i sbalené položky, ať je najde fulltext.

## Co web reálně prodává (z dat, ne z dojmu)

Rozbor 221 reálných klientských referencí (2011–2026, `docs/analyza-klienti.md` a
`web/public/js/references-data.js`) říká něco jiného, než co web historicky vypichoval:

- **Madeira 57 · Turecko 25 · Azory 14 · Maledivy 14 · Mauritius 13 · Itálie 12 · Portugalsko 11.**
  Naopak Seychely 4, Bali 3 — takže vlajkové destinace homepage slideru byly
  fakticky okrajový byznys. Madeira dostala svou plnou content-kolekci
  (destinace → Funchal atd. → hotely) přesně proto, že tam je jádro byznysu.
- 30 % referencí zmiňuje průvodce/doprovod, 26 % skupinový zájezd, 15 % golf
  (nejvíc Turecko, Mauritius, Kanáry).
- Reference jsou samovýběr (skupinový zájezd vygeneruje víc ohlasů než jedna
  individuální cesta) — poměr 57:4 (Madeira:Seychely) tím ale vysvětlit nejde.

Viz i [snailtravel-real-business-mix.md paměť] a [snailtravel-web-je-vizitka.md
paměť] — Krystofovo rozhodnutí: web má budovat důvěru, ne konvertovat, nenavrhovat
booking/SEO mechaniky bez vyžádání.

## Firma — fakta pro `o-nas`

Založena **1998**, butiková CK, „kvalita před kvantitou". Snail Travel International
a.s., Veleslavínova 6, 110 00 Praha 1. Tým (5 lidí, bez rolí — klient je zatím
neuvedl), na webu abecedně: Bára Blaschke, Jitka Weiss, Kristina Králová, Marcela
Hynštová, Pavla Piknerová. Kontaktní karta na webu (`popup.js`) je Bára Blaschke
(interní e-mail/login `barbora@snailtravel.cz` zůstává beze změny — **jde jen o
zobrazované jméno**, klient si přeje familiární tón „Bára" místo „Barbora"),
`+420 602 552 624` — reálné údaje, na rozdíl od placeholderů v patičce/kontaktu
(`cesty@snailtravel.cz`, `+420 000 000 000`). Citáty v `references-data.js`/
`ref-quotes.js` jsou reálné citace klientů a psali "Barbora" — needitovat je.

## Generovaná data — POZOR, teď rozjeté jen na root, ne na `web/`

`tools/gen-refs.py` a `tools/gen-search-index.py` pořád píšou výstup do root
`js/` (`js/ref-counts.js`, `js/ref-quotes.js`, `js/search-index.js`), NE do
`web/public/js/`. `web/public/js/ref-counts.js` atd. jsou dnes ručně zkopírované
snapshoty. Než se skripty přepíšou, aby uměly psát rovnou do `web/public/js/`
(nebo se dvojice cest sjednotí), **po spuštění generátoru ručně zkopírovat výstup
do `web/public/js/` a zvýšit `?v=` v `Base.astro`/`destinace/index.astro`.**
`tools/gen-search-index.py` navíc pořád parsuje stará root HTML (`destinace.html`,
`index.html`) jako zdroj pravdy — to už neodpovídá obsahu v `web/src/content/`
(nové země/oblasti/hotely přidané jen do content kolekce se do indexu nedostanou).
Migrace `tools/gen-destinace-md.py` a `tools/gen-seychely-md.py` už cílí na `web/`
správně — je to jen `gen-refs.py`/`gen-search-index.py`, co zůstaly pozadu.

## Stav / TODO

- [ ] Přepsat `tools/gen-refs.py` a `tools/gen-search-index.py`, ať píšou (i)
      čtou přímo `web/` — viz sekce výše.
- [ ] Doplnit role/pozice členů týmu na `o-nas.astro` (klient zatím neuvedl).
- [ ] Přidat fotky z akcí do sekce O nás (Kristýnin požadavek 27.8.2026 — chce
      ukázat „normální lidi", zvýšit důvěryhodnost) — čekáme na podklady od klienta,
      nefabrikovat.
- [ ] Nahradit stockové fotky destinací fotkami z vlastních zájezdů klienta.
- [ ] Sehnat fotky do dlaždic Golf a Formule 1 v sekci Zážitky s poměrem stran
      blízkým 3:2 — `assets/zaz-golf.jpg` (1600×1463) a `assets/zaz-f1.jpg`
      (1600×877) na to nesedí, dočasně mají `data-fit="cover"` v `index.astro`
      (mírné oříznutí místo celé fotky) — po výměně ten atribut odstranit.
- [ ] Doplnit tvrdé signály existence (pojištění proti úpadku, IČO, počet
      klientů) na `o-nas.astro`.
- [ ] Rozšířit content kolekci o další destinace/oblasti/hotely — vzor hotový
      u Madeiry (Destinace → Funchal/Encumeada/Calheta/Santo da Serra → hotely)
      a Seychel (ostrovy jako `oblast`) a Botswany (golf pole). Zbytek zemí
      z migrace (viz `tools/gen-destinace-md.py`) má zatím jen základní záznam
      bez hlubší hierarchie/hotelů.
- [ ] Kontaktní formulář napojit na backend/službu (teď jen simuluje úspěch).
- [ ] Finální hero video od klienta → přepsat `web/public/assets/hero.mp4`
      (a zvýšit `?v=`). Zvážit kompresi.
- [ ] Zdokumentovat/naskriptovat reálný postup nasazení na `gh-pages` branch
      (teď se to dělá manuálně, přesný příkaz není zapsaný nikde v repu).
- [ ] Golf web (`snailtravelgolf.cz`) je live a odkazovaný z hlavičky/patičky —
      ověřit, jestli má/potřebuje vlastní systém obsahu, nebo je to zatím
      samostatný statický web mimo tohle repo.

## Poznámky

- Vše respektuje `prefers-reduced-motion`.
- Root statický prototyp (`index.html` atd.) se needituje kvůli běžným úpravám;
  pokud v něm přece jen bude potřeba něco změnit (např. má sloužit jako referenční
  archiv živého webu), řešit to explicitně a odděleně od práce na `web/`.

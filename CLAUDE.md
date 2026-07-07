# Snail Travel — homepage

Exkluzivní česká luxusní cestovní agentura. Statická homepage (zatím jen homepage).

## Stack & spuštění
- Čistá statika: `index.html` + `css/style.css` + `js/main.js` + `assets/`. Žádný build.
- Lokální náhled: `python3 -m http.server 4137` v rootu → http://localhost:4137
  (`.claude/launch.json` existuje, ale MCP `preview_start` ho aktuálně nenačítá — spouštět server přes Bash.)
- Cache-busting přes query verze: `style.css?v=6`, `main.js?v=4`, `hero.mp4?v=3`. **Při změně CSS/JS zvýšit verzi**, jinak prohlížeč drží cache.

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
- Pod sliderem tlačítko **„Všechny destinace"** (`.btn-ghost`) — zatím odkazuje na `#destinace`, později přepojit na stránku se všemi destinacemi.

## Stav / TODO
- [ ] „Všechny destinace" → skutečná stránka (až bude).
- [ ] Kontaktní formulář napojit na backend / službu (teď jen simuluje úspěch).
- [ ] Finální hero video od klienta → přepsat `assets/hero.mp4` (a zvýšit `?v=`). Zvážit kompresi.
- [ ] Volitelně: vektor loga; vlastní fotky destinací od klienta.
- [ ] Nasazení (hosting) — zatím jen lokálně.

## Poznámky
- Vše respektuje `prefers-reduced-motion`.
- Placeholder kontakt: `cesty@snailtravel.cz`, `+420 000 000 000` (nahradit reálnými).

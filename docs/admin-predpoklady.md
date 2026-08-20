# Co potřebujeme, aby admin mohl fungovat

Shrnutí pro Krystofa: **admin se nestaví jako první, ale rozhoduje se o něm hned.**
Dnešní web je ručně psané HTML — text je natvrdo v souborech. Do toho se admin
zaroubovat nedá. Musíme projekt převést do formy, kde je **obsah oddělený od šablon**.
Tenhle dokument říká, co k tomu je potřeba.

## 1. Změna formy projektu (fáze 2, největší kus)

Ze statického HTML na **statický generátor s obsahovými kolekcemi — doporučení: Astro**.

| Dnes | Po převodu |
|---|---|
| text natvrdo v `index.html`, `destinace/seychely.html` | obsah v MD/JSON souborech (`src/content/destinace/madeira.md`) |
| header/footer zkopírovaný do každého HTML | jedna sdílená šablona |
| nová destinace = ruční kopie celé stránky | nová destinace = jeden obsahový soubor |
| `js/references-data.js`, `ref-counts.js` generované skriptem | data v kolekcích, generuje build |
| golf = třetí kopie všeho | golf = druhý web nad stejným design systemem |

Výstup zůstává **čistá statika** jako dnes (rychlé, levné, bez serveru pro frontend).
Design system z prototypu se přenáší 1:1 — vizuál se nezahazuje, jen se obsah přelije do dat.

**Bez tohohle kroku admin nemá kam zapisovat.**

## 2. Datový model (bez něj se admin nedá ani navrhnout)

Musíme definovat entity a jejich pole, protože **admin je jen formulář nad nimi**:

- **Destinace** — název, země, kontinent, perex, dlouhý text, hlavní foto, galerie, kdy jet (počasí po měsících), tipy specialisty, vazba na hotely a reference
- **Hotel** — název, destinace (vazba), hvězdy, popis, galerie, vybavení, poloha na mapě, orientační cena od, „ověřil/a za tým: [osoba]"
- **Zájezd / pobyt** — typ (poznávací, pobytový, golf, na míru), destinace, hotel(y), termíny, program den po dni, cena a co zahrnuje, obsazenost
- **Golfové hřiště** — název, počet jamek, vzdálenost od hotelu, green fee v ceně ano/ne, foto *(z dotazníku: vzdálenost hotel–hřiště 62 %, počet hřišť 51 %, green fee 50 %)*
- **Reference** — text, datum, destinace(tagy), autor *(221 kusů už máme)*
- **Osoba / tým** — jméno, foto, e-mail, telefon, role, „moje destinace"
- **Stránka** — statické texty (o nás, filozofie, kontakt)

Pole se doladí až po rozhovorech s týmem (`docs/otazky-admin-tym.md`, část B a C) —
proto ty otázky potřebujeme **dřív, než začneme stavět**.

## 3. Volba nástroje pro admin (rozhodne se po fázi 2, ne teď)

Dvě reálné cesty, liší se provozem i cenou:

**A) Git-based CMS (Decap CMS)** — admin je stránka `/admin` na stejné statice, zápis
jde jako commit do GitHubu, build se pustí sám.
- ➕ zdarma, žádný server, žádná databáze, obsah verzovaný (jde vrátit chybu)
- ➖ jednodušší UX, publikace trvá ~1–2 min (běží build), horší práce s velkými galeriemi
- Vhodné, když tým mění obsah nárazově a nepotřebuje ceníky a termíny.

**B) Headless CMS (Payload / Directus)** — vlastní admin aplikace nad databází.
- ➕ hezčí UX, role a schvalování, dobré na ceny/termíny/vztahy, náhledy
- ➖ potřebuje běžící server + databázi + zálohy → **měsíční provozní náklad** (řádově stovky Kč/měs.) a někoho, kdo to udržuje
- Vhodné, když se ceny a termíny mění často a v adminu dělá víc lidí.

**Rozhodovací kritérium:** odpovědi na otázky A1–A3 a B6–B8 z `docs/otazky-admin-tym.md`.

## 4. Co k tomu potřebujeme od klienta (organizačně)

Tohle je potřeba začít řešit hned, protože to blokuje nasazení:

1. **Domény a přístupy** — kdo vlastní `snailtravel.cz`, kde běží současný web, doména pro golf. Potřebujeme přístup do DNS.
2. **Hosting** — kdo platí a co (statika jde skoro zdarma; varianta B přidá server).
3. **Účty** — e-mailové adresy lidí, kteří budou mít admin (kvůli přihlašování), a rozhodnutí, kdo smí co.
4. **Obsah** — fotky (ideálně vlastní ze zájezdů, ne stock), texty hotelů, ceníky, programy zájezdů. **Tohle bývá největší brzda celého projektu** — plánovat jako úzké hrdlo.
5. **Mailing** — jaký nástroj se používá na ty pravidelné mailingy (65 % klientů se inspiruje právě jimi) a jestli má web sbírat e-maily.
6. **Kontaktní formulář** — kam mají chodit poptávky (dnes jen simuluje odeslání).
7. **Právní/důvěryhodnostní údaje** — IČO, pojištění proti úpadku, obchodní podmínky, cookies/GDPR text. *(60 % klientů mělo před první rezervací obavu „neznal jsem CK" — tyhle signály na web patří.)*

## 5. Co uděláme my (technicky, mimo samotný web)

- Build a nasazení (statika + automatický build po změně obsahu)
- Zálohy obsahu (u varianty A řeší git sám, u B je potřeba nastavit)
- Napojení formuláře na e-mail
- SEO hygiena, sitemap, analytika
- Zaškolení týmu + návod s obrázky (`docs/admin-navod.md`)

## Pořadí, ve kterém to jde

1. Rozhovory s Kristinou (`otazky-kristina.md`) a týmem (`otazky-admin-tym.md`) ← **teď**
2. Brand dokument + datový model → schválit
3. Převod webu na Astro + přenos design systemu
4. Obsah hlavního webu, pak golf web
5. Admin nad ověřeným modelem + zaškolení
6. Nasazení, domény, předání

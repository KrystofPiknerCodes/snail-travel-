# Snail Travel — plán projektu (2 weby + admin)

Schválený rozpočet: **100 000 Kč**, placeno postupně po milnících.
Rozsah: hlavní web Snail Travel, golfový web, administrace (správa destinací, hotelů, fotek, textů, cen).

---

## Klíčový princip: obsah jako data od prvního dne

Největší riziko přepisování není design, ale tohle: postavit web jako ručně psané HTML
(jako dnešní prototyp) a pak do něj zpětně roubovat admin. Proto:

1. **Datový model se navrhne hned po analýze** (fáze 2) — co přesně je „destinace",
   „hotel", „zájezd", „cena", „fotogalerie", jaká mají pole a vztahy.
2. **Web se staví nad těmito daty** (šablony + obsahové soubory), ne nad natvrdo psaným textem.
3. **Admin se staví až nakonec** — v tu chvíli je datový model ověřený reálným obsahem
   a admin je jen editační vrstva nad ním. Nic se nepřepisuje.

Stavět admin dřív by znamenalo předělávat ho pokaždé, když se při plnění obsahu ukáže,
že destinace potřebuje jiná pole. Stavět ho souběžně znamená dvojí práci. Nakonec = správně.

Dnešní statický web **není odpad** — je to designový prototyp. Vizuál, komponenty a CSS
se přenesou, jen obsah se přelije do strukturovaných dat.

---

## Fáze projektu

### Fáze 0 — Dotazník stálým klientům (e-mail)
**Cíl:** zjistit, k čemu klienti web reálně používají, co jim chybí, co buduje důvěru.
- Sestavit otázky (draft níže), odsouhlasit s Kristinou.
- Poslat jako **osobní e-mail od Kristiny** (ne Google Form — vztahový byznys, starší
  věrná klientela, odpověď přímo do mailu má násobně vyšší návratnost).
- Sesbírat odpovědi (~2 týdny), vytáhnout závěry do `docs/analyza-klienti.md`.

**Výstup:** shrnutí odpovědí + 5 hlavních zjištění pro stavbu webu.

### Fáze 1 — Konzultace s Kristinou → brand dokument
**Cíl:** aby existoval MD soubor, ze kterého jde poznat „feel" firmy, a podle kterého
se dá rozhodovat bez dalšího doptávání.
- Projít s ní zjištění z dotazníku.
- Zeptat se: co si od webu představuje, co je pro ni důležité, co Snail Travel JE a NENÍ,
  jací jsou klienti, jak mluví, čím se liší od konkurence, které destinace chce tlačit.
- Konfrontovat s daty z referencí (Madeira 57×, Turecko 25×, golf 15 % — vs. Seychely 4×):
  chce web stavět na tom, co reálně prodává, nebo na tom, kam chce firmu posunout?
- Golfový web: pro koho je, jaký má mít vztah k hlavnímu webu (značka, doména, tón).

**Výstup:** `docs/brand-snail.md` — hodnoty, tón, cílovka, priority destinací, co web
má/nemá dělat (už víme: vizitka a důvěra, ne konverzní mašina).

### Fáze 2 — Datový model + technický základ (NEPŘESKAKOVAT)
**Cíl:** základ, díky kterému se pak nic nepřepisuje.
- Navrhnout obsahový model: Destinace, Hotel, Zájezd/Zážitek, Reference, Osoba, Stránka —
  pole, vztahy (hotel patří destinaci…), co z toho bude klient editovat v adminu.
- Postavit skeleton webu nad statickým generátorem (**doporučení: Astro** — obsahové
  kolekce v MD/JSON, výstup čistá statika jako dnes, žádný server nutný pro frontend).
- Přenést design system z prototypu (barvy, fonty, komponenty, header/footer — konečně
  sdílené šablonou místo kopírování do každého HTML).
- Golf web od začátku jako **druhý web nad stejným design systemem a stejným datovým
  modelem** (vlastní barevná/obsahová vrstva) — to je hlavní úspora celého projektu.

**Výstup:** běžící skeleton obou webů, datový model schválený (= vím, co bude admin umět).

### Fáze 3 — Hlavní web, po částech se schvalováním
Vždy: postavit 1 vzor → schválit s Kristinou → teprve pak vyrobit zbytek. Pořadí:
1. **Homepage** (přenos + úpravy dle analýzy).
2. **Vzorový detail destinace — doporučuji Madeiru**, ne Seychely (57 referencí,
   jádro byznysu, je k ní nejvíc materiálu). Seychely poslouží jako druhý test šablony.
3. **Vzorový detail hotelu** (1 hotel na Madeiře) — tady se poprvé objeví ceny/info,
   tj. přesně to, co pak klient spravuje adminem → ověření datového modelu.
4. Po schválení vzorů: **doplnit obsah pro zbytek destinací a hotelů** (tady se čeká
   na podklady od klienta — fotky, texty, ceny; plánovat jako úzké hrdlo).
5. Reference, O nás, kontakt — přenos z prototypu do šablon.

### Fáze 4 — Golf web
Stejný postup ve zmenšeném měřítku: homepage vzor → schválit → vzor golfové
destinace/pobytu → schválit → zbytek obsahu. Díky fázi 2 jde hlavně o obsah a ladění,
ne o novou stavbu.

### Fáze 5 — Admin
Až teď, nad ověřeným datovým modelem.
- Rozsah podle toho, co klient reálně edituje: destinace, hotely, fotky, texty, ceny.
- **Volba nástroje až tady** (podle toho, jak si Kristina/tým vedou s technikou):
  git-based CMS (Decap — zdarma, jednoduché) vs. plnohodnotný headless (Payload/Directus —
  hezčí UX, víc provozu). Rozhodnout po fázi 2, kdy je model známý; teď nezavírat.
- Zaškolení: 1 společné sezení + krátký návod s obrázky (`docs/admin-navod.md`).

### Fáze 6 — Nasazení a předání
- Hosting + domény (hlavní web, golf web, admin), HTTPS, zálohy obsahu.
- Napojení kontaktního formuláře na e-mail (dnes jen simuluje).
- Základní SEO hygiena (meta, sitemap, rychlost) — bez SEO ambicí, web je vizitka.
- Jednoduchá analytika (např. Plausible/GA) — ať je vidět, jestli web někdo používá.
- Předávací dokument: kde co běží, přístupy, jak se co mění.

---

## Milníky a platby (návrh — 100 000 Kč)

| # | Milník | Platba |
|---|--------|--------|
| 1 | Analýza hotová: dotazník vyhodnocen + brand dokument + schválený datový model | 15 000 |
| 2 | Hlavní web: homepage + vzor destinace + vzor hotelu schváleny | 25 000 |
| 3 | Hlavní web kompletní (všechen obsah, reference, o nás) | 20 000 |
| 4 | Golf web kompletní | 15 000 |
| 5 | Admin hotový + zaškolení | 15 000 |
| 6 | Nasazení, domény, předání | 10 000 |

Platba vždy po odsouhlasení milníku — kryje to obě strany a drží tempo.

---

## Draft dotazníku pro stálé klienty (fáze 0)

Krátký — max 8 otázek, osobní tón, odpověď přímo v mailu. Návrh:

> Dobrý den, [jméno],
> připravujeme nový web Snail Travel a než ho začneme stavět, chceme slyšet ty,
> kvůli kterým to děláme. Zabere to 5 minut — stačí odepsat přímo na tento e-mail.

1. Když plánujete další cestu, co si chcete zjistit nebo ověřit, **než nám zavoláte**?
2. Byli jste někdy na našem webu? Pokud ano — našli jste, co jste hledali? Co chybělo?
3. Co bylo pro vás rozhodující, že s námi jezdíte opakovaně? (Zkuste to říct jednou větou —
   možná ji použijeme.)
4. Jaké cesty vás lákají do budoucna? (konkrétní destinace, golf, poznávací s průvodcem,
   individuální cesta na míru…)
5. Co byste na webu chtěli vidět, aby vám pomohl s rozhodováním? (fotky ze skutečných
   zájezdů, konkrétní hotely, orientační ceny, itineráře, zkušenosti ostatních…)
6. Preferujete domluvit cestu telefonicky/e-mailem, nebo byste uvítali možnost
   poptávky přes web?
7. Hrajete golf, případně jezdíte na golfové pobyty? (kvůli připravovanému golfovému webu)
8. Cokoli dalšího, co nám chcete říct?

Pozn.: otázka 3 je zároveň sběr citátů pro reference, otázka 7 validuje golf web ještě
před jeho stavbou.

---

## Otevřené otázky (potřebuji od Krystofa / Kristiny)

- **Golf web:** vlastní značka a doména, nebo „Snail Golf" pod hlavní značkou? Existuje
  už nějaký obsah/nabídka?
- **Domény a hosting:** kdo vlastní snailtravel.cz, kde běží současný web, kdo bude
  platit hosting?
- **Podklady:** kdo dodá texty/fotky/ceny hotelů — klient, nebo se přebírají ze
  současného živého webu?
- **Admin uživatelé:** kolik lidí bude obsah spravovat a jak jsou technicky zdatní?
  (rozhoduje o volbě adminu ve fázi 5)
- **Jazyky:** jen čeština? (předpokládám ano)

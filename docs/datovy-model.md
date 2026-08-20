# Datový model — návrh k diskusi (fáze 2)

Tohle je kostra, nad kterou se staví **oba weby i admin**. Pole nejsou vytesaná —
finalizují se po rozhovorech s týmem (`otazky-admin-tym.md`, část B a C).

Zásada: **jeden model, dva weby.** Skoro každá entita má pole `weby: [hlavni, golf]` —
tím se řídí, kde se obsah zobrazí. Golfový web není druhá databáze, je to druhý pohled
na tutéž. Tohle je hlavní úspora celého projektu.

---

## 1. Destinace

Hierarchická (kontinent → země/oblast → ostrov/lokalita), protože Seychely mají 13 ostrovů
a Madeira je ostrov pod Portugalskem. Řeší se polem `nadrazena`.

| pole | typ | pozn. |
|---|---|---|
| nazev, slug | text | |
| nadrazena | vazba → Destinace | prázdné u top-level |
| kontinent | výběr | EU/AF/AS/NA/SA/OC — už máme v `globe.js` |
| perex | text | do karty a slideru |
| popis | dlouhý text | |
| hlavni_foto, galerie | média | |
| kdy_jet | tabulka měsíc → teplota/doporučení | **přání z dotazníku** |
| tipy_specialisty | text | kdo doporučuje = vazba na Osobu |
| cena_od | číslo | orientační, za osobu |
| weby | [hlavni, golf] | golfová destinace se ukáže i na golfu |
| poradi / je_top | číslo/ano-ne | co jde na homepage |

## 2. Hotel

| pole | typ | pozn. |
|---|---|---|
| nazev, slug | text | |
| destinace | vazba → Destinace | |
| hvezdy, popis, vybaveni | | **hlídat konzistenci** — klienti si stěžují, že někde je odstavec, jinde věta |
| galerie | média | pozor na správné párování (stížnost Madeira/Azory) |
| poloha | souřadnice | mapa oblasti chce 27 % |
| cena_od | číslo + jednotka | „od X Kč / os / noc" — **přání č. 1 (51 %)** |
| co_cena_zahrnuje | text | klienti explicitně žádají |
| overil | vazba → Osoba | „byla jsem tam, ručím za to" — nápad z dotazníku |
| golf_hriste | vazba → Hřiště (více) | + vzdálenost |

## 3. Zájezd / pobyt

Nejdůležitější a nejrizikovější entita — tady se model nejčastěji láme.

| pole | typ | pozn. |
|---|---|---|
| nazev, slug, perex | | |
| typ | výběr | pobytový / poznávací / golfový / na míru |
| destinace | vazba (více!) | okružní cesty mají víc zemí |
| hotely | vazba (více) | |
| program | opakovatelný blok den/text/foto | itinerář den po dni (33 %) |
| termíny | podentita ↓ | |
| cena_od, co_zahrnuje | | |
| stav | výběr | koncept / zveřejněno / vyprodáno |
| weby | [hlavni, golf] | |

**Termín** (podentita): od–do, cena, volná místa, stav. Jen u skupinových;
u „na míru" zůstává prázdné.

## 4. Golfové hřiště

Vlastní entita, ne text v hotelu — protože se filtruje a sdílí mezi hotely.

`nazev, destinace, pocet_jamek, par, vzdalenost_od_hotelu, green_fee_v_cene (ano/ne),
foto, popis`

Odpovídá přesně tomu, co golfisté chtějí: vzdálenost hotel–hřiště (62 %),
počet hřišť v okolí (51 %), green fee (50 %).

## 5. Reference

Máme 221 kusů. Dnes jsou tagované automaticky přes keywords — v modelu to musí být
**skutečná vazba** na Destinaci, aby fungovaly filtry a výpisy u destinací.

`text, datum, autor, destinace (vazba, více), je_ve_vitrine (ano/ne), typ (golf/běžný)`

## 6. Osoba (tým)

`jmeno, foto, email, telefon, role, moje_destinace (vazba)` — role zatím chybí,
klient je nedodal. Vazba „moje destinace" umožní na detailu ukázat konkrétního člověka.

## 7. Zážitek a Stránka

- **Zážitek** — 18 kusů už na webu (safari, degustace…): `nazev, foto, popis, destinace`
- **Stránka** — statické texty (o nás, filozofie, kontakt), aby šly měnit bez programátora

---

## Tři otázky, které musí model rozhodnout (a nezná je nikdo z nás)

1. **Kde bydlí cena?** Na hotelu, na zájezdu, nebo na termínu? Klienti chtějí orientační
   cenu, tým se bojí ji uvádět. → otázka B7
2. **Je golfový zájezd typ, nebo příznak?** Existuje „golf + poznávací"? → otázka C12
3. **Jak vypadá zájezd, co nesedí do škatulky?** Ten nejdivnější případ definuje model
   víc než deset normálních. → otázka C11

Až tyhle tři odpovědi máme, model se zafixuje a admin je nad ním jen formulář.

# Návrhy na vylepšení designu — audit 11. 11. 2026

Jen **návrhy**, nic z toho není v kódu změněné. Písmo ani barvy se nemění. Kde se
návrh opírá o barvu, používá jen odstíny, které už v paletě jsou (`--gold-deep` apod.).

**Jak vznikl:** web běžel lokálně (Astro dev), stránky Homepage, Madeira a hotel Calheta
Beach se nafotily po sekcích na 1440 a 390 px (skript `shoot.mjs` z taste-skill)
a prošly se podle pravidel tří skillů:

- **taste-skill** (`design-taste-frontend`): co dělá web generickým, „one section per screen“,
  první obrazovka má říct, co prodáváte,
- **Hallmark**: seznam „AI tells“ (gates) + statická kontrola kódu `sloplint`,
- **Vercel Web Interface Guidelines**: přístupnost, formuláře, animace.

Čísla v závorkách (např. *H54*) jsou pravidla Hallmarku z `~/.claude/skills/hallmark/references/gates.md`.

## Co funguje a nesahat na to

- Nadpis **„Nespěcháme. A právě v tom je luxus.“**: má názor, nikdo jiný ho nemá. Takhle by měly znít i ostatní.
- **Skutečné dopisy klientů** v referencích, včetně oslovení „Dobrý den, Báro“. Žádný generický web je nemá.
- Reálná data o počasí (MET Norway) a světlé fotky krajiny.
- Čistý hero detailu (fotka přes celou výšku, plná lišta).

---

## A. Největší dopad

### 1. Popup „Naplánujte cestu s Bárou“ se otevírá sám
Po pár sekundách vyskočí na **každé stránce** a zakryje obsah. Na mobilu zakryje skoro celou obrazovku
a na desktopu pravou třetinu. Na webu, který má být vizitka a budovat důvěru, to působí jako e-shop,
který tlačí na prodej.
**Návrh:** automaticky ho neotvírat. Nechat jen malé tlačítko s fotkou Báry v rohu (launcher už existuje).
Na detailu destinace místo toho dát do obsahu klidný blok „Tuhle cestu vám připraví Bára“ s fotkou a kontaktem.

### 2. Hero homepage neříká, co prodáváte
„VÍTEJTE VE SNAIL TRAVEL“ by mohl mít každý web. Taste-skill chce, aby první obrazovka řekla, *co*, *pro koho*
a jeden tvrdý fakt. Na středové ose je zároveň pět prvků (kicker, nadpis, perex, tlačítko, „Posuňte níže“) (*H6b*).
Video (pár v bazénu) je typický stock záběr.
**Návrh:** nadpis s faktem, třeba „Cesty na míru od roku 1998“ nebo „Madeira, Azory, Maledivy. Na míru.“
Kicker nad nadpisem vypustit. Do videa (až přijde finální od klienta) spíš krajinu a moře než pár
(to sedí i na rozhodnutí o světlých fotkách v CLAUDE.md).

### 3. „Proč Snail Travel“ je učebnicová AI šablona
Tři sloupce, ikona nad nadpisem, „Na míru / Soukromí / Čas“ (*H3*, taste: „generic card spam“).
Texty by mohla mít jakákoli cestovka.
**Návrh:** nahradit tím, co máte doložené (z CLAUDE.md a analýzy klientů):
od **1998**, **221** skutečných referencí, z toho **57 z Madeiry**, tým **5 lidí** jménem.
Třeba tři velká čísla, každé s jednou větou, nebo jeden velký citát klienta. Žádná vymyšlená čísla.

### 4. Pás s citátem „Cestování není únik. Je to návrat k sobě.“
Je to anonymní aforismus, nic neříká. Pás je nízký, text skoro naráží na horní a dolní okraj
a pod ním je asi 200 px prázdného světlého pásu.
**Návrh:** dát sem jednu skutečnou větu z dopisu klienta se jménem a destinací (máte jich 221).
Pás zvýšit, prázdný blok pod ním odstranit.

### 5. Chybné skloňování v šablonách (vidí to každý návštěvník)
- „Všechny reference na **Madeira**“ (`[...slug].astro:709`)
- „Zájezdy destinace **Madeira**“ (`:726`)
- „Všechny hotely, které na **Madeira** nabízíme“ (`:727`)

**Návrh:** do content kolekce destinací přidat tvary (`na_kam: "na Madeiru"`, `kde: "na Madeiře"`)
a nadpisy přepsat, třeba „Hotely na Madeiře“ a „Všechny reference z Madeiry“.

### 6. Dva různé kontakty, jeden falešný, a formulář, který nic neodešle
Sekce „Naplánujte svou cestu“ ukazuje `cesty@snailtravel.cz` a **+420 000 000 000**, zatímco popup
a patička mají skutečnou Báru. Formulář „Odeslat poptávku“ jen předstírá odeslání (*H70*
„fake send“: návštěvník si myslí, že poptávka odešla).
**Návrh:** kontakt sjednotit na Báru. Dokud formulář není napojený, buď ho dočasně nahradit
tlačítkem „Napsat Báře“ (mailto), nebo napsat, že zatím neodesílá.

---

## B. Vzory, které se opakují po celém webu

### 7. Malý zlatý nadpis v rozpaleném verzálkovém písmu nad každým nadpisem
„NAŠE FILOZOFIE“, „INFO“, „FOTOGALERIE“, „MAPA“, „NABÍDKA“… Sloplint ho našel 24× jako „eyebrow“ (*H54*)
a 36× jako rozpalené verzálky (*H67*). Je to nejčastější znak generovaného webu podle obou skillů.
Na detailu destinace navíc jen **opakuje položku rozcestníku**, který je hned nad ním.
Luxusní značky (Rolex, Aman) ho taky používají, ale střídmě.
**Návrh (písmo zůstává):** na detailu destinace a hotelu kickery vypustit, protože rozcestník už říká, kde jsem.
Na homepage nechat jeden nebo dva tam, kde nesou informaci. A nestřídat jen nadpisy na středu,
některé sekce zarovnat vlevo (*H9*: každá sekce stejný rytmus).

### 8. Jedna karta na všechno
Destinace, zážitky, oblasti i hotely mají stejnou kartu: fotka, krémový box, název ve zlatých verzálkách,
tři vedle sebe. Stránka pak vypadá jako katalog a nic nevystoupí.
**Návrh:** aspoň na homepage odlišit. Destinace jako velké fotky s názvem přímo v nich, Madeira větší
(je to jádro byznysu, 57 referencí). Zážitky jinou kompozicí, třeba horizontálním pásem nebo seznamem s fotkou.
*(Pozor: u mřížky na `/destinace` je jednotná velikost karet vědomé rozhodnutí, viz CLAUDE.md. Tohle je jen homepage.)*

### 9. Štítek „0 hotelů“ na kartách oblastí
Upozorňuje na to, co nemáte. **Návrh:** u nuly štítek nezobrazovat.

### 10. Tmavé skleněné štítky ★★★★★ a $$$$$ na fotkách hotelů
Vypadá to jako Booking nebo jiný agregátor. Dolary u české cestovky působí cize.
Sloplint navíc hlásí „glass panel“ (*H29*).
**Návrh:** hvězdy a cenovou úroveň dát pod název do krémového boxu, stejně čistě jako v hero hotelu, ne na fotku.
Zvážit jiný symbol místo „$“.

### 11. Hero hotelu: pět věcí na středové ose
Drobečková navigace ve verzálkách, „HOTEL · CALHETA“, název, hvězdy a ceny, „Posuňte níže“.
Drobečky přes fotku jsou špatně čitelné (zlaté „Evropa“ na světlé obloze).
**Návrh:** drobečky přesunout pod hero, nebo je na fotce vynechat. Kicker „Hotel · Calheta“ vypustit,
název s hvězdami stačí.

### 12. „Posuňte níže“
Skilly ho řadí k dekoracím (*H66*). Chtěl jsi ho, takže zůstává jako vědomá volba. Jen pro úplnost.

---

## C. Detail destinace a hotelu

### 13. Mapa
Výchozí podklad OpenStreetMap je barevný a hlučný vedle krémového webu. Bublina „Madeira“ je otevřená hned
a zopakuje, co už víme. **Návrh:** tlumenější podklad, třeba CARTO Positron nebo Voyager (zdarma, bez klíče),
a bublinu neotvírat automaticky. *(Jeden špendlík místo všech hotelů je vaše rozhodnutí ze září, to zůstává.)*

### 14. Poznávejte a Relaxujte
Dlouhé textové bloky bez fotky, sbalené za „Přečíst více“, a mezi nimi velké prázdné pásy.
**Návrh:** ke každému bloku jednu velkou fotku vedle textu (fotka vlevo, text vpravo a u druhého naopak),
z galerie destinace. Prázdné pásy zmenšit.

### 15. Kdy jet: tabulka v pilulkách
Řádek „MĚSÍC“ uprostřed mezi pilulkami působí rozbitě. Před „Teď na ostrově“ je ozdobná tečka (*H63*).
**Návrh:** klasická přehledná tabulka (měsíce nahoře) nebo jednoduchý graf teploty vzduchu a moře.
Zvýraznit doporučené měsíce, to je informace, kterou návštěvník hledá.

### 16. Reference
Dopisy jsou nejsilnější důkaz webu, ale v bílých kartách vypadají jako běžné recenze.
**Návrh:** jeden dopis vytáhnout velký (výňatek + jméno + datum), ostatní pod ním menší.
Oslovení „Dobrý den, Báro“ nechat, je to důkaz, že je dopis skutečný.

### 17. Info hotelu: fakta schovaná v odstavcích
„Funchal 25 minut, letiště 35 minut, 5 pater, 2 restaurace“ je zahrabané v textu.
**Návrh:** nad text dát krátký přehled faktů ve sloupcích (letiště, Funchal, pláž, počet restaurací),
pod ním zbytek textu.

---

## D. Technické (nevidíš je, ale skilly je hlásí jako chyby)

| Co | Kde | Proč |
|---|---|---|
| Obsah s animací `.reveal` je bez JavaScriptu neviditelný (`opacity: 0`) | `style.css:1139` (+ `.tile-cta`, `.country-cta`, mobilní menu) | Když skript selže, stránka je prázdná. Řešení: skrývat jen pod třídou `.js`. |
| Malý zlatý text na krému má kontrast 2,5–2,7 : 1 (potřeba 4,5) | `.tile-cta`, `.country-cta`, `.btn-ghost:hover`, kroužky odznáčků | Pro malý text použít `--gold-deep`, který už v paletě je. |
| `body.hsearch-open { overflow-x: hidden }`, `100vw` u `.dest-card` | `style.css:487`, `destinace-detail.css:747` | Rozbíjí sticky lištu, dělá vodorovný scroll. Řešení: `overflow-x: clip`, `width: 100%`. |
| Hero homepage `min-height: 100vh` | `style.css:556` | Na mobilu skáče kvůli liště prohlížeče, `100dvh` (detail už to má). |
| První fotka galerie `loading="lazy"` | `PhotoSwiper.astro:19` | Zpomaluje první vykreslení, má mít `fetchpriority="high"`. |
| Šipka `→` přilepená k textu odkazu | `PhotoSwiper.astro:26` | Kosmetika (*H63*). |
| Zakázané tlačítko jen průhledností | `.dest-arrow:disabled` | Přidat `cursor: not-allowed`. |

Kompletní výstup sloplintu (207 FAIL, 196 REFLEX) je hlavně o tom, že web nepoužívá jejich
token systém (mezery mimo 4px škálu, barvy mimo `:root`). To je jejich konvence, ne chyba webu, takže to tu neřeším.

## Doporučené pořadí

1. **Rychlé a bez diskuse:** 5 (skloňování), 9 („0 hotelů“), 6 (falešný telefon), technické z části D.
2. **Rozhodnutí s klientem:** 1 (popup), 2 a 3 (hero a „Proč Snail Travel“ s fakty), 4 (citát z reference).
3. **Designová práce:** 7 (kickery), 8 a 10 (karty), 14 až 17 (detail destinace).

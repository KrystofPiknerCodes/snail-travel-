# Otázky pro tým, který dnes spravuje obsah (podklad pro admin)

Cíl: zjistit hned na začátku to, co ovlivňuje **datový model** (fáze 2) a **volbu adminu**
(fáze 5). Špatná odpověď zjištěná pozdě = přepisování. Ptát se lidí, kteří v tom reálně
dělají (Barbora, Marcela, Jitka, Pavla…), ne jen Kristiny.

Formát: 20 minut po telefonu s každým, nebo jedno společné sezení. Ideálně **si nechat
ukázat obrazovku** — „projděte mi, jak přidáváte nový zájezd" řekne víc než odpovědi.

## A. Kdo a jak často

1. **Kdo všechno** dnes do webu/nabídek zasahuje a co konkrétně každý dělá?
2. Jak často se obsah mění — denně, týdně, nárazově před sezónou?
3. Jak jste na tom s technikou? Zvládáte dnešní systém sami, nebo voláte někoho?
   (Bez příkras — podle toho volíme jednoduchost adminu.)
4. Co vás na současné správě obsahu **nejvíc štve**? Co trvá zbytečně dlouho?

## B. Co se reálně edituje (klíčové pro datový model)

5. **Projděte mi, jak vzniká nová nabídka** — odkud berete text, fotky, cenu, program?
   Kolik systémů při tom otevřete?
6. Co měníte **nejčastěji**: ceny, termíny, fotky, texty, hotely? A co naopak skoro nikdy?
7. **Ceny:** jak jsou dnes uložené — jedna cena „od", tabulka podle termínu, PDF ceník,
   nebo se počítají ručně na poptávku? Kdo je zdroj pravdy?
8. **Termíny/odjezdy:** má zájezd pevné termíny (skupinové), nebo je to celoročně na míru?
   Jak evidujete obsazenost / „vyprodáno"?
9. **Hotely:** máte popisy hotelů někde uložené (Word, PDF, jiný systém), nebo se píšou
   pokaždé znovu? Používá se stejný hotel ve víc zájezdech?
10. Odkud berete **fotky** — vlastní ze zájezdů, od hotelů, ze stocku? Kde jsou uložené
    a kdo je vybírá? (V dotazníku klient hlásil chybně spárované fotky Madeira/Azory.)

## C. Vazby a výjimky (tady se láme datový model)

11. Existuje zájezd, který **nesedí do žádné škatulky**? (kombinace destinací, golf +
    poznávací, cesta na míru bez pevného programu…) — ukažte mi ten nejdivnější.
12. Golf: je golfový zájezd **jiný typ**, nebo je to normální zájezd s příznakem „golf"?
    Mají hřiště vlastní karty (název, počet jamek, vzdálenost od hotelu, green fee)?
13. Potřebujete něco na webu **schovat/zveřejnit k datu** (sezónní nabídky, akce),
    nebo mít rozpracovaný koncept, co ještě není vidět?
14. Musí obsah někdo **schvalovat**, než jde ven, nebo publikuje každý sám za sebe?

## D. Okolní systémy

15. Jaké systémy dnes používáte kolem prodeje — rezervační/CRM, účetnictví, mailing
    (jaký nástroj na ty pravidelné mailingy?), Excel? Má web s něčím z toho mluvit,
    nebo je web ostrov?
16. **Poptávky z webu** — kam mají chodit a kdo je zpracovává? Chcete je vidět
    i v adminu, nebo stačí e-mail?
17. Mailing je podle dotazníku hlavní inspirační kanál (65 %). **Sbírá web e-maily
    do newsletteru?** Chcete to, a do jakého nástroje?

## E. Přání do adminu

18. Kdybyste si mohli něco přát: **co byste chtěli měnit sami**, bez volání na agenturu?
19. A naopak — co je vám jedno / co ať radši mění někdo jiný, aby to nešlo rozbít?
20. Pracujete s webem i **mimo kancelář** (mobil, cesty)? Musí admin fungovat na telefonu?

---

## Proč se ptáme právě na tohle

Odpovědi z části B a C definují **entity a pole** datového modelu (fáze 2) — tj. co přesně
je Destinace, Hotel, Zájezd, Termín, Cena, Hřiště a jak spolu souvisí. Až tohle sedí,
je admin jen editační vrstva nad ověřeným modelem a nic se nepřepisuje (viz `PLAN.md`).

Část A rozhoduje o **volbě nástroje**: technicky nejistý tým a pár změn měsíčně → jednoduchý
git-based CMS (Decap, zdarma). Několik lidí, časté změny, ceny a termíny, schvalování →
plnohodnotný headless (Payload/Directus, hezčí UX, ale běžící server a provozní náklady).

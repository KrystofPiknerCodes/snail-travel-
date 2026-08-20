---
nazev: Madeira
nadrazena: Portugalsko
kontinent: EU

perex: >
  Ostrov věčného jara plný rozkvetlých květin, nekonečných oslav a lahodného
  vína. Madeira je čarovný ostrov s nádhernou přírodou a celoročně krásným
  počasím.

hlavni_foto: /assets/madeira/madeira-hero.jpg

galerie:
  - src: /assets/madeira/madeira-hero.jpg
    alt: Pobřeží Madeiry s útesy nad Atlantikem
  - src: /assets/countries/madeira.jpg
    alt: Madeira — panorama ostrova
  - src: /assets/madeira/belmond-reids-palace.jpg
    alt: Belmond Reid's Palace, Funchal
  - src: /assets/madeira/the-cliff-bay.jpg
    alt: The Cliff Bay, Funchal

cena_od:
  znamo: true
  hodnota: 990
  jednotka: "osoba / noc"
  zahrnuje: "se snídaní"
  poznamka: >
    Nejnižší dostupná cena (Valley View Hotel, Encumeada, ***). Konkrétní
    cena se liší podle hotelu, termínu a typu pokoje — přesnou nabídku na
    míru připraví naši specialisté.
  zdroj: >
    Reálná cena z ceníku na živém webu snailtravel.cz — zdrojová stránka má
    v patičce rok 2019, ceny je proto potřeba s klientem ověřit jako aktuální
    před nasazením.

# Vycentrování mapy oblasti na ostrov Madeira. Souřadnice z OpenStreetMap
# Nominatim (dotaz "Madeira Portugal", hraniční relace ostrova/souostroví) —
# k ověření. Zoom 11 ukáže celý ostrov od Funchalu po Encumeadu.
mapa:
  lat: 32.7517501
  lng: -16.9817487
  zoom: 11

hotely:
  - nazev: Valley View Hotel
    hvezdy: 3
    misto: Encumeada
    cena_od: 990
    cena_jednotka: "/ os / noc"
    co_cena_zahrnuje: se snídaní
    # Souřadnice z OSM Nominatim (přesná shoda názvu "Valley View Hotel
    # Encumeada") — k ověření.
    poloha:
      lat: 32.7495336
      lng: -17.0244953
  - nazev: Portobay Serra Golf
    hvezdy: 4
    misto: Santo da Serra
    cena_od: 1490
    cena_jednotka: "/ os / noc"
    co_cena_zahrnuje: se snídaní
    # Souřadnice z OSM Nominatim (nalezeno jako "Porto Bay Serra Golf",
    # Santo António da Serra) — k ověření.
    poloha:
      lat: 32.7222046
      lng: -16.8153285
  - nazev: Pestana Carlton Madeira
    hvezdy: 5
    misto: Funchal
    cena_od: 1990
    cena_jednotka: "/ os / noc"
    co_cena_zahrnuje: se snídaní
    # Souřadnice z OSM Nominatim (přesná shoda názvu) — k ověření.
    poloha:
      lat: 32.6424614
      lng: -16.9220174
  - nazev: Calheta Beach
    hvezdy: 4
    misto: Calheta
    cena_od: 1990
    cena_jednotka: "/ os / noc"
    co_cena_zahrnuje: all inclusive
    # Souřadnice se v OSM Nominatim nepodařilo spolehlivě ověřit (dotaz
    # našel jen pláže Calheta, ne konkrétní hotel) — poloha záměrně
    # nevyplněna, hotel se na mapě nezobrazí, dokud ji nedoplní klient.
  - nazev: Savoy Palace
    hvezdy: 5
    misto: Funchal
    cena_od: 2790
    cena_jednotka: "/ os / noc"
    co_cena_zahrnuje: se snídaní
    # Souřadnice z OSM Nominatim (přesná shoda názvu) — k ověření.
    poloha:
      lat: 32.6436598
      lng: -16.9205632
  - nazev: Vidamar Resort
    hvezdy: 5
    misto: Funchal
    cena_od: 2990
    cena_jednotka: "/ os / noc"
    co_cena_zahrnuje: s polopenzí
    # Souřadnice z OSM Nominatim (nalezeno jako "Vidamar Resorts Madeira") —
    # k ověření.
    poloha:
      lat: 32.6377884
      lng: -16.9283691
  - nazev: The Cliff Bay
    hvezdy: 5
    misto: Funchal
    cena_od: 35890
    cena_jednotka: "/ os ⚠ ověřit rozsah"
    co_cena_zahrnuje: se snídaní
    foto: /assets/madeira/the-cliff-bay.jpg
    # Souřadnice z OSM Nominatim — hotel je v OSM veden pod aktuálním
    # názvem "Les Suites at the Cliff Bay" (přeznačení stejné budovy na
    # Estrada Monumental, Funchal) — k ověření.
    poloha:
      lat: 32.6392673
      lng: -16.9257335
  - nazev: Belmond Reid's Palace
    hvezdy: 5
    misto: Funchal
    cena_od: 54890
    cena_jednotka: "/ os ⚠ ověřit rozsah"
    co_cena_zahrnuje: se snídaní
    foto: /assets/madeira/belmond-reids-palace.jpg
    # Souřadnice z OSM Nominatim (přesná shoda názvu) — k ověření.
    poloha:
      lat: 32.6406140
      lng: -16.9239058

kdy_jet_poznamka: >
  Orientační údaje — Madeira leží v Golfském proudu a má nadprůměrně mírné,
  téměř celoroční „jarní" klima, takže se dá navštívit kdykoli. Přesné
  teploty se rok od roku mírně liší.
kdy_jet:
  - mesic: Leden
    teplota_vzduch: "16–19 °C"
    teplota_more: "19 °C"
    doporuceni: Klidné období, méně turistů, ideální na turistiku po levádách.
  - mesic: Únor
    teplota_vzduch: "16–19 °C"
    teplota_more: "18 °C"
    doporuceni: Madeirský karneval — nejúchvatnější podívaná v roce.
  - mesic: Březen
    teplota_vzduch: "17–20 °C"
    teplota_more: "18 °C"
    doporuceni: Začátek jara, ostrov rozkvétá, příjemné teploty na chůzi.
  - mesic: Duben
    teplota_vzduch: "18–21 °C"
    teplota_more: "18 °C"
    doporuceni: Květinové slavnosti (pár týdnů po Velikonocích) ve Funchalu.
  - mesic: Květen
    teplota_vzduch: "19–22 °C"
    teplota_more: "19 °C"
    doporuceni: Stabilní počasí, výborné podmínky na pěší trasy i golf.
  - mesic: Červen
    teplota_vzduch: "21–24 °C"
    teplota_more: "20 °C"
    doporuceni: Festival Atlántico (ohňostroje) — start letní sezóny.
  - mesic: Červenec
    teplota_vzduch: "22–25 °C"
    teplota_more: "21 °C"
    doporuceni: Nejteplejší měsíce, ideální na koupání a vodní sporty.
  - mesic: Srpen
    teplota_vzduch: "23–26 °C"
    teplota_more: "22 °C"
    doporuceni: Vrchol léta, přelom srpna a září startuje festival vína.
  - mesic: Září
    teplota_vzduch: "22–25 °C"
    teplota_more: "23 °C"
    doporuceni: Nejteplejší moře v roce, festival vína, méně turistů než v srpnu.
  - mesic: Říjen
    teplota_vzduch: "21–24 °C"
    teplota_more: "22 °C"
    doporuceni: Stále teplo, dobrá volba na potápění a whale watching.
  - mesic: Listopad
    teplota_vzduch: "19–22 °C"
    teplota_more: "21 °C"
    doporuceni: Přechod na podzim, klidnější ostrov, dobré na turistiku.
  - mesic: Prosinec
    teplota_vzduch: "17–20 °C"
    teplota_more: "20 °C"
    doporuceni: Vánoční výzdoba Funchalu a novoroční ohňostroj patří k nejslavnějším na světě.

zazitky:
  - nazev: Pěší trasy podél levád
    popis: >
      Staletý zavlažovací systém kanálů (levády) lemuje celý ostrov a podél
      nich vedou jedny z nejkrásnějších pěších tras v Evropě, hluboko do
      pralesa Laurisilva zapsaného na seznamu UNESCO.
  - nazev: Golf s výhledem na oceán
    popis: >
      Dvě hřiště — Santo da Serra (27 jamek) a Palheiro Golf (18 jamek).
      Kvalitu potvrzuje i to, že se tu pravidelně hraje turnaj PGA European Tour.
  - nazev: Výstup na Pico Ruivo a Pico do Arieiro
    popis: >
      Nejvyšší vrcholy ostrova nabízejí výhled nad mraky na Madeiru
      i okolní Atlantik.
  - nazev: Pozorování velryb a delfínů
    popis: >
      Vody kolem Madeiry jsou domovem delfínů i velryb — vyjížďky lodí patří
      k nejoblíbenějším zážitkům na ostrově.
  - nazev: Potápění a šnorchlování
    popis: >
      Průzračný Atlantik s bohatým mořským životem a přírodními lávovými
      jezírky (Porto Moniz) je ideální i pro méně zkušené potápěče.
  - nazev: Jízda na tradičních saních z Monte
    popis: >
      Opálení "carreiros" v bílém vás od kostela Igreja de Nossa Senhora
      svezou na dřevěných saních úzkými uličkami Funchalu — atrakce, kterou
      jinde nezažijete, a řemeslo dědící se z otce na syna.
  - nazev: Ochutnávka madeirského vína
    popis: >
      Festival vína (přelom srpna a září) i celoroční degustace ve
      Funchalu — madeirské víno patří k nejznámějším na světě.

ref_tag: Madeira

chybi:
  - "Ověřit u klienta aktuálnost hotelových cen — zdrojová data jsou z archivní verze webu s rokem 2019 v patičce."
  - "Itinerář den po dni (33 % klientů si ho žádá) — na živém webu není, potřeba od Kristiny/Barbory."
  - "Mapa oblasti — 7 z 8 hotelů má souřadnice předvyplněné z veřejného OSM Nominatim API, je ale potřeba je s klientem ověřit (živý web dával jen název místa, ne souřadnice). Hotel Calheta Beach se přes OSM nepodařilo spolehlivě dohledat — jeho polohu musí doplnit klient/redaktor."
  - "Aktuální vlastní fotky z zájezdů na Madeiru (galerie teď kombinuje 2 fotky z archivu klienta a 1 stock fotku)."
  - "Podpis specialisty / \"byl jsem tam, ručím za to\" u hotelu — nápad z dotazníku (bod 4), zatím bez dat kdo z týmu Madeiru osobně ověřil."
---

Neustále kvetoucí Madeira je právem přezdívaná jako květinový ostrov. Nad
množstvím květin budete žasnout jak ve volné přírodě, tak v krásně
upravených parcích a botanických zahradách — orchideje, lilie, magnolie,
azalky i majestátní přes 2000 let staré palmy dracény. Uchvacující je i
divoká příroda, kterou korunuje prales Laurisilva, vavřínový les plný
endemických druhů zvířat i rostlin a součást světového dědictví UNESCO.

Milovníkům pěší turistiky se rozbuší srdce, jakmile zaslechnou slovo
*leváda*. Levády tvoří dokonalý zavlažovací systém, který odvádí vodu
úzkými kanály z horských jezer a pramenů deštivější severní části ostrova
na jižní plantáže. Kanály lemují celý ostrov a díky chodníčkům podél nich
vznikly nádherné pěší trasy do nitra madeirské přírody. Za návštěvu stojí
i nejvyšší vrcholy ostrova, Pico Ruivo a Pico do Arieiro — vystoupáte nad
mraky a otevře se vám nezapomenutelný výhled na ostrov i oceán.

Usměvaví a příjemní Madeiřané si život na svém ostrově opravdu užívají.
Oslavy, svátky a festivaly probíhají téměř po celý rok — od květinových
slavností přes karneval až po vánoční výzdobu hlavního města Funchal,
malebného přístavního města s plážovou promenádou a atrakcí, kterou jinde
neuvidíte: jízdou na saních taženou dvěma muži v bílém, řemeslem, které
se dědí z otce na syna.

Madeirské moře je krásné, čisté a díky Golfskému proudu celoročně vyhřáté,
i když Madeira není klasická plážová destinace — pláží je tu jen několik,
zato jsou tu unikátní přírodní lávová jezírka. Golfisté si zahrají na dvou
hřištích s dechberoucími výhledy na oceán, kde se pravidelně koná i turnaj
PGA European Tour. A po aktivním dni nezapomeňte ochutnat madeirskou
kuchyni plnou čerstvých ryb a mořských plodů — a sklenku vyhlášeného
madeirského vína.

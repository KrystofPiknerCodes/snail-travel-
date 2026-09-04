import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// ---------------------------------------------------------------------------
// Destinace — kolekce podle docs/datovy-model.md, sekce 1 (Destinace) a 2 (Hotel).
//
// Odchylky od návrhu v datovy-model.md, zjištěné při plnění reálným obsahem
// Madeiry (viz report na konci úkolu, shrnuto i tady u polí):
//
// - Přidáno pole `zdroj` u placeholderů obecně — model nepočítá
//   s tím, že u části obsahu musíme explicitně říct "odkud to víme" / "co
//   chybí". Bez toho admin nerozezná ověřený údaj od dohadu.
// - Přidáno `chybi` (seznam placeholderů) — nejde o pole v modelu vůbec,
//   ale bez něj nemá redaktor jak vidět, co má destinace ještě doplnit.
// - Hotel je v modelu samostatná entita s vazbou na Destinaci. Pro jednu
//   destinaci to zatím zbytečně komplikuje editaci (klient bude plnit obsah
//   po destinacích, ne po hotelích) — hotely jsou proto zanořené pole přímo
//   v Destinaci. Až přibude admin a filtrování napříč destinacemi (např.
//   "všechny hotely s bazénem"), vyplatí se je vytáhnout do vlastní kolekce.
// - `tipy_specialisty` (vazba na Osobu) z modelu zatím nepoužito — klient
//   nedodal, kdo se pod kterou destinaci podepisuje (stejný dluh jako role
//   týmu na o-nas.html, viz CLAUDE.md TODO).
// - `poloha` (souřadnice) u hotelu z modelu doplněno jako VOLITELNÉ pole —
//   vyplňuje ho redaktor v administraci, proto stránka musí fungovat i
//   s prázdnou hodnotou (hotel bez souřadnic se prostě nepřipne na mapu,
//   viz mapová sekce v [slug].astro). U Madeiry předvyplněno tam, kde šlo
//   ověřit přes veřejné OSM Nominatim API — vždy s komentářem u konkrétní
//   hodnoty v madeira.md, že jde o OSM zdroj k ověření klientem.
// - `mapa` (souřadnice + zoom destinace) přidáno na úrovni Destinace —
//   určuje, na co se mapa oblasti vycentruje. Volitelné ze stejného
//   důvodu jako `poloha` — bez dat sekce Mapa oblasti na stránce nenaběhne.
//
// Rozšíření pro strukturu "Destinace > Evropa > Madeira > Funchal > Hotel"
// (klientovo zadání, srpen 2026):
//
// - Klient potvrdil, že úroveň "Oblast" (Funchal, Encumeada, Santo da Serra,
//   Calheta pod Madeirou) je "vlastní stránka", ne jen složka v URL. Řešíme
//   ji jako DALŠÍ ZÁZNAM VE STEJNÉ kolekci `destinace` s `nadrazena: <slug
//   rodiče>`, ne jako novou kolekci — přidali jsme jen `typ: 'destinace' |
//   'oblast'`, který řídí, která sekce šablony se vykreslí. Důvod: `nadrazena`
//   už v modelu existuje přesně pro tenhle účel (hierarchie kontinent → země
//   → ostrov) a routování (`web/src/lib/hierarchie.ts`) umí procházet řetěz
//   `nadrazena` do libovolné hloubky, ať je záznam typu destinace nebo
//   oblast — nová kolekce navíc by tohle procházení musela duplikovat.
// - DŮLEŽITÉ: `nadrazena` je teď dvojí povahy a to je záměr, ne nedopatření.
//   Pokud hodnota odpovídá `id` existujícího záznamu v kolekci `destinace`
//   (např. Funchal má `nadrazena: madeira`), je to skutečná vazba a použije
//   se pro routing i drobečkovou navigaci. Pokud neodpovídá (např. Madeira
//   má `nadrazena: Portugalsko`, ale žádný záznam "portugalsko.md"
//   neexistuje), je to jen text pro podtitulek — routing i breadcrumb ho
//   ignorují a zastaví se na posledním záznamu, který se dá vyhledat. Klient
//   breadcrumb takhle sám popsal (Destinace/Evropa/Madeira/Funchal/Hotel —
//   bez "Portugalsko"), takže je to žádoucí chování, ne mezera.
// - Kvůli záznamům typu `oblast` (Funchal apod.), které nepotřebují celou
//   šíři polí Destinace (počasí, zážitky, reference), jsou `hlavni_foto`,
//   `galerie`, `mapa`, `kdy_jet`, `zazitky`, `ref_tag` a `chybi`
//   teď VOLITELNÉ / s výchozí prázdnou hodnotou místo povinných — šablona
//   sekci vynechá nebo ukáže placeholder, když pole chybí (stejný princip,
//   jaký už měla `poloha`/`mapa`).
// - Cena na úrovni Destinace/Oblasti odstraněna (rozhodnutí Krystof, září
//   2026): "ceny budou pouze u hotelů". Hotel dál nese `cena_od` (interní
//   podklad), ale na stránce se místo přesné částky zobrazuje jen cenová
//   kategorie $ až $$$$$ — viz `web/src/lib/cena.ts` a `CenaTag.astro`.
// - Hotel byl v modelu i v datovy-model.md od začátku samostatná entita —
//   teď, když přibyla druhá úroveň (Oblast) a s ní důvod filtrovat/mapovat
//   napříč destinacemi, se ten dluh vyplácí a hotely se z pole `hotely`
//   uvnitř Destinace stěhují do vlastní kolekce `hotel`
//   (`web/src/content/hotel/*.md`). Vazba na rodiče jde stejným polem
//   `nadrazena` jako u destinace/oblasti — hotel ukazuje na slug oblasti,
//   a když oblast pro danou destinaci neexistuje, přímo na slug destinace.
//   Stejné pole → stejná routovací i breadcrumb logika pro celý strom, bez
//   ohledu na to, jestli je uzel typu destinace, oblast, nebo hotel.
// ---------------------------------------------------------------------------

const destinaceCollection = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/destinace' }),
  schema: z.object({
    // 'destinace' = uzel na úrovni kontinent/země/ostrov (dnešní Madeira).
    // 'oblast' = menší měřítko uvnitř destinace (Funchal, Encumeada...).
    // Řídí, kterou variantu šablony [...slug].astro vykreslí.
    typ: z.enum(['destinace', 'oblast']).default('destinace'),

    nazev: z.string(),
    // Vazba na rodiče (slug jiného záznamu v této kolekci), NEBO volný text
    // bez vazby, když rodič v kolekci vlastní záznam nemá — viz komentář výš.
    nadrazena: z.string().optional(),
    kontinent: z.enum(['EU', 'AF', 'AS', 'NA', 'SA', 'OC', 'AA']),

    // Přeneseno ze starého `destinace.html` (`li.is-featured`) při migraci
    // katalogu zemí srpen 2026 — jen řídí velikost/prioritu karty ve výpisce
    // `/destinace`, nemá jiný vliv na obsah stránky samotné destinace.
    vybrana: z.boolean().default(false),

    // Nepovinné — u drtivé většiny migrovaných zemí (viz migrace srpen 2026,
    // ~107 zemí z destinace.html) zatím žádný perex neexistuje v žádném
    // zdroji dat. Šablona ([...slug].astro) bez něj ukáže placeholder
    // "⚠ Doplnit od klienta", stejný princip jako u ostatních chybějících polí.
    perex: z.string().optional(),
    // Nepovinné kvůli záznamům typu 'oblast', které zatím nemusí mít vlastní
    // hero fotku — šablona bez ní ukáže placeholder.
    hlavni_foto: z.string().optional(),

    galerie: z
      .array(
        z.object({
          src: z.string(),
          alt: z.string(),
        })
      )
      .default([]),

    // Souřadnice + zoom pro vycentrování mapy oblasti. Volitelné — vyplňuje
    // redaktor v administraci. Bez nich se sekce "Mapa oblasti" nevykreslí.
    mapa: z
      .object({
        lat: z.number(),
        lng: z.number(),
        zoom: z.number(),
      })
      .optional(),

    // Reálné klimatické normály (ne odhad/dojem) — viz zdroj v komentáři u
    // madeira.md. `srazky` nepovinné, kdyby se u budoucí destinace nedalo
    // dohledat.
    kdy_jet: z
      .array(
        z.object({
          mesic: z.string(),
          teplota_vzduch: z.string(),
          teplota_more: z.string(),
          srazky: z.string().optional(),
        })
      )
      .default([]),
    kdy_jet_poznamka: z.string().optional(),

    zazitky: z
      .array(
        z.object({
          nazev: z.string(),
          popis: z.string(),
        })
      )
      .default([]),

    ref_tag: z.string().optional(), // klíč do window.SNAIL_REF_QUOTES / reference.html?dest=

    // Golfová hřiště destinace/oblasti — přidáno při plnění Botswany (srpen
    // 2026, viz report v content.config.ts historii / CLAUDE.md), podle
    // entity "Golfové hřiště" z docs/admin-predpoklady.md (sekce 2): název,
    // počet jamek, vzdálenost od hotelu, green fee ano/ne, foto. Zvoleno
    // jako pole objektů přímo na Destinaci/Oblasti (stejný princip jako
    // `hotely` kdysi u Madeiry), NE jako nová kolekce `golf` — hřiště nemají
    // (na rozdíl od hotelů) vlastní podstránku ani netřeba je zatím filtrovat
    // napříč destinacemi, takže samostatná kolekce by dnes jen přidala
    // zbytečnou vrstvu. Pokud v budoucnu přibude potřeba (mapa hřišť napříč
    // zeměmi, filtr "hřiště do 5 km od hotelu" apod.), přesunout stejným
    // způsobem, jakým se hotely vytáhly z Destinace do vlastní kolekce.
    golf: z
      .array(
        z.object({
          nazev: z.string(),
          jamky: z.number().optional(), // počet jamek — u Botswany známo pro všechna hřiště
          vzdalenost_hotel: z.string().optional(), // zatím nikdy neznáme, viz docs/admin-predpoklady.md
          green_fee_v_cene: z.boolean().optional(),
          foto: z.string().optional(),
        })
      )
      .default([]),

    // Co na stránce ještě chybí doplnit od klienta — vykreslí se jako
    // viditelné "⚠ Doplnit od klienta" bloky / poznámka pod sekcemi.
    chybi: z.array(z.string()).default([]),
  }),
});

// Hotel — vlastní kolekce (viz komentář výš). Vazba na rodiče (Oblast, nebo
// přímo Destinace, když oblast chybí) jde přes `nadrazena`, stejně jako
// u kolekce `destinace`, aby routing i breadcrumb mohly zacházet s celým
// stromem (destinace/oblast/hotel) jednou generickou funkcí
// (`web/src/lib/hierarchie.ts`), místo dvou oddělených mechanismů.
const hotelCollection = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/hotel' }),
  schema: z.object({
    nazev: z.string(),
    nadrazena: z.string(), // slug Oblasti, nebo Destinace, když Oblast chybí
    hvezdy: z.number().optional(),
    // Textové místo pro zobrazení (dřív jediný zdroj pravdy o poloze hotelu
    // v rámci destinace, dnes doplňkové k `nadrazena` — ponecháno beze
    // změny při migraci, ať se neztratí nic z původních dat).
    misto: z.string().optional(),
    cena_od: z.number().optional(),
    cena_jednotka: z.string().optional(),
    co_cena_zahrnuje: z.string().optional(),
    foto: z.string().optional(),
    // Fotogalerie pro sekci "Fotografie hotelu" (PhotoSwiper.astro — jedna
    // velká fotka + šipky). Volitelné, výchozí prázdné pole — bez fotek se
    // sekce vykreslí jen s `foto` jako jediným snímkem (viz [...slug].astro).
    galerie: z
      .array(
        z.object({
          src: z.string(),
          alt: z.string(),
        })
      )
      .default([]),
    // Souřadnice hotelu pro špendlík na mapě oblasti. Volitelné — vyplňuje
    // redaktor v administraci. Bez nich se hotel na mapu nepřipne (radši
    // chybějící špendlík než špendlík na špatném místě).
    poloha: z
      .object({
        lat: z.number(),
        lng: z.number(),
      })
      .optional(),
  }),
});

export const collections = {
  destinace: destinaceCollection,
  hotel: hotelCollection,
};

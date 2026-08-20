import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// ---------------------------------------------------------------------------
// Destinace — kolekce podle docs/datovy-model.md, sekce 1 (Destinace) a 2 (Hotel).
//
// Odchylky od návrhu v datovy-model.md, zjištěné při plnění reálným obsahem
// Madeiry (viz report na konci úkolu, shrnuto i tady u polí):
//
// - Model navrhuje `cena_od` jako čisté číslo. Realita: klient (na živém webu)
//   uvádí cenu VŽDY spolu s tím, co zahrnuje ("od 990 Kč, 1 noc/osoba se
//   snídaní") — bez toho je číslo zavádějící (snídaně vs. all inclusive dělá
//   v ceně řádový rozdíl). Proto `cena_od` je objekt {hodnota, jednotka,
//   zahrnuje, poznamka}, ne holé číslo.
// - Přidáno pole `zdroj` u ceny a u placeholderů obecně — model nepočítá
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
// - `poloha` (souřadnice) u hotelu z modelu zatím nepoužito — živý web dává
//   jen název místa (např. "Funchal"), ne souřadnice; mapa je proto
//   placeholder, ne implementace bez dat.
// ---------------------------------------------------------------------------

const destinaceCollection = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/destinace' }),
  schema: z.object({
    nazev: z.string(),
    nadrazena: z.string().optional(), // např. Madeira -> Portugalsko (text, zatím ne vazba)
    kontinent: z.enum(['EU', 'AF', 'AS', 'NA', 'SA', 'OC']),

    perex: z.string(),
    hlavni_foto: z.string(),

    galerie: z.array(
      z.object({
        src: z.string(),
        alt: z.string(),
      })
    ),

    // Orientační cena "od" pro hero sekci — odvozená z nejlevnějšího hotelu,
    // pokud reálná data máme. Když ne, znamo: false a stránka vykreslí placeholder.
    cena_od: z.object({
      znamo: z.boolean(),
      hodnota: z.number().optional(),
      jednotka: z.string().optional(), // "Kč / osoba / noc"
      zahrnuje: z.string().optional(), // "se snídaní" / "all inclusive" / ...
      poznamka: z.string().optional(),
      zdroj: z.string().optional(),
    }),

    hotely: z.array(
      z.object({
        nazev: z.string(),
        hvezdy: z.number().optional(),
        misto: z.string().optional(),
        cena_od: z.number().optional(),
        cena_jednotka: z.string().optional(),
        co_cena_zahrnuje: z.string().optional(),
        foto: z.string().optional(),
      })
    ),

    kdy_jet: z.array(
      z.object({
        mesic: z.string(),
        teplota_vzduch: z.string(),
        teplota_more: z.string(),
        doporuceni: z.string(),
      })
    ),
    kdy_jet_poznamka: z.string().optional(),

    zazitky: z.array(
      z.object({
        nazev: z.string(),
        popis: z.string(),
      })
    ),

    ref_tag: z.string(), // klíč do window.SNAIL_REF_QUOTES / reference.html?dest=

    // Co na stránce ještě chybí doplnit od klienta — vykreslí se jako
    // viditelné "⚠ Doplnit od klienta" bloky / poznámka pod sekcemi.
    chybi: z.array(z.string()),
  }),
});

export const collections = {
  destinace: destinaceCollection,
};

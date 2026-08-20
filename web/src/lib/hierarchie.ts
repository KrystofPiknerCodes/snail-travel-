// Sdílená logika pro procházení stromu Destinace/Oblast/Hotel podle pole
// `nadrazena` — viz komentář v ../content.config.ts (u destinaceCollection
// i hotelCollection) pro vysvětlení, proč je `nadrazena` dvojí povahy
// (skutečná vazba na slug v kolekci `destinace`, nebo jen volný text).
//
// Používá [...slug].astro pro:
// - generování URL segmentů (getStaticPaths) do libovolné hloubky,
// - drobečkovou navigaci (Hlavní strana / Destinace / <kontinent> / ... / uzel),
// - výpis potomků (oblasti pod destinací, hotely pod oblastí/destinací).
import type { CollectionEntry } from 'astro:content';

export type DestEntry = CollectionEntry<'destinace'>;
export type HotelEntry = CollectionEntry<'hotel'>;

export const KONTINENT_NAZEV: Record<string, string> = {
  EU: 'Evropa',
  AF: 'Afrika',
  AS: 'Asie',
  NA: 'Severní Amerika',
  SA: 'Jižní Amerika',
  OC: 'Austrálie a Oceánie',
};

/** Namapuje kolekci `destinace` na Map<id, entry> pro rychlé vyhledání rodiče. */
export function indexDestinace(destinace: DestEntry[]): Map<string, DestEntry> {
  return new Map(destinace.map((d) => [d.id, d]));
}

/**
 * Projde řetěz `nadrazena` od zadané hodnoty směrem nahoru, dokud odkazuje
 * na skutečný záznam v kolekci `destinace`. Jakmile `nadrazena` neodpovídá
 * žádnému `id` (typicky volný text jako "Portugalsko"), řetěz se zastaví —
 * to je záměr, ne chyba (viz content.config.ts).
 *
 * Vrací pole předků OD KOŘENE k nejbližšímu rodiči (bez zadaného uzlu samotného).
 */
export function resolveAncestors(
  nadrazena: string | undefined,
  destinaceById: Map<string, DestEntry>
): DestEntry[] {
  const chain: DestEntry[] = [];
  let cur = nadrazena;
  const seen = new Set<string>();
  while (cur) {
    const parent = destinaceById.get(cur);
    if (!parent || seen.has(parent.id)) break;
    seen.add(parent.id);
    chain.unshift(parent);
    cur = parent.data.nadrazena;
  }
  return chain;
}

/** URL segmenty od kořene po zadaný uzel, např. ['madeira', 'funchal']. */
export function pathSegments(
  entry: DestEntry | HotelEntry,
  destinaceById: Map<string, DestEntry>
): string[] {
  const chain = resolveAncestors(entry.data.nadrazena, destinaceById);
  return [...chain.map((c) => c.id), entry.id];
}

/** Kontinent uzlu — u hotelu odvozený z nejbližšího předka, který ho má. */
export function resolveKontinent(
  entry: DestEntry | HotelEntry,
  chain: DestEntry[]
): string | undefined {
  if ('kontinent' in entry.data) return entry.data.kontinent;
  return chain[0]?.data.kontinent;
}

/** Přímé podřazené záznamy typu 'oblast' pod danou destinací/oblastí. */
export function childOblasti(destinaceId: string, destinace: DestEntry[]): DestEntry[] {
  return destinace.filter((d) => d.data.typ === 'oblast' && d.data.nadrazena === destinaceId);
}

/**
 * Všechny hotely, které patří pod daný uzel (destinace nebo oblast) —
 * ať už přímo (nadrazena === uzel), nebo přes libovolně hluboký řetěz oblastí
 * (nadrazena === podřazená oblast téhož uzlu). Používá mapa i sekce
 * ubytování na stránce destinace, kde se ukazují karty oblastí, ale mapa
 * pořád musí zakreslit špendlíky VŠECH hotelů, i těch v oblastech.
 */
export function hotelyPod(
  destinaceId: string,
  hotely: HotelEntry[],
  destinace: DestEntry[]
): HotelEntry[] {
  const podIds = new Set<string>([destinaceId]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const d of destinace) {
      if (d.data.nadrazena && podIds.has(d.data.nadrazena) && !podIds.has(d.id)) {
        podIds.add(d.id);
        grew = true;
      }
    }
  }
  return hotely.filter((h) => podIds.has(h.data.nadrazena));
}

export interface Crumb {
  label: string;
  href?: string; // undefined u aktuální (poslední) položky
}

/** Sestaví drobečkovou navigaci: Hlavní strana / Destinace / <kontinent> / ... / <uzel>. */
export function buildBreadcrumb(
  entry: DestEntry | HotelEntry,
  chain: DestEntry[]
): Crumb[] {
  const kontinent = resolveKontinent(entry, chain);
  const crumbs: Crumb[] = [
    { label: 'Hlavní strana', href: '/' },
    { label: 'Destinace', href: '/destinace' },
  ];
  if (kontinent && KONTINENT_NAZEV[kontinent]) {
    crumbs.push({ label: KONTINENT_NAZEV[kontinent] });
  }
  let acc: string[] = [];
  for (const ancestor of chain) {
    acc = [...acc, ancestor.id];
    crumbs.push({ label: ancestor.data.nazev, href: `/destinace/${acc.join('/')}` });
  }
  crumbs.push({ label: entry.data.nazev });
  return crumbs;
}

// Cenové kategorie hotelů — nahrazují zobrazení přesné ceny (od X Kč) značkou
// $ až $$$$$ (viz rozhodnutí Krystof, září 2026: "ceny budou pouze u hotelů",
// destinace/oblast cenu nezobrazují vůbec). `cena_od` v obsahu zůstává jako
// interní podklad, ze kterého se kategorie odvozuje — na stránce se
// nezobrazuje přesné číslo, jen symbol.
//
// Hranice (Kč / noc, dle zadání): do 5k $, 5k–10k $$, 10k–20k $$$,
// 20k–40k $$$$, nad 40k $$$$$.

export type CenovaUroven = 1 | 2 | 3 | 4 | 5;

export interface CenovaKategorie {
  uroven: CenovaUroven;
  symbol: string; // "$" .. "$$$$$"
  popis: string; // "do 5 000 Kč / noc"
}

const HRANICE = [5000, 10000, 20000, 40000];

const POPISY: Record<CenovaUroven, string> = {
  1: 'do 5 000 Kč / noc',
  2: '5 000–10 000 Kč / noc',
  3: '10 000–20 000 Kč / noc',
  4: '20 000–40 000 Kč / noc',
  5: 'nad 40 000 Kč / noc',
};

export function cenovaUroven(cenaOd: number): CenovaUroven {
  let uroven = 1;
  for (const hranice of HRANICE) {
    if (cenaOd >= hranice) uroven++;
    else break;
  }
  return Math.min(uroven, 5) as CenovaUroven;
}

export function cenovaKategorie(cenaOd: number): CenovaKategorie {
  const uroven = cenovaUroven(cenaOd);
  return { uroven, symbol: '$'.repeat(uroven), popis: POPISY[uroven] };
}

export const VSECHNY_KATEGORIE: CenovaKategorie[] = ([1, 2, 3, 4, 5] as CenovaUroven[]).map((u) => ({
  uroven: u,
  symbol: '$'.repeat(u),
  popis: POPISY[u],
}));

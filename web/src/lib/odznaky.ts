// Odznáčky hotelů (sdílená sada pro detail hotelu i filtr na /hotely).
// Slugy musí odpovídat enumu `odznaky` v content.config.ts. Skupina A = info
// o hotelu (plný zlatý kroužek), B = typ zájezdu (obrysový kroužek) — stejné
// rozlišení jako v docs/navrh-stitky-hotelu.html.
// Ikony jsou jen z vlastní sady src/ikony/linka.js; kde pro odznáček nemáme
// vlastní piktogram, použita nejbližší existující (nové se nekreslí).

export const ODZNAKY_SLUGY = [
  'all-inclusive', 'wellness', 'plazove', 'jen-dospeli', 'eko', 'wow', 's-detmi',
  'ayurveda', 'barefoot', 'eurovikend', 'exoticky', 'fly-drive', 'golf', 'ledove',
  'plavby', 'vlaky', 'lyzovani', 'pobytovy', 'poznavaci', 'vily', 'safari',
  'stopover', 'seniori',
] as const;

export type OdznakSlug = (typeof ODZNAKY_SLUGY)[number];

export interface OdznakInfo {
  label: string;
  ikona: string;
  skupina: 'A' | 'B';
}

export const ODZNAKY: Record<OdznakSlug, OdznakInfo> = {
  'all-inclusive': { label: 'All inclusive', ikona: 'cocktail', skupina: 'A' },
  wellness: { label: 'Wellness', ikona: 'droplet', skupina: 'A' },
  plazove: { label: 'Plážové hotely', ikona: 'beach-umbrella', skupina: 'A' },
  'jen-dospeli': { label: 'Pouze pro dospělé', ikona: 'sofa', skupina: 'A' },
  eko: { label: 'EKO hotely', ikona: 'sun', skupina: 'A' },
  wow: { label: 'WOW hotely', ikona: 'landmark', skupina: 'A' },
  's-detmi': { label: 'Cestování s dětmi', ikona: 'island', skupina: 'A' },
  ayurveda: { label: 'Ayurvéda', ikona: 'droplet', skupina: 'A' },
  barefoot: { label: 'Barefoot', ikona: 'beach-umbrella', skupina: 'A' },
  eurovikend: { label: 'Eurovíkend', ikona: 'luggage', skupina: 'B' },
  exoticky: { label: 'Exotický zájezd', ikona: 'island', skupina: 'B' },
  'fly-drive': { label: 'Fly & Drive', ikona: 'car', skupina: 'B' },
  golf: { label: 'Golfový zájezd', ikona: 'golf-flag', skupina: 'B' },
  ledove: { label: 'Ledové hotely', ikona: 'hotel', skupina: 'A' },
  plavby: { label: 'Luxusní plavby', ikona: 'compass', skupina: 'B' },
  vlaky: { label: 'Luxusní vlaky', ikona: 'luggage', skupina: 'B' },
  lyzovani: { label: 'Lyžování', ikona: 'dumbbell', skupina: 'B' },
  pobytovy: { label: 'Pobytový zájezd', ikona: 'island', skupina: 'B' },
  poznavaci: { label: 'Poznávací okruhy', ikona: 'compass', skupina: 'B' },
  vily: { label: 'Pronájmy vil', ikona: 'hotel', skupina: 'A' },
  safari: { label: 'Safari', ikona: 'map-pin', skupina: 'B' },
  stopover: { label: 'Stop Over', ikona: 'plane', skupina: 'B' },
  seniori: { label: 'Zájezd pro seniory', ikona: 'sofa', skupina: 'B' },
};

export const STRAVA_SLUGY = ['snidane', 'polopenze', 'plna-penze', 'all-inclusive'] as const;
export type StravaSlug = (typeof STRAVA_SLUGY)[number];

export const STRAVA_LABEL: Record<StravaSlug, string> = {
  snidane: 'Snídaně',
  polopenze: 'Polopenze',
  'plna-penze': 'Plná penze',
  'all-inclusive': 'All inclusive',
};

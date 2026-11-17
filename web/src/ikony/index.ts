// Piktogramy webu — vlastní tenká linková sada s animací (src/ikony/linka.js).
// Kresba je naše; pohyb pohání runtime z balíčku kubai-icons (animate/bindTrigger),
// proto ikony mají jeho formát { name, markup, target, draw }.
//
// Klíč = jméno, které se používá v <Ikona name="…"> a v data-kubai="…" (JS v public/).
// Přidání ikony: nakreslit ji v linka.js (mřížka 24×24, linka 1.5, výplň SOFT).
import { LINKA } from './linka.js';

export type KubaiIcon = {
  name: string;
  markup: string;
  tap: boolean;
  target: (hover: boolean, state?: unknown) => Record<string, number>;
  draw: (p: Record<string, number>, E: Record<string, Element>) => void;
};

export const IKONY: Record<string, KubaiIcon> = Object.fromEntries(
  (LINKA as KubaiIcon[]).map((ic) => [ic.name, ic]),
);

/** SVG jedné ikony. Barva = currentColor (řídí CSS kontextu), linka má vždy stejnou tloušťku (.ki-line). */
export function ikonaSvg(ic: KubaiIcon, { size = 24, className }: { size?: number; className?: string } = {}) {
  const cls = ['ki-line', `ki-${ic.name}`, className].filter(Boolean).join(' ');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}" class="${cls}" data-ki="${ic.name}" aria-hidden="true" overflow="visible">${ic.markup}</svg>`;
}

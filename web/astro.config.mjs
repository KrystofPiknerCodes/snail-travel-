// @ts-check
import { defineConfig } from 'astro/config';

// SITE_BASE se nastavuje jen při buildu pro GitHub Pages podadresář
// (např. "/snail-travel-/"), aby Astro/Vite samy správně prefixovaly
// interní assety (dynamické importy jako Leaflet v MapaOblasti.astro).
// Lokální dev i běžný build zůstávají na "/" beze změny.
// https://astro.build/config
export default defineConfig({
  base: process.env.SITE_BASE || '/',
});

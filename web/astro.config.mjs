// @ts-check
import { defineConfig } from 'astro/config';
import remarkCzechNbsp from './remark-czech-nbsp.mjs';

// SITE_BASE se nastavuje jen při buildu pro GitHub Pages podadresář
// (např. "/snail-travel-/"), aby Astro/Vite samy správně prefixovaly
// interní assety (dynamické importy jako Leaflet v MapaOblasti.astro).
// Lokální dev i běžný build zůstávají na "/" beze změny.
// https://astro.build/config
export default defineConfig({
  base: process.env.SITE_BASE || '/',
  markdown: {
    // Česká typografie: jednoznakové předložky/spojky (k, s, v...) svázané
    // pevnou mezerou s dalším slovem, ať nezůstanou samotné na konci řádku.
    // Týká se Markdown obsahu (<Content />) — viz remark-czech-nbsp.mjs.
    remarkPlugins: [remarkCzechNbsp],
  },
});

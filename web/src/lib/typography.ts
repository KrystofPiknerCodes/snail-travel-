// Česká typografická sazba: jednoznakové předložky a spojky (k, s, v, z, o,
// u, a, i) se nesmí octnout samotné na konci řádku. Řeší se svázáním s
// následujícím slovem pevnou mezerou (U+00A0) — funguje jako obyčejný znak
// v textu, žádné HTML entity ani "set:html" není potřeba.
//
// Pro dlouhý text v Markdownu (`<Content />`) řeší totéž `remark-czech-nbsp.mjs`
// (viz astro.config.mjs) — tahle funkce je pro krátké řetězce vypisované přímo
// v .astro šablonách (perex, texty Objevujte/Poznávejte/Relaxujte, položky
// seznamů apod.), kam remark nedosáhne.
const SINGLE_CHAR_WORD = /(^|[\s([{„“'"])([aiksuvzAIKSUVZ])[ \t]+(?=\S)/g;

export function czechNbsp(text: string): string {
  return text.replace(SINGLE_CHAR_WORD, '$1$2 ');
}

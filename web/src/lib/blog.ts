// Nejnovější článek z blogu (blog.snailtravel.cz, WordPress) pro ukázku na
// homepage — Krystof, 28. 11. 2026: "ať na to někdo klikne".
//
// Načítá se PŘI BUILDU, ne v prohlížeči: blog neposílá CORS hlavičky, takže
// fetch z klienta by prohlížeč zablokoval. Důsledek: na webu je článek, který
// byl nejnovější v době posledního buildu/nasazení — po vydání nového článku
// stačí web znovu sestavit a nasadit.
//
// Zdroj: RSS (https://blog.snailtravel.cz/feed/) — název, odkaz, datum,
// autor, perex. Obrázek RSS nenese, proto se dočte ze stránky článku
// (náhledový obrázek WordPressu, třída "wp-post-image").
// Když cokoli selže (blog nedostupný, timeout), vrací null a homepage
// sekci prostě nevykreslí — build kvůli blogu nikdy nespadne.

export const BLOG_URL = 'https://blog.snailtravel.cz/';
const FEED_URL = 'https://blog.snailtravel.cz/feed/';

export interface BlogClanek {
  nazev: string;
  odkaz: string;
  datum: Date | null;
  autor: string;
  perex: string;
  kategorie: string[];
  obrazek: string | null;
}

function decode(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#8230;|&hellip;/g, '…')
    .replace(/&#8211;|&ndash;/g, '–')
    .replace(/&#8212;|&mdash;/g, '—')
    .replace(/&#8222;/g, '„')
    .replace(/&#8220;/g, '“')
    .replace(/&#8217;|&rsquo;/g, '’')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function tag(xml: string, name: string): string {
  const m = xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`));
  return m ? decode(m[1]) : '';
}

async function stahni(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'snailtravel-web-build' },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  return res.text();
}

let cache: Promise<BlogClanek | null> | null = null;

export function nejnovejsiClanek(): Promise<BlogClanek | null> {
  cache ??= (async () => {
    try {
      const feed = await stahni(FEED_URL);
      const item = feed.match(/<item>([\s\S]*?)<\/item>/)?.[1];
      if (!item) return null;

      const odkaz = tag(item, 'link');
      if (!odkaz.startsWith(BLOG_URL)) return null;
      const datumText = tag(item, 'pubDate');
      // Perex z RSS končí odkazem "Pokračování textu …" — ten se uřízne.
      const perex = tag(item, 'description').replace(/\s*Pokračování textu[\s\S]*$/, '').trim();
      const kategorie = [...item.matchAll(/<category>([\s\S]*?)<\/category>/g)]
        .map((m) => decode(m[1]))
        .filter((k) => k === k.toUpperCase()); // jen hlavní rubriky (VERZÁLKY), ne štítky

      let obrazek: string | null = null;
      try {
        const html = await stahni(odkaz);
        const img = html.match(/<img[^>]+class="[^"]*wp-post-image[^"]*"[^>]*>/)?.[0];
        obrazek = img?.match(/\ssrc="([^"]+)"/)?.[1] ?? null;
      } catch {
        obrazek = null;
      }

      return {
        nazev: tag(item, 'title'),
        odkaz,
        datum: datumText ? new Date(datumText) : null,
        autor: tag(item, 'dc:creator'),
        perex,
        kategorie,
        obrazek: obrazek && obrazek.startsWith(BLOG_URL) ? obrazek : null,
      };
    } catch (e) {
      console.warn('[blog] nejnovější článek se nepodařilo načíst:', (e as Error).message);
      return null;
    }
  })();
  return cache;
}

// Remark plugin: nahradí mezeru za jednoznakovou předložkou/spojkou (k, s, v,
// z, o, u, a, i) pevnou mezerou (U+00A0), ať se nikdy neocitne samotná na
// konci řádku. Prochází jen textové uzly mdast stromu (ne kód, ne URL odkazů),
// takže se netýká ničeho, co není běžný odstavcový text.
//
// Stejné pravidlo pro krátké řetězce vypisované přímo v .astro šablonách
// (perex, texty Objevujte/Poznávejte/Relaxujte...) řeší `src/lib/typography.ts`
// (`czechNbsp`) — sem remark nedosáhne, protože to není Markdown.
const SINGLE_CHAR_WORD = /(^|[\s([{„“'"])([aiksuvzAIKSUVZ])[ \t]+(?=\S)/g;

function visit(node) {
  if (node.type === 'text' && typeof node.value === 'string') {
    node.value = node.value.replace(SINGLE_CHAR_WORD, '$1$2 ');
    return;
  }
  if (Array.isArray(node.children)) {
    for (const child of node.children) visit(child);
  }
}

export default function remarkCzechNbsp() {
  return (tree) => {
    visit(tree);
  };
}

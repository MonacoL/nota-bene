// I blocchi ```abc dei Capitoli diventano un contenitore con il sorgente in un attributo:
// abcjs li disegna nel browser (src/scripts/pentagrammi.ts), perché la larghezza dipende dallo schermo (ADR-0006).
// È un plugin mdast di Sätteri, il processore Markdown di Astro.

export function escapeAttributo(testo: string): string {
  return testo.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** L'HTML che prende il posto di un blocco ```abc. */
export function htmlPentagramma(abc: string): string {
  return `<div class="pentagramma" data-abc="${escapeAttributo(abc.trim())}"></div>`;
}

export const pentagrammi = {
  name: 'nota-bene-pentagrammi',
  code(nodo: Readonly<{ lang?: string | null; value: string }>) {
    if (nodo.lang !== 'abc') return undefined;
    return { type: 'html' as const, value: htmlPentagramma(nodo.value) };
  },
};

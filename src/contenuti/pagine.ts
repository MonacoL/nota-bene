// Regole delle pagine di servizio (ADR-0006, ticket #14), in TypeScript puro: le usano la build e i test.

/** Le pagine di servizio, nell'ordine del piè di pagina. L'id è lo slug dell'URL e il nome del file Markdown. */
export const PAGINE_SERVIZIO = ['privacy', 'intelligenza-artificiale', 'crediti', 'contatti'] as const;
export type PaginaServizio = (typeof PAGINE_SERVIZIO)[number];

/**
 * Gli errori che bloccano la build: una pagina che manca in una lingua o un file in più.
 * A differenza dei Capitoli, una pagina che manca in inglese non ripiega sull'italiano.
 */
export function controllaPagine(it: readonly string[], en: readonly string[]): string[] {
  const errori: string[] = [];
  for (const [lingua, ids] of [['it', it], ['en', en]] as const) {
    for (const id of ids) {
      if (!(PAGINE_SERVIZIO as readonly string[]).includes(id)) {
        errori.push(`contenuti/pagine/${lingua}/${id}.md: "${id}" non è una pagina di servizio (${PAGINE_SERVIZIO.join(', ')})`);
      }
    }
    for (const id of PAGINE_SERVIZIO) {
      if (!ids.includes(id)) {
        errori.push(`contenuti/pagine/${lingua}/${id}.md: manca${lingua === 'en' ? ", e le pagine di servizio non ripiegano sull'italiano" : ''}`);
      }
    }
  }
  return errori;
}

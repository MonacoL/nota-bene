// Regole delle pagine di servizio (ADR-0006, ticket #14), in TypeScript puro: le usano la build e i test.

/** Le pagine di servizio, nell'ordine del piè di pagina. L'id è lo slug dell'URL e il nome del file Markdown. */
export const PAGINE_SERVIZIO = ['privacy', 'intelligenza-artificiale', 'crediti', 'contatti'] as const;
export type PaginaServizio = (typeof PAGINE_SERVIZIO)[number];

/**
 * Le pagine che spiegano come si studia (#84): stanno in contenuti/pagine/ come quelle di servizio, ma non sono nel
 * piè di pagina e, come i Capitoli, in inglese ripiegano sull'italiano finché la traduzione non c'è (ADR-0006).
 */
export const PAGINE_GUIDA = ['come-si-studia'] as const;
export type PaginaGuida = (typeof PAGINE_GUIDA)[number];

/**
 * Gli errori che bloccano la build: una pagina che manca in una lingua o un file in più.
 * A differenza dei Capitoli, una pagina di servizio che manca in inglese non ripiega sull'italiano; una pagina
 * guida sì, ma deve esserci in italiano.
 */
export function controllaPagine(it: readonly string[], en: readonly string[]): string[] {
  const errori: string[] = [];
  for (const [lingua, ids] of [['it', it], ['en', en]] as const) {
    for (const id of ids) {
      if (!(PAGINE_SERVIZIO as readonly string[]).includes(id) && !(PAGINE_GUIDA as readonly string[]).includes(id)) {
        errori.push(`contenuti/pagine/${lingua}/${id}.md: "${id}" non è una pagina di servizio (${PAGINE_SERVIZIO.join(', ')}) né una pagina guida (${PAGINE_GUIDA.join(', ')})`);
      }
    }
    for (const id of lingua === 'it' ? [...PAGINE_SERVIZIO, ...PAGINE_GUIDA] : PAGINE_SERVIZIO) {
      if (!ids.includes(id)) {
        errori.push(`contenuti/pagine/${lingua}/${id}.md: manca${lingua === 'en' ? ", e le pagine di servizio non ripiegano sull'italiano" : ''}`);
      }
    }
  }
  return errori;
}

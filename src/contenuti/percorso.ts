// Regole del Percorso e dei Capitoli, in TypeScript puro: le pagine le usano alla build, i test con Vitest.
import type { CapitoloEn, CapitoloIt, VocePercorso } from './schemi';

/** La scaletta in ordine. Fallisce se i numeri non vanno da 1 a N senza buchi o se un id si ripete. */
export function ordina(voci: readonly VocePercorso[]): VocePercorso[] {
  const ordinate = [...voci].sort((a, b) => a.numero - b.numero);
  ordinate.forEach((v, i) => {
    if (v.numero !== i + 1) throw new Error(`Percorso: atteso il Capitolo numero ${i + 1}, trovato ${v.numero} (${v.id})`);
  });
  const ids = new Set(ordinate.map((v) => v.id));
  if (ids.size !== ordinate.length) throw new Error('Percorso: due Capitoli hanno lo stesso id');
  return ordinate;
}

/** Il Capitolo prima e quello dopo nel Percorso, se ci sono. */
export function vicini<T extends { id: string }>(percorso: readonly T[], id: string): { precedente?: T; successivo?: T } {
  const i = percorso.findIndex((v) => v.id === id);
  if (i < 0) throw new Error(`Capitolo "${id}" non è nel Percorso`);
  return { precedente: percorso[i - 1], successivo: percorso[i + 1] };
}

/**
 * Quale file mostrare per un Capitolo in una lingua. In inglese, se il file manca, si mostra l'italiano
 * con un avviso (ripiego). Senza file in nessuna lingua il Capitolo è ancora in preparazione.
 */
export function scegliTesto<T>(lingua: 'it' | 'en', it: T | undefined, en: T | undefined):
  | { testo: T; lingua: 'it' | 'en'; ripiego: boolean }
  | undefined {
  if (lingua === 'en' && en) return { testo: en, lingua: 'en', ripiego: false };
  if (it) return { testo: it, lingua: 'it', ripiego: lingua === 'en' };
  return undefined;
}

/** Un file di Capitolo che non corrisponde al Percorso è un errore: fa fallire la build. */
export function controllaFile(percorso: readonly VocePercorso[], it: readonly string[], en: readonly string[]): string[] {
  const ids = new Set(percorso.map((v) => v.id));
  const errori: string[] = [];
  for (const id of it) if (!ids.has(id)) errori.push(`contenuti/capitoli/it/${id}.md: "${id}" non è nel Percorso`);
  for (const id of en) {
    if (!ids.has(id)) errori.push(`contenuti/capitoli/en/${id}.md: "${id}" non è nel Percorso`);
    else if (!it.includes(id)) errori.push(`contenuti/capitoli/en/${id}.md: manca l'originale italiano`);
  }
  return errori;
}

export type AvvisoTraduzione = { file: string; messaggio: string };

/**
 * Avvisi che non bloccano il deploy (ADR-0006), per i Capitoli e per le pagine di servizio: una traduzione fatta
 * da una revisione italiana più vecchia di quella attuale, e un Capitolo italiano senza traduzione. Una pagina di
 * servizio senza traduzione non è un avviso ma un errore che blocca la build (controllaPagine, in pagine.ts).
 */
export function avvisiTraduzione(
  it: ReadonlyMap<string, Pick<CapitoloIt, 'revisione'>>,
  en: ReadonlyMap<string, Pick<CapitoloEn, 'tradotto_da'>>,
  cartella: 'capitoli' | 'pagine' = 'capitoli',
): AvvisoTraduzione[] {
  const avvisi: AvvisoTraduzione[] = [];
  for (const [id, originale] of it) {
    const traduzione = en.get(id);
    if (!traduzione) {
      if (cartella === 'capitoli') {
        avvisi.push({ file: `contenuti/capitoli/it/${id}.md`, messaggio: `il Capitolo "${id}" manca in inglese: /en/ mostra l'italiano` });
      }
    } else if (traduzione.tradotto_da < originale.revisione.data) {
      avvisi.push({
        file: `contenuti/${cartella}/en/${id}.md`,
        messaggio: `traduzione indietro: tradotta dalla revisione del ${giorno(traduzione.tradotto_da)}, l'italiano è stato rivisto il ${giorno(originale.revisione.data)}`,
      });
    }
  }
  return avvisi;
}

function giorno(d: Date): string {
  return d.toISOString().slice(0, 10);
}

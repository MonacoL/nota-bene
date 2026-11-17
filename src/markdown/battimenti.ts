// I blocchi ```battimenti dei Capitoli (#90) diventano un contenitore con l'intervallo in un attributo: il pulsante
// e il suono li aggiunge nel browser src/scripts/battimenti.ts. Dentro il blocco c'è solo il nome dell'intervallo.
import { INTERVALLI } from '../audio/battimenti.ts';

export const battimenti = {
  name: 'nota-bene-battimenti',
  code(nodo: Readonly<{ lang?: string | null; value: string }>) {
    if (nodo.lang !== 'battimenti') return undefined;
    const intervallo = nodo.value.trim();
    if (!(INTERVALLI as readonly string[]).includes(intervallo)) {
      throw new Error(`Esempio di battimenti: "${intervallo}" non è fra ${INTERVALLI.join(', ')}`);
    }
    return { type: 'html' as const, value: `<div class="battimenti" data-intervallo="${intervallo}"></div>` };
  },
};

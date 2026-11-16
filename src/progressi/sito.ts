// I Progressi nel sito (ADR-0011): localStorage, se il browser lo lascia usare, e i Capitoli dalla pagina.
// Base.astro scrive in ogni pagina i Capitoli con i tipi dei loro Esercizi e i Prerequisiti (#nb-capitoli).
// Chi cambia i Progressi (Serie, segna, cancella, modo) lo annuncia con l'evento CAMBIO, e chi li mostra si aggiorna.
import { creaProgressi, type Archivio, type CapitoloDaCompletare } from '.';

export type CapitoloDelSito = CapitoloDaCompletare & { prerequisiti: string[] };

export const CAMBIO = 'nb:progressi';

/** Un archivio che non funziona: creaProgressi lo riconosce e passa allo Studio libero. */
const nonDisponibile: Archivio = {
  getItem: () => {
    throw new Error('localStorage non disponibile');
  },
  setItem: () => {},
  removeItem: () => {},
};

/** In navigazione privata o con i dati del sito bloccati anche leggere window.localStorage lancia un errore. */
function archivioDelSito(): Archivio {
  try {
    const s = window.localStorage;
    s.getItem('nota-bene:prova');
    return s;
  } catch {
    return nonDisponibile;
  }
}

export function capitoliDelSito(): CapitoloDelSito[] {
  const dati = document.getElementById('nb-capitoli')?.textContent;
  return dati ? (JSON.parse(dati) as CapitoloDelSito[]) : [];
}

export function progressiDelSito() {
  return creaProgressi(archivioDelSito(), capitoliDelSito());
}

/** Da chiamare dopo ogni cambio dei Progressi. */
export function annunciaCambio(): void {
  document.dispatchEvent(new Event(CAMBIO));
}

/** Esegue `aggiorna` subito e a ogni cambio dei Progressi, anche da un'altra scheda. */
export function seguiProgressi(aggiorna: () => void): void {
  document.addEventListener(CAMBIO, aggiorna);
  window.addEventListener('storage', aggiorna);
  aggiorna();
}

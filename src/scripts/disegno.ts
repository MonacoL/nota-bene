// Il solo modo di non ridisegnare un pentagramma che ha già quel disegno (ticket #67): lo usano gli Esercizi
// (src/scripts/abc.ts), la Lettura e gli esempi dei Capitoli (src/scripts/pentagrammi.ts). Il disegno di un
// contenitore si ricorda come ABC e larghezza, in memoria e non nel DOM.

const disegni = new WeakMap<HTMLElement, string>();

/**
 * Segna che nel contenitore va questo ABC a questa larghezza. Restituisce false se ce l'ha già, e allora non c'è
 * niente da disegnare; true se è nuovo, e allora chi lo segna deve disegnarlo.
 */
export function segnaDisegno(contenitore: HTMLElement, larghezza: number, abc: string): boolean {
  const disegno = `${larghezza}|${abc}`;
  if (disegni.get(contenitore) === disegno) return false;
  disegni.set(contenitore, disegno);
  return true;
}

/** Dimentica il disegno segnato nel contenitore: il prossimo segnaDisegno lo darà come nuovo (arriva il font del sito). */
export function dimenticaDisegno(contenitore: HTMLElement): void {
  disegni.delete(contenitore);
}

/** Il margine interno del foglio color carta (ADR-0010), a sinistra più a destra: la partitura ci sta dentro. */
export function margineFoglio(foglio: HTMLElement): number {
  const stile = getComputedStyle(foglio);
  return (parseFloat(stile.paddingLeft) || 0) + (parseFloat(stile.paddingRight) || 0);
}

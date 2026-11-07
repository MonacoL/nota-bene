// Disegno con abcjs dei pentagrammi degli Esercizi, su un rigo solo. Gli esempi dei Capitoli vanno a capo come le
// Letture (src/scripts/a-capo.ts, ticket #63).
// abcjs disegna in currentColor: il pentagramma prende il colore del testo, quindi segue il tema (ADR-0009).
// Qui sta anche il solo modo di non ridisegnare un pentagramma già disegnato, che usano Esercizi, Letture ed esempi.
import { renderAbc } from 'abcjs';

/**
 * Se il contenitore va disegnato: no se ha già questo ABC a questa larghezza. Se sì, lo segna come disegnato, e chi
 * chiede deve disegnarlo.
 */
export function daRidisegnare(contenitore: HTMLElement, larghezza: number, abc: string): boolean {
  const chiave = `${larghezza}|${abc}`;
  if (contenitore.dataset.disegnato === chiave) return false;
  contenitore.dataset.disegnato = chiave;
  return true;
}

/** Fa dimenticare il disegno del contenitore: il prossimo daRidisegnare dirà sì (quando arriva il font del sito). */
export function dimentica(contenitore: HTMLElement): void {
  delete contenitore.dataset.disegnato;
}

type Opzioni = { larghezzaMassima: number; scala?: number };

/** Disegna l'ABC nel contenitore, largo quanto il contenitore; non ridisegna se ABC e larghezza non cambiano. */
export function disegna(contenitore: HTMLElement, abc: string, { larghezzaMassima, scala = 1 }: Opzioni): void {
  const larghezza = Math.floor(Math.min(contenitore.clientWidth, larghezzaMassima) / scala);
  if (!daRidisegnare(contenitore, larghezza, abc)) return;
  renderAbc(contenitore, abc, {
    staffwidth: larghezza,
    scale: scala,
    add_classes: true,
    paddingleft: 0,
    paddingright: 0,
    paddingtop: 0,
    paddingbottom: 0,
  });
}

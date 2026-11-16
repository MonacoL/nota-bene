// Disegno con abcjs dei pentagrammi degli Esercizi, su un rigo solo. Gli esempi dei Capitoli vanno a capo come le
// Letture (src/scripts/a-capo.ts, ticket #63).
// abcjs disegna in currentColor: il pentagramma prende il colore del testo, e sul foglio color carta il colore della carta (ADR-0010).
import { renderAbc, type TuneObject } from 'abcjs';
import { margineFoglio, segnaDisegno } from './disegno';

type Opzioni = { larghezzaMassima: number; scala?: number };

/**
 * Disegna l'ABC nel contenitore, largo quanto il contenitore; non ridisegna se ABC e larghezza non cambiano.
 * Restituisce il disegno nuovo, che serve all'Ascolto (ticket #35), o niente se non ha ridisegnato.
 */
export function disegna(contenitore: HTMLElement, abc: string, { larghezzaMassima, scala = 1 }: Opzioni): TuneObject | undefined {
  const larghezza = Math.floor(Math.min(contenitore.clientWidth - margineFoglio(contenitore), larghezzaMassima) / scala);
  if (!segnaDisegno(contenitore, larghezza, abc)) return undefined;
  return renderAbc(contenitore, abc, {
    staffwidth: larghezza,
    scale: scala,
    add_classes: true,
    paddingleft: 0,
    paddingright: 0,
    paddingtop: 0,
    paddingbottom: 0,
  })[0];
}

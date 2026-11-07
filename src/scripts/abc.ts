// Disegno con abcjs dei pentagrammi degli Esercizi, su un rigo solo. Gli esempi dei Capitoli vanno a capo come le
// Letture (src/scripts/a-capo.ts, ticket #63).
// abcjs disegna in currentColor: il pentagramma prende il colore del testo, quindi segue il tema (ADR-0009).
import { renderAbc, type TuneObject } from 'abcjs';
import { segnaDisegno } from './disegno';

type Opzioni = { larghezzaMassima: number; scala?: number };

/**
 * Disegna l'ABC nel contenitore, largo quanto il contenitore; non ridisegna se ABC e larghezza non cambiano.
 * Restituisce il disegno nuovo, che serve all'Ascolto (ticket #35), o niente se non ha ridisegnato.
 */
export function disegna(contenitore: HTMLElement, abc: string, { larghezzaMassima, scala = 1 }: Opzioni): TuneObject | undefined {
  const larghezza = Math.floor(Math.min(contenitore.clientWidth, larghezzaMassima) / scala);
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

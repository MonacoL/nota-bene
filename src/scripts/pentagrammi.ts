// Disegna con abcjs gli esempi musicali scritti nei blocchi ```abc (vedi src/markdown/pentagrammi.ts).
// Il rigo è largo quanto la colonna di testo, a grandezza naturale, e va a capo fra le Battute come una Lettura
// (ticket #63): si rifà l'a capo solo se la larghezza cambia, e quando arriva il font del sito, con cui si misurano
// le Sillabe.
import type { TuneObject } from 'abcjs';
import { dividiEsempio } from '../markdown/esempi';
import { daRidisegnare, dimentica } from './abc';
import { disegnaACapo } from './a-capo';

const LARGHEZZA_MASSIMA = 560;

const contenitori = [...document.querySelectorAll<HTMLElement>('.pentagramma[data-abc]')];
const disegni = new WeakMap<HTMLElement, TuneObject>();

/**
 * Il disegno corrente dell'esempio nel contenitore, quello dell'ultimo a capo: l'Audio degli esempi (ticket #35) ci
 * trova tempi e note, come l'Ascolto di verifica nelle Letture (ticket #31). Dopo un ridisegno è un altro: va
 * chiesto ogni volta.
 */
export const disegnoDi = (contenitore: HTMLElement): TuneObject | undefined => disegni.get(contenitore);

function disegna(contenitore: HTMLElement) {
  // Si misura la colonna e non il contenitore: abcjs dà al div in cui disegna la larghezza dell'SVG.
  const larghezza = Math.floor(Math.min(contenitore.parentElement?.clientWidth ?? 0, LARGHEZZA_MASSIMA));
  const abc = contenitore.dataset.abc ?? '';
  if (!larghezza || !daRidisegnare(contenitore, larghezza, abc)) return;
  disegni.set(contenitore, disegnaACapo(contenitore, abc, { larghezza, scala: 1, divisore: dividiEsempio }));
}

const tutti = () => contenitori.forEach(disegna);
tutti();
new ResizeObserver(tutti).observe(document.body);
document.fonts.ready.then(() => {
  contenitori.forEach(dimentica);
  tutti();
});

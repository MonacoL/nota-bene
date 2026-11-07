// Disegna con abcjs gli esempi musicali scritti nei blocchi ```abc (vedi src/markdown/pentagrammi.ts).
// Il rigo è largo quanto la colonna di testo, a grandezza naturale, e va a capo fra le Battute come una Lettura
// (ticket #63): si rifà l'a capo solo se la larghezza cambia, e quando arriva il font del sito, con cui si misurano
// le Sillabe.
import { dividiEsempio } from '../letture/a-capo';
import { disegnaACapo } from './a-capo';

const LARGHEZZA_MASSIMA = 560;

const contenitori = [...document.querySelectorAll<HTMLElement>('.pentagramma[data-abc]')];

function disegna(contenitore: HTMLElement) {
  // Si misura la colonna e non il contenitore: abcjs dà al div in cui disegna la larghezza dell'SVG.
  const larghezza = Math.floor(Math.min(contenitore.parentElement?.clientWidth ?? 0, LARGHEZZA_MASSIMA));
  if (!larghezza || contenitore.dataset.larghezza === String(larghezza)) return;
  contenitore.dataset.larghezza = String(larghezza);
  disegnaACapo(contenitore, contenitore.dataset.abc ?? '', { larghezza, scala: 1, divisore: dividiEsempio });
}

const tutti = () => contenitori.forEach(disegna);
tutti();
new ResizeObserver(tutti).observe(document.body);
document.fonts.ready.then(() => {
  contenitori.forEach((c) => delete c.dataset.larghezza);
  tutti();
});

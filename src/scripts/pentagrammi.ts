// Disegna con abcjs gli esempi musicali scritti nei blocchi ```abc (vedi src/markdown/pentagrammi.ts).
// abcjs disegna in currentColor: il pentagramma prende il colore del testo, quindi segue il tema (ADR-0009).
// Il rigo è largo quanto la colonna di testo, a grandezza naturale: si ridisegna solo se la larghezza cambia.
import { renderAbc } from 'abcjs';

const LARGHEZZA_MASSIMA = 560;

function disegna(contenitore: HTMLElement): void {
  const larghezza = Math.min(contenitore.clientWidth, LARGHEZZA_MASSIMA);
  if (Number(contenitore.dataset.larghezza) === larghezza) return;
  contenitore.dataset.larghezza = String(larghezza);
  renderAbc(contenitore, contenitore.dataset.abc ?? '', {
    staffwidth: larghezza,
    add_classes: true,
    paddingleft: 0,
    paddingright: 0,
    paddingtop: 0,
    paddingbottom: 0,
  });
}

const contenitori = [...document.querySelectorAll<HTMLElement>('.pentagramma[data-abc]')];
contenitori.forEach(disegna);
new ResizeObserver(() => contenitori.forEach(disegna)).observe(document.body);

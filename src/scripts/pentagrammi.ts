// Disegna con abcjs gli esempi musicali scritti nei blocchi ```abc (vedi src/markdown/pentagrammi.ts).
// Il rigo è largo quanto la colonna di testo, a grandezza naturale: si ridisegna solo se la larghezza cambia.
import { disegna } from './abc';

const LARGHEZZA_MASSIMA = 560;

const contenitori = [...document.querySelectorAll<HTMLElement>('.pentagramma[data-abc]')];
const tutti = () => contenitori.forEach((c) => disegna(c, c.dataset.abc ?? '', { larghezzaMassima: LARGHEZZA_MASSIMA }));
tutti();
new ResizeObserver(tutti).observe(document.body);

// Disegna con abcjs gli esempi musicali scritti nei blocchi ```abc (vedi src/markdown/pentagrammi.ts).
// Il rigo è largo quanto la colonna di testo, a grandezza naturale, e va a capo fra le Battute come una Lettura
// (ticket #63): si rifà l'a capo solo se la larghezza cambia, e quando arriva il font del sito, con cui si misurano
// le Sillabe. Il modulo disegna appena caricato, una volta per pagina: chi gli chiede disegnoDi (l'Ascolto
// dell'esempio, #35) lo importa sapendolo, e trova lo stesso modulo già al lavoro.
import type { TuneObject } from 'abcjs';
import { altezzeDi, ascoltoIlluminato } from '../audio/ascolto';
import { creaLettore } from '../audio/lettore';
import { dividiEsempio } from '../capitoli/esempi';
import { dimenticaDisegno, segnaDisegno } from './disegno';
import { disegnaACapo } from './a-capo';

const LARGHEZZA_MASSIMA = 560;

const contenitori = [...document.querySelectorAll<HTMLElement>('.pentagramma[data-abc]')];
const disegni = new WeakMap<HTMLElement, TuneObject>();
/** Ferma l'Ascolto in corso: le note illuminate appartengono al disegno di prima. */
let fermaAscolto: (() => void) | undefined;

/**
 * Il disegno corrente dell'esempio nel contenitore, quello dell'ultimo a capo: l'Ascolto dell'esempio (ticket #35) ci
 * trova tempi e note, come l'Ascolto di verifica nelle Letture (ticket #31). Dopo un ridisegno è un altro: va
 * chiesto ogni volta.
 */
export const disegnoDi = (contenitore: HTMLElement): TuneObject | undefined => disegni.get(contenitore);

function disegna(contenitore: HTMLElement) {
  // Si misura la colonna e non il contenitore: abcjs dà al div in cui disegna la larghezza dell'SVG.
  const larghezza = Math.floor(Math.min(contenitore.parentElement?.clientWidth ?? 0, LARGHEZZA_MASSIMA));
  const abc = contenitore.dataset.abc ?? '';
  if (!larghezza || !segnaDisegno(contenitore, larghezza, abc)) return;
  fermaAscolto?.();
  disegni.set(contenitore, disegnaACapo(contenitore, abc, { larghezza, scala: 1, divisore: dividiEsempio }));
}

// L'Ascolto dell'esempio (ticket #35): un pulsante sotto ogni esempio, un solo lettore per la pagina, così un esempio
// ferma l'altro. Si caricano i campioni delle note di tutti gli esempi, solo al primo tocco.
const etichetta = document.querySelector<HTMLElement>('[data-ascolta]')?.dataset.ascolta;
if (etichetta && contenitori.length) {
  const pulsanti = contenitori.map((contenitore, i) => {
    const pulsante = document.createElement('button');
    pulsante.type = 'button';
    pulsante.className = 'ascolta';
    pulsante.textContent = etichetta;
    pulsante.setAttribute('aria-pressed', 'false');
    pulsante.addEventListener('click', () => {
      const partitura = disegnoDi(contenitore);
      if (!partitura) return;
      const a = ascoltoIlluminato(partitura);
      lettore.tocca(String(i), a.note, a.evidenzia);
    });
    contenitore.after(pulsante);
    return pulsante;
  });
  const lettore = creaLettore<string>({
    campioni: `${import.meta.env.BASE_URL}audio/pianoforte/`,
    note: [...new Set(contenitori.flatMap((c) => altezzeDi(c.dataset.abc ?? '')))],
    cambio: (suona) => pulsanti.forEach((p, i) => p.setAttribute('aria-pressed', String(String(i) === suona))),
  });
  fermaAscolto = lettore.ferma;
  addEventListener('pagehide', () => lettore.ferma());
}

const tutti = () => contenitori.forEach(disegna);
tutti();
new ResizeObserver(tutti).observe(document.body);
document.fonts.ready.then(() => {
  contenitori.forEach(dimenticaDisegno);
  tutti();
});

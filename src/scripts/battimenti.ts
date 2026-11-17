// Gli esempi dei battimenti (#90), scritti nei blocchi ```battimenti (src/markdown/battimenti.ts): un pulsante sotto
// ogni esempio, un solo lettore per la pagina, così un esempio ferma l'altro. Suonano con l'organo sintetizzato,
// senza file audio. La prima nota è il La3, comodo da sentire per tutte le Voci.
import { esempio, type Intervallo } from '../audio/battimenti';
import { creaLettore } from '../audio/lettore';

const LA3 = 220;

const contenitori = [...document.querySelectorAll<HTMLElement>('.battimenti[data-intervallo]')];
const etichetta = document.querySelector<HTMLElement>('[data-ascolta]')?.dataset.ascolta;
if (etichetta && contenitori.length) {
  const pulsanti = contenitori.map((contenitore, i) => {
    const pulsante = document.createElement('button');
    pulsante.type = 'button';
    pulsante.className = 'ascolta';
    pulsante.textContent = etichetta;
    pulsante.setAttribute('aria-pressed', 'false');
    pulsante.addEventListener('click', () => {
      lettore.toccaTenuti(String(i), esempio(contenitore.dataset.intervallo as Intervallo, LA3));
    });
    contenitore.append(pulsante);
    return pulsante;
  });
  const lettore = creaLettore<string>({
    campioni: `${import.meta.env.BASE_URL}audio/pianoforte/`,
    note: [],
    cambio: (suona) => pulsanti.forEach((p, i) => p.setAttribute('aria-pressed', String(String(i) === suona))),
  });
  addEventListener('pagehide', () => lettore.ferma());
}

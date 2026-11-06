// A capo responsive della Lettura (ticket #30), la parte nel browser: disegna con abcjs e misura.
// Quali Battute vanno in un rigo lo decide src/letture/a-capo.ts; qui si prova ogni rigo disegnandolo da solo,
// alla larghezza dello schermo, e si guarda se le sillabe si toccano o se qualcosa esce dal bordo.
import { renderAbc, type AbcVisualParams, type TuneObject } from 'abcjs';
import { dividi, inRighi, righi, siToccano, type Scatola } from '../letture/a-capo';

type Opzioni = { larghezza: number; scala: number };

/**
 * Disegna l'ABC di una Lettura nel contenitore con il massimo di Battute per rigo: ogni rigo prende Battute finché
 * nessuna sillaba (di Testo o di Soluzione) tocca la vicina e niente esce dal bordo. Restituisce ciò che dà abcjs.
 */
export function disegnaACapo(contenitore: HTMLElement, abc: string, { larghezza, scala }: Opzioni): TuneObject[] {
  const divisa = dividi(abc);
  const opzioni: AbcVisualParams = {
    add_classes: true,
    scale: scala,
    // In abcjs 6.7.2 staffwidth è già in px di uscita: scale rimpicciolisce solo i simboli (prototipo #8).
    staffwidth: larghezza,
    paddingleft: 0,
    paddingright: 0,
    paddingtop: 0,
    paddingbottom: 0,
  };
  const ciSta = (inizio: number, fine: number) => {
    renderAbc(contenitore, inRighi(divisa, [[inizio, fine]]), opzioni);
    const bordo = contenitore.getBoundingClientRect().left + larghezza + 1;
    const esce = [...contenitore.querySelectorAll('.abcjs-note, .abcjs-bar, .abcjs-lyric')].some(
      (e) => e.getBoundingClientRect().right > bordo,
    );
    return !esce && !siToccano(scatoleDelleSillabe(contenitore));
  };
  return renderAbc(contenitore, inRighi(divisa, righi(divisa.quante, ciSta)), opzioni);
}

/** Le scatole delle sillabe disegnate: abcjs mette le righe w: di una nota in un <text>, un <tspan> per riga. */
function scatoleDelleSillabe(contenitore: HTMLElement): Scatola[] {
  const pezzi = [...contenitore.querySelectorAll('.abcjs-lyric')].flatMap((testo) => {
    const righe = [...testo.querySelectorAll('tspan')];
    return righe.length ? righe : [testo];
  });
  return pezzi.flatMap((t) => {
    if (!t.textContent?.trim()) return [];
    const r = t.getBoundingClientRect();
    return r.width ? [{ sinistra: r.left, destra: r.right, alto: r.top }] : [];
  });
}

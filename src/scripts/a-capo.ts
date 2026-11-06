// A capo responsive della Lettura (ticket #30), la parte nel browser: disegna con abcjs e misura.
// Quali Battute vanno in un rigo lo decide src/letture/a-capo.ts; qui si prova ogni rigo candidato disegnandolo come
// apparirà (daMisurare), alla larghezza dello schermo, e si guarda se i segni si toccano o se qualcosa esce dal bordo.
import { renderAbc, type AbcVisualParams } from 'abcjs';
import { daMisurare, dividi, inRighi, righi, siToccano, type Scatola } from '../letture/a-capo';

type Opzioni = { larghezza: number; scala: number };

/**
 * Disegna l'ABC di una Lettura nel contenitore con il massimo di Battute per rigo: ogni rigo prende Battute finché
 * nessun segno (di Testo o di Soluzione) tocca il vicino e niente esce dal bordo. Una Battuta che da sola non ci sta
 * resta da sola sul suo rigo, intera: non si spezza e non si rimpicciolisce. In sviluppo lo dice la console; i test
 * end-to-end controllano che in nessuna Lettura succeda a 360 px.
 */
export function disegnaACapo(contenitore: HTMLElement, abc: string, { larghezza, scala }: Opzioni): void {
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
    const { abc: daProvare, riga } = daMisurare(divisa, [inizio, fine]);
    renderAbc(contenitore, daProvare, opzioni);
    return !problema(contenitore, riga, larghezza);
  };
  const gruppi = righi(divisa.quante, ciSta);
  renderAbc(contenitore, inRighi(divisa, gruppi), opzioni);
  if (import.meta.env.DEV) {
    gruppi.forEach(([inizio, fine], riga) => {
      const quale = problema(contenitore, riga, larghezza);
      if (quale) console.warn(`a capo: il rigo ${riga + 1} (Battute ${inizio + 1}–${fine} dell'ABC) ${quale} a ${larghezza} px`);
    });
  }
}

/** Che cosa non va nel rigo disegnato numero `riga` (da 0): qualcosa esce dal bordo o due segni si toccano. */
function problema(contenitore: HTMLElement, riga: number, larghezza: number): string | undefined {
  const bordo = contenitore.getBoundingClientRect().left + larghezza + 1;
  const delRigo = [...contenitore.querySelectorAll(`.abcjs-l${riga}`)];
  const esce = delRigo.some(
    (e) => e.matches('.abcjs-note, .abcjs-bar, .abcjs-lyric') && e.getBoundingClientRect().right > bordo,
  );
  if (esce) return 'esce dal bordo';
  if (siToccano(scatoleDeiSegni(delRigo.filter((e) => e.matches('.abcjs-lyric'))))) return 'ha due segni che si toccano';
  return undefined;
}

/** Le scatole dei segni disegnati: abcjs mette le righe w: di una nota in un <text>, un <tspan> per riga. */
function scatoleDeiSegni(segni: readonly Element[]): Scatola[] {
  const parti = segni.flatMap((testo) => {
    const righe = [...testo.querySelectorAll('tspan')];
    return righe.length ? righe : [testo];
  });
  return parti.flatMap((t) => {
    if (!t.textContent?.trim()) return [];
    const r = t.getBoundingClientRect();
    return r.width ? [{ sinistra: r.left, destra: r.right, alto: r.top }] : [];
  });
}

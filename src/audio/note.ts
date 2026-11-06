// Le note dell'audio di una Lettura (ADR-0008), in TypeScript puro: l'accordo e la nota di partenza del
// Riferimento tonale e le note da caricare. Lo usano la pagina della Lettura alla build e il controllo dei
// campioni in CI. Le altezze sono numeri MIDI reali (Do centrale = C4 = 60): il tenore in chiave di violino
// ottava bassa è già un'ottava sotto la scritta, perché leggiAbc riporta le Note reali (ADR-0003).
import { semitoni, type Nota } from '../esercizi/note';
import { leggiAbc } from '../letture/abc';
import type { Tonalita } from '../sillabe';

export type Riferimento = {
  /** La triade di tonica in stato fondamentale e posizione stretta, dalla tonica in su. */
  accordo: number[];
  /** La prima nota cantata dell'estratto, anche se l'estratto comincia con una pausa. */
  partenza: number;
};

export type AudioDellaLettura = {
  riferimento: Riferimento;
  /** Tutte le altezze che suonano, in ordine crescente e senza ripetizioni: estratto, accordo e partenza. */
  note: number[];
};

const SEMITONI = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 } as const;

/** Il numero MIDI di una Nota reale: Do4 = 60. */
export function midi(nota: { lettera: Nota['lettera']; alterazione: number; ottava: number }): number {
  return semitoni({ ...nota, alterazione: 0 }) + nota.alterazione + 12;
}

/**
 * ADR-0008: la tonica è la prima occorrenza sotto la nota di partenza, o su di essa; sopra, la terza (maggiore o
 * minore secondo il Modo) e la quinta.
 */
export function riferimentoTonale(tonalita: Tonalita, partenza: number): Riferimento {
  const classe = (((SEMITONI[tonalita.tonica.lettera] + tonalita.tonica.alterazione) % 12) + 12) % 12;
  const tonica = partenza - ((((partenza - classe) % 12) + 12) % 12);
  const terza = tonalita.modo === 'maggiore' ? 4 : 3;
  return { accordo: [tonica, tonica + terza, tonica + 7], partenza };
}

/** Una nota da suonare: altezza MIDI, inizio e durata in secondi dall'avvio. */
export type NotaDaSuonare = { midi: number; inizio: number; durata: number };

/** ADR-0008: le durate del Riferimento tonale sono fisse e non dipendono dall'Andamento della Lettura. */
export const ACCORDO = 1.5;
export const PAUSA = 0.5;
export const PARTENZA = 1.5;

export function noteDelRiferimento(riferimento: Riferimento): NotaDaSuonare[] {
  return [
    ...riferimento.accordo.map((midi) => ({ midi, inizio: 0, durata: ACCORDO })),
    { midi: riferimento.partenza, inizio: ACCORDO + PAUSA, durata: PARTENZA },
  ];
}

/** L'audio di una Lettura dal suo ABC e dalla Tonalità in vigore all'inizio dell'estratto (ADR-0004). */
export function audioDellaLettura(abc: string, tonalita: Tonalita): AudioDellaLettura {
  const altezze = leggiAbc(abc).note.flatMap((n) => (n.pausa ? [] : [midi(n.nota)]));
  const riferimento = riferimentoTonale(tonalita, altezze[0]!);
  const note = [...new Set([...altezze, ...riferimento.accordo])].sort((a, b) => a - b);
  return { riferimento, note };
}

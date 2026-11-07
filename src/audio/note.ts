// Le note dell'audio di una Lettura (ADR-0008), in TypeScript puro: l'accordo e la nota di partenza del
// Riferimento tonale e le note da caricare. Lo usano la pagina della Lettura alla build e il controllo dei
// campioni in CI. Le altezze sono numeri MIDI reali (Do centrale = C4 = 60): il tenore in chiave di violino
// ottava bassa è già un'ottava sotto la scritta, perché leggiAbc riporta le Note reali (ADR-0003).
import { RIGHI, type Chiave } from '../esercizi/nomina-la-nota';
import { daGrado, semitoni, tasto, type Nota } from '../esercizi/note';
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

/** Il numero MIDI di una Nota reale: Do4 = 60. */
export function midi(nota: { lettera: Nota['lettera']; alterazione: number; ottava: number }): number {
  return semitoni({ ...nota, alterazione: 0 }) + nota.alterazione + 12;
}

/** Il resto della divisione per 12, sempre fra 0 e 11: quanti semitoni sopra un Do. */
const dentroLOttava = (n: number) => ((n % 12) + 12) % 12;

/**
 * ADR-0008: la tonica è la prima occorrenza sotto la nota di partenza, o su di essa; sopra, la terza (maggiore o
 * minore secondo il Modo) e la quinta.
 */
export function riferimentoTonale(tonalita: Tonalita, partenza: number): Riferimento {
  const tonica = partenza - dentroLOttava(partenza - tasto(tonalita.tonica));
  const terza = tonalita.modo === 'maggiore' ? 4 : 3;
  return { accordo: [tonica, tonica + terza, tonica + 7], partenza };
}

/** Una nota da suonare: altezza MIDI, inizio e durata in secondi dall'avvio. */
export type NotaDaSuonare = { midi: number; inizio: number; durata: number };

/** ADR-0008: le durate del Riferimento tonale sono fisse e non dipendono dall'Andamento della Lettura. */
export const DURATA_ACCORDO = 1.5;
export const DURATA_PAUSA = 0.5;
export const DURATA_PARTENZA = 1.5;

export function noteDelRiferimento(riferimento: Riferimento): NotaDaSuonare[] {
  return [
    ...riferimento.accordo.map((midi) => ({ midi, inizio: 0, durata: DURATA_ACCORDO })),
    { midi: riferimento.partenza, inizio: DURATA_ACCORDO + DURATA_PAUSA, durata: DURATA_PARTENZA },
  ];
}

/** L'audio di una Lettura dal suo ABC e dalla Tonalità in vigore all'inizio dell'estratto (ADR-0004). */
export function audioDellaLettura(abc: string, tonalita: Tonalita): AudioDellaLettura {
  const altezze = leggiAbc(abc).note.flatMap((n) => (n.pausa ? [] : [midi(n.nota)]));
  const riferimento = riferimentoTonale(tonalita, altezze[0]!);
  const note = [...new Set([...altezze, ...riferimento.accordo])].sort((a, b) => a - b);
  return { riferimento, note };
}

/**
 * Le altezze che gli Esercizi possono suonare nelle Chiavi date (ticket #35): le Note reali dal taglio sotto il rigo
 * al taglio sopra, un semitono in più da ogni parte per le alterazioni. Le note cambiano a ogni Esercizio, quindi
 * si caricano i campioni di tutta l'estensione, al primo tocco.
 */
export function noteDelleChiavi(chiavi: readonly Chiave[]): number[] {
  const note = chiavi.flatMap((c) => {
    const [da, a] = [midi(daGrado(RIGHI[c].da)) - 1, midi(daGrado(RIGHI[c].a)) + 1];
    return Array.from({ length: a - da + 1 }, (_, i) => da + i);
  });
  return [...new Set(note)].sort((a, b) => a - b);
}

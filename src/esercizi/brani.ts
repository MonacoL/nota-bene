// I brani degli Esercizi pratici di ascolto (#86). SEGNAPOSTO: finché non ci sono i brani per pianoforte di #87,
// presi da una Fonte (ADR-0012), si suonano brani di prova generati qui. Sono quattro battute in Do maggiore,
// I IV V I: un basso su ogni pulsazione, più grave sul battere, e un arpeggio con una nota su ogni suddivisione.
// I brani veri prenderanno il posto di branoDiProva con la stessa forma, Brano.
import type { Casuale } from './casuale';
import { metrica, type NomeIndicazione } from './metrica';

export const BRANI_DI_PROVA = ['2/4', '3/4', '4/4', '6/8', '9/8', '12/8'] as const satisfies readonly NomeIndicazione[];
export type IndicazioneBrano = (typeof BRANI_DI_PROVA)[number];

/** Una nota del brano: altezza MIDI, inizio e durata in secondi. */
export type NotaDelBrano = { midi: number; inizio: number; durata: number };

export type Brano = {
  indicazione: IndicazioneBrano;
  /** Prima i bassi, poi l'arpeggio: il lettore evidenzia l'ultima nota della lista che sta suonando. */
  note: NotaDelBrano[];
  /** Gli istanti delle pulsazioni e delle suddivisioni, in secondi; la pulsazione è anche la sua prima suddivisione. */
  pulsazioni: number[];
  suddivisioni: number[];
  /** Per ogni suddivisione, l'indice in `note` della nota dell'arpeggio che comincia lì. */
  indiceSuddivisione: number[];
};

const BATTUTE = 4;
/** I, IV, V, I: fondamentale del basso e note dell'arpeggio, tutte dentro i campioni (ADR-0008). */
const ACCORDI = [
  { basso: 48, arpeggio: [60, 64, 67, 72] },
  { basso: 53, arpeggio: [65, 69, 72, 77] },
  { basso: 55, arpeggio: [67, 71, 74, 79] },
  { basso: 48, arpeggio: [60, 64, 67, 72] },
];

/** Tutte le altezze che i brani di prova possono suonare: il lettore carica solo i loro campioni. */
export const NOTE_BRANI = [...new Set(ACCORDI.flatMap((a) => [a.basso - 12, a.basso, ...a.arpeggio]))].sort((a, b) => a - b);

export function branoDiProva(indicazione: IndicazioneBrano, caso: Casuale): Brano {
  const m = metrica(indicazione);
  const perPulsazione = m.genere === 'semplice' ? 2 : 3;
  // Una pulsazione fra 0,6 e 0,85 secondi: da 70 a 100 battiti al minuto.
  const pulsazione = 0.6 + caso.intero(6) * 0.05;
  const suddivisione = pulsazione / perPulsazione;
  const bassi: NotaDelBrano[] = [];
  const arpeggio: NotaDelBrano[] = [];
  const pulsazioni: number[] = [];
  const suddivisioni: number[] = [];
  for (let b = 0; b < BATTUTE; b++) {
    const accordo = ACCORDI[b]!;
    for (let p = 0; p < m.pulsazioni; p++) {
      const inizio = (b * m.pulsazioni + p) * pulsazione;
      pulsazioni.push(inizio);
      bassi.push({ midi: accordo.basso, inizio, durata: pulsazione });
      if (p === 0) bassi.push({ midi: accordo.basso - 12, inizio, durata: pulsazione });
      for (let s = 0; s < perPulsazione; s++) {
        const t = inizio + s * suddivisione;
        suddivisioni.push(t);
        // Sul battito la nota più grave dell'accordo, nelle suddivisioni una a caso fra le altre.
        const midi = s === 0 ? accordo.arpeggio[0]! : caso.scegli(accordo.arpeggio.slice(1));
        arpeggio.push({ midi, inizio: t, durata: suddivisione });
      }
    }
  }
  return {
    indicazione,
    note: [...bassi, ...arpeggio],
    pulsazioni,
    suddivisioni,
    indiceSuddivisione: arpeggio.map((_, i) => bassi.length + i),
  };
}

/** Il brano di "Batti la pulsazione": uno qualunque dei brani di prova. */
export function branoPerBattere(caso: Casuale): Brano {
  return branoDiProva(caso.scegli(BRANI_DI_PROVA), caso);
}

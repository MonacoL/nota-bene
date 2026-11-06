// Esercizio "Nomina la nota": una nota su un rigo, in una delle Chiavi ammesse; si risponde con alterazione e nome.
// Si chiede solo il nome, senza ottava; la spiegazione dà l'ottava (ticket "Interazione negli Esercizi di teoria da telefono").
import { casuale } from './casuale';
import { abcNota, daGrado, grado, tasto, type Alterazione, type Lettera, type Nota } from './note';
import type { Testi } from './testi';
import { nomeNota } from './testi';

export const CHIAVI = ['violino', 'violino-ottava-bassa', 'basso'] as const;
export type Chiave = (typeof CHIAVI)[number];

export type Parametri = { chiavi: Chiave[] };

export type Esercizio = {
  tipo: 'nomina-la-nota';
  chiave: Chiave;
  /** La Nota reale. */
  nota: Nota;
  abc: string;
};

/** Il nome scelto con i pulsanti: alterazione e lettera, senza ottava. */
export type Risposta = { lettera: Lettera; alterazione: Alterazione };

type Rigo = {
  clef: string;
  /** Note reali, in gradi (Do4 = 28), da un taglio sotto il rigo a un taglio sopra. */
  da: number;
  a: number;
  ottavaSopra: 0 | 1;
  /** Grado della Nota scritta sulla 1ª riga. */
  primaRiga: number;
  ancora: Testi;
};

/**
 * abcjs disegna `clef=treble-8` come la chiave di violino senza spostare le note (ADR-0003):
 * l'ABC del violino ottava bassa si scrive quindi un'ottava sopra la Nota reale.
 */
export const RIGHI: Record<Chiave, Rigo> = {
  violino: {
    clef: 'treble', da: 28, a: 40, ottavaSopra: 0, primaRiga: 30,
    ancora: {
      it: "La chiave di violino si avvolge attorno alla 2ª riga: lì c'è il Sol4.",
      en: 'The treble clef curls around the 2nd line: that line is G4.',
    },
  },
  'violino-ottava-bassa': {
    clef: 'treble-8', da: 21, a: 33, ottavaSopra: 1, primaRiga: 30,
    ancora: {
      it: "Il piccolo 8 sotto la chiave di violino la porta un'ottava sotto: sulla 2ª riga c'è il Sol3.",
      en: 'The small 8 under the treble clef moves it an octave lower: the 2nd line is G3.',
    },
  },
  basso: {
    clef: 'bass', da: 16, a: 28, ottavaSopra: 0, primaRiga: 18,
    ancora: {
      it: "I due punti della chiave di basso stanno attorno alla 4ª riga: lì c'è il Fa3.",
      en: 'The two dots of the bass clef sit around the 4th line: that line is F3.',
    },
  },
};

/**
 * Mi♯, Si♯, Do♭ e Fa♭ sono tasti bianchi con un altro nome: per chi parte da zero si escludono.
 * Dove il segno scelto non va bene si usa quello opposto.
 */
function alterazionePossibile(lettera: Lettera, segno: -1 | 1): Alterazione {
  if (segno === 1 && (lettera === 'E' || lettera === 'B')) return -1;
  if (segno === -1 && (lettera === 'C' || lettera === 'F')) return 1;
  return segno;
}

export function genera(parametri: Parametri, seed: number): Esercizio {
  const caso = casuale(seed);
  const chiave = caso.scegli(parametri.chiavi);
  const { clef, da, a, ottavaSopra } = RIGHI[chiave];
  const naturale = daGrado(da + caso.intero(a - da + 1));
  const nota: Nota = {
    ...naturale,
    alterazione: caso.intero(10) < 3 ? alterazionePossibile(naturale.lettera, caso.scegli([-1, 1] as const)) : 0,
  };
  const scritta = { ...nota, ottava: nota.ottava + ottavaSopra };
  return { tipo: 'nomina-la-nota', chiave, nota, abc: `X:1\nL:1/1\nK:C clef=${clef}\n${abcNota(scritta)}|]\n` };
}

/** Dove sta la nota scritta, contando righe e spazi dal basso. */
function posizione(passi: number): Testi {
  if (passi === -2) return { it: 'sul taglio addizionale sotto il rigo', en: 'on the ledger line below the staff' };
  if (passi === -1) return { it: 'appena sotto la 1ª riga', en: 'just below the 1st line' };
  if (passi === 9) return { it: 'appena sopra la 5ª riga', en: 'just above the 5th line' };
  if (passi === 10) return { it: 'sul taglio addizionale sopra il rigo', en: 'on the ledger line above the staff' };
  const n = passi / 2 + 1;
  if (passi % 2 === 0) return { it: `sulla ${n}ª riga`, en: `on the ${ordinale(n)} line` };
  const spazio = (passi + 1) / 2;
  return { it: `nel ${spazio}° spazio`, en: `in the ${ordinale(spazio)} space` };
}

function ordinale(n: number): string {
  return `${n}${({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n] ?? 'th'}`;
}

export function valuta(es: Esercizio, risposta: Risposta) {
  const rigo = RIGHI[es.chiave];
  const giusto = risposta.lettera === es.nota.lettera && risposta.alterazione === es.nota.alterazione;
  const dove = posizione(grado(es.nota) + rigo.ottavaSopra * 7 - rigo.primaRiga);
  const conOttava = { it: nomeNota(es.nota, 'it', true), en: nomeNota(es.nota, 'en', true) };
  const data = { it: nomeNota(risposta, 'it'), en: nomeNota(risposta, 'en') };
  const giusta = { it: nomeNota(es.nota, 'it'), en: nomeNota(es.nota, 'en') };
  const spiegazione: Testi = {
    it: `${rigo.ancora.it} La nota è ${dove.it}: è il ${conOttava.it}.`,
    en: `${rigo.ancora.en} The note is ${dove.en}: it is ${conOttava.en}.`,
  };
  // Conta il nome scritto: lo stesso tasto con un altro nome è sbagliato, ma va detto perché.
  if (!giusto && tasto(risposta) === tasto(es.nota)) {
    spiegazione.it += ` Il ${data.it} è lo stesso tasto della tastiera, ma qui la nota è scritta come ${giusta.it}: conta il nome scritto.`;
    spiegazione.en += ` ${data.en} is the same key on the keyboard, but here the note is written as ${giusta.en}: the written name is what counts.`;
  }
  return { esito: giusto ? ('giusto' as const) : ('sbagliato' as const), data, giusta, spiegazione };
}

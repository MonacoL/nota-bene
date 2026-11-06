// Modulo Sillabe (ADR-0002, ADR-0004): dalle Note scritte, la Tonalità iniziale e le Mutazioni, la Sillaba di ogni nota.
// TypeScript puro: lo usano l'Esercizio "Nomina la sillaba" e la Soluzione delle Letture, una sola fonte di verità.
// Le Note arrivano già lette: alterazione effettiva (Armatura e alterazioni della Battuta comprese), Battuta e posizione.
import { LETTERE, type Lettera } from '../esercizi/note';

export type Sillaba = 'DO' | 'RE' | 'MI' | 'FA' | 'SOL' | 'LA' | 'TI' | 'DI' | 'RI' | 'FI' | 'SI' | 'LI' | 'RA' | 'ME' | 'SE' | 'LE' | 'TE';

export type Tonalita = { tonica: { lettera: Lettera; alterazione: -1 | 0 | 1 }; modo: 'maggiore' | 'minore' };

/** Una nota o una pausa, con la sua Battuta (da 1) e la posizione nella Battuta (da 1). */
export type NotaScritta = { battuta: number; posizione: number } & (
  | { pausa: true }
  | {
      pausa?: false;
      /** La Nota come si legge: lettera, alterazione effettiva (fino alle doppie) e ottava scritta. */
      nota: { lettera: Lettera; alterazione: -2 | -1 | 0 | 1 | 2; ottava: number };
      /** Legata alla precedente con una legatura di valore. */
      legata?: boolean;
    }
);

/** Dalla nota in (battuta, posizione) in poi vale la nuova Tonalità. */
export type Mutazione = { battuta: number; posizione: number; tonalita: Tonalita };

export type Esito =
  | { tipo: 'sillaba'; sillaba: Sillaba }
  /** Pause e note legate alla precedente. */
  | { tipo: 'nessuna' }
  /** Una Nota senza Sillaba prevista: Mi♯ o Do♭ in Do, doppie alterazioni. */
  | { tipo: 'errore'; motivo: string };

const DIATONICHE: Sillaba[] = ['DO', 'RE', 'MI', 'FA', 'SOL', 'LA', 'TI'];
/** Un grado alzato o abbassato di un semitono cambia vocale; dove manca (MI e TI alzati, DO e FA abbassati) non c'è Sillaba. */
const ALZATE: (Sillaba | undefined)[] = ['DI', 'RI', undefined, 'FI', 'SI', 'LI', undefined];
const ABBASSATE: (Sillaba | undefined)[] = [undefined, 'RA', 'ME', undefined, 'SE', 'LE', 'TE'];
const SEMITONI_MAGGIORE = [0, 2, 4, 5, 7, 9, 11];
const SEMITONI: Record<Lettera, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** Il DO della Tonalità: la Tonica in maggiore; in minore la Tonica è LA e il DO sta una terza minore sopra. */
function doDi(tonalita: Tonalita): { lettera: number; semitoni: number } {
  const lettera = LETTERE.indexOf(tonalita.tonica.lettera);
  const semitoni = SEMITONI[tonalita.tonica.lettera] + tonalita.tonica.alterazione;
  return tonalita.modo === 'maggiore' ? { lettera, semitoni } : { lettera: lettera + 2, semitoni: semitoni + 3 };
}

function sillabaDi(nota: { lettera: Lettera; alterazione: number }, tonalita: Tonalita): Esito {
  if (Math.abs(nota.alterazione) > 1) return { tipo: 'errore', motivo: 'doppia alterazione' };
  const d = doDi(tonalita);
  const grado = (LETTERE.indexOf(nota.lettera) - d.lettera + 14) % 7;
  const semitoni = (SEMITONI[nota.lettera] + nota.alterazione - d.semitoni + 24) % 12;
  // Di quanto la Nota si scosta dal grado della scala maggiore costruita sul DO, fra -6 e +5.
  const scarto = ((semitoni - SEMITONI_MAGGIORE[grado]! + 18) % 12) - 6;
  const sillaba = scarto === 0 ? DIATONICHE[grado] : scarto === 1 ? ALZATE[grado] : scarto === -1 ? ABBASSATE[grado] : undefined;
  return sillaba ? { tipo: 'sillaba', sillaba } : { tipo: 'errore', motivo: 'senza Sillaba prevista' };
}

const prima = (a: { battuta: number; posizione: number }, b: { battuta: number; posizione: number }) =>
  a.battuta - b.battuta || a.posizione - b.posizione;

export function sillabe(note: NotaScritta[], tonalita: Tonalita, mutazioni: Mutazione[] = []): Esito[] {
  const inOrdine = [...mutazioni].sort(prima);
  return note.map((n): Esito => {
    if (n.pausa || n.legata) return { tipo: 'nessuna' };
    // La Tonalità in vigore è quella dell'ultima Mutazione che non viene dopo questa nota.
    const inVigore = inOrdine.filter((m) => prima(m, n) <= 0).at(-1)?.tonalita ?? tonalita;
    return sillabaDi(n.nota, inVigore);
  });
}

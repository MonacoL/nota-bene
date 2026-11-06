// Modulo Sillabe (ADR-0002, ADR-0004): dalle Note scritte, la Tonalità iniziale e le Mutazioni, la Sillaba di ogni nota.
// Le Sillabe attese sono scritte a mano, come le canterebbe il maestro.
import { describe, expect, it } from 'vitest';
import type { Lettera } from '../../src/esercizi';
import { sillabe, type Mutazione, type NotaScritta, type Tonalita } from '../../src/sillabe';

/** "F#4 G4 r A4-A4" → Note scritte, una Battuta ogni "|". Il "-" lega la nota alla successiva. */
function brano(testo: string): NotaScritta[] {
  const note: NotaScritta[] = [];
  testo.split('|').forEach((battuta, b) => {
    let posizione = 0;
    for (const segno of battuta.trim().split(/\s+/).filter(Boolean)) {
      for (const [k, s] of segno.split('-').entries()) {
        posizione += 1;
        if (s === 'r') {
          note.push({ battuta: b + 1, posizione, pausa: true });
          continue;
        }
        const [, lettera, alt, ottava] = /^([A-G])(bb|##|b|#)?(\d)$/.exec(s)!;
        const alterazione = ({ bb: -2, b: -1, '#': 1, '##': 2 } as const)[alt as 'b'] ?? 0;
        note.push({ battuta: b + 1, posizione, nota: { lettera: lettera as Lettera, alterazione, ottava: Number(ottava) }, legata: k > 0 });
      }
    }
  });
  return note;
}

const maggiore = (lettera: string, alterazione: -1 | 0 | 1 = 0): Tonalita => ({ tonica: { lettera: lettera as Lettera, alterazione }, modo: 'maggiore' });
const minore = (lettera: string, alterazione: -1 | 0 | 1 = 0): Tonalita => ({ tonica: { lettera: lettera as Lettera, alterazione }, modo: 'minore' });

/** Le Sillabe in una riga: "–" per le note senza Sillaba, "!" per gli errori. */
function canta(testo: string, tonalita: Tonalita, mutazioni: Mutazione[] = []): string {
  return sillabe(brano(testo), tonalita, mutazioni)
    .map((e) => (e.tipo === 'sillaba' ? e.sillaba : e.tipo === 'nessuna' ? '–' : '!'))
    .join(' ');
}

describe('sillabe', () => {
  it.each([
    ['in Do maggiore la scala è DO…TI', 'C4 D4 E4 F4 G4 A4 B4 C5', maggiore('C'), 'DO RE MI FA SOL LA TI DO'],
    ['in Re maggiore il DO è il Re', 'D4 E4 F#4 G4 A4 B4 C#5 D5', maggiore('D'), 'DO RE MI FA SOL LA TI DO'],
    ['in Mi♭ maggiore il DO è il Mi♭', 'Eb4 Bb3 G4 Ab4 D5 Eb5', maggiore('E', -1), 'DO SOL MI FA TI DO'],
    ['in La minore la Tonica è LA', 'A3 B3 C4 D4 E4 F4 G4 A4', minore('A'), 'LA TI DO RE MI FA SOL LA'],
    ['in Re minore il LA è il Re', 'D4 F4 A4 Bb4 C5 D5', minore('D'), 'LA DO MI FA SOL LA'],
    ['nella minore armonica la sensibile è SI', 'D4 E4 F4 G4 A4 Bb4 C#5 D5', minore('D'), 'LA TI DO RE MI FA SI LA'],
  ])('%s', (_, testo, tonalita, attese) => {
    expect(canta(testo, tonalita)).toBe(attese);
  });

  it.each([
    ['salendo le alterate cambiano vocale: DI RI FI SI LI', 'C#4 D#4 F#4 G#4 A#4', maggiore('C'), 'DI RI FI SI LI'],
    ['scendendo: RA ME SE LE TE', 'Db4 Eb4 Gb4 Ab4 Bb4', maggiore('C'), 'RA ME SE LE TE'],
    // Senza Mutazione una Nota alterata resta nella Tonalità: Si♮ in Fa maggiore è FA alzato, Fa♮ in Sol è TI abbassato.
    ['una Nota alterata senza Mutazione è cromatica: Si♮ in Fa maggiore', 'F4 B4 C5', maggiore('F'), 'DO FI SOL'],
    ['e Fa♮ in Sol maggiore', 'G4 F4 G4', maggiore('G'), 'DO TE DO'],
    ['nel minore le cromatiche si contano dal DO', 'A3 G#3 A3 Eb4 D4', minore('A'), 'LA SI LA ME RE'],
  ])('%s', (_, testo, tonalita, attese) => {
    expect(canta(testo, tonalita)).toBe(attese);
  });

  it.each([
    ['Mi♯ in Do', 'E#4', maggiore('C')],
    ['Do♭ in Do', 'Cb4', maggiore('C')],
    ['Si♯ e Fa♭ in Do', 'B#4 Fb4', maggiore('C')],
    ['una doppia alterazione, anche se è un grado alzato', 'F##4', maggiore('A')],
    ['una doppia alterazione', 'Dbb4 C##4', maggiore('C')],
  ])('non ha Sillaba prevista: %s', (_, testo, tonalita) => {
    const esiti = sillabe(brano(testo), tonalita);
    for (const e of esiti) expect(e).toMatchObject({ tipo: 'errore' });
  });

  it('le pause e le note legate con legatura di valore non hanno Sillaba', () => {
    expect(canta('C4 r E4-E4 | E4 D4', maggiore('C'))).toBe('DO – MI – MI RE');
  });

  it('dalla nota della Mutazione in poi vale la nuova Tonalità', () => {
    // Do maggiore che modula a Sol: dalla 2ª nota della Battuta 2 il DO è il Sol, e il Fa♯ diventa TI.
    const aSol: Mutazione = { battuta: 2, posizione: 2, tonalita: maggiore('G') };
    expect(canta('C4 E4 G4 | A4 F#4 G4', maggiore('C'), [aSol])).toBe('DO MI SOL LA TI DO');
    // Senza Mutazione lo stesso Fa♯ è FI.
    expect(canta('C4 E4 G4 | A4 F#4 G4', maggiore('C'))).toBe('DO MI SOL LA FI SOL');
  });

  it('una Mutazione sulla prima nota è ammessa: l\'estratto comincia già modulato', () => {
    // Il K: dice Do maggiore, ma la musica è già in Re maggiore: senza Mutazione sarebbe RE MI FI DI RE.
    const inizio: Mutazione = { battuta: 1, posizione: 1, tonalita: maggiore('D') };
    expect(canta('D4 E4 F#4 | C#4 D4', maggiore('C'), [inizio])).toBe('DO RE MI TI DO');
  });

  it('più Mutazioni si applicano in ordine, anche dichiarate alla rinfusa', () => {
    const mutazioni: Mutazione[] = [
      { battuta: 3, posizione: 1, tonalita: maggiore('C') },
      { battuta: 2, posizione: 1, tonalita: maggiore('G') },
    ];
    expect(canta('C4 | G4 F#4 | G4 F4', maggiore('C'), mutazioni)).toBe('DO DO TI SOL FA');
  });

  it('la chiave di violino ottava bassa non cambia le Sillabe: conta la Nota scritta, non l\'ottava', () => {
    // La Voce di tenore si scrive un'ottava sopra (ADR-0003): le Sillabe sono le stesse delle Note reali.
    expect(canta('D4 F#4 A4', maggiore('D'))).toBe(canta('D3 F#3 A3', maggiore('D')));
    expect(canta('D4 F#4 A4', maggiore('D'))).toBe('DO MI SOL');
  });
});

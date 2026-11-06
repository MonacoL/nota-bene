// Scale maggiore e minori (Capitoli 5 e 6): le note attese sono scritte a mano, come nei libri di teoria.
import { describe, expect, it } from 'vitest';
import { scala } from '../../src/esercizi/scale';
import type { Nota } from '../../src/esercizi';

const n = (s: string): Nota => ({
  lettera: s[0] as Nota['lettera'],
  alterazione: s.includes('#') ? 1 : s.slice(1).includes('b') ? -1 : 0,
  ottava: Number(s.at(-1)),
});
const nomi = (note: Nota[]) => note.map((x) => `${x.lettera}${{ '-1': 'b', '0': '', '1': '#' }[x.alterazione]}${x.ottava}`).join(' ');

describe('scala', () => {
  it.each([
    ['D4', 'maggiore', 'D4 E4 F#4 G4 A4 B4 C#5 D5'],
    ['Bb3', 'maggiore', 'Bb3 C4 D4 Eb4 F4 G4 A4 Bb4'],
    ['E4', 'maggiore', 'E4 F#4 G#4 A4 B4 C#5 D#5 E5'],
    ['A3', 'naturale', 'A3 B3 C4 D4 E4 F4 G4 A4'],
    ['A3', 'armonica', 'A3 B3 C4 D4 E4 F4 G#4 A4'],
    ['A3', 'melodica', 'A3 B3 C4 D4 E4 F#4 G#4 A4'],
    ['F#4', 'armonica', 'F#4 G#4 A4 B4 C#5 D5 E#5 F#5'],
    ['C4', 'melodica', 'C4 D4 Eb4 F4 G4 A4 B4 C5'],
    ['G4', 'naturale', 'G4 A4 Bb4 C5 D5 Eb5 F5 G5'],
  ] as const)('da %s, %s: %s', (tonica, forma, attese) => {
    expect(nomi(scala(n(tonica), forma))).toBe(attese);
  });
});

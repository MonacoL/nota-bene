// Intervalli: numero (si contano le note) e qualità (si contano i semitoni), e il rivolto.
// I valori attesi sono quelli dei libri di teoria, scritti a mano.
import { describe, expect, it } from 'vitest';
import { intervallo, rivolto } from '../../src/esercizi/intervalli';
import type { Nota } from '../../src/esercizi';

/** "C#4" → Nota. */
const n = (s: string): Nota => ({
  lettera: s[0] as Nota['lettera'],
  alterazione: s.includes('#') ? 1 : s.slice(1).includes('b') ? -1 : 0,
  ottava: Number(s.at(-1)),
});

describe('intervallo', () => {
  it.each([
    ['C4', 'E4', 3, 'maggiore'],
    ['E4', 'G4', 3, 'minore'],
    ['C4', 'Eb4', 3, 'minore'],
    ['C4', 'G4', 5, 'giusta'],
    ['B3', 'F4', 5, 'diminuita'],
    ['F4', 'B4', 4, 'aumentata'],
    ['C4', 'F4', 4, 'giusta'],
    ['E4', 'F4', 2, 'minore'],
    ['D4', 'E4', 2, 'maggiore'],
    ['A3', 'F#4', 6, 'maggiore'],
    ['E4', 'C5', 6, 'minore'],
    ['C4', 'B4', 7, 'maggiore'],
    ['D4', 'C5', 7, 'minore'],
    ['G3', 'G4', 8, 'giusta'],
    ['C4', 'D#4', 2, 'aumentata'],
    ['C#4', 'Eb4', 3, 'diminuita'],
  ] as const)('da %s a %s: %iª %s', (a, b, numero, qualita) => {
    expect(intervallo(n(a), n(b))).toEqual({ numero, qualita, semitoni: expect.any(Number) });
  });

  it('conta i semitoni e non dipende dal verso: discendente è lo stesso intervallo', () => {
    expect(intervallo(n('C4'), n('E4')).semitoni).toBe(4);
    expect(intervallo(n('G4'), n('C4'))).toEqual({ numero: 5, qualita: 'giusta', semitoni: 7 });
    expect(intervallo(n('F4'), n('B3'))).toEqual({ numero: 5, qualita: 'diminuita', semitoni: 6 });
  });
});

describe('rivolto', () => {
  it.each([
    [3, 'maggiore', 6, 'minore'],
    [6, 'minore', 3, 'maggiore'],
    [5, 'giusta', 4, 'giusta'],
    [4, 'aumentata', 5, 'diminuita'],
    [2, 'minore', 7, 'maggiore'],
    [7, 'diminuita', 2, 'aumentata'],
  ] as const)('il rivolto della %iª %s è la %iª %s', (numero, qualita, rn, rq) => {
    expect(rivolto({ numero, qualita })).toEqual({ numero: rn, qualita: rq });
  });
});

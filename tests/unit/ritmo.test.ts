// Figure e Tempi (Capitoli 3 e 4): quanto durano, in semicrome. I valori sono quelli dei libri di teoria.
import { describe, expect, it } from 'vitest';
import { durata, durataBattuta, semplice, type Figura } from '../../src/esercizi/ritmo';

const f = (figura: Figura['figura'], punto = false): Figura => ({ figura, punto });

describe('durata', () => {
  it.each([
    [[f('semibreve')], 16],
    [[f('minima')], 8],
    [[f('semiminima')], 4],
    [[f('croma')], 2],
    [[f('semiminima', true)], 6],
    [[f('minima', true)], 12],
    [[f('croma', true)], 3],
    [[f('minima'), f('croma')], 10],
    [[f('semiminima', true), f('croma')], 8],
    [[], 0],
  ] as const)('%j dura %i semicrome', (figure, attesa) => {
    expect(durata([...figure])).toBe(attesa);
  });
});

describe('durataBattuta', () => {
  it.each([
    ['4/4', 16, true],
    ['3/4', 12, true],
    ['2/4', 8, true],
    ['3/8', 6, false],
    ['6/8', 12, false],
    ['9/8', 18, false],
    ['12/8', 24, false],
  ] as const)('una Battuta di %s dura %i semicrome', (tempo, attesa, eSemplice) => {
    const [battiti, unita] = tempo.split('/').map(Number) as [number, 4 | 8];
    expect(durataBattuta({ battiti, unita })).toBe(attesa);
    expect(semplice({ battiti, unita })).toBe(eSemplice);
  });
});

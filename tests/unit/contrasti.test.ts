// Ricalcola dalle variabili CSS i contrasti WCAG 2.1 AA delle coppie dell'ADR-0009, nei due temi.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync(new URL('../../src/styles/global.css', import.meta.url), 'utf8');

function variabili(blocco: string): Record<string, string> {
  const v: Record<string, string> = {};
  for (const [, nome, valore] of blocco.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)) v[nome!] = valore!;
  return v;
}

function bloccoDopo(inizio: number): string {
  const apertura = css.indexOf('{', inizio);
  let profondita = 0;
  for (let i = apertura; i < css.length; i++) {
    if (css[i] === '{') profondita++;
    if (css[i] === '}' && --profondita === 0) return css.slice(apertura + 1, i);
  }
  throw new Error('blocco CSS non chiuso');
}

const chiaro = variabili(bloccoDopo(css.indexOf(':root')));
const scuro = { ...chiaro, ...variabili(bloccoDopo(css.indexOf('@media (prefers-color-scheme: dark)'))) };

function luminanza(hex: string): number {
  const [r, g, b] = hex.slice(1).match(/../g)!.map((x) => {
    const c = parseInt(x, 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

export function rapporto(a: string, b: string): number {
  const [chiara, scura] = [luminanza(a), luminanza(b)].sort((x, y) => y - x);
  return (chiara! + 0.05) / (scura! + 0.05);
}

// [primo piano, sfondo, soglia]: 4,5:1 per il testo (Sillabe e riscontri compresi), 3:1 per la nota illuminata.
const COPPIE: [string, string, number][] = [
  ['ink', 'bg', 4.5],
  ['ink', 'surface', 4.5],
  ['muted', 'bg', 4.5],
  ['muted', 'surface', 4.5],
  ['accent', 'bg', 4.5],
  ['accent', 'surface', 4.5],
  ['accent-ink', 'accent', 4.5],
  ['sol', 'bg', 4.5],
  ['sol', 'surface', 4.5],
  ['suona', 'bg', 3],
  ['suona', 'surface', 3],
  ['ok', 'ok-bg', 4.5],
  ['ko', 'ko-bg', 4.5],
];

describe('rapporto di contrasto', () => {
  it('dà 21:1 fra nero e bianco e 1:1 fra due colori uguali', () => {
    expect(rapporto('#000000', '#ffffff')).toBeCloseTo(21, 5);
    expect(rapporto('#8a1c2c', '#8a1c2c')).toBe(1);
  });
});

for (const [tema, colori] of [['chiaro', chiaro], ['scuro', scuro]] as const) {
  describe(`tema ${tema}`, () => {
    it('definisce tutte le variabili delle coppie', () => {
      for (const [a, b] of COPPIE) {
        expect(colori[a], `--${a}`).toMatch(/^#/);
        expect(colori[b], `--${b}`).toMatch(/^#/);
      }
    });
    it.each(COPPIE)('--%s su --%s rispetta %s:1', (a, b, soglia) => {
      expect(rapporto(colori[a]!, colori[b]!)).toBeGreaterThanOrEqual(soglia);
    });
  });
}

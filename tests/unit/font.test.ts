// Ordine dei font in --font (ADR-0009, ADR-0010). Safari su iOS prende le misure della riga dal primo font della lista,
// anche se il suo unicode-range non copre lo spazio: con il font delle alterazioni in testa (ascendente alto,
// ingrandito del 150%) il testo scendeva di qualche pixel in pulsanti e intestazione. I test Playwright non lo vedono.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync(new URL('../../src/styles/global.css', import.meta.url), 'utf8');
const famiglie = (nome: string) =>
  new RegExp(`--${nome}:\\s*([^;]+);`).exec(css)![1]!.split(',').map((f) => f.trim().replace(/'/g, ''));

describe('font del sito', () => {
  it('mette Open Sans per primo nel testo e le alterazioni subito dopo, come ripiego per ♭ ♮ ♯', () => {
    expect(famiglie('font').slice(0, 2)).toEqual(['Open Sans', 'Alterazioni']);
  });
  it('mette Oswald per primo nei titoli e le alterazioni subito dopo', () => {
    expect(famiglie('font-titoli').slice(0, 2)).toEqual(['Oswald', 'Alterazioni']);
  });
});

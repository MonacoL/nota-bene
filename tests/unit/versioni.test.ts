// Le baseline degli screenshot valgono solo per una versione di Playwright: pacchetto npm e immagine Docker devono coincidere.
import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

const leggi = (p: string) => readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');

it('i workflow usano l\'immagine di Playwright della stessa versione del pacchetto', () => {
  const versione = JSON.parse(leggi('package.json')).devDependencies['@playwright/test'];
  for (const workflow of ['.github/workflows/ci.yml', '.github/workflows/baseline.yml']) {
    const immagini = [...leggi(workflow).matchAll(/mcr\.microsoft\.com\/playwright:v([\d.]+)-/g)].map((m) => m[1]);
    expect(immagini.length, workflow).toBeGreaterThan(0);
    for (const v of immagini) expect(v, workflow).toBe(versione);
  }
});

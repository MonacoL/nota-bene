// Pagina Esercizi (ticket "Pagina Esercizi con la prima Serie: «Nomina la nota»").
// Con ?seed=s l'Esercizio n (da 0) della Serie usa il seed s + n: il test genera lo stesso Esercizio e sa la risposta.
import { expect, test, type Page } from '@playwright/test';
import { genera, type Chiave, type Nota } from '../../src/esercizi';
import { CAPITOLI } from './pagine';

const PRIMO = CAPITOLI[0]!;
const SECONDO = CAPITOLI[1]!;
const NOMI_IT = { C: 'Do', D: 'Re', E: 'Mi', F: 'Fa', G: 'Sol', A: 'La', B: 'Si' } as const;
const SEGNI_IT = { '-1': 'bemolle', '0': 'bequadro', '1': 'diesis' } as const;

/** Risponde dal tastierino in basso e preme Verifica. */
async function rispondi(page: Page, nota: Pick<Nota, 'lettera' | 'alterazione'>) {
  const tastierino = page.getByRole('group', { name: 'Risposta' });
  await tastierino.getByRole('button', { name: SEGNI_IT[nota.alterazione], exact: true }).click();
  await tastierino.getByRole('button', { name: NOMI_IT[nota.lettera], exact: true }).click();
  await tastierino.getByRole('button', { name: 'Verifica' }).click();
}

const esercizio = (chiavi: Chiave[], seed: number) => genera('nomina-la-nota', { chiavi }, seed);
const sbagliata = (n: Nota) => ({ lettera: n.lettera === 'C' ? 'D' : 'C', alterazione: 0 }) as const;

test('una Serie completa di "Nomina la nota", fino al riepilogo e a una nuova Serie', async ({ page }) => {
  await page.goto(`it/capitoli/${PRIMO}/esercizi/?seed=100`);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Esercizi: Note, toni e semitoni');
  await expect(page.getByRole('tablist')).toHaveCount(0);
  const foglio = page.getByRole('region', { name: 'Riscontro' });

  for (let n = 0; n < 10; n++) {
    await expect(page.getByText(`Esercizio ${n + 1} di 10`)).toBeVisible();
    await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', String(n + 1));
    await expect(page.locator('.esercizio .pentagramma svg')).toHaveCount(1);
    const { nota } = esercizio(['violino'], 100 + n);
    const giusta = n % 2 === 0;
    await rispondi(page, giusta ? nota : sbagliata(nota));

    await expect(foglio).toBeVisible();
    await expect(foglio).toContainText(giusta ? '✓ Giusto' : '✗ Non è così');
    // La spiegazione c'è sempre e dà l'ottava della Nota.
    await expect(foglio).toContainText(`${NOMI_IT[nota.lettera]}${{ '-1': '♭', '0': '', '1': '♯' }[nota.alterazione]}${nota.ottava}`);
    if (!giusta) {
      await expect(foglio).toContainText('La tua risposta');
      await expect(foglio).toContainText('Risposta giusta');
      await expect(foglio.getByRole('button', { name: /Riprova/ })).toHaveCount(0);
    }
    await foglio.getByRole('button', { name: 'Avanti →' }).click();
  }

  await expect(page.getByText('5 su 10 giuste al primo colpo')).toBeVisible();
  const riepilogo = page.getByRole('region', { name: '5 su 10 giuste al primo colpo' });
  await expect(riepilogo.getByRole('link', { name: 'Capitolo successivo →' })).toHaveAttribute('href', `/nota-bene/it/capitoli/${SECONDO}/`);
  await page.getByRole('button', { name: 'Altri 10 esercizi' }).click();
  await expect(page.getByText('Esercizio 1 di 10')).toBeVisible();

  // Non si salva niente.
  expect(await page.evaluate(() => localStorage.length + sessionStorage.length)).toBe(0);
});

test('lo stesso tasto con un altro nome è sbagliato, e la spiegazione lo dice', async ({ page }) => {
  const seed = Array.from({ length: 500 }, (_, i) => i).find((s) => esercizio(['violino'], s).nota.alterazione !== 0)!;
  const { nota } = esercizio(['violino'], seed);
  // Sol♯ → La♭, Si♭ → La♯: la lettera dopo o prima, con l'alterazione opposta.
  const lettere = 'CDEFGAB';
  const i = lettere.indexOf(nota.lettera);
  const enarmonica = {
    lettera: lettere[(i + (nota.alterazione === 1 ? 1 : 6)) % 7] as Nota['lettera'],
    alterazione: (nota.alterazione === 1 ? -1 : 1) as Nota['alterazione'],
  };
  await page.goto(`it/capitoli/${PRIMO}/esercizi/?seed=${seed}`);
  await rispondi(page, enarmonica);
  const foglio = page.getByRole('region', { name: 'Riscontro' });
  await expect(foglio).toContainText('✗ Non è così');
  await expect(foglio).toContainText('stesso tasto');
});

test('nel Capitolo 2 compaiono tutte e tre le Chiavi', async ({ page }) => {
  await page.goto(`it/capitoli/${SECONDO}/esercizi/?seed=0`);
  const chiavi = new Set<string>();
  const foglio = page.getByRole('region', { name: 'Riscontro' });
  for (let n = 0; n < 10; n++) {
    const es = esercizio(['violino', 'violino-ottava-bassa', 'basso'], n);
    chiavi.add(es.chiave);
    await rispondi(page, es.nota);
    await expect(foglio).toContainText('✓ Giusto');
    await foglio.getByRole('button', { name: 'Avanti →' }).click();
  }
  expect(chiavi.size).toBe(3);
  await expect(page.getByText('10 su 10 giuste al primo colpo')).toBeVisible();
});

test('in inglese i pulsanti hanno i nomi C D E F G A B', async ({ page }) => {
  await page.goto(`en/capitoli/${PRIMO}/esercizi/?seed=1`);
  const tastierino = page.getByRole('group', { name: 'Answer' });
  for (const nome of 'CDEFGAB') await expect(tastierino.getByRole('button', { name: nome, exact: true })).toBeVisible();
  await expect(tastierino.getByRole('button', { name: 'Check' })).toBeVisible();
});

test('dagli Esercizi si va al Capitolo successivo', async ({ page }) => {
  await page.goto(`it/capitoli/${PRIMO}/esercizi/`);
  await expect(page.getByRole('link', { name: 'Capitolo successivo →' }).first()).toHaveAttribute('href', `/nota-bene/it/capitoli/${SECONDO}/`);
});

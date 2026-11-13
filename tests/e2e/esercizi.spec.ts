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
  await expect(page).toHaveTitle(/^Esercizi: Note, toni e semitoni \//);
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
  // Nel riepilogo la pagina torna normale, anche col dito.
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Esercizi: Note, toni e semitoni');
  await expect(page.locator('footer.piede')).toBeVisible();
  const riepilogo = page.getByRole('region', { name: '5 su 10 giuste al primo colpo' });
  await expect(riepilogo.getByRole('link', { name: 'Capitolo successivo →' })).toHaveAttribute('href', `/nota-bene/it/capitoli/${SECONDO}/`);
  await page.getByRole('button', { name: 'Altri 10 esercizi' }).click();
  await expect(page.getByText('Esercizio 1 di 10')).toBeVisible();

  // La Serie non si salva: in localStorage ci sono solo i Progressi (ADR-0011), niente in sessionStorage.
  expect(await page.evaluate(() => [Object.keys(localStorage), sessionStorage.length])).toEqual([['nota-bene:progressi:v1'], 0]);
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

test('dagli Esercizi si va al capitolo successivo e si torna al capitolo', async ({ page }) => {
  await page.goto(`it/capitoli/${PRIMO}/esercizi/`);
  // Col dito, durante la Serie, il link al successivo è nascosto e torna nel riepilogo.
  await expect(page.locator('nav.seguito a[rel="next"]')).toHaveAttribute('href', `/nota-bene/it/capitoli/${SECONDO}/`);
  // Col mouse il link per tornare sta sopra il titolo; col dito nella riga dell'avanzamento.
  await page.getByRole('link', { name: /Torna al capitolo/ }).click();
  await expect(page).toHaveURL(new RegExp(`/it/capitoli/${PRIMO}/$`));
});

test('col dito la Serie sta in una schermata, senza scorrere; col mouse tastierino e foglio stanno sotto il pentagramma', async ({ page }, info) => {
  await page.goto(`it/capitoli/${PRIMO}/esercizi/?seed=1`);
  const pentagramma = page.locator('.esercizio .pentagramma svg');
  const tastierino = page.getByRole('group', { name: 'Risposta' });
  await expect(pentagramma).toBeVisible();
  const tocco = await page.evaluate(() => !matchMedia('(hover: hover) and (pointer: fine)').matches);

  if (tocco) {
    const nellaSchermata = async (cosa: string) => {
      const { scorre, scorreSerie, altezza } = await page.evaluate(() => {
        const main = document.querySelector('main')!;
        return {
          scorre: document.documentElement.scrollHeight - window.innerHeight,
          scorreSerie: main.scrollHeight - main.clientHeight,
          altezza: window.innerHeight,
        };
      });
      expect(scorre, `${info.project.name}: la pagina scorre (${cosa})`).toBeLessThanOrEqual(0);
      expect(scorreSerie, `${info.project.name}: la Serie scorre (${cosa})`).toBeLessThanOrEqual(0);
      for (const elemento of [pentagramma, page.locator('.avanzamento'), page.locator('header.top')]) {
        const box = (await elemento.boundingBox())!;
        expect(box.y, cosa).toBeGreaterThanOrEqual(0);
        expect(box.y + box.height, cosa).toBeLessThanOrEqual(altezza);
      }
    };
    await expect(page.locator('footer.piede')).toBeHidden();
    await expect(page.getByRole('heading', { level: 1 })).toBeHidden();
    const box = (await tastierino.boundingBox())!;
    expect(box.y + box.height).toBeLessThanOrEqual(await page.evaluate(() => window.innerHeight));
    await nellaSchermata('tastierino');
    await rispondi(page, { lettera: 'C', alterazione: 0 });
    await expect(page.getByRole('region', { name: 'Riscontro' })).toBeInViewport({ ratio: 1 });
    await nellaSchermata('foglio');
    // Dalla riga in alto si torna al capitolo.
    await expect(page.getByRole('link', { name: 'Torna al capitolo' })).toBeVisible();
  } else {
    const [sotto, sopra] = await Promise.all([page.locator('.esercizio').boundingBox(), tastierino.boundingBox()]);
    expect(sopra!.y).toBeGreaterThan(sotto!.y + sotto!.height);
    await rispondi(page, { lettera: 'C', alterazione: 0 });
    const foglio = await page.getByRole('region', { name: 'Riscontro' }).boundingBox();
    expect(foglio!.y).toBeGreaterThan(sotto!.y + sotto!.height);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  }
});

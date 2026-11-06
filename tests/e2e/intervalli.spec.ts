// Esercizi sugli intervalli nel Capitolo 8 (ticket "Esercizi sugli intervalli"): numero, poi qualità, poi Verifica.
// Con ?seed=s l'Esercizio n della Serie usa il seed s + n: il test genera lo stesso Esercizio e sa la risposta.
import { expect, test, type Page } from '@playwright/test';
import { genera, type Chiave, type Intervallo } from '../../src/esercizi';
import { CAPITOLI } from './pagine';

const INTERVALLI = CAPITOLI[7]!;
const CHIAVI: Chiave[] = ['violino', 'violino-ottava-bassa', 'basso'];
const QUALITA = { minore: 'minore', maggiore: 'maggiore', giusta: 'giusta', aumentata: 'aumentata', diminuita: 'diminuita' } as const;

async function rispondi(page: Page, risposta: Intervallo) {
  const tastierino = page.getByRole('group', { name: 'Risposta' });
  await tastierino.getByRole('button', { name: `${risposta.numero}ª`, exact: true }).click();
  await expect(tastierino.getByRole('button', { name: 'Verifica' })).toBeDisabled();
  await tastierino.getByRole('button', { name: QUALITA[risposta.qualita], exact: true }).click();
  await tastierino.getByRole('button', { name: 'Verifica' }).click();
}

const rivolto = (i: Intervallo): Intervallo => ({
  numero: (9 - i.numero) as Intervallo['numero'],
  qualita: ({ minore: 'maggiore', maggiore: 'minore', giusta: 'giusta', aumentata: 'diminuita', diminuita: 'aumentata' } as const)[i.qualita],
});

test('una Serie di "Riconosci l\'intervallo" con seed fisso', async ({ page }) => {
  await page.goto(`it/capitoli/${INTERVALLI}/esercizi/?seed=200`);
  await expect(page.getByRole('tab', { name: "Riconosci l'intervallo" })).toHaveAttribute('aria-selected', 'true');
  const foglio = page.getByRole('region', { name: 'Riscontro' });
  for (let n = 0; n < 10; n++) {
    await expect(page.getByText(`Esercizio ${n + 1} di 10`)).toBeVisible();
    const { intervallo } = genera('riconosci-intervallo', { chiavi: CHIAVI }, 200 + n);
    const giusta = n % 3 !== 0;
    await rispondi(page, giusta ? intervallo : { ...intervallo, numero: intervallo.numero === 2 ? 3 : 2 });
    await expect(foglio).toContainText(giusta ? '✓ Giusto' : '✗ Non è così');
    await expect(foglio).toContainText('semitoni');
    await foglio.getByRole('button', { name: 'Avanti →' }).click();
  }
  await expect(page.getByText('6 su 10 giuste al primo colpo')).toBeVisible();
});

test('una Serie di "Rivolta l\'intervallo" con seed fisso', async ({ page }) => {
  await page.goto(`it/capitoli/${INTERVALLI}/esercizi/?seed=300`);
  await page.getByRole('tab', { name: "Rivolta l'intervallo" }).click();
  // Cambiare scheda fa ripartire la Serie: i seed vanno avanti di 10.
  const foglio = page.getByRole('region', { name: 'Riscontro' });
  for (let n = 0; n < 10; n++) {
    const { intervallo } = genera('rivolta-intervallo', { chiavi: CHIAVI }, 310 + n);
    await rispondi(page, rivolto(intervallo));
    await expect(foglio).toContainText('✓ Giusto');
    await foglio.getByRole('button', { name: 'Avanti →' }).click();
  }
  await expect(page.getByText('10 su 10 giuste al primo colpo')).toBeVisible();
});

test('in inglese numeri e qualità hanno i nomi inglesi', async ({ page }) => {
  await page.goto(`en/capitoli/${INTERVALLI}/esercizi/?seed=1`);
  const tastierino = page.getByRole('group', { name: 'Answer' });
  for (const nome of ['2nd', '3rd', '8th', 'minor', 'major', 'perfect', 'augmented', 'diminished']) {
    await expect(tastierino.getByRole('button', { name: nome, exact: true })).toBeVisible();
  }
});

test('col dito, anche con due schede, il foglio sta nella schermata e il pentagramma resta visibile', async ({ page }) => {
  await page.goto(`it/capitoli/${INTERVALLI}/esercizi/?seed=3`);
  test.skip(await page.evaluate(() => matchMedia('(hover: hover) and (pointer: fine)').matches), 'solo col dito');
  const { intervallo } = genera('riconosci-intervallo', { chiavi: CHIAVI }, 3);
  await rispondi(page, { ...intervallo, numero: intervallo.numero === 2 ? 3 : 2 });
  await expect(page.getByRole('region', { name: 'Riscontro' })).toBeInViewport({ ratio: 1 });
  const { scorre, scorreSerie } = await page.evaluate(() => {
    const main = document.querySelector('main')!;
    return { scorre: document.documentElement.scrollHeight - innerHeight, scorreSerie: main.scrollHeight - main.clientHeight };
  });
  expect(scorre).toBeLessThanOrEqual(0);
  expect(scorreSerie).toBeLessThanOrEqual(0);
  // Il rigo intero, non una striscia: almeno 60 px dell'SVG dentro il riquadro.
  const [riquadro, rigo] = await Promise.all([page.locator('.esercizio').boundingBox(), page.locator('.esercizio .pentagramma svg').boundingBox()]);
  expect(Math.min(riquadro!.y + riquadro!.height, rigo!.y + rigo!.height) - rigo!.y).toBeGreaterThan(60);
});

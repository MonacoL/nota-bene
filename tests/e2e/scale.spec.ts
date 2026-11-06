// Esercizi su scale e Tonalità nei Capitoli 5 e 6 (ticket "Esercizi su scale e Tonalità").
// Con ?seed=s l'Esercizio n della Serie usa il seed s + n: il test genera lo stesso Esercizio e sa la risposta.
import { expect, test, type Page } from '@playwright/test';
import { genera, type Forma, type Nota } from '../../src/esercizi';
import { CAPITOLI } from './pagine';

const MAGGIORE = CAPITOLI[4]!;
const MINORE = CAPITOLI[5]!;
const NOMI_IT = { C: 'Do', D: 'Re', E: 'Mi', F: 'Fa', G: 'Sol', A: 'La', B: 'Si' } as const;
const SEGNI_IT = { '-1': 'bemolle', '0': 'bequadro', '1': 'diesis' } as const;
const MINORI = { forme: ['naturale', 'armonica', 'melodica'] as Forma[] };

const tastierino = (page: Page) => page.getByRole('group', { name: 'Risposta' });
const noteSulRigo = (page: Page) => page.locator('.esercizio .pentagramma .abcjs-note');

async function nota(page: Page, n: Pick<Nota, 'lettera' | 'alterazione'>) {
  await tastierino(page).getByRole('button', { name: SEGNI_IT[n.alterazione], exact: true }).click();
  await tastierino(page).getByRole('button', { name: NOMI_IT[n.lettera], exact: true }).click();
}

test('"Costruisci la scala": ogni nota compare sul rigo, ⌫ cancella l\'ultima, Verifica solo con 7 note', async ({ page }) => {
  await page.goto(`it/capitoli/${MAGGIORE}/esercizi/?seed=40`);
  const es = genera('costruisci-la-scala', { forme: ['maggiore'] }, 40);
  await expect(page.getByText(/^Costruisci la scala di .+ maggiore\.$/)).toBeVisible();
  await expect(noteSulRigo(page)).toHaveCount(1);
  const verifica = tastierino(page).getByRole('button', { name: 'Verifica' });
  const [, ...giuste] = es.scala;
  for (const [i, n] of giuste.slice(0, 3).entries()) {
    await nota(page, n);
    await expect(noteSulRigo(page)).toHaveCount(i + 2);
  }
  await expect(verifica).toBeDisabled();
  await tastierino(page).getByRole('button', { name: 'Cancella l\'ultima nota' }).click();
  await expect(noteSulRigo(page)).toHaveCount(3);
  for (const n of giuste.slice(2)) await nota(page, n);
  await expect(noteSulRigo(page)).toHaveCount(8);
  // Con 7 note i nomi si spengono: non se ne aggiungono altre.
  for (const nome of Object.values(NOMI_IT)) await expect(tastierino(page).getByRole('button', { name: nome, exact: true })).toBeDisabled();
  await verifica.click();
  await expect(page.getByRole('region', { name: 'Riscontro' })).toContainText('✓ Giusto');
});

test('una Serie di "Costruisci la scala" nel Capitolo 6, con le scale minori', async ({ page }) => {
  await page.goto(`it/capitoli/${MINORE}/esercizi/?seed=70`);
  const foglio = page.getByRole('region', { name: 'Riscontro' });
  for (let n = 0; n < 10; n++) {
    const es = genera('costruisci-la-scala', MINORI, 70 + n);
    await expect(page.locator('.domanda')).toContainText('minore');
    const note = es.scala.slice(1);
    const giusta = n % 2 === 0;
    if (!giusta) note[2] = { ...note[2]!, alterazione: note[2]!.alterazione === 1 ? 0 : 1 };
    for (const x of note) await nota(page, x);
    await tastierino(page).getByRole('button', { name: 'Verifica' }).click();
    await expect(foglio).toContainText(giusta ? '✓ Giusto' : '✗ Non è così');
    await expect(foglio).toContainText('Toni e semitoni');
    if (!giusta) await expect(foglio).toContainText('La 4ª nota è');
    await foglio.getByRole('button', { name: 'Avanti →' }).click();
  }
  await expect(page.getByText('5 su 10 giuste al primo colpo')).toBeVisible();
});

/** La tonica maggiore di ogni armatura, dal libro: quella che sbaglia chi risponde con la relativa. */
const MAGGIORI: Record<number, Pick<Nota, 'lettera' | 'alterazione'>> = {
  [-4]: { lettera: 'A', alterazione: -1 }, [-3]: { lettera: 'E', alterazione: -1 }, [-2]: { lettera: 'B', alterazione: -1 },
  [-1]: { lettera: 'F', alterazione: 0 }, 0: { lettera: 'C', alterazione: 0 }, 1: { lettera: 'G', alterazione: 0 },
  2: { lettera: 'D', alterazione: 0 }, 3: { lettera: 'A', alterazione: 0 }, 4: { lettera: 'E', alterazione: 0 },
};

test('una Serie di "Trova la tonalità" nel Capitolo 6: la relativa è sbagliata e la spiegazione la nomina', async ({ page }) => {
  await page.goto(`it/capitoli/${MINORE}/esercizi/?seed=90`);
  // Cambiare scheda fa ripartire la Serie: i seed vanno avanti di 10.
  await page.getByRole('tab', { name: 'Trova la tonalità' }).click();
  const foglio = page.getByRole('region', { name: 'Riscontro' });
  let relativaData = false;
  for (let n = 0; n < 10; n++) {
    const es = genera('trova-la-tonalita', { modi: ['maggiore', 'minore'] }, 100 + n);
    await expect(page.locator('.domanda')).toHaveText(es.domanda.it);
    const conRelativa = !relativaData && es.modo === 'minore';
    await nota(page, conRelativa ? MAGGIORI[es.quinte]! : es.tonica);
    await tastierino(page).getByRole('button', { name: 'Verifica' }).click();
    if (conRelativa) {
      relativaData = true;
      await expect(foglio).toContainText('✗ Non è così');
      await expect(foglio).toContainText('è la tonica della relativa maggiore');
    } else {
      await expect(foglio).toContainText('✓ Giusto');
    }
    await foglio.getByRole('button', { name: 'Avanti →' }).click();
  }
  expect(relativaData).toBe(true);
  await expect(page.getByText('9 su 10 giuste al primo colpo')).toBeVisible();
});

test('nel Capitolo 5 "Trova la tonalità" chiede solo tonalità maggiori', async ({ page }) => {
  await page.goto(`it/capitoli/${MAGGIORE}/esercizi/?seed=5`);
  await page.getByRole('tab', { name: 'Trova la tonalità' }).click();
  await expect(page.locator('.domanda')).toHaveText('Quale tonalità maggiore ha questa armatura?');
});

test('con tutte le 8 note sul rigo, anche le alterazioni, nessuna nota si sovrappone alla successiva', async ({ page }) => {
  // Do minore naturale: tre bemolle, due nelle ultime note.
  const seed = Array.from({ length: 200 }, (_, i) => i).find((s) => {
    const es = genera('costruisci-la-scala', MINORI, s);
    return es.scala.filter((x) => x.alterazione !== 0).length >= 3;
  })!;
  await page.goto(`it/capitoli/${MINORE}/esercizi/?seed=${seed}`);
  for (const x of genera('costruisci-la-scala', MINORI, seed).scala.slice(1)) await nota(page, x);
  await expect(noteSulRigo(page)).toHaveCount(8);
  const scatole = await noteSulRigo(page).evaluateAll((note) => note.map((n) => n.getBoundingClientRect()).map((r) => ({ da: r.left, a: r.right })));
  for (let i = 1; i < scatole.length; i++) expect(scatole[i]!.da, `nota ${i + 1}`).toBeGreaterThanOrEqual(scatole[i - 1]!.a);
});

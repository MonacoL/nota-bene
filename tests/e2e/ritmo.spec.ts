// Esercizi di ritmo nei Capitoli 3 e 4 (ticket "Esercizi di ritmo").
// Con ?seed=s l'Esercizio n della Serie usa il seed s + n: il test genera lo stesso Esercizio e sa la risposta.
import { expect, test, type Page } from '@playwright/test';
import { genera, TEMPI, type NomeTempo } from '../../src/esercizi';
import { CAPITOLI } from './pagine';

const FIGURE = CAPITOLI[2]!;
const TEMPI_CAP = CAPITOLI[3]!;
const tastierino = (page: Page) => page.getByRole('group', { name: 'Risposta' });
const noteSulRigo = (page: Page) => page.locator('.esercizio .pentagramma .abcjs-note');

/** Riempie quello che manca con crome, oppure con una sola Figura quando c'è. */
async function completa(page: Page, mancano: number, conCrome: boolean) {
  const t = tastierino(page);
  if (conCrome) {
    for (let i = 0; i < mancano / 2; i++) await t.getByRole('button', { name: 'croma', exact: true }).click();
    return;
  }
  const una: Record<number, [string, boolean]> = {
    2: ['croma', false], 4: ['semiminima', false], 6: ['semiminima', true], 8: ['minima', false], 12: ['minima', true],
  };
  const [nome, punto] = una[mancano]!;
  if (punto) await t.getByRole('button', { name: 'punto', exact: true }).click();
  await t.getByRole('button', { name: nome, exact: true }).click();
}

test('una Serie di "Completa la battuta" nel Capitolo 3, in 4/4: conta la somma, non le Figure', async ({ page }) => {
  await page.goto(`it/capitoli/${FIGURE}/esercizi/?seed=30`);
  const foglio = page.getByRole('region', { name: 'Riscontro' });
  const verifica = tastierino(page).getByRole('button', { name: 'Verifica' });
  for (let n = 0; n < 10; n++) {
    const es = genera('completa-la-battuta', { tempi: ['4/4'] }, 30 + n);
    const scritte = es.scritte.flat().length;
    await expect(noteSulRigo(page)).toHaveCount(scritte);
    await expect(verifica).toBeDisabled();
    if (n === 9) {
      // Una semibreve è sempre troppo, perché manca al massimo metà Battuta.
      await tastierino(page).getByRole('button', { name: 'semibreve', exact: true }).click();
    } else {
      await completa(page, es.mancano, n % 2 === 0);
    }
    if (n === 0) {
      // Ogni Figura compare sul rigo, e ⌫ cancella l'ultima.
      await expect(noteSulRigo(page)).toHaveCount(scritte + es.mancano / 2);
      await tastierino(page).getByRole('button', { name: "Cancella l'ultima nota" }).click();
      await expect(noteSulRigo(page)).toHaveCount(scritte + es.mancano / 2 - 1);
      await tastierino(page).getByRole('button', { name: 'croma', exact: true }).click();
    }
    await verifica.click();
    await expect(foglio).toContainText(n === 9 ? '✗ Non è così' : '✓ Giusto');
    await expect(foglio).toContainText('crome');
    await foglio.getByRole('button', { name: 'Avanti →' }).click();
  }
  await expect(page.getByText('9 su 10 giuste al primo colpo')).toBeVisible();
});

test('una Serie di "Completa la battuta" nel Capitolo 4, con gli altri Tempi', async ({ page }) => {
  await page.goto(`it/capitoli/${TEMPI_CAP}/esercizi/?seed=60`);
  const foglio = page.getByRole('region', { name: 'Riscontro' });
  for (let n = 0; n < 10; n++) {
    const es = genera('completa-la-battuta', { tempi: [...TEMPI] }, 60 + n);
    await completa(page, es.mancano, false);
    await tastierino(page).getByRole('button', { name: 'Verifica' }).click();
    await expect(foglio).toContainText(`Una battuta di ${es.tempo}`);
    await expect(foglio).toContainText('✓ Giusto');
    await foglio.getByRole('button', { name: 'Avanti →' }).click();
  }
});

test('una Serie di "Riconosci il tempo": scelta fra i Tempi con un tocco', async ({ page }) => {
  await page.goto(`it/capitoli/${TEMPI_CAP}/esercizi/?seed=80`);
  await page.getByRole('tab', { name: 'Riconosci il tempo' }).click();
  await expect(tastierino(page).getByRole('button')).toHaveText([...TEMPI]);
  await expect(page.getByRole('button', { name: 'Verifica' })).toHaveCount(0);
  const foglio = page.getByRole('region', { name: 'Riscontro' });
  for (let n = 0; n < 10; n++) {
    // Cambiare scheda fa ripartire la Serie: i seed vanno avanti di 10.
    const es = genera('riconosci-il-tempo', { tempi: [...TEMPI] }, 90 + n);
    const giusta = n !== 0;
    const data: NomeTempo = giusta ? es.tempo : es.tempo === '2/4' ? '3/4' : '2/4';
    await tastierino(page).getByRole('button', { name: data, exact: true }).click();
    await expect(foglio).toContainText(giusta ? '✓ Giusto' : '✗ Non è così');
    await expect(foglio).toContainText('pulsazion');
    await foglio.getByRole('button', { name: 'Avanti →' }).click();
  }
  await expect(page.getByText('9 su 10 giuste al primo colpo')).toBeVisible();
});

test('in inglese le Figure hanno i nomi americani', async ({ page }) => {
  await page.goto(`en/capitoli/${FIGURE}/esercizi/?seed=1`);
  const t = page.getByRole('group', { name: 'Answer' });
  for (const nome of ['whole note', 'half note', 'quarter note', 'eighth note', 'dot']) await expect(t.getByRole('button', { name: nome, exact: true })).toBeVisible();
});

test('le due Battute di "Riconosci il tempo" stanno intere nel riquadro, anche in 12/8', async ({ page }) => {
  const seed = Array.from({ length: 300 }, (_, i) => i).find((s) => {
    const es = genera('riconosci-il-tempo', { tempi: [...TEMPI] }, s + 10);
    return es.tempo === '12/8' && es.battute.flat(2).length >= 18;
  })!;
  await page.goto(`it/capitoli/${TEMPI_CAP}/esercizi/?seed=${seed}`);
  await page.getByRole('tab', { name: 'Riconosci il tempo' }).click();
  await expect(noteSulRigo(page).first()).toBeVisible();
  const riquadro = (await page.locator('.esercizio').boundingBox())!;
  for (const nota of await noteSulRigo(page).all()) {
    const box = (await nota.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(riquadro.x);
    expect(box.x + box.width).toBeLessThanOrEqual(riquadro.x + riquadro.width);
    expect(box.y + box.height).toBeLessThanOrEqual(riquadro.y + riquadro.height);
  }
});

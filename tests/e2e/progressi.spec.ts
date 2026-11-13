// I Progressi nel browser (ADR-0011, ticket #78): Serie che completa un Capitolo, segna come già studiato, cancella.
import { expect, test, type Page } from '@playwright/test';
import { genera } from '../../src/esercizi';

/** Chiavi: un solo tipo di Esercizio, "nomina la nota" in tre Chiavi. */
const CHIAVI = 'chiavi';
const DICHIARAZIONE = { chiavi: ['violino', 'violino-ottava-bassa', 'basso'] } as const;
const SEED = 100;

// Qui si provano i Progressi, non i blocchi (scaletta.spec.ts): si parte in Studio libero (playwright.config.ts).

/** Una Serie intera con seed fisso: le prime `giuste` risposte giuste, le altre sbagliate. */
async function faiSerie(page: Page, giuste: number, lingua = 'it') {
  await page.goto(`${lingua}/capitoli/${CHIAVI}/esercizi/?seed=${SEED}`);
  for (let n = 0; n < 10; n++) {
    const { nota } = genera('nomina-la-nota', { ...DICHIARAZIONE, chiavi: [...DICHIARAZIONE.chiavi] }, SEED + n);
    const risposta = n < giuste ? nota : { lettera: nota.lettera === 'C' ? 'D' : 'C', alterazione: 0 };
    const tastierino = page.locator('.tastierino');
    await tastierino.locator('.alterazioni button').nth(risposta.alterazione + 1).click();
    await tastierino.locator('.nomi button').nth('CDEFGAB'.indexOf(risposta.lettera)).click();
    await tastierino.locator('.verifica').click();
    await page.locator('.foglio button').click();
  }
}

test('una Serie con 8 giuste completa il Capitolo, in tutte e due le lingue; con 7 no', async ({ page }) => {
  await faiSerie(page, 7);
  await expect(page.locator('.riepilogo')).toContainText('7 su 10');
  await expect(page.locator('.riepilogo .conta')).toHaveText('Con almeno 8 giuste al primo colpo la serie conta per completare il capitolo.');
  await page.goto(`it/capitoli/${CHIAVI}/`);
  await expect(page.getByRole('button', { name: 'Segna come già studiato' })).toBeVisible();

  await faiSerie(page, 8);
  await expect(page.locator('.riepilogo .conta')).toHaveText('✓ Questa serie conta: il capitolo è completato.');
  await page.goto(`it/capitoli/${CHIAVI}/`);
  await expect(page.locator('.stato-capitolo .fatto')).toHaveText('✓ Capitolo completato');
  await expect(page.getByRole('button', { name: 'Segna come già studiato' })).toBeHidden();
  await page.goto('en/capitoli/');
  await expect(page.locator(`#scaletta li[data-capitolo="${CHIAVI}"] .fatto`)).toHaveText('✓ Chapter completed');
});

test('si segna un Capitolo come già studiato e si cancellano i Progressi con due tocchi', async ({ page }) => {
  await page.goto('it/capitoli/intervalli/');
  await page.getByRole('button', { name: 'Segna come già studiato' }).click();
  await expect(page.locator('.stato-capitolo .fatto')).toBeVisible();

  await page.goto('it/capitoli/');
  const voce = page.locator('#scaletta li[data-capitolo="intervalli"]');
  await expect(voce.locator('.fatto')).toBeVisible();
  await expect(page.locator('#scaletta li .fatto:visible')).toHaveCount(1);

  const cancella = page.getByRole('button', { name: 'Cancella i miei progressi' });
  await cancella.click();
  await expect(voce.locator('.fatto')).toBeVisible();
  await page.getByRole('button', { name: 'Tocca ancora per cancellare tutto' }).click();
  await expect(page.getByRole('status')).toHaveText('Progressi cancellati.');
  await expect(voce.locator('.fatto')).toBeHidden();
  await page.reload();
  await expect(voce.locator('.fatto')).toBeHidden();
});

test.describe('senza JavaScript', () => {
  // Senza JavaScript Playwright non può preparare il localStorage iniziale (Firefox si blocca): browser vuoto.
  test.use({ javaScriptEnabled: false, storageState: { cookies: [], origins: [] } });
  test('i comandi dei Progressi non si vedono', async ({ page }) => {
    await page.goto('it/capitoli/intervalli/');
    await expect(page.locator('.stato-capitolo')).toBeHidden();
    await page.goto('it/capitoli/');
    await expect(page.locator('.cancella')).toBeHidden();
  });
});

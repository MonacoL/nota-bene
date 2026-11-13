// Scaletta e Studio libero (ADR-0011, ticket #79): Prerequisiti che bloccano, prossimo passo, niente blocchi senza JS.
import { expect, test } from '@playwright/test';
import { CAPITOLI, LETTURE } from './pagine';
import { telefono } from './menu';

// Un browser vuoto, come chi entra la prima volta: in Scaletta (gli altri test partono in Studio libero).
test.use({ storageState: { cookies: [], origins: [] } });

const PRIMO = CAPITOLI[0]!; // note-toni-e-semitoni, senza Prerequisiti
const CHIAVI = 'chiavi'; // richiede il primo

test('si parte in Scaletta: il primo Capitolo è il prossimo passo, Chiavi è bloccato', async ({ page }) => {
  await page.goto('it/capitoli/');
  await expect(page.locator('.modo .cambia-modo')).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('.modo .descrizione')).toContainText('Segui la scaletta');
  const voce = (id: string) => page.locator(`#scaletta li[data-capitolo="${id}"]`);
  await expect(voce(PRIMO).locator('.prossimo')).toHaveText('Prossimo passo');
  await expect(voce(PRIMO).locator('.lucchetto')).toBeHidden();
  await expect(voce(CHIAVI).locator('.lucchetto')).toBeVisible();
  await expect(page.locator('#scaletta .prossimo:visible')).toHaveCount(1);
});

test('un Capitolo bloccato mostra il riquadro, e si sblocca segnando il Prerequisito come già studiato', async ({ page }) => {
  await page.goto(`it/capitoli/${CHIAVI}/`);
  const blocco = page.locator('.blocco');
  await expect(blocco).toBeVisible();
  await expect(page.locator('article.testo')).toBeHidden();
  await expect(blocco.getByRole('link')).toHaveAttribute('href', `/nota-bene/it/capitoli/${PRIMO}/`);

  await blocco.getByRole('button', { name: /^Segna ".+" come già studiato$/ }).click();
  await expect(blocco).toBeHidden();
  await expect(page.locator('article.testo')).toBeVisible();
  // Gli esempi, nascosti finché era bloccato, si disegnano ora.
  await expect(page.locator('article.testo .pentagramma:not(:has(svg))')).toHaveCount(0);
  await expect(page.locator('article.testo .pentagramma svg').first()).toBeVisible();

  // Il Prerequisito ora è completato: anche gli Esercizi di Chiavi sono aperti, e il prossimo passo è Chiavi.
  await page.goto(`it/capitoli/${CHIAVI}/esercizi/`);
  await expect(page.locator('.blocco')).toBeHidden();
  await expect(page.locator('.serie')).toBeVisible();
  await page.goto('it/capitoli/');
  await expect(page.locator(`#scaletta li[data-capitolo="${CHIAVI}"] .prossimo`)).toBeVisible();
});

test('Esercizi e Letture con Prerequisiti mancanti sono bloccati anche loro', async ({ page }) => {
  await page.goto(`it/capitoli/${CHIAVI}/esercizi/`);
  await expect(page.locator('.blocco')).toBeVisible();
  await expect(page.locator('.serie')).toBeHidden();
  await page.goto(`it/letture/${LETTURE[0]}/`);
  await expect(page.locator('.blocco')).toBeVisible();
  await expect(page.locator('.partitura')).toBeHidden();
});

test('dal riquadro si passa allo Studio libero, che apre tutto; dall\'intestazione si torna alla Scaletta', async ({ page }) => {
  await page.goto(`en/capitoli/${CHIAVI}/`);
  await page.locator('.blocco').getByRole('button', { name: 'Switch to free study' }).click();
  await expect(page.locator('.blocco')).toBeHidden();
  await expect(page.locator('article.testo')).toBeVisible();

  await page.goto('it/capitoli/');
  await expect(page.locator('.modo .cambia-modo')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#scaletta .lucchetto:visible')).toHaveCount(0);
  await expect(page.locator('#scaletta .prossimo:visible')).toHaveCount(0);

  // Sul telefono il cambio sta nel menu con le lineette; fra 440 e 640 px solo nella pagina dei Capitoli.
  const larghezza = page.viewportSize()!.width;
  if (larghezza >= 440 && larghezza < 640) return;
  if (telefono(page)) await page.locator('header .menu summary').click();
  const intestazione = page.locator('header .cambia-modo:visible');
  await expect(intestazione).toHaveAttribute('aria-pressed', 'true');
  await intestazione.click();
  await expect(page.locator('.modo .cambia-modo')).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator(`#scaletta li[data-capitolo="${CHIAVI}"] .lucchetto`)).toBeVisible();
});

test.describe('senza JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('non si blocca niente', async ({ page }) => {
    await page.goto(`it/capitoli/${CHIAVI}/`);
    await expect(page.locator('article.testo')).toBeVisible();
    await expect(page.locator('.blocco')).toBeHidden();
    await expect(page.locator('header .cambia-modo')).toHaveCount(2);
    await expect(page.locator('header .cambia-modo:visible')).toHaveCount(0);
  });
});

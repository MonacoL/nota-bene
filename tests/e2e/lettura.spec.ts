// La pagina di una Lettura (ticket "Prima Lettura vera", #29): Soluzione nascosta con lo spazio riservato,
// comandi in basso sul telefono e sopra la partitura su desktop, attribuzione sempre visibile.
// La Lettura è la prima vera: If Ye Love Me di Tallis, soprano, battute 1–7, in Fa maggiore.
import { expect, test, type Page } from '@playwright/test';

const LETTURA = 'it/letture/if-ye-love-me/soprano-1-7/';
// Lette a mano dalla partitura: DO = Fa; i La legati non riattaccano e non prendono una Sillaba.
const SILLABE = 'DO DO RE MI MI RE DO FA MI MI MI MI SOL FA MI FA RE MI';

async function apri(page: Page, percorso = LETTURA) {
  await page.goto(percorso);
  await expect(page.locator('.partitura svg')).toHaveCount(1);
}

const sillabe = (page: Page) => page.locator('.partitura .sillaba');

test('la soluzione resta nascosta finché non si chiede, senza spostare la partitura', async ({ page }) => {
  await apri(page);
  const partitura = page.locator('.partitura');
  const prima = await partitura.boundingBox();
  await expect(sillabe(page)).toHaveCount(SILLABE.split(' ').length);
  for (const s of await sillabe(page).all()) await expect(s).toBeHidden();
  await expect(page.getByText('Tonalità: Fa maggiore.')).toBeHidden();

  const mostra = page.getByRole('button', { name: 'Mostra la soluzione' });
  await mostra.click();
  await expect(page.getByRole('button', { name: 'Nascondi la soluzione' })).toHaveAttribute('aria-pressed', 'true');
  expect((await sillabe(page).allTextContents()).join(' ')).toBe(SILLABE);
  for (const s of await sillabe(page).all()) await expect(s).toBeVisible();
  await expect(page.getByText('Tonalità: Fa maggiore.')).toBeVisible();
  expect(await partitura.boundingBox()).toEqual(prima);

  await page.getByRole('button', { name: 'Nascondi la soluzione' }).click();
  await expect(sillabe(page).first()).toBeHidden();
});

test('il testo del brano sta sotto le note e resta sempre visibile', async ({ page }) => {
  await apri(page);
  const testo = page.locator('.partitura .abcjs-lyric').filter({ hasText: 'love' });
  await expect(testo.first()).toBeVisible();
});

test('i quattro comandi: in basso sul telefono, sopra la partitura su desktop', async ({ page }) => {
  await apri(page);
  const comandi = page.getByRole('navigation', { name: 'Comandi della lettura' });
  await expect(comandi.getByRole('button')).toHaveCount(3);
  for (const nome of ['Riferimento tonale', 'Ascolto di verifica']) {
    await expect(comandi.getByRole('button', { name: nome })).toBeDisabled();
  }
  await expect(comandi.getByRole('link', { name: 'Lettura successiva' })).toBeVisible();
  const barra = (await comandi.boundingBox())!;
  const partitura = (await page.locator('.partitura').boundingBox())!;
  const { width, height } = page.viewportSize()!;
  if (width < 720) expect(Math.round(barra.y + barra.height)).toBe(height);
  else expect(barra.y + barra.height).toBeLessThanOrEqual(partitura.y);
});

test("l'attribuzione è sempre visibile e i dettagli portano ai capitoli", async ({ page }) => {
  await apri(page);
  const attribuzione = page.locator('.attribuzione');
  await expect(attribuzione).toContainText(
    'If Ye Love Me, Thomas Tallis. Fonte: Mutopia, edizione Mutopia-2014/08/05-412. Licenza: Public Domain. Trascrizione in ABC: CC0 1.0.',
  );
  await expect(attribuzione.getByRole('link', { name: 'Mutopia-2014/08/05-412' })).toHaveAttribute(
    'href',
    'https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=412',
  );
  await attribuzione.getByText('Dettagli sulla fonte').click();
  await expect(attribuzione).toContainText('Stan Sanderson');
  // La nota delle modifiche richiesta dalla CPDL License (ADR-0003): generata dai dati, più il campo libero.
  await expect(attribuzione).toContainText(
    'Estratto della voce di soprano, battute 1–7, trascritto in notazione ABC con le sillabe del DO mobile. ' +
      'Le legature di portamento su note uguali (battute 2–3 e 6–7) sono scritte come legature di valore. ' +
      'Ultima modifica: 6 novembre 2026.',
  );
  await attribuzione.getByRole('link', { name: 'DO mobile' }).click();
  await expect(page).toHaveURL(/\/it\/capitoli\/do-mobile\/$/);
});

test('in inglese la pagina usa i nomi del glossario', async ({ page }) => {
  await apri(page, 'en/letture/if-ye-love-me/soprano-1-7/');
  await expect(page.getByText('Soprano voice part, measures 1–7', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Show the solution' }).click();
  await expect(page.getByText('Key: F major.')).toBeVisible();
  await page.getByText('About the source').click();
  await expect(page.locator('.attribuzione')).toContainText('Excerpt of the soprano voice part, measures 1–7, transcribed into ABC notation');
});

// Elenco delle Letture e Lettura successiva (ticket #32, decisioni nel #16), sul catalogo d'esempio di
// tests/e2e/letture-esempio/ (costruito con `npm run build:esempio` e servito su una porta a parte).
// Letture: Brano alfa soprano e tenore, Brano beta soprano; Brano alfa basso è ritirata. Avanzate: Brano beta contralto.
import { expect, test, type Page } from '@playwright/test';
import { BASE_ESEMPIO } from './pagine';

test.use({ baseURL: BASE_ESEMPIO });

const blocco = (page: Page, nome: string) => page.getByRole('region', { name: nome, exact: true });
const righe = (page: Page, nome: string) => blocco(page, nome).getByRole('listitem');

test("l'elenco ha due blocchi, in ordine, e ogni riga dice brano, autore, voce e battute", async ({ page }) => {
  await page.goto('it/letture/');
  await expect(page.getByRole('heading', { level: 1, name: 'Letture' })).toBeVisible();
  await expect(righe(page, 'Letture')).toHaveText([
    'Brano alfa Autore di prova, soprano, 4 battute',
    'Brano alfa Autore di prova, tenore, 4 battute',
    'Brano beta Autore di prova, soprano, 4 battute',
  ]);
  await expect(righe(page, 'Letture avanzate')).toHaveText(['Brano beta Autore di prova, contralto, 4 battute']);
});

test('il filtro per voce lascia solo quella voce, anche nei link alle letture', async ({ page }) => {
  await page.goto('it/letture/');
  await page.getByRole('navigation', { name: 'Filtra per voce' }).getByRole('link', { name: 'Soprano' }).click();
  await expect(page).toHaveURL(/\/it\/letture\/\?voce=soprano$/);
  await expect(righe(page, 'Letture')).toHaveText([/^Brano alfa .*soprano/, /^Brano beta .*soprano/]);
  await expect(blocco(page, 'Letture avanzate')).toContainText('Nessuna lettura per questa voce.');
  await righe(page, 'Letture').first().getByRole('link').click();
  await expect(page).toHaveURL(/\/it\/letture\/brano-alfa\/soprano-1-4\/\?voce=soprano$/);
});

test('Lettura successiva fa il giro completo del blocco, senza filtro', async ({ page }) => {
  await page.goto('it/letture/brano-alfa/soprano-1-4/');
  const giro = ['brano-alfa/tenore-1-4/', 'brano-beta/soprano-1-4/', 'brano-alfa/soprano-1-4/'];
  for (const prossima of giro) {
    await page.getByRole('link', { name: 'Lettura successiva' }).click();
    await expect(page).toHaveURL(new RegExp(`/it/letture/${prossima}$`));
  }
});

test('Lettura successiva tiene il filtro per voce e resta nel blocco delle avanzate', async ({ page }) => {
  await page.goto('it/letture/brano-alfa/soprano-1-4/?voce=soprano');
  await page.getByRole('link', { name: 'Lettura successiva' }).click();
  await expect(page).toHaveURL(/\/it\/letture\/brano-beta\/soprano-1-4\/\?voce=soprano$/);
  await page.getByRole('link', { name: 'Lettura successiva' }).click();
  await expect(page).toHaveURL(/\/it\/letture\/brano-alfa\/soprano-1-4\/\?voce=soprano$/);

  await page.goto('it/letture/brano-beta/contralto-1-4/');
  await page.getByRole('link', { name: 'Lettura successiva' }).click();
  await expect(page).toHaveURL(/\/it\/letture\/brano-beta\/contralto-1-4\/$/);
});

test('il cambio di lingua mantiene il filtro', async ({ page }) => {
  await page.goto('it/letture/?voce=tenore');
  await page.getByRole('link', { name: 'EN', exact: true }).click();
  await expect(page).toHaveURL(/\/en\/letture\/\?voce=tenore$/);
  await expect(righe(page, 'Readings')).toHaveText(['Brano alfa Autore di prova, tenor, 4 measures']);

  await page.goto('it/letture/brano-alfa/tenore-1-4/?voce=tenore');
  await page.getByRole('link', { name: 'EN', exact: true }).click();
  await expect(page).toHaveURL(/\/en\/letture\/brano-alfa\/tenore-1-4\/\?voce=tenore$/);
  await page.getByRole('link', { name: 'Next reading' }).click();
  await expect(page).toHaveURL(/\/en\/letture\/brano-alfa\/tenore-1-4\/\?voce=tenore$/);
});

test("una lettura ritirata non è nell'elenco e la sua pagina rimanda all'elenco", async ({ page }) => {
  await page.goto('it/letture/');
  await expect(page.getByRole('listitem').filter({ hasText: 'basso' })).toHaveCount(0);

  await page.goto('it/letture/brano-alfa/basso-1-4/');
  await expect(page.getByText('Questa lettura non è più disponibile.')).toBeVisible();
  await expect(page.locator('.partitura')).toHaveCount(0);
  await page.getByRole('link', { name: 'Vai alle letture' }).click();
  await expect(page).toHaveURL(/\/it\/letture\/$/);
});

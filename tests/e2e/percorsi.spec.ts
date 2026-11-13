// Tre Percorsi e la Scaletta (ADR-0011, ticket #77): le due viste della pagina dei Capitoli e i Prerequisiti.
import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { CAPITOLI } from './pagine';

type Voce = { id: string; percorso: string; prerequisiti: string[] };
const VOCI = parse(readFileSync('contenuti/percorso.yml', 'utf8')) as Voce[];
const PERCORSO = (id: string) => VOCI.find((v) => v.id === id)!.percorso;
const NOMI = { ritmico: 'Percorso ritmico', armonico: 'Percorso armonico', melodico: 'Percorso melodico' } as const;

test('si parte dalla Scaletta, con il Percorso di ogni Capitolo, e si passa alla vista per percorso', async ({ page }) => {
  await page.goto('it/capitoli/');
  const scaletta = page.locator('#scaletta');
  await expect(scaletta).toBeVisible();
  await expect(page.locator('#per-percorso')).toBeHidden();
  await expect(page.getByRole('link', { name: 'Scaletta', exact: true })).toHaveAttribute('aria-current', 'true');
  for (const [i, id] of CAPITOLI.entries()) {
    await expect(scaletta.locator('ol.elenco > li').nth(i).locator('.etichetta')).toHaveText(PERCORSO(id));
  }

  await page.getByRole('link', { name: 'Per percorso' }).click();
  await expect(page).toHaveURL(/#per-percorso$/);
  await expect(scaletta).toBeHidden();
  const colonne = page.locator('#per-percorso .colonna');
  await expect(colonne).toHaveCount(3);
  for (const [i, nome] of (['ritmico', 'armonico', 'melodico'] as const).entries()) {
    const colonna = colonne.nth(i);
    await expect(colonna.getByRole('heading', { level: 3 })).toContainText(NOMI[nome]);
    // In ogni colonna i Capitoli del suo Percorso, nell'ordine della Scaletta, col numero della Scaletta.
    const attesi = CAPITOLI.filter((id) => PERCORSO(id) === nome);
    await expect(colonna.locator('li')).toHaveCount(attesi.length);
    for (const [j, id] of attesi.entries()) {
      await expect(colonna.locator('li').nth(j).locator('a')).toHaveAttribute('href', `/nota-bene/it/capitoli/${id}/`);
      await expect(colonna.locator('li').nth(j).locator('.numero')).toHaveText(String(CAPITOLI.indexOf(id) + 1));
    }
  }

  // L'indirizzo ricorda la vista, anche ricaricando.
  await page.reload();
  await expect(page.locator('#per-percorso')).toBeVisible();
  await expect(scaletta).toBeHidden();
});

test.describe('senza JavaScript', () => {
  // Senza JavaScript Playwright non può preparare il localStorage iniziale (Firefox si blocca): browser vuoto.
  test.use({ javaScriptEnabled: false, storageState: { cookies: [], origins: [] } });
  test('si vedono tutte e due le viste, ciascuna col suo titolo', async ({ page }) => {
    await page.goto('it/capitoli/');
    await expect(page.locator('#scaletta')).toBeVisible();
    await expect(page.locator('#per-percorso')).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Per percorso' })).toBeVisible();
  });
});

test('un Capitolo e i suoi Esercizi mostrano Percorso e Prerequisiti, anche di un altro Percorso', async ({ page }) => {
  // DO mobile (melodico) ha fra i Prerequisiti Modo maggiore e minore, armonico: un incrocio.
  const voce = VOCI.find((v) => v.id === 'do-mobile')!;
  for (const pagina of ['it/capitoli/do-mobile/', 'it/capitoli/do-mobile/esercizi/']) {
    await page.goto(pagina);
    const riquadro = page.locator('main > .prerequisiti');
    await expect(riquadro.locator('.etichetta').first()).toHaveText('melodico');
    // Col dito, durante la Serie, i Prerequisiti si nascondono (tornano nel riepilogo): si contano nel DOM.
    const link = riquadro.locator('a');
    await expect(link).toHaveCount(voce.prerequisiti.length);
    for (const [i, id] of voce.prerequisiti.entries()) {
      await expect(link.nth(i)).toHaveAttribute('href', `/nota-bene/it/capitoli/${id}/`);
    }
    await expect(riquadro.locator('.etichetta', { hasText: 'armonico' })).toHaveCount(1);
  }
  // Il primo Capitolo non ha Prerequisiti, in inglese anche.
  await page.goto(`en/capitoli/${CAPITOLI[0]}/`);
  await expect(page.locator('main > .prerequisiti')).toContainText('No prerequisites');
});

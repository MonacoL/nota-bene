// Il Capitolo "Battimenti" (#90): gli esempi sintetizzati con l'organo e "Trova l'unisono", con l'AudioContext finto
// (audio-finto.ts). Niente file audio e niente microfono. L'oscillatore finto registra l'ultima frequenza programmata,
// cioè quella a cui il glissando arriva.
import { expect, test } from '@playwright/test';
import { installaAudioFinto, registro } from './audio-finto';

const organo = async (page: import('@playwright/test').Page) => (await registro(page)).suoni.filter((s) => s.onda === 'custom');

test('gli esempi del Capitolo: unisono, ottava e quinta, con l\'organo e senza file audio', async ({ page }) => {
  const richieste: string[] = [];
  page.on('request', (r) => {
    if (/\.(m4a|ogg|mp3|wav)$/.test(r.url())) richieste.push(r.url());
  });
  await installaAudioFinto(page, { velocita: 1 });
  await page.goto('it/capitoli/battimenti/');
  const pulsanti = page.locator('.battimenti').getByRole('button', { name: "Ascolta l'esempio" });
  await expect(pulsanti).toHaveCount(3);

  await pulsanti.nth(0).click();
  await expect(pulsanti.nth(0)).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(async () => (await organo(page)).map((s) => s.frequenza)).toEqual([220, 220]);

  // Un esempio ferma l'altro: l'ottava arriva a 440 Hz, la quinta a 330.
  await pulsanti.nth(1).click();
  await expect(pulsanti.nth(0)).toHaveAttribute('aria-pressed', 'false');
  await expect(pulsanti.nth(1)).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(async () => (await organo(page)).slice(2).map((s) => s.frequenza)).toEqual([220, 440]);
  await pulsanti.nth(2).click();
  await expect.poll(async () => (await organo(page)).slice(4).map((s) => s.frequenza)).toEqual([220, 330]);

  // Un secondo tocco ferma l'esempio.
  await pulsanti.nth(2).click();
  await expect(pulsanti.nth(2)).toHaveAttribute('aria-pressed', 'false');
  const r = await registro(page);
  expect((await organo(page)).every((s) => s.fine !== undefined && s.fine <= r.adesso + 0.1)).toBe(true);
  expect(richieste).toEqual([]);
});

test('"Trova l\'unisono": si sceglie la voce, il sito tiene la nota finché non si ferma', async ({ page }) => {
  await installaAudioFinto(page);
  await page.goto('it/capitoli/battimenti/esercizi/?seed=3');
  const esercizio = page.getByRole('region', { name: "Trova l'unisono" });
  await expect(esercizio.getByRole('button', { name: 'Tieni la nota' })).toHaveCount(0);

  await esercizio.getByRole('button', { name: 'contralto' }).click();
  await expect(esercizio.getByText('La nota: Do4')).toBeVisible();
  await esercizio.getByRole('button', { name: 'Tieni la nota' }).click();
  await expect(esercizio.getByRole('button', { name: 'Ferma la nota' })).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(async () => (await organo(page)).map((s) => Math.round(s.frequenza!))).toEqual([262]);
  // La nota tenuta non finisce da sola.
  await page.waitForTimeout(500);
  expect((await organo(page))[0]!.fine).toBeUndefined();
  await expect(esercizio.getByRole('slider', { name: 'Volume della nota' })).toBeVisible();

  await esercizio.getByRole('button', { name: 'Ferma la nota' }).click();
  await expect(esercizio.getByRole('button', { name: 'Tieni la nota' })).toHaveAttribute('aria-pressed', 'false');
  expect((await organo(page))[0]!.fine).toBeDefined();

  // Il basso parte dal Fa3; l'esempio è la nota tenuta più una voce che scivola e torna all'unisono.
  await esercizio.getByRole('button', { name: 'basso' }).click();
  await expect(esercizio.getByText('La nota: Fa3')).toBeVisible();
  await esercizio.getByRole('button', { name: "Ascolta l'esempio" }).click();
  await expect.poll(async () => (await organo(page)).slice(1).map((s) => Math.round(s.frequenza!))).toEqual([175, 175]);
});

test('"Trova l\'unisono" non ha una Serie: niente avanzamento né risposte', async ({ page }) => {
  await page.goto('it/capitoli/battimenti/esercizi/');
  await expect(page.getByRole('progressbar')).toHaveCount(0);
  await expect(page.getByRole('group', { name: 'Risposta' })).toHaveCount(0);
});

test('in inglese, finché manca la traduzione, il Capitolo mostra il testo italiano con l\'avviso e gli esempi', async ({ page }) => {
  await page.goto('en/capitoli/battimenti/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Beating');
  await expect(page.getByText('This chapter has not been translated yet, so it is shown in Italian.')).toBeVisible();
  await expect(page.locator('.battimenti').getByRole('button', { name: 'Listen to the example' })).toHaveCount(3);
});

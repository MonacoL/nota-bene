// Esercizi pratici di ascolto (#86): Serie di riconoscimento che contano per il Capitolo completato, il battito di mani
// sintetizzato, i pallini e "Batti la pulsazione", con l'AudioContext finto (audio-finto.ts). Niente microfono.
// Con ?seed=s l'Esercizio n della Serie usa il seed s + n; cambiare scheda fa avanzare i seed di 10.
import { expect, test, type Page } from '@playwright/test';
import { genera, metrica } from '../../src/esercizi';
import { installaAudioFinto, registro } from './audio-finto';

const PULSAZIONE = 'pulsazione-e-suddivisione';
const TEMPI = 'tempi-semplici-e-composti';
const tastierino = (page: Page) => page.getByRole('group', { name: 'Risposta' });
const foglio = (page: Page) => page.getByRole('region', { name: 'Riscontro' });
const ascolta = (page: Page) => page.getByRole('button', { name: 'Ascolta', exact: true });

test('le schede mostrano l\'Importanza, con le colonnine e la parola', async ({ page }) => {
  await page.goto(`it/capitoli/${PULSAZIONE}/esercizi/`);
  await expect(page.getByRole('tab')).toHaveText([/Semplice o composto\?\s*essenziale/, /Batti la pulsazione\s*approfondimento/]);
  await expect(page.getByRole('tab').first().locator('rect.accesa')).toHaveCount(3);
  await expect(page.getByRole('tab').nth(1).locator('rect.accesa')).toHaveCount(1);
});

test('"Semplice o composto?": il battito di mani suona, e dieci risposte giuste completano il Capitolo', async ({ page }) => {
  await installaAudioFinto(page, { velocita: 10 });
  await page.goto(`it/capitoli/${PULSAZIONE}/esercizi/?seed=40`);
  await ascolta(page).click();
  const es0 = genera('semplice-o-composto', { importanza: 3 }, 40);
  // I battiti sono rumore filtrato: suoni senza campione del pianoforte, uno per colpo.
  await expect.poll(async () => (await registro(page)).suoni.length).toBe(es0.battiti.length);
  for (let n = 0; n < 10; n++) {
    const es = genera('semplice-o-composto', { importanza: 3 }, 40 + n);
    await tastierino(page).getByRole('button', { name: es.genere, exact: true }).click();
    await expect(foglio(page)).toContainText('✓ Giusto');
    await foglio(page).getByRole('button', { name: 'Avanti →' }).click();
  }
  await expect(page.getByText('✓ Questa serie conta: il capitolo è completato.')).toBeVisible();
});

test('"I pallini": un pallino grande per pulsazione, e si accendono mentre suona il brano', async ({ page }) => {
  await installaAudioFinto(page, { velocita: 2 });
  await page.goto(`it/capitoli/${TEMPI}/esercizi/?seed=7`);
  const es = genera('pallini', { importanza: 3 }, 7);
  const m = metrica(es.brano.indicazione);
  const pallini = page.locator('.esercizio .pallino');
  await expect(pallini).toHaveCount(m.pulsazioni * (m.genere === 'semplice' ? 2 : 3));
  await expect(page.locator('.esercizio .pallino.grande')).toHaveCount(m.pulsazioni);
  await ascolta(page).click();
  await expect(page.locator('.esercizio .pallino.acceso')).toHaveCount(1, { timeout: 10_000 });
  await tastierino(page).getByRole('button', { name: m.numero, exact: true }).click();
  await tastierino(page).getByRole('button', { name: m.genere, exact: true }).click();
  await tastierino(page).getByRole('button', { name: 'Verifica' }).click();
  await expect(foglio(page)).toContainText('✓ Giusto');
  await expect(foglio(page)).toContainText('pallini grandi');
});

test('"Semplice o composto all\'ascolto": il riscontro dice l\'indicazione metrica del brano', async ({ page }) => {
  await page.goto(`it/capitoli/${TEMPI}/esercizi/?seed=20`);
  await page.getByRole('tab', { name: /all'ascolto/ }).click();
  const es = genera('semplice-o-composto-ascolto', { importanza: 3 }, 30);
  await expect(page.locator('.esercizio .pentagramma')).toHaveCount(0);
  await tastierino(page).getByRole('button', { name: metrica(es.brano.indicazione).genere, exact: true }).click();
  await expect(foglio(page)).toContainText(`Il brano era in ${es.brano.indicazione}`);
});

test('"Batti la pulsazione": i tocchi e la barra spaziatrice si registrano, e alla fine c\'è il riepilogo', async ({ page }) => {
  await installaAudioFinto(page, { velocita: 4 });
  await page.goto(`it/capitoli/${PULSAZIONE}/esercizi/`);
  await page.getByRole('tab', { name: /Batti la pulsazione/ }).click();
  await page.getByRole('button', { name: 'Ascolta e batti' }).click();
  const batti = page.getByRole('button', { name: 'Batti', exact: true });
  await expect(batti).toBeVisible();
  // Si aspetta che il brano parta (i campioni finti arrivano subito), poi si batte due volte.
  await expect.poll(async () => (await registro(page)).suoni.length).toBeGreaterThan(0);
  await batti.dispatchEvent('pointerdown');
  await page.keyboard.press('Space');
  await expect(page.locator('.batti .esito')).not.toBeEmpty();
  await page.getByRole('button', { name: 'Ferma' }).click();
  await expect(page.getByText(/^\d+ battiti in tempo su \d+ pulsazioni$/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Un altro brano' })).toBeVisible();
});

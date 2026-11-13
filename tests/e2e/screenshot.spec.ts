// Screenshot di confronto, sulle configurazioni scelte in playwright.config.ts. Un tema solo (ADR-0010): il telefono
// è in tema chiaro, e il sito deve restare scuro lo stesso.
import { expect, test } from '@playwright/test';
import { genera } from '../../src/esercizi';
import { CAPITOLI, LETTURE, LINGUE } from './pagine';
import { telefono } from './menu';

/** Un seed il cui primo Esercizio è un Sol♭3 in chiave di violino ottava bassa: mostra l'8 e un'alterazione. */
const SEED_FOGLIO = 13;

const TEMI = ['light'] as const;

const SCHERMATE = [
  { nome: 'home', percorso: '' },
  { nome: 'capitoli', percorso: 'capitoli/' },
  { nome: 'capitolo-1', percorso: `capitoli/${CAPITOLI[0]}/` },
];

for (const { nome, percorso } of SCHERMATE) {
  for (const lingua of LINGUE) {
    for (const tema of TEMI) {
      test(`${nome} ${lingua}`, async ({ page }, info) => {
        const scelta = info.project.metadata.screenshot as 'it' | 'it+en' | undefined;
        test.skip(!scelta || (lingua === 'en' && scelta !== 'it+en'), 'niente screenshot su questa configurazione');
        await page.emulateMedia({ colorScheme: tema, reducedMotion: 'reduce' });
        await page.goto(`${lingua}/${percorso}`);
        await page.evaluate(() => document.fonts.ready);
        // Gli esempi abc si disegnano dopo il caricamento: si aspetta che ogni contenitore abbia il suo SVG.
        await expect(page.locator('.pentagramma:not(:has(svg))')).toHaveCount(0);
        await page.mouse.move(-1, -1);
        await expect(page).toHaveScreenshot(`${nome}-${lingua}.png`, { fullPage: true });
      });
    }
  }
}

// Il foglio di riscontro, giusto e sbagliato, sul primo Esercizio del Capitolo 2 con seed fisso.
// Lo screenshot è della finestra e non della pagina intera, perché il foglio è fisso in basso.
for (const esito of ['giusto', 'sbagliato'] as const) {
  for (const lingua of LINGUE) {
    for (const tema of TEMI) {
      test(`esercizi foglio ${esito} ${lingua}`, async ({ page }, info) => {
        const scelta = info.project.metadata.screenshot as 'it' | 'it+en' | undefined;
        test.skip(!scelta || (lingua === 'en' && scelta !== 'it+en'), 'niente screenshot su questa configurazione');
        const { nota } = genera('nomina-la-nota', { chiavi: ['violino', 'violino-ottava-bassa', 'basso'] }, SEED_FOGLIO);
        const risposta = esito === 'giusto' ? nota : { lettera: nota.lettera === 'C' ? 'D' : 'C', alterazione: 0 };
        await page.emulateMedia({ colorScheme: tema, reducedMotion: 'reduce' });
        await page.goto(`${lingua}/capitoli/${CAPITOLI[1]}/esercizi/?seed=${SEED_FOGLIO}`);
        await page.evaluate(() => document.fonts.ready);
        await expect(page.locator('.esercizio .pentagramma svg')).toHaveCount(1);
        const tastierino = page.locator('.tastierino');
        await tastierino.locator('.alterazioni button').nth(risposta.alterazione + 1).click();
        await tastierino.locator('.nomi button').nth('CDEFGAB'.indexOf(risposta.lettera)).click();
        await tastierino.locator('.verifica').click();
        await expect(page.locator('.foglio')).toBeVisible();
        await page.mouse.move(-1, -1);
        await expect(page).toHaveScreenshot(`esercizi-foglio-${esito}-${lingua}.png`);
      });
    }
  }
}

// Il menu con le lineette aperto, sul telefono: screenshot della finestra, perché il pannello copre la pagina.
for (const lingua of LINGUE) {
  for (const tema of TEMI) {
    test(`menu aperto ${lingua}`, async ({ page }, info) => {
      const scelta = info.project.metadata.screenshot as 'it' | 'it+en' | undefined;
      test.skip(!scelta || (lingua === 'en' && scelta !== 'it+en'), 'niente screenshot su questa configurazione');
      test.skip(!telefono(page), 'da 440 px il menu è fatto di link');
      await page.emulateMedia({ colorScheme: tema, reducedMotion: 'reduce' });
      await page.goto(`${lingua}/`);
      await page.evaluate(() => document.fonts.ready);
      await page.locator('header .menu summary').click();
      await page.mouse.move(-1, -1);
      await expect(page).toHaveScreenshot(`menu-aperto-${lingua}.png`);
    });
  }
}

// "Riconosci l'intervallo" a 360 px, con numero e qualità scelti: il tastierino a due righe deve stare nello schermo.
for (const tema of TEMI) {
  test(`esercizi intervalli it`, async ({ page }, info) => {
    test.skip(info.project.name !== 'phone-360-chromium', 'solo a 360 px');
    await page.emulateMedia({ colorScheme: tema, reducedMotion: 'reduce' });
    await page.goto(`it/capitoli/${CAPITOLI[7]}/esercizi/?seed=${SEED_FOGLIO}`);
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator('.esercizio .pentagramma svg')).toHaveCount(1);
    const tastierino = page.getByRole('group', { name: 'Risposta' });
    await tastierino.getByRole('button', { name: '3ª', exact: true }).click();
    await tastierino.getByRole('button', { name: 'maggiore', exact: true }).click();
    await page.mouse.move(-1, -1);
    await expect(page).toHaveScreenshot(`esercizi-intervalli-it.png`);
  });
}

// La prima Lettura vera, con e senza Soluzione, a pagina intera: la barra dei comandi sul telefono resta in basso.
for (const soluzione of [false, true]) {
  for (const lingua of LINGUE) {
    for (const tema of TEMI) {
      const nome = `lettura${soluzione ? '-soluzione' : ''}-${lingua}`;
      test(`${nome}`, async ({ page }, info) => {
        const scelta = info.project.metadata.screenshot as 'it' | 'it+en' | undefined;
        test.skip(!scelta || (lingua === 'en' && scelta !== 'it+en'), 'niente screenshot su questa configurazione');
        await page.emulateMedia({ colorScheme: tema, reducedMotion: 'reduce' });
        await page.goto(`${lingua}/letture/${LETTURE[0]}/`);
        await page.evaluate(() => document.fonts.ready);
        await expect(page.locator('.partitura svg')).toHaveCount(1);
        if (soluzione) await page.locator('.comandi button.mostra').click();
        await page.mouse.move(-1, -1);
        await expect(page).toHaveScreenshot(`${nome}.png`, { fullPage: true });
      });
    }
  }
}

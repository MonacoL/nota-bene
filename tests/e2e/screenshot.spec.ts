// Screenshot di confronto nei due temi (ADR-0009), sulle configurazioni scelte in playwright.config.ts.
import { expect, test } from '@playwright/test';
import { CAPITOLI, LINGUE } from './pagine';

const SCHERMATE = [
  { nome: 'home', percorso: '' },
  { nome: 'capitolo-1', percorso: `capitoli/${CAPITOLI[0]}/` },
];

for (const { nome, percorso } of SCHERMATE) {
  for (const lingua of LINGUE) {
    for (const tema of ['light', 'dark'] as const) {
      test(`${nome} ${lingua}, tema ${tema}`, async ({ page }, info) => {
        const scelta = info.project.metadata.screenshot as 'it' | 'it+en' | undefined;
        test.skip(!scelta || (lingua === 'en' && scelta !== 'it+en'), 'niente screenshot su questa configurazione');
        await page.emulateMedia({ colorScheme: tema, reducedMotion: 'reduce' });
        await page.goto(`${lingua}/${percorso}`);
        await page.evaluate(() => document.fonts.ready);
        // Gli esempi abc si disegnano dopo il caricamento: si aspetta che ogni contenitore abbia il suo SVG.
        await expect(page.locator('.pentagramma:not(:has(svg))')).toHaveCount(0);
        await page.mouse.move(-1, -1);
        await expect(page).toHaveScreenshot(`${nome}-${lingua}-${tema}.png`, { fullPage: true });
      });
    }
  }
}

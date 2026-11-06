// Screenshot di confronto della home nei due temi (ADR-0009), sulle configurazioni scelte in playwright.config.ts.
import { expect, test } from '@playwright/test';
import { LINGUE } from './pagine';

for (const lingua of LINGUE) {
  for (const tema of ['light', 'dark'] as const) {
    test(`home ${lingua}, tema ${tema}`, async ({ page }, info) => {
      const scelta = info.project.metadata.screenshot as 'it' | 'it+en' | undefined;
      test.skip(!scelta || (lingua === 'en' && scelta !== 'it+en'), 'niente screenshot su questa configurazione');
      await page.emulateMedia({ colorScheme: tema, reducedMotion: 'reduce' });
      await page.goto(`${lingua}/`);
      await page.evaluate(() => document.fonts.ready);
      await page.mouse.move(-1, -1);
      await expect(page).toHaveScreenshot(`home-${lingua}-${tema}.png`, { fullPage: true });
    });
  }
}

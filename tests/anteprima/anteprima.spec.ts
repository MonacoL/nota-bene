// Screenshot per la revisione di una PR (ticket #34): ogni Lettura nuova o modificata a 360 px, con la Soluzione
// visibile, da confrontare con il PDF della Fonte. Le Letture arrivano in ANTEPRIMA_LETTURE, una per riga.
// Non è un test di regressione: le immagini vanno in anteprime/ e la CI le allega alla PR.
import { expect, test } from '@playwright/test';

const letture = (process.env.ANTEPRIMA_LETTURE ?? '').split('\n').map((r) => r.trim()).filter(Boolean);

test.skip(!letture.length, 'nessuna Lettura in ANTEPRIMA_LETTURE');

for (const id of letture) {
  test(id, async ({ page }) => {
    await page.goto(`it/letture/${id}/`);
    await expect(page.locator('.partitura svg')).toHaveCount(1);
    await page.getByRole('button', { name: 'Mostra la soluzione' }).click();
    await expect(page.locator('.partitura .sillaba').first()).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    // Nella pagina intera la barra fissa dei comandi coprirebbe l'attribuzione, che fa parte della checklist.
    await page.evaluate(() => {
      for (const el of document.querySelectorAll<HTMLElement>('body *')) {
        if (getComputedStyle(el).position === 'fixed') el.style.position = 'static';
      }
    });
    await page.screenshot({ path: `anteprime/${id.replace('/', '--')}.png`, fullPage: true });
  });
}

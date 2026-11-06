// PROTOTIPO: scatta l'intestazione di ogni variante in chiaro/scuro, telefono 360 px e desktop.
// Uso: npm run build && npx astro preview & ; poi nel container Playwright: node prototypes/segno/scatta.mjs
import { chromium } from '@playwright/test';
const browser = await chromium.launch();
for (const [nome, viewport] of [['telefono', { width: 360, height: 200 }], ['stretto', { width: 320, height: 200 }], ['desktop', { width: 1280, height: 160 }]]) {
  for (const tema of ['light', 'dark']) {
    for (const lingua of ['it', 'en']) {
      if (nome !== 'telefono' && lingua === (nome === 'stretto' ? 'it' : 'en')) continue;
      const page = await browser.newPage({ viewport, colorScheme: tema, deviceScaleFactor: 2 });
      for (const v of ['A', 'B', 'C', 'D', 'E']) {
        await page.goto(`http://127.0.0.1:4321/nota-bene/${lingua}/?variant=${v}&nobar`);
        await page.evaluate(() => document.fonts.ready);
        await page.locator('header').screenshot({ path: `prototypes/segno/screenshots/${v}-${nome}-${lingua}-${tema}.png` });
      }
      await page.close();
    }
  }
}
await browser.close();

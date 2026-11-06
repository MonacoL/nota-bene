// Monta le schermate in una griglia: una riga per variante; colonne = telefono IT chiaro, telefono EN scuro, desktop chiaro.
import { chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';
const dir = 'prototypes/segno/screenshots/';
const img = (f) => `data:image/png;base64,${readFileSync(dir + f).toString('base64')}`;
const righe = ['A', 'B', 'C', 'D', 'E'].map((v) => `<tr><th>${v}</th>
 <td><img src="${img(`${v}-telefono-it-light.png`)}" width="360"></td>
 <td><img src="${img(`${v}-telefono-en-dark.png`)}" width="360"></td>
 <td><img src="${img(`${v}-stretto-en-light.png`)}" width="320"></td></tr>`).join('');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1180, height: 400 }, deviceScaleFactor: 1.5 });
await page.setContent(`<style>body{margin:8px;font:16px sans-serif;background:#888}td{padding:3px}th{padding:0 8px;font-size:22px}</style><table>${righe}</table>`);
await page.screenshot({ path: dir + 'griglia.png', fullPage: true });
await browser.close();

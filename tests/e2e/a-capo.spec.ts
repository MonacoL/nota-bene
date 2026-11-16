// A capo responsive della Lettura (ticket #30): il massimo di Battute per rigo senza che i segni delle righe w:
// (frammenti di Testo e Sillabe della Soluzione) si tocchino, tutti i righi a larghezza piena, a capo rifatti a ogni
// cambio di larghezza e fermi quando si mostra la Soluzione.
import { expect, test, type Page } from '@playwright/test';
import { apri, fuoriDalBordo, rigoDiOgniNota, scorreInOrizzontale, segniCheSiToccano } from './abcjs';
import { LETTURE } from './pagine';

const LETTURA = 'it/letture/if-ye-love-me/soprano-1-7/';

const SILLABE = '.abcjs-lyric tspan';

/** Apre una Lettura: la sua .partitura nasce nel browser, una sola. */
const apriLettura = (page: Page, percorso = LETTURA) => apri(page, percorso, '.partitura', 1);
const partitura = (page: Page) => page.locator('.partitura');

/** Per ogni rigo disegnato, quanto resta dal bordo destro della partitura, dentro il margine del foglio (ADR-0010), la sua ultima stanghetta. */
function righi(page: Page) {
  return page.locator('.lettura').evaluate((lettura) => {
    const foglio = lettura.querySelector('.partitura')!;
    const destra = foglio.getBoundingClientRect().right - parseFloat(getComputedStyle(foglio).paddingRight);
    const rigo = (e: Element) => Number(/abcjs-l(\d+)/.exec(e.getAttribute('class') ?? '')?.[1]);
    const quanti = 1 + Math.max(...[...lettura.querySelectorAll('.partitura .abcjs-note')].map(rigo));
    return Array.from({ length: quanti }, (_, n) => {
      const stanghette = [...lettura.querySelectorAll(`.partitura .abcjs-bar.abcjs-l${n}`)];
      const ultima = Math.max(...stanghette.map((s) => s.getBoundingClientRect().right));
      return { margine: destra - ultima };
    });
  });
}

for (const id of LETTURE) {
  test(`${id}: a 360 px nessun segno ne tocca un altro, niente esce dal bordo e la pagina non scorre di lato`, async ({ page }, info) => {
    test.skip(!info.project.name.startsWith('phone-360'), 'si controlla a 360 px, su Chromium e Firefox');
    await apriLettura(page, `it/letture/${id}/`);
    await page.getByRole('button', { name: 'Mostra la soluzione' }).click();
    expect(await segniCheSiToccano(partitura(page), SILLABE)).toEqual([]);
    expect(await fuoriDalBordo(partitura(page))).toEqual([]);
    expect(await scorreInOrizzontale(page), 'la pagina scorre in orizzontale').toBe(false);
  });
}

test('tutti i righi, anche l’ultimo, occupano la larghezza intera', async ({ page }) => {
  await apriLettura(page);
  for (const { margine } of await righi(page)) expect(Math.abs(margine), 'il rigo non arriva al bordo').toBeLessThanOrEqual(2);
  expect(await segniCheSiToccano(partitura(page), SILLABE)).toEqual([]);
});

test("l'a capo si rifà quando cambia la larghezza", async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop-chromium', 'basta un motore: si cambia la finestra a mano');
  await apriLettura(page);
  const largo = (await righi(page)).length;
  await page.setViewportSize({ width: 360, height: 740 });
  await expect.poll(async () => (await righi(page)).length).toBeGreaterThan(largo);
  for (const { margine } of await righi(page)) expect(Math.abs(margine)).toBeLessThanOrEqual(2);
  expect(await segniCheSiToccano(partitura(page), SILLABE)).toEqual([]);
});

test('mostrare la soluzione non sposta gli a capo', async ({ page }) => {
  await apriLettura(page);
  const prima = await rigoDiOgniNota(partitura(page));
  await page.getByRole('button', { name: 'Mostra la soluzione' }).click();
  expect(await rigoDiOgniNota(partitura(page))).toEqual(prima);
});

// Lo zoom del browser rimpicciolisce la finestra in px CSS: al 200% un desktop da 1280 px ne ha 640, al 400% 320.
for (const larghezza of [320, 640]) {
  test(`con lo zoom del browser (${larghezza} px CSS) la pagina regge`, async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop-chromium', 'basta un motore: si simula lo zoom con la larghezza');
    await page.setViewportSize({ width: larghezza, height: 800 });
    await apriLettura(page);
    expect(await scorreInOrizzontale(page), 'la pagina scorre in orizzontale').toBe(false);
    expect(await fuoriDalBordo(partitura(page))).toEqual([]);
    expect(await segniCheSiToccano(partitura(page), SILLABE)).toEqual([]);
  });
}

test('il sito non blocca lo zoom del browser', async ({ page }) => {
  await apriLettura(page);
  const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
  expect(viewport).not.toMatch(/user-scalable\s*=\s*(no|0)|maximum-scale/);
});

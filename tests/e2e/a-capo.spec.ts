// A capo responsive della Lettura (ticket #30): il massimo di Battute per rigo senza che i segni delle righe w:
// (frammenti di Testo e Sillabe della Soluzione) si tocchino, tutti i righi a larghezza piena, a capo rifatti a ogni
// cambio di larghezza e fermi quando si mostra la Soluzione.
import { expect, test, type Page } from '@playwright/test';
import { apri as apriPagina, fuoriDalBordo, rigoDiOgniNota, scorreInOrizzontale, segniCheSiToccano } from './abcjs';
import { LETTURE } from './pagine';

const LETTURA = 'it/letture/if-ye-love-me/soprano-1-7/';

const apri = (page: Page, percorso = LETTURA) => apriPagina(page, percorso, '.partitura', 1);
const sillabeCheSiToccano = (page: Page) => segniCheSiToccano(page.locator('.partitura'), '.abcjs-lyric tspan');
const fuori = (page: Page) => fuoriDalBordo(page.locator('.partitura'));
const rigoDelleNote = (page: Page) => rigoDiOgniNota(page.locator('.partitura'));

/** Per ogni rigo disegnato, quanto resta dal bordo destro della partitura la sua ultima stanghetta. */
function righi(page: Page) {
  return page.locator('.lettura').evaluate((lettura) => {
    const destra = lettura.getBoundingClientRect().right;
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
    await apri(page, `it/letture/${id}/`);
    await page.getByRole('button', { name: 'Mostra la soluzione' }).click();
    expect(await sillabeCheSiToccano(page)).toEqual([]);
    expect(await fuori(page)).toEqual([]);
    expect(await scorreInOrizzontale(page), 'la pagina scorre in orizzontale').toBe(false);
  });
}

test('tutti i righi, anche l’ultimo, occupano la larghezza intera', async ({ page }) => {
  await apri(page);
  for (const { margine } of await righi(page)) expect(Math.abs(margine), 'il rigo non arriva al bordo').toBeLessThanOrEqual(2);
  expect(await sillabeCheSiToccano(page)).toEqual([]);
});

test("l'a capo si rifà quando cambia la larghezza", async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop-chromium', 'basta un motore: si cambia la finestra a mano');
  await apri(page);
  const largo = (await righi(page)).length;
  await page.setViewportSize({ width: 360, height: 740 });
  await expect.poll(async () => (await righi(page)).length).toBeGreaterThan(largo);
  for (const { margine } of await righi(page)) expect(Math.abs(margine)).toBeLessThanOrEqual(2);
  expect(await sillabeCheSiToccano(page)).toEqual([]);
});

test('mostrare la soluzione non sposta gli a capo', async ({ page }) => {
  await apri(page);
  const prima = await rigoDelleNote(page);
  await page.getByRole('button', { name: 'Mostra la soluzione' }).click();
  expect(await rigoDelleNote(page)).toEqual(prima);
});

// Lo zoom del browser rimpicciolisce la finestra in px CSS: al 200% un desktop da 1280 px ne ha 640, al 400% 320.
for (const larghezza of [320, 640]) {
  test(`con lo zoom del browser (${larghezza} px CSS) la pagina regge`, async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop-chromium', 'basta un motore: si simula lo zoom con la larghezza');
    await page.setViewportSize({ width: larghezza, height: 800 });
    await apri(page);
    expect(await scorreInOrizzontale(page), 'la pagina scorre in orizzontale').toBe(false);
    expect(await fuori(page)).toEqual([]);
    expect(await sillabeCheSiToccano(page)).toEqual([]);
  });
}

test('il sito non blocca lo zoom del browser', async ({ page }) => {
  await apri(page);
  const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
  expect(viewport).not.toMatch(/user-scalable\s*=\s*(no|0)|maximum-scale/);
});

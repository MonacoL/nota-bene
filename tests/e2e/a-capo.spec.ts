// A capo responsive della Lettura (ticket #30): il massimo di Battute per rigo senza che le sillabe si tocchino,
// tutti i righi a larghezza piena, a capo rifatti a ogni cambio di larghezza e fermi quando si mostra la Soluzione.
import { expect, test, type Page } from '@playwright/test';
import { LETTURE } from './pagine';

const LETTURA = 'it/letture/if-ye-love-me/soprano-1-7/';

async function apri(page: Page, percorso = LETTURA) {
  await page.goto(percorso);
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator('.partitura svg')).toHaveCount(1);
}

/** Le coppie di sillabe vicine, sulla stessa riga, che si toccano o si sovrappongono: "sinistra | destra". */
function sillabeCheSiToccano(page: Page): Promise<string[]> {
  return page.locator('.partitura').evaluate((partitura) => {
    const scatole = [...partitura.querySelectorAll('.abcjs-lyric tspan')]
      .filter((t) => t.textContent?.trim())
      .map((t) => ({ r: t.getBoundingClientRect(), testo: t.textContent!.trim() }));
    const urti: string[] = [];
    for (const a of scatole) {
      for (const b of scatole) {
        const stessaRiga = Math.abs(a.r.top - b.r.top) < 2;
        if (a !== b && stessaRiga && a.r.left <= b.r.left && b.r.left < a.r.right + 1) urti.push(`${a.testo} | ${b.testo}`);
      }
    }
    return urti;
  });
}

/** Per ogni rigo disegnato, quanto restano dal bordo destro della partitura la sua ultima stanghetta e ogni sillaba. */
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

/** Il rigo di ogni nota, in ordine: due a capo uguali danno la stessa lista. */
function rigoDiOgniNota(page: Page) {
  return page.locator('.partitura .abcjs-note').evaluateAll((note) =>
    note.map((n) => /abcjs-l(\d+)/.exec(n.getAttribute('class') ?? '')?.[1]),
  );
}

for (const id of LETTURE) {
  test(`${id}: a 360 px nessuna coppia di sillabe vicine si tocca`, async ({ page }, info) => {
    test.skip(!info.project.name.startsWith('phone-360'), 'si controlla a 360 px, su Chromium e Firefox');
    await apri(page, `it/letture/${id}/`);
    await page.getByRole('button', { name: 'Mostra la soluzione' }).click();
    expect(await sillabeCheSiToccano(page)).toEqual([]);
    for (const { margine } of await righi(page)) expect(margine, 'il rigo esce dal bordo').toBeGreaterThanOrEqual(-1);
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
  const prima = await rigoDiOgniNota(page);
  await page.getByRole('button', { name: 'Mostra la soluzione' }).click();
  expect(await rigoDiOgniNota(page)).toEqual(prima);
});

// Lo zoom del browser rimpicciolisce la finestra in px CSS: al 200% un desktop da 1280 px ne ha 640, al 400% 320.
for (const larghezza of [320, 640]) {
  test(`con lo zoom del browser (${larghezza} px CSS) la pagina regge`, async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop-chromium', 'basta un motore: si simula lo zoom con la larghezza');
    await page.setViewportSize({ width: larghezza, height: 800 });
    await apri(page);
    const { scorre, finestra } = await page.evaluate(() => ({ scorre: document.documentElement.scrollWidth, finestra: window.innerWidth }));
    expect(scorre, 'la pagina scorre in orizzontale').toBeLessThanOrEqual(finestra);
    expect(await sillabeCheSiToccano(page)).toEqual([]);
  });
}

test('il sito non blocca lo zoom del browser', async ({ page }) => {
  await apri(page);
  const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
  expect(viewport).not.toMatch(/user-scalable\s*=\s*(no|0)|maximum-scale/);
});

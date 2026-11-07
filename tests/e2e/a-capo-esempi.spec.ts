// A capo automatico degli esempi dei Capitoli (ticket #63): su qualunque schermo un esempio prende la larghezza
// disponibile, quante più Battute possibile per rigo, e non viene mai tagliato; il calcolo si rifà a ogni cambio di
// larghezza.
import { expect, test, type Page } from '@playwright/test';
import { CAPITOLI, LINGUE } from './pagine';

/** Gli esempi della pagina il cui disegno esce dall'SVG: quale esempio e di quanto, in unità della viewBox. */
function tagliati(page: Page): Promise<string[]> {
  return page.locator('.pentagramma svg').evaluateAll((svg) =>
    (svg as SVGSVGElement[]).flatMap((s, i) => {
      const vista = s.viewBox.baseVal;
      const larghezza = vista?.width || s.width.baseVal.value;
      const altezza = vista?.height || s.height.baseVal.value;
      const x0 = vista?.x ?? 0;
      const y0 = vista?.y ?? 0;
      const b = s.getBBox();
      const fuori = [
        b.x < x0 - 1 && `a sinistra di ${x0 - b.x}`,
        b.x + b.width > x0 + larghezza + 1 && `a destra di ${b.x + b.width - x0 - larghezza}`,
        b.y < y0 - 1 && `in alto di ${y0 - b.y}`,
        b.y + b.height > y0 + altezza + 1 && `in basso di ${b.y + b.height - y0 - altezza}`,
      ].filter(Boolean);
      return fuori.length ? [`esempio ${i + 1}: ${fuori.join(', ')}`] : [];
    }),
  );
}

/** Quanti righi ha l'esempio numero `i` (da 0) della pagina. */
function righiDi(page: Page, i: number): Promise<number> {
  return page.locator('.pentagramma').nth(i).evaluate((p) => {
    const righi = new Set([...p.querySelectorAll('.abcjs-note')].map((n) => /abcjs-l(\d+)/.exec(n.getAttribute('class') ?? '')?.[1]));
    return righi.size;
  });
}

async function apri(page: Page, percorso: string) {
  await page.goto(percorso);
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator('.pentagramma svg').first()).toBeVisible();
}

for (const lingua of LINGUE) {
  for (const capitolo of CAPITOLI) {
    test(`${lingua}/${capitolo}: a 360 px nessun esempio esce dal suo SVG`, async ({ page }, info) => {
      test.skip(!info.project.name.startsWith('phone-360'), 'si controlla a 360 px, su Chromium e Firefox');
      await apri(page, `${lingua}/capitoli/${capitolo}/`);
      expect(await tagliati(page)).toEqual([]);
    });
  }
}

test('un esempio che ci sta resta su un rigo, uno diviso a mano si ricompone, e a ogni larghezza si rifà il calcolo', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop-chromium', 'basta un motore: si cambia la finestra a mano');
  // Figure e pause, primo esempio: cinque Battute fino alle semicrome, scritte a mano su tre righi.
  await apri(page, 'it/capitoli/figure-e-pause/');
  expect(await righiDi(page, 0)).toBeLessThan(3);

  // DO mobile, primo esempio: due Battute con otto Sillabe, su un rigo se c'è posto, su due a 360 px.
  await apri(page, 'it/capitoli/do-mobile/');
  expect(await righiDi(page, 0)).toBe(1);

  await page.setViewportSize({ width: 360, height: 740 });
  await expect.poll(() => righiDi(page, 0)).toBe(2);
  expect(await tagliati(page)).toEqual([]);

  await page.setViewportSize({ width: 1280, height: 720 });
  await expect.poll(() => righiDi(page, 0)).toBe(1);
});

import { expect, test, type Page } from '@playwright/test';
import { LINGUE, PAGINE } from './pagine';

async function nessunoScrollOrizzontale(page: Page) {
  const { scrollWidth, innerWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));
  expect(scrollWidth, 'la pagina scorre in orizzontale').toBeLessThanOrEqual(innerWidth);
}

test('la radice porta sempre a /it/', async ({ page }) => {
  await page.goto('./');
  await expect(page).toHaveURL(/\/nota-bene\/it\/$/);
});

for (const percorso of [...PAGINE, 'questa-pagina-non-esiste/']) {
  test(`${percorso}: niente scroll orizzontale`, async ({ page }) => {
    await page.goto(percorso);
    await page.evaluate(() => document.fonts.ready);
    await nessunoScrollOrizzontale(page);
  });
}

for (const percorso of PAGINE) {
  test(`${percorso}: intestazione su una riga sola`, async ({ page }) => {
    await page.goto(percorso);
    await page.evaluate(() => document.fonts.ready);
    const header = page.locator('header');
    const scatole = await Promise.all(
      [header.locator('.marchio'), header.locator('nav').first(), header.locator('.lingua')].map((l) => l.boundingBox()),
    );
    const centri = scatole.map((b) => b!.y + b!.height / 2);
    expect(Math.max(...centri) - Math.min(...centri), "un elemento dell'intestazione è andato a capo").toBeLessThan(4);
  });
}

for (const lingua of LINGUE) {
  test(`${lingua}: intestazione e piè di pagina`, async ({ page }) => {
    await page.goto(`${lingua}/privacy/`);
    const intestazione = page.locator('header');
    await expect(intestazione.getByRole('link', { name: 'Nota Bene' })).toHaveAttribute('href', `/nota-bene/${lingua}/`);
    await expect(intestazione.getByRole('link', { name: lingua === 'it' ? 'Letture' : 'Readings' })).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', lingua);
    const piede = page.locator('footer');
    await expect(piede).toContainText('MIT');
    await expect(piede).toContainText('CC BY-SA 4.0');
    await expect(piede.getByRole('link')).toHaveCount(4);
  });
}

test('il cambio di lingua apre lo stesso percorso, con la stessa query', async ({ page }) => {
  await page.goto('it/letture/?voce=basso');
  await page.locator('astro-island:not([ssr])').waitFor({ state: 'attached' });
  await page.locator('header').getByRole('link', { name: 'EN', exact: true }).click();
  await expect(page).toHaveURL(/\/nota-bene\/en\/letture\/\?voce=basso$/);
  await page.locator('astro-island:not([ssr])').waitFor({ state: 'attached' });
  await page.locator('header').getByRole('link', { name: 'IT', exact: true }).click();
  await expect(page).toHaveURL(/\/nota-bene\/it\/letture\/\?voce=basso$/);
});

test('il 404 è bilingue, con i link alle due home', async ({ page }) => {
  const risposta = await page.goto('questa-pagina-non-esiste/');
  expect(risposta?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: 'Pagina non trovata' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
  await expect(page.locator('a[href="/nota-bene/it/"]')).toBeVisible();
  await expect(page.locator('a[href="/nota-bene/en/"]')).toBeVisible();
});

test.describe('controlli una volta sola', () => {
  test.beforeEach(({}, info) => {
    test.skip(info.project.name !== 'desktop-chromium', 'basta una configurazione');
  });

  test('nessun link interno è rotto', async ({ page, request, baseURL }) => {
    const origine = new URL(baseURL!).origin;
    const daVisitare = PAGINE.map((p) => new URL(p, baseURL).href);
    const visti = new Set<string>();
    while (daVisitare.length) {
      const indirizzo = daVisitare.pop()!;
      if (visti.has(indirizzo)) continue;
      visti.add(indirizzo);
      const risposta = await request.get(indirizzo);
      expect(risposta.status(), `link rotto: ${indirizzo}`).toBe(200);
      if (!(risposta.headers()['content-type'] ?? '').includes('text/html')) continue;
      await page.goto(indirizzo);
      const link = await page.locator('a[href]').evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).href));
      for (const l of link) {
        const u = new URL(l);
        u.hash = '';
        if (u.origin === origine) daVisitare.push(u.href);
      }
    }
    expect(visti.size).toBeGreaterThanOrEqual(PAGINE.length);
  });

  test('niente cookie, storage o risorse di terzi', async ({ page, context, baseURL }) => {
    const origine = new URL(baseURL!).origin;
    const esterne: string[] = [];
    page.on('request', (r) => {
      const u = new URL(r.url());
      if (u.protocol !== 'data:' && u.origin !== origine) esterne.push(r.url());
    });
    for (const percorso of PAGINE) {
      await page.goto(percorso);
      await page.waitForLoadState('networkidle');
      const storage = await page.evaluate(async () => ({
        local: localStorage.length,
        session: sessionStorage.length,
        idb: (await indexedDB.databases()).length,
      }));
      expect(storage, percorso).toEqual({ local: 0, session: 0, idb: 0 });
    }
    expect(esterne).toEqual([]);
    expect(await context.cookies()).toEqual([]);
  });
});

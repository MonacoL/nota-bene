// Percorso e Capitoli (ticket "Capitolo da Markdown e Percorso").
import { expect, test } from '@playwright/test';
import { CAPITOLI } from './pagine';
import { vociDelMenu } from './menu';

const PRIMO = CAPITOLI[0]!;

for (const [lingua, testi] of [
  ['it', { comincia: 'Comincia dal capitolo 1', tutti: 'Tutti i capitoli', menu: ['Capitoli', 'Letture'] }],
  ['en', { comincia: 'Start with chapter 1', tutti: 'All chapters', menu: ['Chapters', 'Readings'] }],
] as const) {
  test(`${lingua}: la home introduce il sito e porta al Capitolo 1, ai Capitoli e alle Letture`, async ({ page }) => {
    await page.goto(`${lingua}/`);
    const main = page.locator('main');
    await expect(main.locator('ol.percorso')).toHaveCount(0);
    await expect(main.getByRole('heading', { level: 2 })).toHaveCount(4);
    await expect(main.getByRole('link', { name: testi.comincia })).toHaveAttribute('href', `/nota-bene/${lingua}/capitoli/${PRIMO}/`);
    await expect(main.getByRole('link', { name: testi.tutti })).toHaveAttribute('href', `/nota-bene/${lingua}/capitoli/`);
    await expect(main.locator(`a[href="/nota-bene/${lingua}/letture/"]`)).toHaveCount(1);
    const menu = await vociDelMenu(page);
    await expect(menu).toHaveText([...testi.menu]);
    await expect(menu.nth(0)).toHaveAttribute('href', `/nota-bene/${lingua}/capitoli/`);
    await expect(menu.nth(1)).toHaveAttribute('href', `/nota-bene/${lingua}/letture/`);
  });
}

test('la pagina Capitoli elenca i 10 Capitoli in ordine, con i loro Esercizi, e porta alle Letture', async ({ page }) => {
  await page.goto('it/capitoli/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Capitoli');
  const voci = page.locator('ol.percorso > li');
  await expect(voci).toHaveCount(10);
  for (const [i, id] of CAPITOLI.entries()) {
    const voce = voci.nth(i);
    await expect(voce.locator('.numero')).toHaveText(String(i + 1));
    await expect(voce.locator('h2 a')).toHaveAttribute('href', `/nota-bene/it/capitoli/${id}/`);
    await expect(voce.locator('.riga')).not.toBeEmpty();
    await expect(voce.getByRole('link', { name: /^Esercizi: / })).toHaveAttribute('href', `/nota-bene/it/capitoli/${id}/esercizi/`);
  }
  await expect(page.locator('main').getByRole('link', { name: 'Vai alle letture' })).toHaveAttribute('href', '/nota-bene/it/letture/');
});

test('dalla home si apre il Capitolo 1 e si va avanti e indietro', async ({ page }) => {
  await page.goto('it/');
  await page.getByRole('link', { name: 'Comincia dal capitolo 1' }).click();
  await expect(page).toHaveURL(new RegExp(`/it/capitoli/${PRIMO}/$`));
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Note, toni e semitoni');

  const seguito = page.locator('nav.seguito');
  await expect(seguito.getByRole('link', { name: 'Esercizi' })).toHaveAttribute('href', `/nota-bene/it/capitoli/${PRIMO}/esercizi/`);
  await expect(seguito.getByRole('link', { name: '← Capitolo precedente' })).toHaveCount(0);
  await expect(seguito.getByRole('link', { name: /Prova le letture/ })).toHaveCount(0);

  await seguito.getByRole('link', { name: 'Capitolo successivo →' }).click();
  await expect(page).toHaveURL(new RegExp(`/it/capitoli/${CAPITOLI[1]}/$`));
  await page.locator('nav.seguito').getByRole('link', { name: '← Capitolo precedente' }).click();
  await expect(page).toHaveURL(new RegExp(`/it/capitoli/${PRIMO}/$`));
});

test('gli esempi abc diventano pentagrammi nel colore del testo', async ({ page }) => {
  await page.goto(`it/capitoli/${PRIMO}/`);
  const pentagrammi = page.locator('.pentagramma svg');
  await expect(pentagrammi).toHaveCount(2);
  await expect(pentagrammi.first().locator('.abcjs-note').first()).toBeVisible();
  for (const tema of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme: tema });
    const [nota, testo] = await Promise.all([
      pentagrammi.first().locator('.abcjs-note path').first().evaluate((p) => getComputedStyle(p).fill),
      page.locator('article.testo p').first().evaluate((p) => getComputedStyle(p).color),
    ]);
    expect(nota, tema).toBe(testo);
  }
});

test('nei Capitoli 9 e 10 c\'è "Prova le letture"; il 10 porta alle avanzate ed è l\'ultimo', async ({ page }) => {
  await page.goto(`it/capitoli/${CAPITOLI[8]}/`);
  await expect(page.locator('nav.seguito').getByRole('link', { name: 'Prova le letture' })).toHaveAttribute('href', '/nota-bene/it/letture/');

  await page.goto(`it/capitoli/${CAPITOLI[9]}/`);
  const seguito = page.locator('nav.seguito');
  await expect(seguito.getByRole('link', { name: 'Prova le letture avanzate' })).toHaveAttribute('href', '/nota-bene/it/letture/#avanzate');
  await expect(seguito.getByRole('link', { name: 'Capitolo successivo →' })).toHaveCount(0);
});

test('un Capitolo senza testo è in preparazione', async ({ page }) => {
  // Il Capitolo 7 è l'ultimo ancora senza testo: quando arriva, questo test va tolto (lo copre già il test unitario).
  await page.goto(`it/capitoli/${CAPITOLI[6]}/`);
  await expect(page.getByText('Questo capitolo è in preparazione.')).toBeVisible();
});

test('il Capitolo 1 in inglese è tradotto, senza avviso, con lo stesso percorso', async ({ page }) => {
  await page.goto(`en/capitoli/${PRIMO}/`);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Notes, whole steps, and half steps');
  await expect(page.locator('article.testo')).not.toHaveAttribute('lang', /.*/);
  await expect(page.getByRole('note').filter({ hasText: 'shown in Italian' })).toHaveCount(0);
  await expect(page.locator('.pentagramma svg')).toHaveCount(2);
  await expect(page.locator('nav.seguito').getByRole('link', { name: 'Next chapter →' })).toHaveAttribute('href', `/nota-bene/en/capitoli/${CAPITOLI[1]}/`);
});

test('dagli Esercizi si torna al Capitolo', async ({ page }) => {
  await page.goto(`it/capitoli/${PRIMO}/esercizi/`);
  await page.getByRole('link', { name: /Torna al capitolo/ }).click();
  await expect(page).toHaveURL(new RegExp(`/it/capitoli/${PRIMO}/$`));
});

// Pagine di servizio (ticket #14, #36): le quattro pagine nelle due lingue, raggiunte dal piè di pagina.
import { expect, test } from '@playwright/test';

const PAGINE = {
  it: [
    { percorso: 'privacy/', titolo: 'Privacy' },
    { percorso: 'intelligenza-artificiale/', titolo: "Uso dell'intelligenza artificiale" },
    { percorso: 'crediti/', titolo: 'Crediti' },
    { percorso: 'contatti/', titolo: 'Contatti' },
  ],
  en: [
    { percorso: 'privacy/', titolo: 'Privacy' },
    { percorso: 'intelligenza-artificiale/', titolo: 'Use of artificial intelligence' },
    { percorso: 'crediti/', titolo: 'Credits' },
    { percorso: 'contatti/', titolo: 'Contact' },
  ],
} as const;

for (const lingua of ['it', 'en'] as const) {
  test(`${lingua}: le quattro pagine di servizio si aprono dal piè di pagina`, async ({ page }) => {
    for (const { percorso, titolo } of PAGINE[lingua]) {
      await page.goto(`${lingua}/`);
      await page.locator('footer').getByRole('link', { name: titolo, exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`/nota-bene/${lingua}/${percorso}$`));
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(titolo);
      await expect(page.locator('html')).toHaveAttribute('lang', lingua);
      await expect(page.locator('main .aggiornata')).toContainText(lingua === 'it' ? 'Ultimo aggiornamento' : 'Last updated');
    }
  });
}

test('la privacy dice che non si raccolgono dati e che GitHub registra gli IP', async ({ page }) => {
  await page.goto('it/privacy/');
  const main = page.locator('main');
  await expect(main).toContainText('non raccoglie dati personali');
  await expect(main.getByRole('link', { name: 'GitHub General Privacy Statement' })).toHaveAttribute('href', /docs\.github\.com/);
});

for (const [lingua, brani, asset] of [['it', 'Brani', 'Asset di terzi'], ['en', 'Pieces', 'Third-party assets']] as const) {
  test(`${lingua}: i crediti elencano i brani delle letture e gli asset di terzi`, async ({ page }) => {
    await page.goto(`${lingua}/crediti/`);
    const sezioneBrani = page.getByRole('region', { name: brani, exact: true });
    await expect(sezioneBrani.getByRole('listitem').filter({ hasText: 'If Ye Love Me' })).toContainText('Thomas Tallis');
    await expect(sezioneBrani.getByRole('link', { name: /Mutopia/ })).toHaveAttribute('href', /mutopiaproject\.org/);
    const sezioneAsset = page.getByRole('region', { name: asset, exact: true });
    for (const nome of [/^abcjs \d/, 'Atkinson Hyperlegible Next', 'Noto Music', 'xml2abc 177']) {
      await expect(sezioneAsset.getByRole('listitem').filter({ hasText: nome })).toHaveCount(1);
    }
  });
}

for (const [lingua, testo] of [['it', 'WCAG 2.1 al livello AA'], ['en', 'WCAG 2.1 at level AA']] as const) {
  test(`${lingua}: contatti ha il paragrafo sull'accessibilità e nessun revisore senza consenso`, async ({ page }) => {
    await page.goto(`${lingua}/contatti/`);
    const main = page.locator('main');
    await expect(main).toContainText(testo);
    await expect(main.getByRole('link', { name: 'GitHub Issues' })).toHaveAttribute('href', 'https://github.com/MonacoL/nota-bene/issues');
    await expect(main.getByRole('region', { name: lingua === 'it' ? 'Revisione dei capitoli' : 'Chapter review' })).toHaveCount(0);
  });
}

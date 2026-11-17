// Esercizi di ritmo in Figure e pause e Indicazioni metriche (ticket "Esercizi di ritmo", #85).
// Con ?seed=s l'Esercizio n della Serie usa il seed s + n: il test genera lo stesso Esercizio e sa la risposta.
// Cambiare scheda fa ripartire la Serie: i seed vanno avanti di 10.
import { expect, test, type Page } from '@playwright/test';
import { genera, metrica, TEMPI, INDICAZIONI, INDICAZIONI_FIGURE } from '../../src/esercizi';

const FIGURE = 'figure-e-pause';
const METRICHE = 'indicazioni-metriche';
const tastierino = (page: Page) => page.getByRole('group', { name: 'Risposta' });
const noteSulRigo = (page: Page) => page.locator('.esercizio .pentagramma .abcjs-note');
const foglio = (page: Page) => page.getByRole('region', { name: 'Riscontro' });

/** Riempie quello che manca con crome, oppure con una sola Figura quando c'è. */
async function completa(page: Page, mancano: number, conCrome: boolean) {
  const t = tastierino(page);
  if (conCrome) {
    for (let i = 0; i < mancano / 2; i++) await t.getByRole('button', { name: 'croma', exact: true }).click();
    return;
  }
  const una: Record<number, [string, boolean]> = {
    2: ['croma', false], 4: ['semiminima', false], 6: ['semiminima', true], 8: ['minima', false], 12: ['minima', true],
  };
  const [nome, punto] = una[mancano]!;
  if (punto) await t.getByRole('button', { name: 'punto', exact: true }).click();
  await t.getByRole('button', { name: nome, exact: true }).click();
}

test('una Serie di "Completa la battuta" in Figure e pause, in 4/4: conta la somma, non le Figure', async ({ page }) => {
  await page.goto(`it/capitoli/${FIGURE}/esercizi/?seed=30`);
  const verifica = tastierino(page).getByRole('button', { name: 'Verifica' });
  for (let n = 0; n < 10; n++) {
    const es = genera('completa-la-battuta', { tempi: ['4/4'] }, 30 + n);
    const scritte = es.scritte.flat().length;
    await expect(noteSulRigo(page)).toHaveCount(scritte);
    await expect(verifica).toBeDisabled();
    if (n === 9) {
      // Una semibreve è sempre troppo, perché manca al massimo metà Battuta.
      await tastierino(page).getByRole('button', { name: 'semibreve', exact: true }).click();
    } else {
      await completa(page, es.mancano, n % 2 === 0);
    }
    if (n === 0) {
      // Ogni Figura compare sul rigo, e ⌫ cancella l'ultima.
      await expect(noteSulRigo(page)).toHaveCount(scritte + es.mancano / 2);
      await tastierino(page).getByRole('button', { name: "Cancella l'ultima nota" }).click();
      await expect(noteSulRigo(page)).toHaveCount(scritte + es.mancano / 2 - 1);
      await tastierino(page).getByRole('button', { name: 'croma', exact: true }).click();
    }
    await verifica.click();
    await expect(foglio(page)).toContainText(n === 9 ? '✗ Non è così' : '✓ Giusto');
    await expect(foglio(page)).toContainText('crome');
    await foglio(page).getByRole('button', { name: 'Avanti →' }).click();
  }
  await expect(page.getByText('9 su 10 giuste al primo colpo')).toBeVisible();
});

test('Indicazioni metriche ha tre schede: Riconosci il tempo, Scegli le figure, Completa la battuta', async ({ page }) => {
  await page.goto(`it/capitoli/${METRICHE}/esercizi/`);
  await expect(page.getByRole('tab')).toHaveText(['Riconosci il tempo', 'Scegli le figure', 'Completa la battuta']);
});

test('una Serie di "Riconosci il tempo": dall\'indicazione metrica, quante pulsazioni e come si suddividono', async ({ page }) => {
  await page.goto(`it/capitoli/${METRICHE}/esercizi/?seed=80`);
  const verifica = tastierino(page).getByRole('button', { name: 'Verifica' });
  for (let n = 0; n < 10; n++) {
    const es = genera('riconosci-il-tempo', { indicazioni: [...INDICAZIONI] }, 80 + n);
    const m = metrica(es.indicazione);
    await expect(page.locator('.esercizio .indicazione')).toHaveAttribute('aria-label', es.indicazione);
    await expect(verifica).toBeDisabled();
    // La prima volta si sbaglia la Suddivisione: il numero di pulsazioni giusto non basta.
    const genere = n === 0 ? (m.genere === 'semplice' ? 'composto' : 'semplice') : m.genere;
    await tastierino(page).getByRole('button', { name: m.numero, exact: true }).click();
    await expect(verifica).toBeDisabled();
    await tastierino(page).getByRole('button', { name: genere, exact: true }).click();
    await verifica.click();
    await expect(foglio(page)).toContainText(n === 0 ? '✗ Non è così' : '✓ Giusto');
    await expect(foglio(page)).toContainText(`${m.numero} ${m.genere}`);
    await foglio(page).getByRole('button', { name: 'Avanti →' }).click();
  }
  await expect(page.getByText('9 su 10 giuste al primo colpo')).toBeVisible();
});

/** Una risposta giusta per ogni Indicazione metrica di "Scegli le figure": [Suddivisione, Pulsazione, Battuta]. */
const FIGURE_GIUSTE: Record<string, [string, string, string[]]> = {
  '2/2': ['semiminima', 'minima', ['semibreve']],
  '2/4': ['croma', 'semiminima', ['minima']],
  '3/4': ['croma', 'semiminima', ['minima.']],
  '4/4': ['croma', 'semiminima', ['semibreve']],
  '5/4': ['croma', 'semiminima', ['semibreve', 'semiminima']],
  '7/4': ['croma', 'semiminima', ['semibreve.', 'semiminima']],
  '3/8': ['semicroma', 'croma', ['semiminima.']],
  '6/4': ['semiminima', 'minima.', ['semibreve.']],
  '6/8': ['croma', 'semiminima.', ['minima.']],
  '9/8': ['croma', 'semiminima.', ['minima.', 'semiminima.']],
  '12/8': ['croma', 'semiminima.', ['semibreve.']],
  '15/8': ['croma', 'semiminima.', ['semibreve.', 'semiminima.']],
};

async function tocca(page: Page, figura: string) {
  const t = tastierino(page);
  if (figura.endsWith('.')) await t.getByRole('button', { name: 'punto', exact: true }).click();
  await t.getByRole('button', { name: figura.replace('.', ''), exact: true }).click();
}

test('una Serie di "Scegli le figure": tre caselle, e la battuta può avere figure legate', async ({ page }) => {
  await page.goto(`it/capitoli/${METRICHE}/esercizi/?seed=200`);
  await page.getByRole('tab', { name: 'Scegli le figure' }).click();
  const t = tastierino(page);
  const verifica = t.getByRole('button', { name: 'Verifica' });
  const casella = (nome: string) => t.getByRole('button', { name: new RegExp(`^${nome}`) });
  for (let n = 0; n < 10; n++) {
    const es = genera('scegli-le-figure', { indicazioni: [...INDICAZIONI_FIGURE] }, 210 + n);
    const [suddivisione, pulsazione, battuta] = FIGURE_GIUSTE[es.indicazione]!;
    await expect(casella('Suddivisione')).toHaveAttribute('aria-pressed', 'true');
    // Dopo ogni figura la casella passa alla successiva; la Battuta ne prende più di una.
    await tocca(page, suddivisione);
    await expect(casella('Pulsazione')).toHaveAttribute('aria-pressed', 'true');
    await tocca(page, pulsazione);
    await expect(casella('Battuta')).toHaveAttribute('aria-pressed', 'true');
    await expect(verifica).toBeDisabled();
    if (n === 0) {
      // ⌫ toglie l'ultima figura della casella scelta.
      await tocca(page, 'croma');
      await expect(casella('Battuta')).toContainText('croma');
      await t.getByRole('button', { name: "Cancella l'ultima nota" }).click();
      await expect(casella('Battuta')).toContainText('scegli');
    }
    if (n === 9) {
      // Tante semiminime col punto quante sono le pulsazioni: durano quanto la battuta, ma non la riassumono.
      for (let i = 0; i < metrica(es.indicazione).pulsazioni; i++) await tocca(page, pulsazione);
    } else {
      for (const f of battuta) await tocca(page, f);
    }
    await verifica.click();
    const sbagliata = n === 9 && battuta.length !== metrica(es.indicazione).pulsazioni;
    await expect(foglio(page)).toContainText(sbagliata ? '✗ Non è così' : '✓ Giusto');
    await foglio(page).getByRole('button', { name: 'Avanti →' }).click();
  }
});

test('una Serie di "Completa la battuta" in Indicazioni metriche, con i tempi semplici e composti', async ({ page }) => {
  await page.goto(`it/capitoli/${METRICHE}/esercizi/?seed=60`);
  await page.getByRole('tab', { name: 'Completa la battuta' }).click();
  for (let n = 0; n < 10; n++) {
    const es = genera('completa-la-battuta', { tempi: [...TEMPI] }, 70 + n);
    await completa(page, es.mancano, false);
    await tastierino(page).getByRole('button', { name: 'Verifica' }).click();
    await expect(foglio(page)).toContainText(`Una battuta di ${es.tempo}`);
    await expect(foglio(page)).toContainText('✓ Giusto');
    await foglio(page).getByRole('button', { name: 'Avanti →' }).click();
  }
});

test('in inglese le Figure hanno i nomi americani, e il Tempo si dice "compound duple"', async ({ page }) => {
  await page.goto(`en/capitoli/${FIGURE}/esercizi/?seed=1`);
  const t = page.getByRole('group', { name: 'Answer' });
  for (const nome of ['whole note', 'half note', 'quarter note', 'eighth note', 'dot']) await expect(t.getByRole('button', { name: nome, exact: true })).toBeVisible();
  await page.goto(`en/capitoli/${METRICHE}/esercizi/`);
  for (const nome of ['duple', 'triple', 'quadruple', 'quintuple', 'septuple', 'simple', 'compound']) await expect(t.getByRole('button', { name: nome, exact: true })).toBeVisible();
  await page.getByRole('tab', { name: 'Choose the note values' }).click();
  await expect(t.getByRole('button', { name: 'sixteenth note', exact: true })).toBeVisible();
});

// "Nomina la sillaba" nei Capitoli 9 e 10 (ticket "Modulo Sillabe e «Nomina la sillaba»").
// Con ?seed=s l'Esercizio n della Serie usa il seed s + n: il test genera lo stesso Esercizio e sa la Sillaba.
import { expect, test } from '@playwright/test';
import { genera, type Chiave } from '../../src/esercizi';
import { CAPITOLI } from './pagine';

const DO_MOBILE = CAPITOLI[8]!;
const AVANZATO = CAPITOLI[9]!;
const DIATONICHE = ['DO', 'RE', 'MI', 'FA', 'SOL', 'LA', 'TI'];
const CROMATICHE = ['DI', 'RI', 'FI', 'SI', 'LI', 'RA', 'ME', 'SE', 'LE', 'TE'];
const CHIAVI: Chiave[] = ['violino', 'violino-ottava-bassa', 'basso'];

test('una Serie di "Nomina la sillaba" nel Capitolo 9: un tocco e niente Verifica', async ({ page }) => {
  await page.goto(`it/capitoli/${DO_MOBILE}/esercizi/?seed=500`);
  const tastierino = page.getByRole('group', { name: 'Risposta' });
  await expect(tastierino.getByRole('button')).toHaveText(DIATONICHE);
  await expect(page.getByRole('button', { name: 'Verifica' })).toHaveCount(0);
  const foglio = page.getByRole('region', { name: 'Riscontro' });

  for (let n = 0; n < 10; n++) {
    await expect(page.getByText(`Esercizio ${n + 1} di 10`)).toBeVisible();
    await expect(page.locator('.esercizio .pentagramma svg')).toHaveCount(1);
    const { sillaba } = genera('nomina-la-sillaba', { chiavi: CHIAVI, cromatiche: false }, 500 + n);
    const giusta = n < 7;
    const data = giusta ? sillaba : sillaba === 'DO' ? 'RE' : 'DO';
    await tastierino.getByRole('button', { name: data, exact: true }).click();
    await expect(foglio).toContainText(giusta ? '✓ Giusto' : '✗ Non è così');
    await expect(foglio).toContainText('il DO è il');
    if (!giusta) await expect(foglio.locator('dd').last()).toHaveText(sillaba);
    await foglio.getByRole('button', { name: 'Avanti →' }).click();
  }
  await expect(page.getByText('7 su 10 giuste al primo colpo')).toBeVisible();
});

test('nel Capitolo 10 il tastierino ha anche le Sillabe cromatiche', async ({ page }) => {
  await page.goto(`it/capitoli/${AVANZATO}/esercizi/?seed=0`);
  const tastierino = page.getByRole('group', { name: 'Risposta' });
  await expect(tastierino.getByRole('button')).toHaveText([...DIATONICHE, ...CROMATICHE]);
  const { sillaba } = genera('nomina-la-sillaba', { chiavi: CHIAVI, cromatiche: true }, 0);
  await tastierino.getByRole('button', { name: sillaba, exact: true }).click();
  await expect(page.getByRole('region', { name: 'Riscontro' })).toContainText('✓ Giusto');
});

test('in inglese le Sillabe restano DO RE MI', async ({ page }) => {
  await page.goto(`en/capitoli/${DO_MOBILE}/esercizi/?seed=1`);
  await expect(page.getByText('Which syllable is this note?')).toBeVisible();
  await expect(page.getByRole('group', { name: 'Answer' }).getByRole('button')).toHaveText(DIATONICHE);
});

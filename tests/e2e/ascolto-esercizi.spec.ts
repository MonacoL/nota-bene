// L'Ascolto negli Esercizi (ticket #35): "Riconosci l'intervallo" e "Trova Tonica e Modo" si possono ascoltare,
// con il pianoforte delle Letture e un AudioContext finto (audio-finto.ts). Senza Q: si suona a 80 semiminime al
// minuto: le due minime di un intervallo melodico partono a 1,5 s l'una dall'altra.
import { expect, test, type Page } from '@playwright/test';
import { genera, type Chiave, type Nota } from '../../src/esercizi';
import { altezza, installaAudioFinto, registro, type Suono } from './audio-finto';
import { CAPITOLI } from './pagine';

const INTERVALLI = CAPITOLI[7]!;
const CHIAVI: Chiave[] = ['violino', 'violino-ottava-bassa', 'basso'];
const VELOCITA = 10;
const SEMITONI: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
/** Il numero MIDI di una Nota reale: Do4 = 60. */
const midiDi = (n: Nota) => 12 * (n.ottava + 1) + SEMITONI[n.lettera]! + n.alterazione;

function note(suoni: Suono[]) {
  const zero = Math.min(...suoni.map((s) => s.inizio));
  return suoni.map((s) => ({ midi: altezza(s), inizio: +(s.inizio - zero).toFixed(2) }));
}

async function aspettaSuoni(page: Page, quanti: number) {
  await expect.poll(async () => (await registro(page)).suoni.length, { timeout: 10_000 }).toBeGreaterThanOrEqual(quanti);
  return (await registro(page)).suoni;
}

/** Il primo seed dell'intervallo armonico o melodico. */
function seedIntervallo(armonico: boolean) {
  for (let s = 1; ; s++) if (genera('riconosci-intervallo', { chiavi: CHIAVI }, s).armonico === armonico) return s;
}

const ascolta = (page: Page) => page.getByRole('button', { name: 'Ascolta', exact: true });

test("l'intervallo armonico suona le due note insieme", async ({ page }) => {
  const seed = seedIntervallo(true);
  const es = genera('riconosci-intervallo', { chiavi: CHIAVI }, seed);
  await installaAudioFinto(page, { velocita: VELOCITA });
  await page.goto(`it/capitoli/${INTERVALLI}/esercizi/?seed=${seed}`);
  await ascolta(page).click();
  await expect(ascolta(page)).toHaveAttribute('aria-pressed', 'true');
  const suonate = note(await aspettaSuoni(page, 2));
  expect(suonate).toEqual(expect.arrayContaining([{ midi: midiDi(es.prima), inizio: 0 }, { midi: midiDi(es.seconda), inizio: 0 }]));
  expect(suonate).toHaveLength(2);
  await expect(ascolta(page)).toHaveAttribute('aria-pressed', 'false', { timeout: 10_000 });
});

test("l'intervallo melodico suona le due note una dopo l'altra, e un secondo tocco ferma", async ({ page }) => {
  const seed = seedIntervallo(false);
  const es = genera('riconosci-intervallo', { chiavi: CHIAVI }, seed);
  await installaAudioFinto(page, { velocita: VELOCITA });
  await page.goto(`it/capitoli/${INTERVALLI}/esercizi/?seed=${seed}`);
  await ascolta(page).click();
  expect(note(await aspettaSuoni(page, 2))).toEqual([
    { midi: midiDi(es.prima), inizio: 0 },
    { midi: midiDi(es.seconda), inizio: 1.5 },
  ]);
  await expect(ascolta(page)).toHaveAttribute('aria-pressed', 'false', { timeout: 10_000 });
  await ascolta(page).click();
  await ascolta(page).click();
  await expect(ascolta(page)).toHaveAttribute('aria-pressed', 'false');
});

const MODO = CAPITOLI[6]!;
const NOMI: Record<string, string> = { C: 'Do', D: 'Re', E: 'Mi', F: 'Fa', G: 'Sol', A: 'La', B: 'Si' };
const ALTERAZIONI: Record<number, string> = { [-1]: 'bemolle', 0: 'bequadro', 1: 'diesis' };

test('una Serie di "Trova Tonica e Modo" con seed fisso: si ascolta la melodia e si risponde in due passi', async ({ page }) => {
  await installaAudioFinto(page, { velocita: VELOCITA });
  await page.goto(`it/capitoli/${MODO}/esercizi/?seed=400`);
  const tastierino = page.getByRole('group', { name: 'Risposta' });
  const foglio = page.getByRole('region', { name: 'Riscontro' });
  for (let n = 0; n < 10; n++) {
    await expect(page.getByText(`Esercizio ${n + 1} di 10`)).toBeVisible();
    await expect(page.getByText('Qual è la tonalità di questa melodia?')).toBeVisible();
    const es = genera('trova-tonica-e-modo', { chiavi: CHIAVI }, 400 + n);
    if (n === 0) {
      // La melodia suona tutta, con le altezze reali della Chiave.
      await ascolta(page).click();
      const suonate = (await aspettaSuoni(page, es.melodia.length)).map(altezza);
      expect(suonate).toEqual(es.melodia.map(midiDi));
      await ascolta(page).click();
    }
    // Primo passo, la tonica: alterazione e nome, poi Avanti. Al secondo passo si sceglie il modo.
    await tastierino.getByRole('button', { name: ALTERAZIONI[es.tonica.alterazione]! }).click();
    await tastierino.getByRole('button', { name: NOMI[es.tonica.lettera]!, exact: true }).click();
    await tastierino.getByRole('button', { name: 'Avanti →' }).click();
    await expect(page.getByText('Maggiore o minore?')).toBeVisible();
    await expect(tastierino.getByRole('button', { name: 'Verifica' })).toBeDisabled();
    const giusta = n % 4 !== 0;
    const modo = giusta ? es.modo : es.modo === 'maggiore' ? 'minore' : 'maggiore';
    await tastierino.getByRole('button', { name: modo, exact: true }).click();
    await tastierino.getByRole('button', { name: 'Verifica' }).click();
    await expect(foglio).toContainText(giusta ? '✓ Giusto' : '✗ Non è così');
    await expect(foglio).toContainText('3° grado');
    await foglio.getByRole('button', { name: 'Avanti →' }).click();
  }
  await expect(page.getByText('7 su 10 giuste al primo colpo')).toBeVisible();
});

test('in "Trova Tonica e Modo" si torna dal modo alla tonica per cambiarla', async ({ page }) => {
  await page.goto(`it/capitoli/${MODO}/esercizi/?seed=400`);
  const tastierino = page.getByRole('group', { name: 'Risposta' });
  await tastierino.getByRole('button', { name: 'Do', exact: true }).click();
  await tastierino.getByRole('button', { name: 'Avanti →' }).click();
  await tastierino.getByRole('button', { name: '← Tonica: Do' }).click();
  await expect(tastierino.getByRole('button', { name: 'Do', exact: true })).toHaveAttribute('aria-pressed', 'true');
});

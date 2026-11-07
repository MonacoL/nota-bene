// L'Ascolto dell'esempio nei Capitoli (ticket #35, ADR-0008), con un AudioContext finto (audio-finto.ts): ogni
// esempio ha il suo pulsante, suona con il pianoforte delle Letture e, senza Q:, a 80 semiminime al minuto.
// Capitolo 7, primo esempio: "C E G E | F D B, D | E D C2 |]" in 4/4, L:1/4.
import { expect, test, type Page } from '@playwright/test';
import { altezza, installaAudioFinto, registro, type Suono } from './audio-finto';
import { CAPITOLI } from './pagine';

const MODO = `it/capitoli/${CAPITOLI[6]}/`;
const VELOCITA = 10;
const PULSAZIONE = 60 / 80;

async function apri(page: Page, velocita = VELOCITA) {
  await installaAudioFinto(page, { velocita });
  await page.goto(MODO);
  await expect(page.locator('.pentagramma svg')).toHaveCount(2);
}

const pulsanti = (page: Page) => page.getByRole('button', { name: "Ascolta l'esempio" });

function note(suoni: Suono[]) {
  const zero = Math.min(...suoni.map((s) => s.inizio));
  return suoni.map((s) => ({ midi: altezza(s), inizio: +(s.inizio - zero).toFixed(2) }));
}

async function aspettaSuoni(page: Page, quanti: number) {
  await expect.poll(async () => (await registro(page)).suoni.length, { timeout: 10_000 }).toBeGreaterThanOrEqual(quanti);
  return (await registro(page)).suoni;
}

test("ogni esempio ha il suo pulsante e suona a 80 semiminime al minuto se non ha un Q:", async ({ page }) => {
  await apri(page);
  await expect(pulsanti(page)).toHaveCount(2);
  await pulsanti(page).first().click();
  await expect(pulsanti(page).first()).toHaveAttribute('aria-pressed', 'true');
  const midi = [60, 64, 67, 64, 65, 62, 59, 62, 64, 62, 60];
  expect(note(await aspettaSuoni(page, 11))).toEqual(midi.map((m, i) => ({ midi: m, inizio: +(i * PULSAZIONE).toFixed(2) })));
  await expect(pulsanti(page).first()).toHaveAttribute('aria-pressed', 'false', { timeout: 10_000 });
});

test("un secondo tocco ferma l'esempio, e un altro esempio ferma il primo", async ({ page }) => {
  await apri(page, 1);
  await pulsanti(page).first().click();
  await aspettaSuoni(page, 1);
  await pulsanti(page).first().click();
  await expect(pulsanti(page).first()).toHaveAttribute('aria-pressed', 'false');
  const fermo = await registro(page);
  for (const s of fermo.suoni) expect(s.fine).toBeLessThanOrEqual(fermo.adesso + 1);

  await pulsanti(page).first().click();
  await aspettaSuoni(page, fermo.suoni.length + 1);
  await pulsanti(page).nth(1).click();
  await expect(pulsanti(page).first()).toHaveAttribute('aria-pressed', 'false');
  await expect(pulsanti(page).nth(1)).toHaveAttribute('aria-pressed', 'true');
});

test("durante l'ascolto la nota che suona si illumina", async ({ page }) => {
  await apri(page, 1);
  await pulsanti(page).first().click();
  const suona = page.locator('.pentagramma .suona');
  await expect(suona.locator('.abcjs-notehead')).toHaveCount(1);
  await pulsanti(page).first().click();
  await expect(suona).toHaveCount(0);
});

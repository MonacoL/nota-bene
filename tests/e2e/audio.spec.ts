// Riferimento tonale e Ascolto di verifica (ticket #31, ADR-0008), con un AudioContext finto (audio-finto.ts):
// quali note partono, quando, e che un secondo tocco ferma tutto. L'audio vero va provato su un iPhone.
// Catalogo d'esempio: Brano alfa, in Fa maggiore, Q:1/4=70, "F3 F | G2 A2 | A A G F | B2 A2", per soprano e
// per tenore (in chiave di violino ottava bassa, un'ottava sotto la scritta).
import { expect, test, type Page } from '@playwright/test';
import { altezza, installaAudioFinto, registro, type Suono } from './audio-finto';
import { BASE_ESEMPIO } from './pagine';

test.use({ baseURL: BASE_ESEMPIO });

const SOPRANO = 'it/letture/brano-alfa/soprano-1-4/';
const TENORE = 'it/letture/brano-alfa/tenore-1-4/';
// If Ye Love Me nel catalogo vero, per le legature di valore: "F3 F | G2 A2- | A A G F | B2 A2 | z A A A | …".
const CON_LEGATURE = 'http://127.0.0.1:4321/nota-bene/it/letture/if-ye-love-me/soprano-1-7/';
// Il tempo del contesto finto scorre 10 volte più in fretta: l'estratto (circa 14 s) dura un secondo e mezzo.
const VELOCITA = 10;
const PULSAZIONE = 60 / 70;

async function apri(page: Page, percorso: string, opzioni: Parameters<typeof installaAudioFinto>[1] = {}) {
  const richieste = await installaAudioFinto(page, { velocita: VELOCITA, ...opzioni });
  await page.goto(percorso);
  await expect(page.locator('.partitura svg')).toHaveCount(1);
  return richieste;
}

const pulsante = (page: Page, nome: 'Riferimento tonale' | 'Ascolto di verifica') =>
  page.getByRole('navigation', { name: 'Comandi della lettura' }).getByRole('button', { name: nome });

/** Le note suonate, con l'inizio in secondi dal primo suono. */
function note(suoni: Suono[]) {
  const zero = Math.min(...suoni.map((s) => s.inizio));
  return suoni.map((s) => ({ midi: altezza(s), inizio: +(s.inizio - zero).toFixed(2) }));
}

/** In pulsazioni dall'inizio → in secondi, arrotondati come in note(). */
const attacchi = (midi: number[], pulsazioni: number[]) => midi.map((m, i) => ({ midi: m, inizio: +(pulsazioni[i]! * PULSAZIONE).toFixed(2) }));

async function aspettaSuoni(page: Page, quanti: number) {
  await expect.poll(async () => (await registro(page)).suoni.length, { timeout: 10_000 }).toBeGreaterThanOrEqual(quanti);
  return (await registro(page)).suoni;
}

test("il riferimento tonale suona l'accordo di tonica insieme, poi la nota di partenza", async ({ page }) => {
  await apri(page, SOPRANO);
  await pulsante(page, 'Riferimento tonale').click();
  await expect(pulsante(page, 'Riferimento tonale')).toHaveAttribute('aria-pressed', 'true');
  // Fa maggiore, partenza Fa4: Fa4 La4 Do5 insieme per circa 1,5 s, mezzo secondo di pausa, poi Fa4.
  expect(note(await aspettaSuoni(page, 4))).toEqual([
    { midi: 65, inizio: 0 },
    { midi: 69, inizio: 0 },
    { midi: 72, inizio: 0 },
    { midi: 65, inizio: 2 },
  ]);
  await expect(pulsante(page, 'Riferimento tonale')).toHaveAttribute('aria-pressed', 'false', { timeout: 10_000 });
  for (const s of (await registro(page)).suoni) expect(s.fine! - s.inizio).toBeGreaterThanOrEqual(1.5);
});

test("il tenore sente il riferimento e l'ascolto un'ottava sotto la scritta", async ({ page }) => {
  await apri(page, TENORE);
  await pulsante(page, 'Riferimento tonale').click();
  expect(note(await aspettaSuoni(page, 4)).map((n) => n.midi)).toEqual([53, 57, 60, 53]);
  await expect(pulsante(page, 'Riferimento tonale')).toHaveAttribute('aria-pressed', 'false', { timeout: 10_000 });
  await pulsante(page, 'Ascolto di verifica').click();
  expect(altezza((await aspettaSuoni(page, 5))[4]!)).toBe(53);
});

test("l'ascolto di verifica suona l'estratto all'andamento del Q:", async ({ page }) => {
  await apri(page, SOPRANO);
  await pulsante(page, 'Ascolto di verifica').click();
  await expect(pulsante(page, 'Ascolto di verifica')).toHaveAttribute('aria-pressed', 'true');
  // Fa4 (3 pulsazioni) Fa4 | Sol4 (2) La4 (2) | La4 La4 Sol4 Fa4 | Si♭4 (2) La4 (2)
  expect(note(await aspettaSuoni(page, 10))).toEqual(
    attacchi([65, 65, 67, 69, 69, 69, 67, 65, 70, 69], [0, 3, 4, 6, 8, 9, 10, 11, 12, 14]),
  );
  await expect(pulsante(page, 'Ascolto di verifica')).toHaveAttribute('aria-pressed', 'false', { timeout: 10_000 });
});

test("nell'ascolto una nota legata non si riattacca e la pausa resta in silenzio", async ({ page }) => {
  await apri(page, CON_LEGATURE);
  await pulsante(page, 'Ascolto di verifica').click();
  // Fa4 (3) Fa4 | Sol4 (2) La4 (2, legato) | La4 La4 Sol4 Fa4 | Si♭4 (2) La4 (2) | pausa La4 …
  const suoni = await aspettaSuoni(page, 10);
  expect(note(suoni.slice(0, 10))).toEqual(attacchi([65, 65, 67, 69, 69, 67, 65, 70, 69, 69], [0, 3, 4, 6, 9, 10, 11, 12, 14, 17]));
  // La4 legato dura 3 pulsazioni.
  expect(suoni[3]!.fine! - suoni[3]!.inizio).toBeGreaterThanOrEqual(3 * PULSAZIONE);
});

test("durante l'ascolto la nota che suona e la sua sillaba si illuminano", async ({ page }) => {
  await apri(page, SOPRANO, { velocita: 1 });
  await page.getByRole('button', { name: 'Mostra la soluzione' }).click();
  await pulsante(page, 'Ascolto di verifica').click();
  const suona = page.locator('.partitura .suona');
  await expect(suona).toHaveCount(1);
  // La prima nota, Fa4 in Fa maggiore, è un DO: nota e sillaba prendono il colore della nota che suona.
  await expect(suona.locator('.abcjs-notehead')).toHaveCount(1);
  await expect(suona.locator('.sillaba')).toHaveText('DO');
  const colore = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--suona').trim());
  const rgb = (hex: string) => `rgb(${[1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(', ')})`;
  await expect(suona.locator('.sillaba')).toHaveCSS('fill', rgb(colore));
  await expect(suona.locator('.abcjs-notehead')).toHaveCSS('fill', rgb(colore));
  // La seconda nota (dopo 3 pulsazioni) è di nuovo Fa4: si illumina quella, non più la prima.
  const prima = await suona.getAttribute('data-index');
  await expect.poll(() => suona.getAttribute('data-index'), { timeout: 5_000 }).not.toBe(prima);
  await pulsante(page, 'Ascolto di verifica').click();
  await expect(suona).toHaveCount(0);
});

test('la pagina segue la nota che suona', async ({ page }) => {
  // Uno schermo basso: la partitura comincia sotto il bordo, o sotto la barra dei comandi sul telefono.
  await page.setViewportSize({ width: page.viewportSize()!.width, height: 240 });
  await apri(page, SOPRANO, { velocita: 1 });
  await pulsante(page, 'Ascolto di verifica').click();
  const suona = page.locator('.partitura .suona');
  await expect(suona).toHaveCount(1);
  await expect
    .poll(async () => {
      const nota = (await suona.boundingBox())!;
      const barra = (await page.getByRole('navigation', { name: 'Comandi della lettura' }).boundingBox())!;
      const basso = barra.y > 120 ? barra.y : 240;
      return nota.y >= 0 && nota.y + nota.height <= basso;
    })
    .toBe(true);
});

test("illuminare la nota non mostra la soluzione nascosta", async ({ page }) => {
  await apri(page, SOPRANO, { velocita: 1 });
  await pulsante(page, 'Ascolto di verifica').click();
  await expect(page.locator('.partitura .suona')).toHaveCount(1);
  await expect(page.locator('.partitura .suona .sillaba')).toBeHidden();
});

test('un secondo tocco ferma tutto', async ({ page }) => {
  await apri(page, SOPRANO, { velocita: 1 });
  await pulsante(page, 'Ascolto di verifica').click();
  await aspettaSuoni(page, 1);
  await pulsante(page, 'Ascolto di verifica').click();
  await expect(pulsante(page, 'Ascolto di verifica')).toHaveAttribute('aria-pressed', 'false');
  const dopo = await registro(page);
  // I suoni partiti si fermano subito (con il breve rilascio di smplr) e non ne parte nessun altro.
  for (const s of dopo.suoni) expect(s.fine).toBeLessThanOrEqual(dopo.adesso + 1);
  await page.waitForTimeout(4 * PULSAZIONE * 1000);
  expect((await registro(page)).suoni).toHaveLength(dopo.suoni.length);
});

test("far partire una funzione ferma l'altra", async ({ page }) => {
  await apri(page, SOPRANO, { velocita: 1 });
  await pulsante(page, 'Ascolto di verifica').click();
  await aspettaSuoni(page, 1);
  await pulsante(page, 'Riferimento tonale').click();
  await expect(pulsante(page, 'Ascolto di verifica')).toHaveAttribute('aria-pressed', 'false');
  await expect(pulsante(page, 'Riferimento tonale')).toHaveAttribute('aria-pressed', 'true');
  const suoni = await aspettaSuoni(page, 4);
  const accordo = suoni.slice(-3);
  // L'accordo del riferimento parte dopo che l'ascolto si è fermato, e dell'ascolto non parte altro.
  expect(accordo.map(altezza)).toEqual([65, 69, 72]);
  for (const s of suoni.slice(0, -3)) expect(s.fine).toBeLessThanOrEqual(accordo[0]!.inizio + 1);
});

test("su iOS l'audioSession passa a playback e il contesto riparte nel gesto, anche dopo un'interruzione", async ({ page }) => {
  await apri(page, SOPRANO, { ios: true });
  await pulsante(page, 'Riferimento tonale').click();
  await aspettaSuoni(page, 4);
  await expect(pulsante(page, 'Riferimento tonale')).toHaveAttribute('aria-pressed', 'false', { timeout: 10_000 });
  // Una telefonata interrompe l'audio: al tocco dopo, il contesto riparte di nuovo dentro il gesto.
  await page.evaluate(() => (window as unknown as { __interrompiAudio: () => void }).__interrompiAudio());
  await pulsante(page, 'Ascolto di verifica').click();
  await aspettaSuoni(page, 5);
  const { resume } = await registro(page);
  expect(resume).toEqual([
    { stato: 'suspended', nelGesto: true, sessione: 'playback' },
    { stato: 'interrupted', nelGesto: true, sessione: 'playback' },
  ]);
});

test('si scaricano solo i campioni delle note della lettura, accordo compreso, e poi restano in cache', async ({ page, browserName }) => {
  const richieste = await apri(page, SOPRANO);
  // Fa4 Sol4 La4 Si♭4 e l'accordo Fa4 La4 Do5: Si♭4 usa il campione di La4. smplr chiama C3 il Do centrale.
  await pulsante(page, 'Riferimento tonale').click();
  await aspettaSuoni(page, 4);
  const formato = richieste[0]!.split('.')[1];
  expect(['m4a', 'ogg']).toContain(formato);
  expect([...richieste].sort()).toEqual(['mf-a3', 'mf-c4', 'mf-f3', 'mf-g3'].map((c) => `${c}.${formato}`));
  const inCache = await page.evaluate(async () =>
    (await (await caches.open('nota-bene-campioni-v1')).keys()).map((r) => r.url.split('/').at(-1)).sort(),
  );
  expect(inCache).toEqual([...richieste].sort());
  // Alla visita dopo i campioni arrivano da CacheStorage, senza chiederli di nuovo alla rete. Il WebKit di
  // Playwright svuota CacheStorage a ogni caricamento della pagina, quindi lì ci si ferma al controllo sopra.
  test.skip(browserName === 'webkit', 'il WebKit di Playwright non tiene CacheStorage tra un caricamento e l\'altro');
  await page.reload();
  await expect(page.locator('.partitura svg')).toHaveCount(1);
  await pulsante(page, 'Riferimento tonale').click();
  await aspettaSuoni(page, 4);
  expect(richieste).toHaveLength(4);
});

test('le licenze di smplr e dei campioni si pubblicano con il sito', async ({ request }) => {
  // smplr finisce nel JavaScript del sito: la licenza MIT chiede che l'avviso viaggi con il codice.
  for (const [file, testo] of [['smplr-LICENSE.txt', 'MIT License'], ['splendid-grand-piano-LICENSE.txt', 'Public Domain']]) {
    const risposta = await request.get(`audio/pianoforte/${file}`);
    expect(risposta.status(), file).toBe(200);
    expect(await risposta.text()).toContain(testo);
  }
});

test('se i campioni non arrivano suona un oscillatore a triangolo', async ({ page }) => {
  await apri(page, SOPRANO, { campioni: 'mancano' });
  await pulsante(page, 'Riferimento tonale').click();
  const suoni = await aspettaSuoni(page, 4);
  expect(suoni.every((s) => s.tipo === 'oscillatore' && s.onda === 'triangle')).toBe(true);
  expect(note(suoni)).toEqual([
    { midi: 65, inizio: 0 },
    { midi: 69, inizio: 0 },
    { midi: 72, inizio: 0 },
    { midi: 65, inizio: 2 },
  ]);
});

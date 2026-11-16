import { defineConfig, devices } from '@playwright/test';

// Le 11 configurazioni della ricerca "Test responsive e visual regression in CI".
// Il nome finisce con il motore, così la CI lancia un job per motore con --project="*-<motore>".
// `screenshot` dice in quali lingue si scattano gli screenshot di confronto su quella configurazione.
type Screenshot = { screenshot?: 'it' | 'it+en' };

const PORTA = 4321;
// Il sito con il catalogo d'esempio delle Letture (npm run build:esempio), per i test che lo chiedono con test.use.
const PORTA_ESEMPIO = 4322;

// I test partono in Studio libero (ADR-0011): quasi tutti aprono Capitoli, Esercizi e Letture che in Scaletta
// sarebbero bloccati. Scaletta e blocchi li provano scaletta.spec.ts e chi riparte da un browser vuoto.
const STUDIO_LIBERO = [{ name: 'nota-bene:progressi:v1', value: JSON.stringify({ serie: {}, segnati: [], modo: 'libero' }) }];
export const IN_STUDIO_LIBERO = {
  cookies: [],
  origins: [PORTA, PORTA_ESEMPIO].map((p) => ({ origin: `http://127.0.0.1:${p}`, localStorage: STUDIO_LIBERO })),
};

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['html', { open: 'never' }], ['github']] : [['list']],
  // Un solo set di baseline, quello Linux dell'immagine Docker di Playwright: niente {platform} nel nome.
  snapshotPathTemplate: '{testDir}/__screenshots__/{projectName}/{testFilePath}/{arg}{ext}',
  expect: {
    // Tolleranza tarata sugli SVG reali (#40): nell'immagine Docker il rumore fra due sessioni è di 0–5 pixel
    // (webkit), mentre una nota spostata di un grado in un esempio ne cambia 70–75.
    // Una soglia in pixel e non in proporzione: lo 0,1% di una pagina intera sono migliaia di pixel, e la nota passava.
    toHaveScreenshot: { maxDiffPixels: 10, animations: 'disabled', caret: 'hide', scale: 'css' },
  },
  use: {
    baseURL: `http://127.0.0.1:${PORTA}/nota-bene/`,
    trace: 'retain-on-failure',
    contextOptions: { reducedMotion: 'reduce' },
    storageState: IN_STUDIO_LIBERO,
  },
  webServer: [
    {
      command: `npx astro preview --ignore-lock --host 127.0.0.1 --port ${PORTA}`,
      url: `http://127.0.0.1:${PORTA}/nota-bene/it/`,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: `NOTA_BENE_LETTURE=tests/e2e/letture-esempio npx astro preview --ignore-lock --host 127.0.0.1 --port ${PORTA_ESEMPIO}`,
      url: `http://127.0.0.1:${PORTA_ESEMPIO}/nota-bene/it/`,
      reuseExistingServer: !process.env.CI,
    },
  ],
  projects: [
    { name: 'phone-320-webkit', use: { ...devices['iPhone SE'] } },
    { name: 'phone-360-chromium', use: { ...devices['Galaxy S8'] }, metadata: { screenshot: 'it+en' } satisfies Screenshot },
    { name: 'iphone-webkit', use: { ...devices['iPhone 15'] }, metadata: { screenshot: 'it' } satisfies Screenshot },
    { name: 'phone-large-chromium', use: { ...devices['Pixel 7'] } },
    { name: 'phone-360-firefox', use: { ...devices['Desktop Firefox'], viewport: { width: 360, height: 740 } } },
    { name: 'tablet-webkit', use: { ...devices['iPad Mini'] }, metadata: { screenshot: 'it' } satisfies Screenshot },
    { name: 'tablet-landscape-webkit', use: { ...devices['iPad Mini landscape'] } },
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] }, metadata: { screenshot: 'it+en' } satisfies Screenshot },
    { name: 'desktop-firefox', use: { ...devices['Desktop Firefox'] }, metadata: { screenshot: 'it' } satisfies Screenshot },
    { name: 'desktop-webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'desktop-wide-chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1920, height: 1080 } }, metadata: { screenshot: 'it' } satisfies Screenshot },
  ],
});

// Gli screenshot delle Letture per la revisione delle PR (tests/anteprima, ticket #34), a 360 px come un telefono.
import { defineConfig, devices } from '@playwright/test';
import base from './playwright.config';

export default defineConfig({
  ...base,
  testDir: 'tests/anteprima',
  // Solo il sito vero: il job delle anteprime non costruisce quello con il catalogo d'esempio.
  webServer: Array.isArray(base.webServer) ? base.webServer[0] : base.webServer,
  reporter: [['list']],
  projects: [{ name: 'phone-360-chromium', use: { ...devices['Galaxy S8'] } }],
});

// @ts-check
import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';

// Il base path vive solo qui (ADR-0006): il resto del codice usa import.meta.env.BASE_URL.
export default defineConfig({
  site: 'https://monacol.github.io',
  base: '/nota-bene/',
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [svelte()],
});

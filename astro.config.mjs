// @ts-check
import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import { satteri } from '@astrojs/markdown-satteri';
import { pentagrammi } from './src/markdown/pentagrammi.ts';

// Il base path vive solo qui (ADR-0006): il resto del codice usa import.meta.env.BASE_URL.
export default defineConfig({
  site: 'https://monacol.github.io',
  base: '/nota-bene/',
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [svelte()],
  markdown: { processor: satteri({ mdastPlugins: [pentagrammi] }) },
});

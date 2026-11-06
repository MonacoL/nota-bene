// @ts-check
import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import { satteri } from '@astrojs/markdown-satteri';
import { pentagrammi } from './src/markdown/pentagrammi.ts';

// Il base path vive solo qui (ADR-0006): il resto del codice usa import.meta.env.BASE_URL.
// Con NOTA_BENE_LETTURE il catalogo delle Letture è un altro (quello d'esempio degli e2e, ticket #32) e il sito
// va in dist-esempio/, così non si confonde mai con quello che si pubblica.
export default defineConfig({
  outDir: process.env.NOTA_BENE_LETTURE ? 'dist-esempio' : 'dist',
  site: 'https://monacol.github.io',
  base: '/nota-bene/',
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [svelte()],
  markdown: { processor: satteri({ mdastPlugins: [pentagrammi] }) },
});

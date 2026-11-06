// Content collections (ADR-0006): i contenuti stanno in contenuti/, fuori da src/, con i loro schemi.
import { defineCollection } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { schemaCapitoloEn, schemaCapitoloIt, schemaPaginaEn, schemaPaginaIt, schemaVocePercorso } from './contenuti/schemi';

export const collections = {
  percorso: defineCollection({ loader: file('contenuti/percorso.yml'), schema: schemaVocePercorso }),
  capitoliIt: defineCollection({
    loader: glob({ pattern: '*.md', base: 'contenuti/capitoli/it' }),
    schema: schemaCapitoloIt,
  }),
  capitoliEn: defineCollection({
    loader: glob({ pattern: '*.md', base: 'contenuti/capitoli/en' }),
    schema: schemaCapitoloEn,
  }),
  // Le pagine di servizio (ticket #14): senza ripiego, una pagina che manca in inglese ferma la build (src/contenuti/pagine.ts).
  pagineIt: defineCollection({
    loader: glob({ pattern: '*.md', base: 'contenuti/pagine/it' }),
    schema: schemaPaginaIt,
  }),
  pagineEn: defineCollection({
    loader: glob({ pattern: '*.md', base: 'contenuti/pagine/en' }),
    schema: schemaPaginaEn,
  }),
};

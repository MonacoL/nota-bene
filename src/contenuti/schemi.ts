// Schemi dei contenuti (ADR-0006). Stanno qui, fuori da content.config.ts, così i test unitari li usano senza Astro.
import { z } from 'astro/zod';

/** La revisione umana che la pagina "Uso dell'intelligenza artificiale" dichiara: senza, la build fallisce. */
const revisione = z.object({
  da: z.string().trim().min(1),
  data: z.coerce.date(),
});

export const schemaCapitoloIt = z.object({ revisione }).strict();

/** Un Capitolo inglese dice anche da quale revisione italiana è stato tradotto. */
export const schemaCapitoloEn = schemaCapitoloIt.extend({ tradotto_da: z.coerce.date() }).strict();

const testiPercorso = z.object({ titolo: z.string().min(1), riga: z.string().min(1) }).strict();

/** Una voce della scaletta: l'id è lo slug dell'URL e non contiene il numero, che può cambiare. */
export const schemaVocePercorso = z
  .object({
    id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
    numero: z.number().int().positive(),
    /** Solo nei Capitoli 9 e 10: il link "Prova le Letture", alle Letture o alle Letture avanzate. */
    prova_letture: z.enum(['letture', 'avanzate']).optional(),
    it: testiPercorso,
    en: testiPercorso,
  })
  .strict();

export type CapitoloIt = z.infer<typeof schemaCapitoloIt>;
export type CapitoloEn = z.infer<typeof schemaCapitoloEn>;
export type VocePercorso = z.infer<typeof schemaVocePercorso>;

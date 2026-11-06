// Schemi dei contenuti (ADR-0006). Stanno qui, fuori da content.config.ts, così i test unitari li usano senza Astro.
import { z } from 'astro/zod';
import { CHIAVI } from '../esercizi';

/** La revisione umana che la pagina "Uso dell'intelligenza artificiale" dichiara: senza, la build fallisce. */
const revisione = z.object({
  da: z.string().trim().min(1),
  data: z.coerce.date(),
});

/** Un tipo di Esercizio con i suoi parametri: discriminato su `tipo`, uno schema per tipo. */
const dichiarazioneEsercizio = z.discriminatedUnion('tipo', [
  z.object({ tipo: z.literal('nomina-la-nota'), chiavi: z.array(z.enum(CHIAVI)).nonempty() }).strict(),
  z.object({ tipo: z.literal('nomina-la-sillaba'), chiavi: z.array(z.enum(CHIAVI)).nonempty(), cromatiche: z.boolean() }).strict(),
  z.object({ tipo: z.literal('riconosci-intervallo'), chiavi: z.array(z.enum(CHIAVI)).nonempty() }).strict(),
  z.object({ tipo: z.literal('rivolta-intervallo'), chiavi: z.array(z.enum(CHIAVI)).nonempty() }).strict(),
]);

/** Gli Esercizi del Capitolo, una scheda per tipo: un tipo non si dichiara due volte. */
const esercizi = z
  .array(dichiarazioneEsercizio)
  .nonempty()
  .refine((d) => new Set(d.map((e) => e.tipo)).size === d.length, { message: 'un tipo di Esercizio è dichiarato due volte' });

/** Gli Esercizi si dichiarano solo nel file italiano, che fa fede anche per l'inglese. */
export const schemaCapitoloIt = z.object({ revisione, esercizi: esercizi.optional() }).strict();

/** Un Capitolo inglese dice anche da quale revisione italiana è stato tradotto. */
export const schemaCapitoloEn = z.object({ revisione, tradotto_da: z.coerce.date() }).strict();

const testiPercorso = z.object({ titolo: z.string().min(1), riga: z.string().min(1) }).strict();

/** Una voce della scaletta: l'id è lo slug dell'URL e non contiene il numero, che può cambiare. */
export const schemaVocePercorso = z
  .object({
    id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
    numero: z.number().int().positive(),
    /** Solo nei Capitoli 9 e 10: il link "Prova le letture", alle Letture o alle Letture avanzate. */
    prova_letture: z.enum(['letture', 'avanzate']).optional(),
    it: testiPercorso,
    en: testiPercorso,
  })
  .strict();

export type CapitoloIt = z.infer<typeof schemaCapitoloIt>;
export type DichiarazioneEsercizio = z.infer<typeof dichiarazioneEsercizio>;
export type CapitoloEn = z.infer<typeof schemaCapitoloEn>;
export type VocePercorso = z.infer<typeof schemaVocePercorso>;

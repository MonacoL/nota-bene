// Schemi dei contenuti (ADR-0006). Stanno qui, fuori da content.config.ts, così i test unitari li usano senza Astro.
import { z } from 'astro/zod';
import { CHIAVI, FORME, TEMPI } from '../esercizi';

/** La revisione umana che la pagina "Uso dell'intelligenza artificiale" dichiara: senza, la build fallisce. */
const revisione = z.object({
  da: z.string().trim().min(1),
  data: z.coerce.date(),
});

/** Un tipo di Esercizio con i suoi parametri: discriminato su `tipo`, uno schema per tipo. */
const dichiarazioneEsercizio = z.discriminatedUnion('tipo', [
  z.object({ tipo: z.literal('nomina-la-nota'), chiavi: z.array(z.enum(CHIAVI)).nonempty() }).strict(),
  z.object({ tipo: z.literal('nomina-la-sillaba'), chiavi: z.array(z.enum(CHIAVI)).nonempty(), cromatiche: z.boolean() }).strict(),
  z.object({ tipo: z.literal('costruisci-la-scala'), forme: z.array(z.enum(FORME)).nonempty() }).strict(),
  z.object({ tipo: z.literal('trova-la-tonalita'), modi: z.array(z.enum(['maggiore', 'minore'])).nonempty() }).strict(),
  z.object({ tipo: z.literal('trova-tonica-e-modo'), chiavi: z.array(z.enum(CHIAVI)).nonempty() }).strict(),
  z.object({ tipo: z.literal('completa-la-battuta'), tempi: z.array(z.enum(TEMPI)).nonempty() }).strict(),
  z.object({ tipo: z.literal('riconosci-il-tempo'), tempi: z.array(z.enum(TEMPI)).nonempty() }).strict(),
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

/** Una pagina di servizio (ticket #14): la revisione umana e la data dell'ultimo aggiornamento, che la pagina mostra. */
export const schemaPaginaIt = z.object({ revisione, aggiornata: z.coerce.date() }).strict();

/** Come per i Capitoli, il file inglese dice da quale revisione italiana è tradotto. */
export const schemaPaginaEn = z.object({ revisione, aggiornata: z.coerce.date(), tradotto_da: z.coerce.date() }).strict();

/**
 * Chi ha rivisto dei Capitoli oltre al responsabile (ticket #14), in contenuti/revisori.yml. Una persona si aggiunge
 * solo quando ha dato il consenso scritto, con la data di quel consenso e i soli Capitoli che ha rivisto.
 */
export const schemaRevisori = z.array(
  z
    .object({
      nome: z.string().trim().min(1),
      consenso: z.coerce.date(),
      capitoli: z.array(z.string().min(1)).nonempty(),
    })
    .strict(),
);

const testiPercorso = z.object({ titolo: z.string().min(1), riga: z.string().min(1) }).strict();

/** I tre Percorsi (ADR-0011), nell'ordine in cui la pagina dei Capitoli li mostra. */
export const PERCORSI = ['ritmico', 'armonico', 'melodico'] as const;
export type NomePercorso = (typeof PERCORSI)[number];

const slug = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/);

/**
 * Una voce della Scaletta: l'id è lo slug dell'URL e non contiene il numero, che è la posizione nella Scaletta e
 * può cambiare. Ogni Capitolo sta in un solo Percorso; i Prerequisiti possono stare in un altro (ADR-0011).
 */
export const schemaVocePercorso = z
  .object({
    id: slug,
    numero: z.number().int().positive(),
    percorso: z.enum(PERCORSI),
    prerequisiti: z.array(slug).default([]),
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
export type Revisore = z.infer<typeof schemaRevisori>[number];
export type PaginaIt = z.infer<typeof schemaPaginaIt>;
export type PaginaEn = z.infer<typeof schemaPaginaEn>;

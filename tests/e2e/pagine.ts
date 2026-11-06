// Le pagine che esistono oggi, nelle due lingue. Ogni ticket che aggiunge pagine le aggiunge qui.
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { PAGINE_SERVIZIO } from '../../src/contenuti/pagine';

export const LINGUE = ['it', 'en'] as const;

/** Il sito costruito con il catalogo d'esempio delle Letture (tests/e2e/letture-esempio/, porta in playwright.config.ts). */
export const BASE_ESEMPIO = 'http://127.0.0.1:4322/nota-bene/';

/** Gli id dei Capitoli, nell'ordine del Percorso. */
export const CAPITOLI: string[] = (parse(readFileSync('contenuti/percorso.yml', 'utf8')) as { id: string; numero: number }[])
  .sort((a, b) => a.numero - b.numero)
  .map((v) => v.id);

/** Gli id delle Letture del registro (ADR-0003), cioè `<brano>/<voce>-<inizio>-<fine>`. */
export const LETTURE: string[] = readFileSync('letture/pubblicate.txt', 'utf8')
  .split('\n')
  .map((r) => r.trim())
  .filter((r) => r && !r.startsWith('#'));

export const PAGINE = LINGUE.flatMap((l) => [
  `${l}/`,
  `${l}/capitoli/`,
  `${l}/letture/`,
  ...PAGINE_SERVIZIO.map((p) => `${l}/${p}/`),
  ...CAPITOLI.flatMap((c) => [`${l}/capitoli/${c}/`, `${l}/capitoli/${c}/esercizi/`]),
  ...LETTURE.map((id) => `${l}/letture/${id}/`),
]);

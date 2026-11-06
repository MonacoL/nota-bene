// Le pagine che esistono oggi, nelle due lingue. Ogni ticket che aggiunge pagine le aggiunge qui.
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { PROVVISORIE } from '../../src/pagine-provvisorie';

export const LINGUE = ['it', 'en'] as const;

/** Gli id dei Capitoli, nell'ordine del Percorso. */
export const CAPITOLI: string[] = (parse(readFileSync('contenuti/percorso.yml', 'utf8')) as { id: string; numero: number }[])
  .sort((a, b) => a.numero - b.numero)
  .map((v) => v.id);

export const PAGINE = LINGUE.flatMap((l) => [
  `${l}/`,
  ...PROVVISORIE.map((p) => `${l}/${p}/`),
  ...CAPITOLI.flatMap((c) => [`${l}/capitoli/${c}/`, `${l}/capitoli/${c}/esercizi/`]),
]);

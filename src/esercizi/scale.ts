// Scale (Capitoli 5 e 6): la maggiore e le tre forme della minore, dalla tonica all'ottava.
// Ogni lettera compare una volta sola; l'alterazione viene dai toni e semitoni della forma.
import { daGrado, grado, semitoni, type Alterazione, type Nota } from './note';

export const FORME = ['maggiore', 'naturale', 'armonica', 'melodica'] as const;
export type Forma = (typeof FORME)[number];

/** Semitoni di ogni grado dalla tonica. La melodica è quella ascendente, con 6° e 7° alzati. */
export const GRADI: Record<Forma, number[]> = {
  maggiore: [0, 2, 4, 5, 7, 9, 11, 12],
  naturale: [0, 2, 3, 5, 7, 8, 10, 12],
  armonica: [0, 2, 3, 5, 7, 8, 11, 12],
  melodica: [0, 2, 3, 5, 7, 9, 11, 12],
};

/** Le 8 note della scala, tonica e ottava comprese. Una doppia alterazione è un errore: chi genera la evita. */
export function scala(tonica: Nota, forma: Forma): Nota[] {
  return GRADI[forma].map((s, i) => {
    const naturale = daGrado(grado(tonica) + i);
    const alterazione = semitoni(tonica) + s - semitoni(naturale);
    if (Math.abs(alterazione) > 1) throw new Error(`doppia alterazione nella scala di ${tonica.lettera}${tonica.alterazione} ${forma}`);
    return { ...naturale, alterazione: alterazione as Alterazione };
  });
}

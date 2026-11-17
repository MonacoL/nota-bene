// I battimenti (#90): due suoni quasi alla stessa altezza si sommano in una terza vibrazione che pulsa. Si sentono
// fra armoniche vicine, perciò un'ottava o una quinta stonate battono solo con un timbro ricco di armoniche: il sito
// suona con un organo sintetizzato, mai con una sinusoide. TypeScript puro: lo usano il Capitolo, "Trova l'unisono"
// e i test.

/** Le ampiezze delle armoniche dell'organo, dalla fondamentale in su (come nel prototipo dell'accordatore, #88). */
export const ARMONICHE = [1, 0.6, 0.35, 0.25, 0.12, 0.08, 0.05, 0.03] as const;

export type Intervallo = 'unisono' | 'ottava' | 'quinta';
export const INTERVALLI: readonly Intervallo[] = ['unisono', 'ottava', 'quinta'];

/** I rapporti giusti, sopra su sotto, in termini minimi: 1:1, 2:1, 3:2. */
const RAPPORTI: Record<Intervallo, [sopra: number, sotto: number]> = { unisono: [1, 1], ottava: [2, 1], quinta: [3, 2] };

/** Sotto questa differenza le armoniche coincidono; sopra la seconda non si sentono più pulsazioni ma asprezza. */
const COINCIDONO = 0.05;
const PIU_VELOCE = 20;

/**
 * Quante volte al secondo battono due suoni, dal battimento più lento: una pulsazione per ogni coppia di armoniche
 * (una per suono) che distano meno di 20 Hz senza coincidere. Vuoto se l'intervallo è intonato.
 */
export function battimenti(prima: number, seconda: number, armoniche: number = ARMONICHE.length): number[] {
  const trovati: number[] = [];
  for (let i = 1; i <= armoniche; i++) {
    for (let j = 1; j <= armoniche; j++) {
      const d = Math.abs(i * prima - j * seconda);
      if (d > COINCIDONO && d < PIU_VELOCE) trovati.push(d);
    }
  }
  return trovati.sort((a, b) => a - b);
}

/**
 * La frequenza della nota sopra `prima` che fa l'intervallo e batte `battito` volte al secondo, crescente: con 0 è
 * l'intervallo giusto. I battimenti più lenti stanno fra l'armonica `sopra` della prima e l'armonica `sotto` della
 * seconda.
 */
export function seconda(intervallo: Intervallo, prima: number, battito: number): number {
  const [sopra, sotto] = RAPPORTI[intervallo];
  return (sopra * prima + battito) / sotto;
}

/** Un suono tenuto: i punti sono [secondi, frequenza] e la frequenza va dritta da un punto al successivo. */
export type SuonoTenuto = { inizio: number; fine: number; punti: [number, number][] };

const ENTRATA = 1.5;
const STONATA = 3;
const GLISSANDO = 4;
const FERMA = 2.5;
/** Quanto batte la seconda nota quando entra. */
const BATTITO = 3;

/**
 * Un esempio del Capitolo: la prima nota da sola, poi la seconda entra stonata e batte, scivola piano fino
 * all'intervallo giusto e lì resta, ferma, senza battimenti.
 */
export function esempio(intervallo: Intervallo, prima: number): [SuonoTenuto, SuonoTenuto] {
  const stonata = seconda(intervallo, prima, BATTITO);
  const giusta = seconda(intervallo, prima, 0);
  const t1 = ENTRATA + STONATA;
  const t2 = t1 + GLISSANDO;
  const fine = t2 + FERMA;
  return [
    { inizio: 0, fine, punti: [[0, prima]] },
    { inizio: ENTRATA, fine, punti: [[ENTRATA, stonata], [t1, stonata], [t2, giusta]] },
  ];
}

/** Di quanti Hz la voce dell'esempio di "Trova l'unisono" si allontana dalla nota: battimenti ben udibili. */
const SCOSTAMENTO = 4;

/**
 * L'esempio di "Trova l'unisono" (#90), al posto delle voci registrate finché non ci sono (#91): il sito tiene la
 * nota, una seconda voce entra poco sopra e scivola giù fino all'unisono; resta lì, poi cala un po' e risale.
 */
export function esempioUnisono(nota: number): [SuonoTenuto, SuonoTenuto] {
  const [sopra, sotto] = [nota + SCOSTAMENTO, nota - SCOSTAMENTO];
  const punti: [number, number][] = [
    [1.5, sopra], [3.5, sopra], [7.5, nota], [9.5, nota], [10.5, sotto], [12.5, sotto], [16.5, nota],
  ];
  const fine = 19;
  return [
    { inizio: 0, fine, punti: [[0, nota]] },
    { inizio: 1.5, fine, punti },
  ];
}

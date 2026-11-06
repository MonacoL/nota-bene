// La Nota scritta: lettera, alterazione e ottava (Do4 è il do centrale). Le lettere sono quelle inglesi
// (ADR-0007) perché non dipendono dalla lingua: i nomi italiani si danno solo nei testi.

export const LETTERE = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const;
export type Lettera = (typeof LETTERE)[number];
export type Alterazione = -1 | 0 | 1;

export type Nota = { lettera: Lettera; alterazione: Alterazione; ottava: number };

/** Posizione della Nota sui tasti bianchi, un passo per grado: Do4 = 28. */
export function grado(nota: Nota): number {
  return nota.ottava * 7 + LETTERE.indexOf(nota.lettera);
}

export function daGrado(g: number, alterazione: Alterazione = 0): Nota {
  return { lettera: LETTERE[((g % 7) + 7) % 7]!, alterazione, ottava: Math.floor(g / 7) };
}

/** La Nota in ABC, con l'alterazione scritta davanti: Do4 → "C", Do5 → "c", Sol♯2 → "^G,,". */
export function abcNota(nota: Nota): string {
  const segno = { '-1': '_', '0': '', '1': '^' }[nota.alterazione];
  const lettera = nota.ottava >= 5 ? nota.lettera.toLowerCase() + "'".repeat(nota.ottava - 5) : nota.lettera + ','.repeat(4 - nota.ottava);
  return segno + lettera;
}

const SEMITONI: Record<Lettera, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** Il tasto della tastiera, senza ottava: Sol♯ e La♭ danno lo stesso numero. */
export function tasto(nota: Pick<Nota, 'lettera' | 'alterazione'>): number {
  return (SEMITONI[nota.lettera] + nota.alterazione + 12) % 12;
}

/** L'altezza in semitoni, con l'ottava: Do4 = 48, Do♯4 = 49. */
export function semitoni(nota: Nota): number {
  return nota.ottava * 12 + SEMITONI[nota.lettera] + nota.alterazione;
}

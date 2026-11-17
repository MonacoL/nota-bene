// Figure e battute (Figure e pause, Indicazioni metriche). Le durate si contano in semicrome, così anche la croma col punto è un intero.
// Niente gruppi irregolari (terzine e simili): il Percorso non li insegna (ADR-0003).
import { metrica, type NomeIndicazione } from './metrica';

/** La tavolozza di "Completa la battuta". "Scegli le figure" aggiunge la semicroma (scegli-le-figure.ts). */
export const FIGURE = ['semibreve', 'minima', 'semiminima', 'croma'] as const;
export type NomeFigura = (typeof FIGURE)[number] | 'semicroma';
export type Figura = { figura: NomeFigura; punto: boolean };

/** Un Tempo come 6/8: battiti sopra, unità sotto. */
export type Tempo = { battiti: number; unita: 4 | 8 };

const VALORI: Record<NomeFigura, number> = { semibreve: 16, minima: 8, semiminima: 4, croma: 2, semicroma: 1 };

/** La durata di una o più Figure, in semicrome: il punto aggiunge metà del valore. */
export function durata(figure: Figura[]): number {
  return figure.reduce((somma, f) => somma + VALORI[f.figura] * (f.punto ? 1.5 : 1), 0);
}

export function durataBattuta(tempo: Tempo): number {
  return (tempo.battiti * 16) / tempo.unita;
}

/** Semplice o composto lo decide il numero sopra, come per ogni Indicazione metrica (metrica.ts). */
export function semplice(tempo: Tempo): boolean {
  return metrica(`${tempo.battiti}/${tempo.unita}` as NomeIndicazione).genere === 'semplice';
}

/**
 * Le Indicazioni metriche di "Completa la battuta": Pulsazione di semiminima nei semplici, di semiminima col punto
 * nei composti. Il 3/8 non c'è: è semplice, con la Pulsazione di croma, e la tavolozza non ha la semicroma.
 */
export const INDICAZIONI_BATTUTA = ['2/4', '3/4', '4/4', '6/8', '9/8', '12/8'] as const;
export type IndicazioneBattuta = (typeof INDICAZIONI_BATTUTA)[number];

export function tempo(nome: IndicazioneBattuta): Tempo {
  const [battiti, unita] = nome.split('/').map(Number) as [number, 4 | 8];
  return { battiti, unita };
}

/** La Pulsazione in semicrome: semiminima nei Tempi semplici, semiminima col punto nei composti. */
export const pulsazione = (t: Tempo) => (semplice(t) ? 4 : 6);

const DA_DURATA: Record<number, Figura> = {
  16: { figura: 'semibreve', punto: false },
  12: { figura: 'minima', punto: true },
  8: { figura: 'minima', punto: false },
  6: { figura: 'semiminima', punto: true },
  4: { figura: 'semiminima', punto: false },
  3: { figura: 'croma', punto: true },
  2: { figura: 'croma', punto: false },
};

export const figura = (durata: number): Figura => DA_DURATA[durata]!;

/** Come si riempie una Pulsazione, senza gruppi irregolari: le crome di una Pulsazione stanno sotto una trave. */
export const RIEMPIMENTI: Record<4 | 6, number[][]> = {
  4: [[4], [2, 2]],
  6: [[6], [4, 2], [2, 2, 2]],
};

/**
 * Una Battuta in ABC, sul Si4 (la riga centrale): un gruppo per Pulsazione, le note di un gruppo unite.
 * Le note dopo la Battuta scritta ("Completa la battuta") vanno ognuna per conto suo.
 */
export function abcBattute(nome: IndicazioneBattuta | undefined, battute: number[][][], { aCapo = false } = {}): string {
  // Con aCapo ogni Battuta va su un rigo suo: due Battute di 12/8 non stanno in un rigo da telefono.
  const corpo = battute.map((gruppi) => gruppi.map((g) => g.map((d) => `B${d}`).join('')).join(' ')).join(aCapo ? ' |\n' : ' | ');
  return `X:1\nM:${nome ?? 'none'}\nL:1/16\nK:C clef=treble\n${corpo} |]\n`;
}

const NOMI_FIGURE: Record<NomeFigura, { it: string; en: string }> = {
  semibreve: { it: 'semibreve', en: 'whole note' },
  minima: { it: 'minima', en: 'half note' },
  semiminima: { it: 'semiminima', en: 'quarter note' },
  croma: { it: 'croma', en: 'eighth note' },
  semicroma: { it: 'semicroma', en: 'sixteenth note' },
};

/** "semiminima col punto" / "dotted quarter note". */
export function nomeFigura(f: Figura): { it: string; en: string } {
  const n = NOMI_FIGURE[f.figura];
  return f.punto ? { it: `${n.it} col punto`, en: `dotted ${n.en}` } : n;
}

/** Una durata in crome, con il mezzo della croma col punto: 3 semicrome → "1½". */
export function inCrome(semicrome: number): string {
  const intere = Math.floor(semicrome / 2);
  if (semicrome % 2 === 0) return String(intere);
  return `${intere || ''}½`;
}

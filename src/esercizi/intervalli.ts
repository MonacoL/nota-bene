// Intervalli: il numero si trova contando le note, la qualità contando i semitoni (Capitolo 8).
import type { Casuale } from './casuale';
import type { Testi } from './testi';
import { daGrado, grado, semitoni as altezza, type Alterazione, type Nota } from './note';

export const NUMERI = [2, 3, 4, 5, 6, 7, 8] as const;
export const QUALITA = ['minore', 'maggiore', 'giusta', 'aumentata', 'diminuita'] as const;
export type Numero = (typeof NUMERI)[number];
export type Qualita = (typeof QUALITA)[number];
export type Intervallo = { numero: Numero; qualita: Qualita };

/** 1ª, 4ª, 5ª e 8ª sono giuste; le altre maggiori o minori. Semitoni della giusta o della maggiore. */
const RIFERIMENTO: Record<number, { giusto: boolean; semitoni: number }> = {
  1: { giusto: true, semitoni: 0 },
  2: { giusto: false, semitoni: 2 },
  3: { giusto: false, semitoni: 4 },
  4: { giusto: true, semitoni: 5 },
  5: { giusto: true, semitoni: 7 },
  6: { giusto: false, semitoni: 9 },
  7: { giusto: false, semitoni: 11 },
  8: { giusto: true, semitoni: 12 },
};

/** L'intervallo fra due note, nell'una o nell'altra direzione, fino all'ottava. */
export function intervallo(a: Nota, b: Nota): Intervallo & { semitoni: number } {
  const [basso, alto] = grado(a) <= grado(b) ? [a, b] : [b, a];
  const numero = grado(alto) - grado(basso) + 1;
  const semitoni = altezza(alto) - altezza(basso);
  const rif = RIFERIMENTO[numero];
  if (!rif) throw new Error(`intervallo oltre l'ottava: ${numero}`);
  const scarto = semitoni - rif.semitoni;
  const qualita: Qualita | undefined = rif.giusto
    ? ({ [-1]: 'diminuita', 0: 'giusta', 1: 'aumentata' } as Record<number, Qualita>)[scarto]
    : ({ [-2]: 'diminuita', [-1]: 'minore', 0: 'maggiore', 1: 'aumentata' } as Record<number, Qualita>)[scarto];
  if (!qualita) throw new Error(`qualità non prevista: ${numero}ª con ${semitoni} semitoni`);
  return { numero: numero as Numero, qualita, semitoni };
}

const QUALITA_RIVOLTA: Record<Qualita, Qualita> = {
  minore: 'maggiore', maggiore: 'minore', giusta: 'giusta', aumentata: 'diminuita', diminuita: 'aumentata',
};

/** Nel rivolto la nota in basso sale di un'ottava: i numeri sommano 9, maggiore e minore si scambiano. */
export function rivolto(i: Intervallo): Intervallo {
  return { numero: (9 - i.numero) as Numero, qualita: QUALITA_RIVOLTA[i.qualita] };
}

/** Note scritte con un altro nome di un tasto bianco: per chi parte da zero si escludono, come in "Nomina la nota". */
const ESCLUSE = ['E1', 'B1', 'C-1', 'F-1'];

/**
 * Due note che formano un intervallo, dentro il rigo della Chiave. Quinta, terza e quarta pesano di più, come
 * nell'ordine del maestro (ticket "Scaletta dei Capitoli"); aumentati e diminuiti sono solo il tritono (cenno).
 */
export function dueNote(caso: Casuale, rigo: { da: number; a: number }, numeri: readonly Numero[]) {
  const PESI: Record<Numero, number> = { 5: 4, 3: 4, 4: 3, 2: 1, 6: 1, 7: 1, 8: 1 };
  const sacco = numeri.flatMap((n) => Array<Numero>(PESI[n]).fill(n));
  for (;;) {
    const numero = caso.scegli(sacco);
    const qualita: Qualita =
      numero === 4 ? (caso.intero(5) === 0 ? 'aumentata' : 'giusta')
      : numero === 5 ? (caso.intero(5) === 0 ? 'diminuita' : 'giusta')
      : numero === 8 ? 'giusta'
      : caso.scegli(['maggiore', 'minore'] as const);
    const g = rigo.da + caso.intero(rigo.a - rigo.da - numero + 2);
    const basso: Nota = { ...daGrado(g), alterazione: caso.intero(4) === 0 ? caso.scegli([-1, 1] as const) : 0 };
    const naturale = daGrado(g + numero - 1);
    // L'alterazione della nota in alto che dà la qualità voluta.
    const voluti = SEMITONI_DI[qualita](numero);
    const alterazione = voluti - (altezza(naturale) - altezza(basso));
    if (Math.abs(alterazione) > 1) continue;
    const alto: Nota = { ...naturale, alterazione: alterazione as Alterazione };
    if ([basso, alto].some((x) => ESCLUSE.includes(`${x.lettera}${x.alterazione}`))) continue;
    return { basso, alto, intervallo: { numero, qualita } };
  }
}

const SEMITONI_DI: Record<Qualita, (n: number) => number> = {
  giusta: (n) => RIFERIMENTO[n]!.semitoni,
  maggiore: (n) => RIFERIMENTO[n]!.semitoni,
  minore: (n) => RIFERIMENTO[n]!.semitoni - 1,
  aumentata: (n) => RIFERIMENTO[n]!.semitoni + 1,
  diminuita: (n) => RIFERIMENTO[n]!.semitoni - (RIFERIMENTO[n]!.giusto ? 1 : 2),
};

const NUMERI_IT: Record<number, string> = { 2: 'seconda', 3: 'terza', 4: 'quarta', 5: 'quinta', 6: 'sesta', 7: 'settima', 8: 'ottava' };
const NUMERI_EN: Record<number, string> = { 2: 'second', 3: 'third', 4: 'fourth', 5: 'fifth', 6: 'sixth', 7: 'seventh', 8: 'octave' };
export const QUALITA_EN: Record<Qualita, string> = { minore: 'minor', maggiore: 'major', giusta: 'perfect', aumentata: 'augmented', diminuita: 'diminished' };

export const numeroTesti = (n: number): Testi => ({ it: NUMERI_IT[n]!, en: NUMERI_EN[n]! });

/** "terza maggiore" / "major third". */
export function nomeIntervallo(i: Intervallo): Testi {
  return { it: `${NUMERI_IT[i.numero]} ${i.qualita}`, en: `${QUALITA_EN[i.qualita]} ${NUMERI_EN[i.numero]}` };
}

/** "a major third", "an augmented fourth". */
export const conArticolo = (en: string) => `${/^[aeiou]/.test(en) ? 'an' : 'a'} ${en}`;

/** Le qualità che un numero può avere: giuste per 4ª, 5ª e 8ª, maggiori o minori per le altre. */
export const haQualita = (numero: number, qualita: Qualita) =>
  qualita === 'aumentata' || qualita === 'diminuita' || (RIFERIMENTO[numero]!.giusto === (qualita === 'giusta'));

export const semitoniDi = (i: Intervallo) => SEMITONI_DI[i.qualita](i.numero);

/** La qualità che quel numero non ha mai, e quelle che ha. */
export function qualitaImpossibile(numero: number): Testi {
  const nome = numeroTesti(numero);
  if (RIFERIMENTO[numero]!.giusto) {
    return {
      it: `Una ${nome.it} non è mai maggiore o minore: è giusta, aumentata o diminuita.`,
      en: `A ${nome.en} is never major or minor: it is perfect, augmented, or diminished.`,
    };
  }
  return { it: `Una ${nome.it} non è mai giusta: è maggiore o minore.`, en: `A ${nome.en} is never perfect: it is major or minor.` };
}

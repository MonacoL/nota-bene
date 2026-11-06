// "Costruisci la scala" e "Trova la tonalità" (Capitoli 5 e 6). L'ABC si legge con abcjs, indipendente dal modulo.
import abcjs from 'abcjs';
import { describe, expect, it } from 'vitest';
import { abcScala, genera, valuta, type EsercizioCostruisciLaScala, type Nota } from '../../src/esercizi';

const SEED = Array.from({ length: 300 }, (_, i) => i * 7919 + 11);
const SEMITONI: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const LETTERE = 'CDEFGAB';
const segno = { sharp: 1, flat: -1, natural: 0 } as Record<string, number>;

/** Le note scritte, come le legge abcjs, con l'altezza in semitoni. */
function letto(abc: string) {
  const [brano] = abcjs.parseOnly(abc);
  expect(brano!.warnings ?? []).toEqual([]);
  return brano!.lines[0]!.staff![0]!.voices![0]!
    .filter((e) => e.el_type === 'note')
    .flatMap((e) => e.pitches!)
    .map((p) => {
      const g = 28 + p.pitch;
      const lettera = LETTERE[((g % 7) + 7) % 7]!;
      const alterazione = p.accidental ? segno[p.accidental]! : 0;
      return { lettera, alterazione, altezza: Math.floor(g / 7) * 12 + SEMITONI[lettera]! + alterazione };
    });
}

/** Toni e semitoni fra le note consecutive: "TTSTTTS"; la seconda aumentata è "3". */
const passi = (note: { altezza: number }[]) => note.slice(1).map((x, i) => ({ 1: 'S', 2: 'T', 3: '3' })[x.altezza - note[i]!.altezza as 1]).join('');

const TONICHE = {
  maggiore: ['C', 'G', 'D', 'A', 'E', 'F', 'Bb', 'Eb', 'Ab'],
  minore: ['A', 'E', 'B', 'F#', 'C#', 'D', 'G', 'C', 'F'],
};
const nome = (n: Pick<Nota, 'lettera' | 'alterazione'>) => `${n.lettera}${{ '-1': 'b', '0': '', '1': '#' }[n.alterazione]}`;

describe('Costruisci la scala: genera', () => {
  it('nel Capitolo 5 una scala maggiore da una tonica con armatura fino a 4 alterazioni; il rigo mostra solo la tonica', () => {
    const toniche = new Set<string>();
    for (const s of SEED) {
      const es = genera('costruisci-la-scala', { forme: ['maggiore'] }, s);
      expect(es.forma).toBe('maggiore');
      toniche.add(nome(es.tonica));
      const [tonica, ...altre] = letto(es.abc);
      expect(altre).toEqual([]);
      expect(tonica).toMatchObject({ lettera: es.tonica.lettera, alterazione: es.tonica.alterazione });
      expect(passi(letto(abcScala(es.scala)))).toBe('TTSTTTS');
    }
    expect([...toniche].sort()).toEqual([...TONICHE.maggiore].sort());
  });

  it('nel Capitolo 6 le tre forme della minore, ognuna con i suoi toni e semitoni', () => {
    const attesi = { naturale: 'TSTTSTT', armonica: 'TSTTS3S', melodica: 'TSTTTTS' } as const;
    const forme = new Set<string>();
    for (const s of SEED) {
      const es = genera('costruisci-la-scala', { forme: ['naturale', 'armonica', 'melodica'] }, s);
      forme.add(es.forma);
      expect(TONICHE.minore).toContain(nome(es.tonica));
      expect(passi(letto(abcScala(es.scala)))).toBe(attesi[es.forma as keyof typeof attesi]);
    }
    expect(forme.size).toBe(3);
  });
});

const n = (s: string): Nota => ({
  lettera: s[0] as Nota['lettera'],
  alterazione: s.includes('#') ? 1 : s.slice(1).includes('b') ? -1 : 0,
  ottava: Number(s.at(-1) ?? 4),
});
/** "E F# G" → le note della risposta, senza ottava. */
const risposta = (s: string) => ({ note: s.split(' ').map((x) => ({ lettera: x[0] as Nota['lettera'], alterazione: n(x + '4').alterazione })) });
const costruisci = (tonica: string, forma: EsercizioCostruisciLaScala['forma'], scala: string): EsercizioCostruisciLaScala =>
  ({ tipo: 'costruisci-la-scala', forma, tonica: n(tonica), scala: scala.split(' ').map(n), domanda: { it: '', en: '' }, abc: '' });

const reMaggiore = costruisci('D4', 'maggiore', 'D4 E4 F#4 G4 A4 B4 C#5 D5');
const laArmonica = costruisci('A4', 'armonica', 'A4 B4 C5 D5 E5 F5 G#5 A5');

describe('Costruisci la scala: valuta', () => {
  it('la scala giusta è giusta; la spiegazione la scrive e conta toni e semitoni', () => {
    const r = valuta(reMaggiore, risposta('E F# G A B C# D'));
    expect(r.esito).toBe('giusto');
    expect(r.giusta).toEqual({ it: 'Re Mi Fa♯ Sol La Si Do♯ Re', en: 'D E F♯ G A B C♯ D' });
    expect(r.spiegazione.it).toBe('La scala di Re maggiore: Re Mi Fa♯ Sol La Si Do♯ Re. Toni e semitoni: T T S T T T S.');
    expect(r.spiegazione.en).toBe('The D major scale: D E F♯ G A B C♯ D. Whole and half steps: W W H W W W H.');
  });

  it('la minore armonica ha il tono e mezzo fra 6° e 7° grado', () => {
    const r = valuta(laArmonica, risposta('B C D E F G# A'));
    expect(r.esito).toBe('giusto');
    expect(r.spiegazione.it).toBe('La scala di La minore armonica: La Si Do Re Mi Fa Sol♯ La. Toni e semitoni: T S T T S 1½ S.');
    expect(r.spiegazione.en).toBe('The A harmonic minor scale: A B C D E F G♯ A. Whole and half steps: W H W W H 1½ H.');
  });

  it('una nota sbagliata: la spiegazione dice qual è la prima e quanto dista dalla precedente', () => {
    const r = valuta(reMaggiore, risposta('E F G A B C# D'));
    expect(r.esito).toBe('sbagliato');
    expect(r.data).toEqual({ it: 'Re Mi Fa Sol La Si Do♯ Re', en: 'D E F G A B C♯ D' });
    expect(r.spiegazione.it).toContain('La 3ª nota è Fa♯: dal Mi ci vuole un tono.');
    expect(r.spiegazione.en).toContain('The 3rd note is F♯: a whole step up from E.');
    expect(valuta(laArmonica, risposta('B C D E F G A')).spiegazione.it).toContain('La 7ª nota è Sol♯: dal Fa ci vuole un tono e mezzo.');
    expect(valuta(laArmonica, risposta('B C D E F G A')).spiegazione.en).toContain('The 7th note is G♯: a step and a half up from F.');
  });

  it('lo stesso tasto con un\'altra lettera è sbagliato: ogni lettera compare una volta sola', () => {
    const r = valuta(reMaggiore, risposta('E Gb G A B C# D'));
    expect(r.esito).toBe('sbagliato');
    expect(r.spiegazione.it).toContain('Il Sol♭ è lo stesso tasto, ma nella scala ogni lettera compare una volta sola: dopo il Mi viene un Fa.');
    expect(r.spiegazione.en).toContain('G♭ is the same key, but in a scale each letter appears only once: after E comes an F.');
  });

  it('per ogni seed la scala dell\'Esercizio è giusta', () => {
    for (const s of SEED) {
      const es = genera('costruisci-la-scala', { forme: ['maggiore', 'naturale', 'armonica', 'melodica'] }, s);
      expect(valuta(es, { note: es.scala.slice(1) }).esito).toBe('giusto');
    }
  });
});

/** Le Tonalità di ogni armatura, dal libro: chiave = numero di diesis (positivo) o di bemolle (negativo). */
const TONALITA: Record<number, { maggiore: string; minore: string }> = {
  [-4]: { maggiore: 'Ab', minore: 'F' }, [-3]: { maggiore: 'Eb', minore: 'C' }, [-2]: { maggiore: 'Bb', minore: 'G' },
  [-1]: { maggiore: 'F', minore: 'D' }, 0: { maggiore: 'C', minore: 'A' }, 1: { maggiore: 'G', minore: 'E' },
  2: { maggiore: 'D', minore: 'B' }, 3: { maggiore: 'A', minore: 'F#' }, 4: { maggiore: 'E', minore: 'C#' },
};

function armaturaLetta(abc: string): number {
  const [brano] = abcjs.parseOnly(abc);
  expect(brano!.warnings ?? []).toEqual([]);
  const rigo = brano!.lines[0]!.staff![0]!;
  expect(rigo.voices![0]!.filter((e) => e.el_type === 'note' && !e.rest)).toEqual([]);
  const alterazioni = rigo.key?.accidentals ?? [];
  return alterazioni.length * (alterazioni[0]?.acc === 'flat' ? -1 : 1);
}

describe('Trova la tonalità: genera', () => {
  it('mostra solo un\'armatura fino a 4 alterazioni, e la tonica è quella del libro', () => {
    const armature = new Set<number>();
    const modi = new Set<string>();
    for (const s of SEED) {
      const es = genera('trova-la-tonalita', { modi: ['maggiore', 'minore'] }, s);
      const quinte = armaturaLetta(es.abc);
      armature.add(quinte);
      modi.add(es.modo);
      expect(nome(es.tonica)).toBe(TONALITA[quinte]![es.modo]);
    }
    expect([...armature].sort((a, b) => a - b)).toEqual([-4, -3, -2, -1, 0, 1, 2, 3, 4]);
    expect([...modi].sort()).toEqual(['maggiore', 'minore']);
  });

  it('la domanda dice se la tonalità è maggiore o minore; nel Capitolo 5 solo maggiore', () => {
    for (const s of SEED.slice(0, 50)) expect(genera('trova-la-tonalita', { modi: ['maggiore'] }, s).modo).toBe('maggiore');
    const minore = SEED.map((s) => genera('trova-la-tonalita', { modi: ['maggiore', 'minore'] }, s)).find((e) => e.modo === 'minore')!;
    expect(minore.domanda).toEqual({ it: 'Quale tonalità minore ha questa armatura?', en: 'Which minor key has this key signature?' });
    expect(genera('trova-la-tonalita', { modi: ['maggiore'] }, 1).domanda).toEqual({ it: 'Quale tonalità maggiore ha questa armatura?', en: 'Which major key has this key signature?' });
  });
});

const trova = (quinte: number, modo: 'maggiore' | 'minore', tonica: string) =>
  ({ tipo: 'trova-la-tonalita', quinte, modo, tonica: n(tonica + '4'), domanda: { it: '', en: '' }, abc: '' }) as const;
const tonica = (s: string) => ({ lettera: s[0] as Nota['lettera'], alterazione: n(s + '4').alterazione });

describe('Trova la tonalità: valuta', () => {
  it('con i diesis la tonica maggiore sta un semitono sopra l\'ultimo diesis', () => {
    const r = valuta(trova(2, 'maggiore', 'D'), tonica('D'));
    expect(r.esito).toBe('giusto');
    expect(r.giusta).toEqual({ it: 'Re maggiore', en: 'D major' });
    expect(r.spiegazione.it).toBe("Con 2 diesis l'ultimo diesis è il Do♯: la tonica maggiore sta un semitono sopra, Re. È Re maggiore.");
    expect(r.spiegazione.en).toBe('With 2 sharps the last sharp is C♯: the major tonic is a half step above it, D. It is D major.');
  });

  it('con i bemolle la tonica maggiore è il penultimo bemolle; con 1 bemolle è Fa, senza alterazioni Do', () => {
    expect(valuta(trova(-3, 'maggiore', 'Eb'), tonica('Eb')).spiegazione.it).toBe('Con 3 bemolle il penultimo bemolle è il Mi♭: è la tonica maggiore. È Mi♭ maggiore.');
    expect(valuta(trova(-3, 'maggiore', 'Eb'), tonica('Eb')).spiegazione.en).toBe('With 3 flats the second-to-last flat is E♭: that is the major tonic. It is E♭ major.');
    expect(valuta(trova(-1, 'maggiore', 'F'), tonica('F')).spiegazione.it).toBe('Con 1 bemolle è Fa maggiore.');
    expect(valuta(trova(0, 'maggiore', 'C'), tonica('C')).spiegazione.en).toBe('With no sharps or flats it is C major.');
  });

  it('in minore la spiegazione scende di una terza minore dalla tonica maggiore', () => {
    const r = valuta(trova(3, 'minore', 'F#'), tonica('F#'));
    expect(r.esito).toBe('giusto');
    expect(r.giusta).toEqual({ it: 'Fa♯ minore', en: 'F♯ minor' });
    expect(r.spiegazione.it).toContain('È La maggiore. La relativa minore sta una terza minore sotto, 3 semitoni: Fa♯ minore.');
    expect(r.spiegazione.en).toContain('It is A major. The relative minor is a minor third below, 3 half steps: F♯ minor.');
  });

  it('chi risponde con la relativa sbaglia, e la spiegazione la nomina', () => {
    const r = valuta(trova(2, 'minore', 'B'), tonica('D'));
    expect(r.esito).toBe('sbagliato');
    expect(r.data).toEqual({ it: 'Re minore', en: 'D minor' });
    expect(r.giusta).toEqual({ it: 'Si minore', en: 'B minor' });
    expect(r.spiegazione.it).toContain('Re è la tonica della relativa maggiore: la domanda chiede la tonalità minore.');
    expect(r.spiegazione.en).toContain('D is the tonic of the relative major: the question asks for the minor key.');
    expect(valuta(trova(-2, 'maggiore', 'Bb'), tonica('G')).spiegazione.it).toContain('Sol è la tonica della relativa minore: la domanda chiede la tonalità maggiore.');
  });

  it('una tonica sbagliata che non è la relativa non parla di relativa', () => {
    expect(valuta(trova(2, 'maggiore', 'D'), tonica('A')).spiegazione.it).not.toContain('relativa');
  });
});

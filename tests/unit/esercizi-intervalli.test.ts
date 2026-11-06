// "Riconosci l'intervallo" e "Rivolta l'intervallo" (Capitolo 8). L'ABC si legge con abcjs, indipendente dal modulo.
import abcjs from 'abcjs';
import { describe, expect, it } from 'vitest';
import { genera, valuta, type EsercizioRiconosciIntervallo, type EsercizioRivoltaIntervallo, type Nota } from '../../src/esercizi';

const LETTERE = 'CDEFGAB';
const SEED = Array.from({ length: 400 }, (_, i) => i * 7919 + 5);
const TUTTE = ['violino', 'violino-ottava-bassa', 'basso'] as const;
const segno = { sharp: 1, flat: -1, natural: 0 } as Record<string, -1 | 0 | 1>;

/** Le note scritte come le legge abcjs, e se stanno insieme (armonico) o una dopo l'altra (melodico). */
function letto(abc: string) {
  const [brano] = abcjs.parseOnly(abc);
  expect(brano!.warnings ?? []).toEqual([]);
  const elementi = brano!.lines[0]!.staff![0]!.voices![0]!.filter((e) => e.el_type === 'note');
  const note = elementi.flatMap((e) => e.pitches!).map((p): Nota => {
    const g = 28 + p.pitch;
    return { lettera: LETTERE[((g % 7) + 7) % 7] as Nota['lettera'], alterazione: p.accidental ? segno[p.accidental]! : 0, ottava: Math.floor(g / 7) };
  });
  return { armonico: elementi.length === 1, note, passi: Math.abs(elementi.flatMap((e) => e.pitches!).reduce((d, p, i) => (i ? d - p.pitch : p.pitch), 0)) };
}

const giuSeServe = (es: { chiave: string }, nota: Nota): Nota => (es.chiave === 'violino-ottava-bassa' ? { ...nota, ottava: nota.ottava - 1 } : nota);

describe('Riconosci l\'intervallo: genera', () => {
  const esercizi = SEED.map((s) => genera('riconosci-intervallo', { chiavi: [...TUTTE] }, s));

  it('scrive le due note dell\'Esercizio, melodiche o armoniche, e l\'intervallo ha il numero che contano le note', () => {
    for (const es of esercizi) {
      const l = letto(es.abc);
      expect(l.note).toHaveLength(2);
      expect(l.armonico).toBe(es.armonico);
      expect(l.note.map((x) => giuSeServe(es, x))).toEqual([es.prima, es.seconda]);
      expect(es.intervallo.numero).toBe(l.passi + 1);
    }
    expect(esercizi.some((e) => e.armonico)).toBe(true);
    expect(esercizi.some((e) => !e.armonico)).toBe(true);
  });

  it('quinta, terza e quarta sono le più frequenti; ci sono tutti i numeri dalla 2ª all\'8ª', () => {
    const conta = (n: number) => esercizi.filter((e) => e.intervallo.numero === n).length;
    const rari = Math.max(...[2, 6, 7, 8].map(conta));
    for (const n of [5, 3, 4]) expect(conta(n)).toBeGreaterThan(rari);
    for (const n of [2, 3, 4, 5, 6, 7, 8]) expect(conta(n)).toBeGreaterThan(0);
  });

  it('maggiori, minori e giuste; aumentate e diminuite solo come tritono; mai doppie alterazioni o Mi♯, Si♯, Do♭, Fa♭', () => {
    const qualita = new Set(esercizi.map((e) => `${e.intervallo.numero}${e.intervallo.qualita}`));
    for (const q of ['3maggiore', '3minore', '5giusta', '4giusta', '4aumentata', '5diminuita']) expect(qualita).toContain(q);
    for (const es of esercizi) {
      if (['aumentata', 'diminuita'].includes(es.intervallo.qualita)) expect(['4aumentata', '5diminuita']).toContain(`${es.intervallo.numero}${es.intervallo.qualita}`);
      for (const nota of [es.prima, es.seconda]) expect(['E1', 'B1', 'C-1', 'F-1']).not.toContain(`${nota.lettera}${nota.alterazione}`);
    }
  });
});

describe('Rivolta l\'intervallo: genera', () => {
  it('mai l\'ottava, che si rivolterebbe in un unisono', () => {
    for (const s of SEED) {
      const es = genera('rivolta-intervallo', { chiavi: ['violino'] }, s);
      expect(letto(es.abc).note).toEqual([es.prima, es.seconda]);
      expect(es.intervallo.numero).not.toBe(8);
    }
  });
});

const n = (s: string): Nota => ({
  lettera: s[0] as Nota['lettera'],
  alterazione: s.includes('#') ? 1 : s.slice(1).includes('b') ? -1 : 0,
  ottava: Number(s.at(-1)),
});
const riconosci = (a: string, b: string, numero: number, qualita: string, armonico = false): EsercizioRiconosciIntervallo =>
  ({ tipo: 'riconosci-intervallo', chiave: 'violino', armonico, prima: n(a), seconda: n(b), intervallo: { numero, qualita } as never, abc: '' });
const rivolta = (a: string, b: string, numero: number, qualita: string): EsercizioRivoltaIntervallo =>
  ({ tipo: 'rivolta-intervallo', chiave: 'violino', armonico: true, prima: n(a), seconda: n(b), intervallo: { numero, qualita } as never, abc: '' });

describe('Riconosci l\'intervallo: valuta', () => {
  it('la risposta giusta è giusta; la spiegazione conta le note e poi i semitoni', () => {
    const r = valuta(riconosci('C4', 'E4', 3, 'maggiore'), { numero: 3, qualita: 'maggiore' });
    expect(r.esito).toBe('giusto');
    expect(r.giusta).toEqual({ it: 'terza maggiore', en: 'major third' });
    expect(r.spiegazione.it).toBe('Dal Do4 al Mi4 si contano 3 note (Do, Re, Mi): è una terza. I semitoni sono 4: terza maggiore.');
    expect(r.spiegazione.en).toBe('From C4 to E4 you count 3 notes (C, D, E): it is a third. It spans 4 half steps: a major third.');
  });

  it('un intervallo discendente si conta dalla nota più bassa', () => {
    const r = valuta(riconosci('B4', 'F4', 4, 'aumentata'), { numero: 4, qualita: 'aumentata' });
    expect(r.spiegazione.it).toBe('Dal Fa4 al Si4 si contano 4 note (Fa, Sol, La, Si): è una quarta. I semitoni sono 6: quarta aumentata.');
    expect(r.spiegazione.en).toContain('It spans 6 half steps: an augmented fourth.');
  });

  it('il numero giusto con la qualità sbagliata: la spiegazione dice quanti semitoni avrebbe', () => {
    const r = valuta(riconosci('E4', 'G4', 3, 'minore'), { numero: 3, qualita: 'maggiore' });
    expect(r.esito).toBe('sbagliato');
    expect(r.data).toEqual({ it: 'terza maggiore', en: 'major third' });
    expect(r.giusta).toEqual({ it: 'terza minore', en: 'minor third' });
    expect(r.spiegazione.it).toContain('Una terza maggiore avrebbe 4 semitoni.');
    expect(r.spiegazione.en).toContain('A major third would span 4 half steps.');
    // Il tritono: 6 semitoni, ma la quarta giusta ne ha 5.
    expect(valuta(riconosci('F4', 'B4', 4, 'aumentata'), { numero: 4, qualita: 'giusta' }).spiegazione.it).toContain('Una quarta giusta avrebbe 5 semitoni.');
  });

  it('una qualità che quel numero non ha: la spiegazione lo dice', () => {
    expect(valuta(riconosci('C4', 'E4', 3, 'maggiore'), { numero: 3, qualita: 'giusta' }).spiegazione.it).toContain('Una terza non è mai giusta: è maggiore o minore.');
    expect(valuta(riconosci('C4', 'E4', 3, 'maggiore'), { numero: 3, qualita: 'giusta' }).spiegazione.en).toContain('A third is never perfect: it is major or minor.');
    expect(valuta(riconosci('C4', 'G4', 5, 'giusta'), { numero: 5, qualita: 'maggiore' }).spiegazione.it).toContain('Una quinta non è mai maggiore o minore: è giusta, aumentata o diminuita.');
    expect(valuta(riconosci('C4', 'G4', 5, 'giusta'), { numero: 5, qualita: 'minore' }).spiegazione.en).toContain('A fifth is never major or minor: it is perfect, augmented, or diminished.');
  });

  it('un numero in meno: si contano anche la prima e l\'ultima nota', () => {
    const r = valuta(riconosci('C4', 'G4', 5, 'giusta'), { numero: 4, qualita: 'giusta' });
    expect(r.esito).toBe('sbagliato');
    expect(r.spiegazione.it).toContain('Si contano anche la prima e l\'ultima nota.');
    expect(r.spiegazione.en).toContain('Count the first and the last note too.');
  });

  it('per ogni seed la risposta dell\'Esercizio è giusta', () => {
    for (const s of SEED) {
      const es = genera('riconosci-intervallo', { chiavi: [...TUTTE] }, s);
      expect(valuta(es, es.intervallo).esito).toBe('giusto');
    }
  });
});

describe('Rivolta l\'intervallo: valuta', () => {
  it('si risponde col rivolto; la spiegazione sposta la nota in basso e conta note e semitoni', () => {
    const r = valuta(rivolta('C4', 'E4', 3, 'maggiore'), { numero: 6, qualita: 'minore' });
    expect(r.esito).toBe('giusto');
    expect(r.giusta).toEqual({ it: 'sesta minore', en: 'minor sixth' });
    expect(r.spiegazione.it).toBe(
      "L'intervallo è una terza maggiore (Do4–Mi4). Nel rivolto la nota in basso sale di un'ottava: Mi4–Do5. " +
        'I numeri sommano 9 (3 + 6), i semitoni 12 (4 + 8), e maggiore diventa minore: sesta minore.',
    );
    expect(r.spiegazione.en).toBe(
      'The interval is a major third (C4–E4). In the inversion the lower note moves up an octave: E4–C5. ' +
        'The numbers add up to 9 (3 + 6), the half steps to 12 (4 + 8), and major becomes minor: a minor sixth.',
    );
  });

  it('giusta resta giusta, aumentata diventa diminuita', () => {
    expect(valuta(rivolta('C4', 'G4', 5, 'giusta'), { numero: 4, qualita: 'giusta' }).spiegazione.it).toContain('e giusta resta giusta: quarta giusta.');
    expect(valuta(rivolta('F4', 'B4', 4, 'aumentata'), { numero: 5, qualita: 'diminuita' }).spiegazione.en).toContain('and augmented becomes diminished: a diminished fifth.');
  });

  it('rispondere con l\'intervallo scritto invece del rivolto è sbagliato', () => {
    const r = valuta(rivolta('C4', 'E4', 3, 'maggiore'), { numero: 3, qualita: 'maggiore' });
    expect(r.esito).toBe('sbagliato');
    expect(r.spiegazione.it).toContain('La terza maggiore è l\'intervallo scritto: si chiede il suo rivolto.');
    expect(r.spiegazione.en).toContain('The major third is the written interval: the question asks for its inversion.');
  });

  it('per ogni seed il rivolto è giusto', () => {
    for (const s of SEED) {
      const es = genera('rivolta-intervallo', { chiavi: [...TUTTE] }, s);
      expect(valuta(es, { numero: (9 - es.intervallo.numero) as never, qualita: ({ minore: 'maggiore', maggiore: 'minore', giusta: 'giusta', aumentata: 'diminuita', diminuita: 'aumentata' } as const)[es.intervallo.qualita] }).esito).toBe('giusto');
    }
  });
});
